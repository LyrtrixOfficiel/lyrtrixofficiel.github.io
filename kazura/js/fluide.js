/* ==========================================================================
   KAZURA 葛 - l'encre
   --------------------------------------------------------------------------
   Une vraie simulation de fluide incompressible, resolue dans le navigateur,
   soixante fois par seconde. Ce n'est pas une texture qui ondule : c'est
   l'equation de Navier-Stokes, dans la forme dite « stable fluids » de Jos
   Stam, et l'encre que vous poussez obeit a un champ de vitesse qui a
   reellement ete rendu incompressible.

   L'ENCHAINEMENT, ET POURQUOI CHAQUE PASSE EXISTE

   1. injection    le doigt depose de la vitesse et de la couleur
   2. advection    le champ se transporte lui-meme, en remontant le temps
   3. divergence   on mesure ou le fluide se comprime ou se dilate
   4. pression     on resout Poisson par iterations de Jacobi (20 tours)
   5. gradient     on retire le gradient de pression au champ de vitesse,
                   ce qui le rend incompressible. C'est LA passe qui fait la
                   difference entre un fluide et un simple flou qui derive.
   6. affichage    l'encre est teintee jade et violet, puis relevee

   Tout tient en texture flottante, donc WebGL2 est requis. Sans lui, on rend
   la main a l'appelant qui posera un repli.

   RESOLUTIONS. La simulation tourne bas (128) parce qu'un champ de vitesse n'a
   pas besoin d'etre fin. L'encre tourne plus haut (512) parce que c'est elle
   qu'on voit. C'est le compromis classique, et c'est ce qui rend la chose
   jouable sur une machine ordinaire.
   ========================================================================== */

export function monterLEncre(toile, options = {}) {
  const _fm = new URLSearchParams(location.search).get('mouvement');
  const sobre = _fm === '1' ? false : _fm === '0' ? true
              : matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = toile.getContext('webgl2', {
    alpha: false, depth: false, stencil: false, antialias: false,
    preserveDrawingBuffer: false, powerPreference: 'high-performance'
  });
  if (!gl) return null;
  if (!gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('OES_texture_float_linear');

  const petit = innerWidth < 820;
  const RES_SIM  = petit ? 96  : 128;
  const RES_ENCRE= petit ? 256 : 512;
  const ITERATIONS = petit ? 14 : 20;
  /* Dissipations par image, a 60 par seconde. A 0,975 l'encre disparaissait
     en une seconde et demie et la surface restait vide : il faut qu'une
     volute survive assez longtemps pour qu'on la voie deriver. */
  const DISSIPATION_VITESSE = 0.994;
  const DISSIPATION_ENCRE   = 0.992;

  /* ── Outils ────────────────────────────────────────────────────────── */
  const compiler = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('encre, shader :', gl.getShaderInfoLog(s), src.slice(0, 90));
      return null;
    }
    return s;
  };

  const VS = `#version 300 es
    in vec2 aPos;
    out vec2 vUv, vL, vR, vT, vB;
    uniform vec2 uPas;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      vL = vUv - vec2(uPas.x, 0.0);
      vR = vUv + vec2(uPas.x, 0.0);
      vT = vUv + vec2(0.0, uPas.y);
      vB = vUv - vec2(0.0, uPas.y);
      gl_Position = vec4(aPos, 0.0, 1.0);
    }`;

  const programme = (fs) => {
    const p = gl.createProgram();
    const v = compiler(gl.VERTEX_SHADER, VS);
    const f = compiler(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('encre, lien :', gl.getProgramInfoLog(p));
      return null;
    }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const nom = gl.getActiveUniform(p, i).name;
      u[nom] = gl.getUniformLocation(p, nom);
    }
    return { p, u };
  };

  /* ── Les passes ────────────────────────────────────────────────────── */
  const P_INJECTION = programme(`#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 sortie;
    uniform sampler2D uCible;
    uniform float uRatio, uRayon;
    uniform vec2  uPoint;
    uniform vec3  uCouleur;
    void main() {
      vec2 d = vUv - uPoint;
      d.x *= uRatio;
      vec3 tache = exp(-dot(d, d) / uRayon) * uCouleur;
      /* Borne. Sans elle l'encre s'accumule sans fin la ou le geste repasse :
         l'equilibre entre injection et dissipation se situe vers 180, alors
         que l'affichage sature des 0,32. On obtenait une tache blanche
         brulee au lieu d'une volute. */
      sortie = vec4(min(texture(uCible, vUv).xyz + tache, vec3(1.6)), 1.0);
    }`);

  /* Advection semi-lagrangienne : pour savoir ce qu'il y a ici maintenant, on
     remonte le courant d'un pas de temps et on lit ce qui y etait. */
  const P_ADVECTION = programme(`#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 sortie;
    uniform sampler2D uVitesse, uSource;
    uniform vec2  uPasTexel;
    uniform float uDt, uDissipation;
    void main() {
      vec2 coord = vUv - uDt * texture(uVitesse, vUv).xy * uPasTexel;
      sortie = uDissipation * texture(uSource, coord);
      sortie.a = 1.0;
    }`);

  const P_DIVERGENCE = programme(`#version 300 es
    precision highp float;
    in vec2 vUv, vL, vR, vT, vB;
    out vec4 sortie;
    uniform sampler2D uVitesse;
    void main() {
      float L = texture(uVitesse, vL).x;
      float R = texture(uVitesse, vR).x;
      float T = texture(uVitesse, vT).y;
      float B = texture(uVitesse, vB).y;
      // Aux bords, on reflechit la composante normale : le fluide ne sort pas.
      vec2 C = texture(uVitesse, vUv).xy;
      if (vL.x < 0.0)  L = -C.x;
      if (vR.x > 1.0)  R = -C.x;
      if (vT.y > 1.0)  T = -C.y;
      if (vB.y < 0.0)  B = -C.y;
      sortie = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`);

  const P_PRESSION = programme(`#version 300 es
    precision highp float;
    in vec2 vUv, vL, vR, vT, vB;
    out vec4 sortie;
    uniform sampler2D uPression, uDivergence;
    void main() {
      float L = texture(uPression, vL).x;
      float R = texture(uPression, vR).x;
      float T = texture(uPression, vT).x;
      float B = texture(uPression, vB).x;
      float d = texture(uDivergence, vUv).x;
      sortie = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
    }`);

  const P_GRADIENT = programme(`#version 300 es
    precision highp float;
    in vec2 vUv, vL, vR, vT, vB;
    out vec4 sortie;
    uniform sampler2D uPression, uVitesse;
    void main() {
      float L = texture(uPression, vL).x;
      float R = texture(uPression, vR).x;
      float T = texture(uPression, vT).x;
      float B = texture(uPression, vB).x;
      vec2 v = texture(uVitesse, vUv).xy - vec2(R - L, T - B);
      sortie = vec4(v, 0.0, 1.0);
    }`);

  /* Injection a travers un masque : au lieu d'une tache ronde, on depose la
     couleur exactement la ou un dessin est opaque. C'est ce qui permet a
     l'encre d'ECRIRE un mot, que le courant emporte ensuite. */
  const P_MASQUE = programme(`#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 sortie;
    uniform sampler2D uCible, uMasque;
    uniform vec3  uCouleur;
    uniform float uForce;
    void main() {
      float a = texture(uMasque, vUv).a;
      sortie = vec4(min(texture(uCible, vUv).xyz + uCouleur * a * uForce, vec3(1.6)), 1.0);
    }`);

  const P_AFFICHAGE = programme(`#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 sortie;
    uniform sampler2D uEncre;
    uniform float uTemps;

    void main() {
      vec3 e = texture(uEncre, vUv).rgb;
      float m = max(e.r, max(e.g, e.b));

      /* Les deux couleurs de la marque, posees par masques DISJOINTS. Un
         mix() direct entre un vert et un violet traverse un bleu sale : la
         ou les deux masques faiblissent on veut du noir, pas de la boue.
         Ne jamais mettre d'accent grave dans ces commentaires : on est a
         l'interieur d'un gabarit de chaine, il la refermerait. */
      vec3 jade   = vec3(0.063, 0.725, 0.506);
      vec3 violet = vec3(0.486, 0.227, 0.929);

      /* Seuils cales sur ce que la simulation produit REELLEMENT, mesure au
         tampon (bilan()) et non estime au jugé : apres advection et
         dissipation, l'encre plafonne autour de 0,3 et non de 1. Des seuils
         poses a l'oeil laissaient une surface entierement noire. */
      float mVert   = smoothstep(0.010, 0.26, e.g);
      float mViolet = smoothstep(0.014, 0.32, e.b);

      vec3 col = vec3(0.004, 0.016, 0.024);
      col += jade   * mVert   * 1.35;
      col += violet * mViolet * 1.45;

      // Une crete blanche la ou l'encre est la plus dense.
      col += vec3(0.78, 1.0, 0.92) * pow(smoothstep(0.22, 0.62, m), 2.2) * 0.85;

      vec2 c = vUv - 0.5;
      col *= 1.0 - 0.85 * dot(c, c);
      col += (fract(sin(dot(vUv * 900.0 + uTemps, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.022;

      sortie = vec4(col, 1.0);
    }`);

  if (!P_INJECTION || !P_ADVECTION || !P_DIVERGENCE || !P_PRESSION || !P_GRADIENT || !P_AFFICHAGE) {
    return null;
  }

  /* ── Le quad ───────────────────────────────────────────────────────── */
  const quad = gl.createVertexArray();
  gl.bindVertexArray(quad);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const dessiner = (cible) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, cible ? cible.fbo : null);
    gl.viewport(0, 0, cible ? cible.w : toile.width, cible ? cible.h : toile.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  /* ── Cibles de rendu ───────────────────────────────────────────────── */
  function cible(w, h, interne, format, type, filtre) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtre);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtre);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, interne, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, pas: [1 / w, 1 / h],
             lier(unite) { gl.activeTexture(gl.TEXTURE0 + unite); gl.bindTexture(gl.TEXTURE_2D, this.tex); return unite; } };
  }

  function paire(w, h, interne, format, type, filtre) {
    let a = cible(w, h, interne, format, type, filtre);
    let b = cible(w, h, interne, format, type, filtre);
    return {
      get lire() { return a; }, get ecrire() { return b; },
      echanger() { const t = a; a = b; b = t; },
      w, h, pas: [1 / w, 1 / h]
    };
  }

  const F = gl.RG16F, FF = gl.RG, FT = gl.HALF_FLOAT;
  const filtre = gl.getExtension('OES_texture_float_linear') ? gl.LINEAR : gl.NEAREST;

  let vitesse   = paire(RES_SIM, RES_SIM, gl.RG16F,   gl.RG,   gl.HALF_FLOAT, filtre);
  let encre     = paire(RES_ENCRE, RES_ENCRE, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, filtre);
  let divergence= cible(RES_SIM, RES_SIM, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
  let pression  = paire(RES_SIM, RES_SIM, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);

  /* ── Le mot ecrit a l'encre ────────────────────────────────────────── */
  /* Un mot dessine dans une toile hors ecran devient un masque d'injection :
     l'encre se depose exactement sur ses lettres, puis le courant l'emporte.
     Le mot n'est jamais affiche tel quel, il n'existe que comme forme initiale
     donnee au fluide.

     Subtilite : la texture d'encre est carree alors que la toile est large. On
     ecrit donc le mot PRE-COMPRIME horizontalement, pour qu'il retrouve ses
     proportions une fois etire sur la toile. */
  let masque = null;
  const texteEncre = options.texte || null;

  async function preparerLeMot() {
    if (!texteEncre) return;
    try { await document.fonts.load('800 200px Syne'); await document.fonts.ready; }
    catch (e) { /* on ecrit quand meme */ }

    const N = RES_ENCRE;
    const c = document.createElement('canvas');
    c.width = N; c.height = N;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, N, N);

    let taille = N * 0.5;
    ctx.font = `800 ${taille}px Syne, system-ui, sans-serif`;
    const vise = N * 0.80 * Math.min(1, ratio);   // largeur visee, apres etirement
    taille *= vise / Math.max(1, ctx.measureText(texteEncre).width / ratio);
    taille = Math.min(taille, N * 0.34);

    ctx.font = `800 ${taille}px Syne, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.setTransform(1 / ratio, 0, 0, 1, N / 2, N / 2);  // compression horizontale
    ctx.fillText(texteEncre, 0, 0);

    masque = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, masque);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);   // sinon le mot est a l'envers
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  }

  function ecrireLeMot(force = 1) {
    if (!masque || !P_MASQUE) return;
    gl.useProgram(P_MASQUE.p);
    gl.uniform2f(P_MASQUE.u.uPas, ...encre.pas);
    gl.uniform1i(P_MASQUE.u.uCible, encre.lire.lier(0));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, masque);
    gl.uniform1i(P_MASQUE.u.uMasque, 1);
    /* Le mot s'ecrit en JADE seul. Injecte avec autant de vert que de bleu,
       il saturait les deux masques de l'affichage et ressortait blanc. Le
       violet est reserve a ce que la main y ajoute : la marque ecrit, le
       visiteur colore. */
    gl.uniform3f(P_MASQUE.u.uCouleur, 0.04, 0.46, 0.05);
    gl.uniform1f(P_MASQUE.u.uForce, force);
    dessiner(encre.ecrire);
    encre.echanger();
  }

  /* ── Le doigt ──────────────────────────────────────────────────────── */
  const doigt = { x: .5, y: .5, dx: 0, dy: 0, appuie: false, deja: false };
  let ratio = 1;

  const injecter = (x, y, dx, dy, rayon = 0.00030, force = 1) => {
    // Vitesse
    gl.useProgram(P_INJECTION.p);
    gl.uniform1i(P_INJECTION.u.uCible, vitesse.lire.lier(0));
    gl.uniform2f(P_INJECTION.u.uPas, ...vitesse.pas);
    gl.uniform1f(P_INJECTION.u.uRatio, ratio);
    gl.uniform2f(P_INJECTION.u.uPoint, x, y);
    gl.uniform3f(P_INJECTION.u.uCouleur, dx, dy, 0);
    gl.uniform1f(P_INJECTION.u.uRayon, rayon * 1.6);
    dessiner(vitesse.ecrire);
    vitesse.echanger();

    /* La couleur injectee alterne entre le jade et le violet selon la
       direction du geste : pousser vers la droite depose du vert, vers la
       gauche du violet. Le fluide melange le reste tout seul. */
    const vers = Math.max(0, Math.min(1, 0.5 + dx * 0.04));
    gl.useProgram(P_INJECTION.p);
    gl.uniform1i(P_INJECTION.u.uCible, encre.lire.lier(0));
    gl.uniform2f(P_INJECTION.u.uPas, ...encre.pas);
    gl.uniform1f(P_INJECTION.u.uRatio, ratio);
    gl.uniform2f(P_INJECTION.u.uPoint, x, y);
    gl.uniform3f(P_INJECTION.u.uCouleur,
      0.18 * force,
      (1.45 * (1 - vers) + 0.40) * force,
      (1.45 * vers + 0.40) * force);
    gl.uniform1f(P_INJECTION.u.uRayon, rayon);
    dessiner(encre.ecrire);
    encre.echanger();
  };

  /* ── Redimensionnement ─────────────────────────────────────────────── */
  const dpr = Math.min(devicePixelRatio || 1, petit ? 1.25 : 1.5);
  function redimensionner() {
    const r = toile.getBoundingClientRect();
    toile.width  = Math.max(1, Math.floor(r.width  * dpr));
    toile.height = Math.max(1, Math.floor(r.height * dpr));
    ratio = toile.width / Math.max(1, toile.height);
  }
  redimensionner();
  window.addEventListener('resize', redimensionner);

  /* ── Entrees ───────────────────────────────────────────────────────── */
  const placer = (e) => {
    const r = toile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (!doigt.deja) { doigt.x = x; doigt.y = y; doigt.deja = true; }
    doigt.dx = (x - doigt.x) * 620;
    doigt.dy = (y - doigt.y) * 620;
    doigt.x = x; doigt.y = y;
    doigt.appuie = Math.abs(doigt.dx) > 0.02 || Math.abs(doigt.dy) > 0.02;
  };
  toile.addEventListener('pointermove', placer, { passive: true });
  toile.addEventListener('pointerdown', e => { doigt.deja = false; placer(e); });
  toile.addEventListener('pointerleave', () => { doigt.appuie = false; doigt.deja = false; });

  /* ── Une caresse automatique ───────────────────────────────────────── */
  /* Personne ne devine qu'une surface est interactive si elle est immobile.
     Une main invisible dessine donc une figure de Lissajous en continu, avec
     assez peu de force pour qu'un vrai geste la couvre aussitot. */
  let phase = Math.random() * 100;
  const lissajous = (p) => [
    0.5 + Math.sin(p * 0.83) * 0.30 + Math.sin(p * 0.47) * 0.09,
    0.5 + Math.cos(p * 0.61) * 0.26 + Math.cos(p * 0.37) * 0.08
  ];

  function caresser(dt) {
    phase += dt;
    const [x, y] = lissajous(phase);
    const [px, py] = lissajous(phase - dt);
    injecter(x, y, (x - px) * 1400, (y - py) * 1400, 0.00042, 0.75);
  }

  /* Composition fixe, pour le mode sobre. Neuf taches posees en spirale, avec
     des vitesses qui les font s'enrouler les unes dans les autres, puis on
     laisse la simulation tourner un moment. On obtient une image d'encre
     credible, immobile, plutot qu'un rectangle noir sous un texte qui parle
     de fluide. */
  function composerImageFixe() {
    const OR = 2.39996;   // angle d'or, pour une repartition sans motif
    const N = 20;

    /* Le shader corrige la tache par le rapport d'image (`d.x *= uRatio`) :
       en paysage elle s'ecrase, en portrait elle s'etale. Sans compensation,
       la meme composition couvrait 45 pour cent sur un ecran large et 92 sur
       un telephone, ou elle noyait tout. On adapte donc l'etendue en x ET le
       rayon au format reel. */
    const etendueX = Math.max(0.55, Math.min(1.55, ratio * 0.9));
    const rayon = 0.0022 * Math.max(0.30, Math.min(1, ratio * 0.7));

    for (let i = 0; i < N; i++) {
      const r = 0.10 + (i / N) * 0.34;
      const a = i * OR;
      const x = 0.5 + Math.cos(a) * r * etendueX;
      const y = 0.5 + Math.sin(a) * r;
      // Vitesse tangentielle : les taches s'enroulent au lieu de s'etaler.
      injecter(x, y, -Math.sin(a) * 900, Math.cos(a) * 900, rayon, 1.15);
      /* Peu de pas entre les taches : chaque pas dissipe, et deux cents pas
         effacaient l'encre avant qu'on ne l'affiche. */
      for (let k = 0; k < 4; k++) simuler(1 / 60);
    }
    for (let k = 0; k < 45; k++) simuler(1 / 60);
  }

  /* ── Boucle ────────────────────────────────────────────────────────── */
  let visible = false, dernier = performance.now(), t = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; },
                           { threshold: 0.01 }).observe(toile);
  setTimeout(() => { if (!visible) visible = true; }, 2500);

  function simuler(dt) {
    gl.disable(gl.BLEND);
    gl.bindVertexArray(quad);

    // 2. advection de la vitesse
    gl.useProgram(P_ADVECTION.p);
    gl.uniform2f(P_ADVECTION.u.uPas, ...vitesse.pas);
    gl.uniform2f(P_ADVECTION.u.uPasTexel, ...vitesse.pas);
    gl.uniform1i(P_ADVECTION.u.uVitesse, vitesse.lire.lier(0));
    gl.uniform1i(P_ADVECTION.u.uSource, vitesse.lire.lier(0));
    gl.uniform1f(P_ADVECTION.u.uDt, dt);
    gl.uniform1f(P_ADVECTION.u.uDissipation, DISSIPATION_VITESSE);
    dessiner(vitesse.ecrire);
    vitesse.echanger();

    // 3. divergence
    gl.useProgram(P_DIVERGENCE.p);
    gl.uniform2f(P_DIVERGENCE.u.uPas, ...vitesse.pas);
    gl.uniform1i(P_DIVERGENCE.u.uVitesse, vitesse.lire.lier(0));
    dessiner(divergence);

    // 4. pression, par iterations de Jacobi
    gl.useProgram(P_PRESSION.p);
    gl.uniform2f(P_PRESSION.u.uPas, ...vitesse.pas);
    gl.uniform1i(P_PRESSION.u.uDivergence, divergence.lier(0));
    for (let i = 0; i < ITERATIONS; i++) {
      gl.uniform1i(P_PRESSION.u.uPression, pression.lire.lier(1));
      dessiner(pression.ecrire);
      pression.echanger();
    }

    // 5. on retire le gradient de pression : le champ devient incompressible
    gl.useProgram(P_GRADIENT.p);
    gl.uniform2f(P_GRADIENT.u.uPas, ...vitesse.pas);
    gl.uniform1i(P_GRADIENT.u.uPression, pression.lire.lier(0));
    gl.uniform1i(P_GRADIENT.u.uVitesse, vitesse.lire.lier(1));
    dessiner(vitesse.ecrire);
    vitesse.echanger();

    // 2 bis. advection de l'encre, dans le champ desormais propre
    gl.useProgram(P_ADVECTION.p);
    gl.uniform2f(P_ADVECTION.u.uPas, ...encre.pas);
    gl.uniform2f(P_ADVECTION.u.uPasTexel, ...vitesse.pas);
    gl.uniform1i(P_ADVECTION.u.uVitesse, vitesse.lire.lier(0));
    gl.uniform1i(P_ADVECTION.u.uSource, encre.lire.lier(1));
    gl.uniform1f(P_ADVECTION.u.uDt, dt);
    gl.uniform1f(P_ADVECTION.u.uDissipation, DISSIPATION_ENCRE);
    dessiner(encre.ecrire);
    encre.echanger();
  }

  /* Lecture directe des champs internes, pour verifier ou deboguer : le rendu
     final passe par un seuillage et une vignette, donc une encre bien presente
     peut sembler noire a l'ecran alors que le probleme est ailleurs. */
  function sonder(fx = 0.5, fy = 0.5) {
    const lire = (c) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, c.fbo);
      const px = new Float32Array(4);
      gl.readPixels(Math.floor(fx * c.w), Math.floor(fy * c.h), 1, 1, gl.RGBA, gl.FLOAT, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return [...px].map(v => +v.toFixed(4));
    };
    return { encre: lire(encre.lire), vitesse: lire(vitesse.lire), erreur: gl.getError() };
  }

  /* Bilan du champ d'encre entier. Sonder cinq points ne prouve rien quand les
     taches font quinze pixels : il faut la valeur maximale pour savoir si
     l'encre existe, et la moyenne pour savoir si elle couvre la surface. */
  function bilan() {
    const c = encre.lire;
    gl.bindFramebuffer(gl.FRAMEBUFFER, c.fbo);
    const px = new Float32Array(c.w * c.h * 4);
    gl.readPixels(0, 0, c.w, c.h, gl.RGBA, gl.FLOAT, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    let maxG = 0, maxB = 0, sommeG = 0, sommeB = 0, couverts = 0;
    for (let i = 0; i < px.length; i += 4) {
      const g = px[i + 1], b = px[i + 2];
      if (g > maxG) maxG = g;
      if (b > maxB) maxB = b;
      sommeG += g; sommeB += b;
      if (g > 0.02 || b > 0.02) couverts++;
    }
    const n = c.w * c.h;
    return {
      taille: c.w + 'x' + c.h,
      maxVert: +maxG.toFixed(4), maxViolet: +maxB.toFixed(4),
      moyenneVert: +(sommeG / n).toFixed(5), moyenneViolet: +(sommeB / n).toFixed(5),
      couverture: +(couverts / n * 100).toFixed(2) + ' %'
    };
  }

  function afficher() {
    gl.useProgram(P_AFFICHAGE.p);
    gl.uniform2f(P_AFFICHAGE.u.uPas, ...encre.pas);
    gl.uniform1i(P_AFFICHAGE.u.uEncre, encre.lire.lier(0));
    gl.uniform1f(P_AFFICHAGE.u.uTemps, t);
    dessiner(null);
  }

  /* Le mot se reecrit regulierement. Le premier jet arrive vite pour que la
     section ne soit jamais vide, puis il revient toutes les quinze secondes,
     le temps que le courant ait fini d'emporter le precedent. */
  let prochainMot = 0.6;

  function image() {
    const maintenant = performance.now();
    const dt = Math.min((maintenant - dernier) / 1000, 1 / 30);
    dernier = maintenant;
    t += dt;

    if (visible) {
      if (masque && t >= prochainMot) {
        ecrireLeMot(1);
        prochainMot = t + 15;
      }
      if (doigt.appuie) {
        injecter(doigt.x, doigt.y, doigt.dx, doigt.dy);
        doigt.dx *= 0.7; doigt.dy *= 0.7;
        if (Math.abs(doigt.dx) < 0.02 && Math.abs(doigt.dy) < 0.02) doigt.appuie = false;
      } else {
        caresser(dt);
      }
      simuler(dt);
      afficher();
    }
    requestAnimationFrame(image);
  }

  /* En mode sobre, on laisse la caresse deposer quelques volutes puis on
     s'arrete : une image fixe, mais pas un rectangle noir. */
  // La preparation du mot est asynchrone (chargement de la police).
  preparerLeMot().then(() => {
    if (sobre && masque) { ecrireLeMot(1); for (let k = 0; k < 30; k++) simuler(1 / 60); afficher(); }
  });

  if (sobre) {
    composerImageFixe();
    afficher();
    window.addEventListener('resize', () => { redimensionner(); afficher(); });
    return {
      statique: true,
      rafraichir: afficher,
      recomposer() { composerImageFixe(); afficher(); },
      pas(dt = 1 / 60) { simuler(dt); afficher(); },
      ecrire(f = 1) { ecrireLeMot(f); afficher(); },
      sonder, bilan
    };
  }

  requestAnimationFrame(image);
  return {
    statique: false,
    rafraichir: afficher,
    /* Un pas manuel, pour verifier ou deboguer quand rAF ne tourne pas
       (onglet masque, navigateur pilote). Meme raison d'etre que
       `window.kazura.pas`. */
    pas(dt = 1 / 60) { caresser(dt); simuler(dt); afficher(); },
    ecrire(f = 1) { ecrireLeMot(f); afficher(); },
    sonder, bilan
  };
}
