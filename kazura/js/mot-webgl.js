/* ==========================================================================
   KAZURA 葛 - le mot, rendu en WebGL
   --------------------------------------------------------------------------
   C'est la piece qui manquait. Le mot-symbole n'est plus du texte anime en
   CSS : il est dessine une fois dans une toile hors ecran avec la vraie
   police, televerse comme texture, puis MALTRAITE dans un shader.

   POURQUOI PASSER PAR LE GPU. Un texte en DOM ne peut pas se disloquer, se
   fendre par canal ni se recondenser depuis un nuage sans que le navigateur
   recalcule une mise en page a chaque image. C'est exactement le probleme que
   resout Igloo Inc en rendant son interface en WebGL. Ici on obtient le meme
   resultat par un chemin plus simple : une seule texture, jamais retouchee,
   et tout le mouvement dans le fragment shader.

   CE QUE FAIT LE SHADER, DANS L'ORDRE
   1. deplacement    le champ est deforme par un bruit a deux tours
   2. dislocation    le mot se disperse ou se recondense (uniforme uForme)
   3. fente          les trois canaux sont lus a des decalages differents
   4. teinte         degrade jade vers violet, plus une crete blanche
   5. poussiere      les fragments arraches deviennent des grains lumineux

   ACCESSIBILITE. Le vrai `<h1>` reste dans le document, simplement masque a
   l'oeil. La toile est decorative et porte `aria-hidden`. Un lecteur d'ecran
   et un moteur de recherche lisent donc un titre normal.
   ========================================================================== */

export async function monterLeMot(toile, texte = 'KAZURA') {
  const sobre = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = toile.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  /* ── 1. Le mot, peint une fois dans une toile hors ecran ───────────── */
  /* La police doit etre chargee avant de peindre, sinon on capture le repli
     systeme et on garde ce dessin faux pour toute la session. */
  try {
    await document.fonts.load('800 200px Syne');
    await document.fonts.ready;
  } catch (e) { /* on peint quand meme */ }

  const atlas = document.createElement('canvas');
  const ctx = atlas.getContext('2d');

  let largeurMot = 1, hauteurMot = 1;

  function peindreLeMot() {
    const r = toile.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const L = Math.max(2, Math.floor(r.width * dpr));
    const H = Math.max(2, Math.floor(r.height * dpr));
    atlas.width = L; atlas.height = H;

    ctx.clearRect(0, 0, L, H);
    // On cherche la taille qui remplit 88 pour cent de la largeur disponible.
    let taille = H;
    ctx.font = `800 ${taille}px Syne, system-ui, sans-serif`;
    let m = ctx.measureText(texte);
    const vise = L * 0.88;
    taille = Math.max(10, taille * (vise / Math.max(1, m.width)));
    if (taille > H * 0.92) taille = H * 0.92;

    ctx.font = `800 ${taille}px Syne, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.letterSpacing = '-0.05em';
    m = ctx.measureText(texte);
    largeurMot = m.width; hauteurMot = taille;
    ctx.fillText(texte, L / 2, H / 2 + taille * 0.02);
    return { L, H };
  }

  let dim = peindreLeMot();
  toile.width = dim.L; toile.height = dim.H;

  const texture = gl.createTexture();
  const televerser = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  };
  televerser();

  /* ── 2. Le shader ──────────────────────────────────────────────────── */
  const VS = `
    attribute vec2 p;
    varying vec2 vUv;
    void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

  const FS = `
    precision highp float;
    uniform sampler2D uMot;
    uniform vec2  uRes;
    uniform vec2  uSouris;
    uniform float uTemps;
    uniform float uForme;    // 0 = disloque, 1 = net
    uniform float uFente;    // ecart des trois canaux
    varying vec2 vUv;

    float alea(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    float bruit(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(alea(i),                 alea(i + vec2(1.0, 0.0)), u.x),
                 mix(alea(i + vec2(0.0, 1.0)), alea(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++){ v += a * bruit(p); p *= 2.07; a *= 0.5; }
      return v;
    }

    void main(){
      float ratio = uRes.x / uRes.y;
      vec2 uv = vUv;
      float t = uTemps * 0.12;

      // 1. deplacement : deux tours de bruit, pour que le champ ondule
      vec2 q = vec2(uv.x * ratio, uv.y) * 2.4;
      vec2 w = vec2(fbm(q + t), fbm(q + vec2(4.7, 2.1) - t));
      float n = fbm(q + 2.6 * w);

      // 2. dislocation : plus uForme baisse, plus les fragments s'ecartent
      float manque = 1.0 - uForme;
      vec2 fuite = (w - 0.5) * manque * 0.42;
      fuite.y += manque * (n - 0.5) * 0.30;

      // La souris repousse localement la matiere.
      vec2 d = uv - uSouris;
      d.x *= ratio;
      float pres = exp(-dot(d, d) * 26.0);
      fuite += normalize(d + 0.0001) * pres * 0.016;

      // 3. fente des canaux
      float f = (uFente + pres * 1.4 + manque * 2.2) * 0.008;
      vec2 axe = vec2(1.0, 0.35);

      float a1 = texture2D(uMot, uv + fuite - axe * f).a;
      float a2 = texture2D(uMot, uv + fuite).a;
      float a3 = texture2D(uMot, uv + fuite + axe * f).a;

      /* Le seuil monte quand le mot est disloque : les zones ou le bruit est
         faible perdent leur matiere en premier, ce qui donne une dissolution
         par plaques plutot qu'un fondu uniforme. */
      float seuil = manque * (0.35 + n * 0.75);
      a1 = smoothstep(seuil, seuil + 0.22, a1);
      a2 = smoothstep(seuil, seuil + 0.22, a2);
      a3 = smoothstep(seuil, seuil + 0.22, a3);

      float a = max(a1, max(a2, a3));
      if (a < 0.004) { gl_FragColor = vec4(0.0); return; }

      // 4. teinte : degrade vertical jade vers violet, plus la crete blanche
      vec3 haut = vec3(1.0, 1.0, 1.0);
      vec3 mid  = vec3(0.431, 0.906, 0.718);
      vec3 bas  = vec3(0.016, 0.470, 0.341);
      float g = clamp(uv.y, 0.0, 1.0);
      vec3 col = mix(bas, mid, smoothstep(0.0, 0.62, g));
      col = mix(col, haut, smoothstep(0.72, 1.0, g));

      // Les canaux ecartes se voient comme des lisieres coloree.
      col.r *= 0.55 + a1 * 0.75;
      col.g *= 0.65 + a2 * 0.60;
      col.b  = mix(col.b, 0.929, a3 * 0.42 * min(1.0, f * 60.0 + manque));

      col += vec3(0.486, 0.227, 0.929) * pres * 0.55;

      // 5. poussiere : les grains arraches par la dislocation
      float grain = alea(floor(uv * uRes / 3.0) + floor(uTemps * 22.0));
      col += vec3(0.62, 1.0, 0.86) * step(0.9965 - manque * 0.02, grain) * manque * 2.4;

      gl_FragColor = vec4(col * a, a);
    }`;

  const compiler = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('mot, shader :', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };

  const vs = compiler(gl.VERTEX_SHADER, VS);
  const fs = compiler(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('mot, lien :', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    mot:    gl.getUniformLocation(prog, 'uMot'),
    res:    gl.getUniformLocation(prog, 'uRes'),
    souris: gl.getUniformLocation(prog, 'uSouris'),
    temps:  gl.getUniformLocation(prog, 'uTemps'),
    forme:  gl.getUniformLocation(prog, 'uForme'),
    fente:  gl.getUniformLocation(prog, 'uFente')
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // alpha premultiplie
  gl.clearColor(0, 0, 0, 0);

  /* ── 3. Etat et boucle ─────────────────────────────────────────────── */
  let forme = 0, formeCible = 1, fente = 0, fenteCible = 0;
  /* Le curseur demarre TRES loin de la toile, et c'est capital. Initialise au
     centre, le terme de repulsion `pres` valait 1 en plein milieu du mot des
     la premiere image : les lettres se chevauchaient et on lisait KASNBA au
     lieu de KAZURA. Le nom de la marque doit etre parfaitement lisible au
     repos ; il ne se deforme que sous un geste reel. */
  let sx = -9, sy = -9, lx = -9, ly = -9;
  let debut = performance.now();
  let visible = true;

  function redimensionner() {
    dim = peindreLeMot();
    toile.width = dim.L; toile.height = dim.H;
    televerser();
    gl.viewport(0, 0, dim.L, dim.H);
    gl.uniform2f(u.res, dim.L, dim.H);
  }
  gl.viewport(0, 0, dim.L, dim.H);
  gl.uniform2f(u.res, dim.L, dim.H);
  addEventListener('resize', redimensionner);

  toile.addEventListener('pointermove', e => {
    const r = toile.getBoundingClientRect();
    sx = (e.clientX - r.left) / r.width;
    sy = 1 - (e.clientY - r.top) / r.height;
    fenteCible = 1;
  }, { passive: true });
  toile.addEventListener('pointerleave', () => { fenteCible = 0; });

  new IntersectionObserver(es => { visible = es[0].isIntersecting; },
                           { threshold: 0.01 }).observe(toile);

  function peindre() {
    const t = (performance.now() - debut) / 1000;
    forme += (formeCible - forme) * (sobre ? 1 : 0.055);
    fente += (fenteCible - fente) * 0.09;
    lx += (sx - lx) * 0.08;
    ly += (sy - ly) * 0.08;

    gl.uniform1i(u.mot, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform2f(u.souris, lx, ly);
    gl.uniform1f(u.temps, t);
    gl.uniform1f(u.forme, forme);
    gl.uniform1f(u.fente, fente);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  if (sobre) {
    // Net tout de suite, et une seule image.
    forme = 1; formeCible = 1;
    peindre();
    addEventListener('resize', () => { redimensionner(); peindre(); });
    return { statique: true, viser() {}, peindre };
  }

  (function boucle() {
    if (visible) peindre();
    requestAnimationFrame(boucle);
  })();

  return {
    statique: false,
    /* Appelee par le defilement : 1 quand le mot doit etre net, 0 quand il
       doit se disloquer. C'est ce qui fait que descendre le pulverise. */
    viser(v) { formeCible = Math.max(0, Math.min(1, v)); },
    peindre
  };
}
