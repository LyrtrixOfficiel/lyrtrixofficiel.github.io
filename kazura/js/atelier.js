/* ==========================================================================
   KAZURA 葛 - l'atelier
   --------------------------------------------------------------------------
   Un quad plein ecran et un fragment shader, sans aucune bibliotheque. Deux
   tours de domain warping sur un bruit fractal, puis deux jeux de nervures.
   La souris pousse le champ.

   Point de couleur qui compte : jade et violet sont poses par DEUX MASQUES
   DISJOINTS, jamais par un `mix()`. Un fondu direct entre un vert et un
   violet traverse un bleu sale, et tout le rendu vire au sarcelle fade.
   ========================================================================== */

export function monterLAtelier(toile) {
  /* La decision est prise une seule fois, par kazura.js, a partir de l'adresse,
     du choix garde et du reglage systeme. On la lit, on ne la refait pas. */
  const sobre = document.documentElement.dataset.mouvement !== 'anime';

  const gl = toile.getContext('webgl', {
    antialias: false, alpha: false, powerPreference: 'low-power'
  });

  if (!gl) {
    toile.style.background =
      'radial-gradient(70% 70% at 30% 40%, #0B7A5B 0%, #04060A 62%),' +
      'radial-gradient(60% 60% at 74% 66%, #5B2BB4 0%, transparent 70%)';
    return null;
  }

  const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

  const FS = `
    precision highp float;
    uniform vec2  u_res;
    uniform vec2  u_souris;
    uniform float u_temps;

    float alea(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    float bruit(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(alea(i),                 alea(i + vec2(1.0, 0.0)), u.x),
                 mix(alea(i + vec2(0.0, 1.0)), alea(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++){ v += a * bruit(p); p *= 2.03; a *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
      vec2 ms = (u_souris - 0.5 * u_res) / u_res.y;
      float t = u_temps * 0.055;

      vec2 q = uv * 1.55;
      float d = length(uv - ms);
      q += normalize(uv - ms + 0.0001) * 0.22 * exp(-d * 2.6);

      vec2 w = vec2(fbm(q + t), fbm(q + vec2(5.2, 1.3) - t));
      vec2 r = vec2(fbm(q + 3.6 * w + vec2(1.7, 9.2) + t * 1.4),
                    fbm(q + 3.6 * w + vec2(8.3, 2.8) - t * 1.1));
      float f = fbm(q + 3.4 * r);

      vec3 jade   = vec3(0.063, 0.725, 0.506);
      vec3 violet = vec3(0.486, 0.227, 0.929);

      /* LES DEUX MASQUES SE CHEVAUCHAIENT. A 0.60 vers 0.24 et 0.54 vers 0.90,
         ensemble ils couvraient toute la plage : chaque pixel recevait donc du
         jade ou du violet a pleine force, multiplie par 1.3 et 1.4 par dessus.
         Resultat, une marbrure saturee sur tout l'ecran ou le titre blanc
         devenait illisible, et qui contredisait la regle de la maison, ici
         presque tout doit etre noir.
         On les resserre chacun sur un bout de la plage en laissant entre eux un
         large creux qui reste sombre. Le noir est la matiere par defaut, la
         couleur est l'exception. */
      /* LE JADE EST LA COULEUR DE LA MAISON, le violet n'est qu'un accent.
         La premiere balance donnait l'inverse : un ecran entier violet, ce
         qui est joli et ne nous ressemble pas. Le masque vert prend donc la
         plus grande part de la plage, le violet la plus etroite. */
      float mVert   = smoothstep(0.58, 0.08, f);
      float mViolet = smoothstep(0.74, 0.96, f);

      /* LA PRESENCE. Resserrer les masques ne suffisait pas : la couleur
         restait repartie sur toute la surface, simplement moins forte, et
         l'ensemble gardait l'air d'une nappe d'huile. Ce qu'il faut n'est pas
         moins de couleur PARTOUT, c'est de la couleur PAR ENDROITS.
         Ce bruit de tres basse frequence decide donc ou la matiere s'allume du
         tout. Il laisse de larges plages presque noires entre les zones vives,
         ce qui est exactement la densite du fond des lianes, et il derive
         lentement pour que ces plages se deplacent. */
      /* PORTE ROUVERTE. Reglee de 0,48 a 0,88, elle ne s'ouvrait presque
         jamais : combinee au puits central et au vignettage, elle laissait un
         ecran entier NOIR sous un titre qui promet une matiere recalculee
         soixante fois par seconde. La promesse etait donc dementie par
         l'image, ce qui est pire que de ne rien promettre. On garde l'idee,
         de la couleur PAR ENDROITS et non partout, mais avec un plancher :
         meme au creux du bruit, il reste un tiers de matiere. */
      float presence = 0.34 + 0.66 * smoothstep(0.30, 0.72, fbm(q * 0.32 + t * 0.35));

      vec3 col = vec3(0.008, 0.032, 0.044);
      col += jade   * mVert   * 1.30 * presence;
      col += violet * mViolet * 0.62 * presence;

      /* Les nervures gardent leur eclat : ce sont elles qui portent la vie, et
         elles sont assez fines pour ne jamais noyer le texte. C'est la lecon du
         sceau de verre, ou trois traits pales disaient mieux la refraction que
         sept barres epaisses. */
      float nerf = abs(sin(f * 11.0 + t * 5.5));
      col += vec3(0.43, 0.94, 0.74) * pow(nerf, 6.0) * 1.35 * mVert * presence;
      col += vec3(0.72, 0.55, 1.00) * pow(abs(sin(f * 7.5 - t * 3.6)), 9.0) * 0.55 * presence;

      col += violet * exp(-d * 3.2) * 0.22;
      col += jade   * exp(-d * 2.2) * 0.30;

      /* Un puits sombre au centre, exactement la ou le titre se pose. Le texte
         est blanc : sans ce creux il tombait sur du vert clair. */
      /* Le puits et le vignettage se CUMULAIENT : soixante-dix pour cent de
         moins au centre, cinquante-cinq de moins sur les bords, il ne restait
         qu'un anneau. Le puits sert a poser un titre blanc, il n'a pas besoin
         d'aller si loin, et le vignettage encore moins. */
      vec2 pu = uv * vec2(1.15, 1.85);
      col *= 1.0 - 0.46 * exp(-dot(pu, pu) * 2.0);

      col *= 1.0 - 0.34 * length(uv * vec2(0.72, 1.0));
      col = pow(max(col, 0.0), vec3(1.04));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const compiler = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('atelier, shader :', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };

  const vs = compiler(gl.VERTEX_SHADER, VS);
  const fs = compiler(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uSou = gl.getUniformLocation(prog, 'u_souris');
  const uTps = gl.getUniformLocation(prog, 'u_temps');

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let sx = 0, sy = 0, lx = 0, ly = 0;

  const redimensionner = () => {
    const r = toile.getBoundingClientRect();
    toile.width  = Math.max(1, Math.floor(r.width  * dpr));
    toile.height = Math.max(1, Math.floor(r.height * dpr));
    gl.viewport(0, 0, toile.width, toile.height);
    gl.uniform2f(uRes, toile.width, toile.height);
    sx = toile.width / 2; sy = toile.height / 2;
    lx = sx; ly = sy;
  };
  redimensionner();
  window.addEventListener('resize', redimensionner);

  const peindre = (t) => {
    gl.uniform2f(uSou, lx, ly);
    gl.uniform1f(uTps, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* Le mode sobre ne coupe pas le rendu, seulement le mouvement : une image
     fixe vaut mieux qu'un rectangle noir sous un texte qui promet de la
     matiere vivante. */
  if (sobre) {
    peindre(18.0);
    window.addEventListener('resize', () => { redimensionner(); peindre(18.0); });
    return { statique: true };
  }

  toile.addEventListener('pointermove', e => {
    const r = toile.getBoundingClientRect();
    sx = (e.clientX - r.left) * dpr;
    sy = (r.height - (e.clientY - r.top)) * dpr;
  });

  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; },
                           { threshold: 0.01 }).observe(toile);
  // Filet : l'observateur ne repond pas dans un document non compose.
  setTimeout(() => { if (!visible) visible = true; }, 2500);

  const debut = performance.now();

  /* La poignee de reglage : elle peint UNE image par le chemin normal, a
     l'instant qu'on lui donne. Sans elle, une toile animee dans un onglet
     d'arriere-plan reste noire et on ne peut rien conclure de ce qu'on voit. */
  (window.kazura ||= {}).atelier = {
    poser(sec = 3) { visible = true; peindre(sec); },
    /* La sonde. L'atelier n'a pas de boucle a pas de temps : on lui donne un
       instant, il peint cet instant-la. */
    async sonder(sec = 6) {
      const { sonderToile } = await import('./sonde.js');
      visible = true;
      let t = sec;
      return sonderToile(gl, toile, () => { peindre(t); t += 1 / 60; }, 6);
    }
  };

  (function boucle() {
    if (visible) {
      lx += (sx - lx) * 0.06;
      ly += (sy - ly) * 0.06;
      peindre((performance.now() - debut) / 1000);
    }
    requestAnimationFrame(boucle);
  })();

  return { statique: false };
}
