/* ==========================================================================
   KAZURA 葛 - le jardin sec
   --------------------------------------------------------------------------
   Un karesansui : du gravier qu'on ratisse. Le curseur est un rateau a
   plusieurs dents, les sillons restent, et ils accrochent la lumiere.

   COMMENT CA MARCHE

   Tout tient dans un CHAMP DE HAUTEUR garde en texture, et deux passes.

   1. GRAVER. On depose l'empreinte du rateau le long du deplacement du
      curseur. Les dents sont un motif periodique dans la direction
      PERPENDICULAIRE au geste : c'est ce qui distingue un rateau d'un doigt,
      et c'est tout ce qui fait lire « jardin japonais ».

   2. ECLAIRER. La normale de la surface se deduit du gradient du champ de
      hauteur (la difference entre deux texels voisins). Avec une lumiere
      rasante, un creux de quelques milliemes suffit a dessiner une ombre
      franche : c'est pour ca qu'un sillon se voit alors que le champ est
      presque plat.

   Le champ n'est jamais efface : le visiteur laisse une trace qui reste tant
   qu'il est sur la page. C'est le point, un jardin sec se garde.
   ========================================================================== */

export function monterLeJardin(toile, options = {}) {
  const _fm = new URLSearchParams(location.search).get('mouvement');
  const sobre = _fm === '1' ? false : _fm === '0' ? true
              : matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gl = toile.getContext('webgl2', { alpha: false, antialias: false, depth: false });
  if (!gl) return null;
  if (!gl.getExtension('EXT_color_buffer_float')) return null;

  const petit = innerWidth < 820;
  const N = petit ? 512 : 1024;          // finesse du champ de hauteur

  /* ── Outils ────────────────────────────────────────────────────────── */
  const compiler = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('jardin, shader :', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };

  const VS = `#version 300 es
    in vec2 aPos;
    out vec2 vUv;
    void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const programme = (fs) => {
    const p = gl.createProgram();
    const v = compiler(gl.VERTEX_SHADER, VS), f = compiler(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const nom = gl.getActiveUniform(p, i).name;
      u[nom] = gl.getUniformLocation(p, nom);
    }
    return { p, u };
  };

  /* ── 1. Graver ─────────────────────────────────────────────────────── */
  const P_GRAVER = programme(`#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 sortie;
    uniform sampler2D uChamp;
    uniform vec2  uA, uB;        // segment parcouru par le rateau
    uniform vec2  uPerp;         // perpendiculaire au geste, normalisee
    uniform float uRatio;        // rapport d'image, pour un rateau non deforme
    uniform float uLargeur;      // demi-largeur du rateau
    uniform float uDents;        // nombre de dents sur cette largeur
    uniform float uForce;

    void main() {
      float h = texture(uChamp, vUv).r;

      // Distance du point au SEGMENT, pas au point : sans cela un geste
      // rapide laisse des taches espacees au lieu d'un trait continu.
      vec2 p  = vec2(vUv.x * uRatio, vUv.y);
      vec2 a  = vec2(uA.x  * uRatio, uA.y);
      vec2 b  = vec2(uB.x  * uRatio, uB.y);
      vec2 ab = b - a;
      float l2 = max(dot(ab, ab), 1e-9);
      float t  = clamp(dot(p - a, ab) / l2, 0.0, 1.0);
      vec2 sur = a + ab * t;
      vec2 d   = p - sur;

      float across = dot(d, normalize(vec2(uPerp.x * uRatio, uPerp.y)));
      float dist   = length(d);

      // Enveloppe du rateau : au-dela de sa largeur, rien.
      float dedans = 1.0 - smoothstep(uLargeur * 0.72, uLargeur, abs(across));
      if (dedans <= 0.001) { sortie = vec4(h, 0.0, 0.0, 1.0); return; }

      // Les dents : un motif periodique en travers du geste.
      float dents = cos(across / uLargeur * 3.14159 * uDents);
      float creux = -dents * 0.5 + 0.5;          // 0 au sillon, 1 sur la crete
      float profil = mix(-1.0, 0.35, creux);      // creux profonds, bourrelets

      // Attenuation le long de la normale au segment.
      float pres = 1.0 - smoothstep(0.0, uLargeur * 1.15, dist);

      h += profil * pres * dedans * uForce;
      sortie = vec4(clamp(h, -1.0, 0.55), 0.0, 0.0, 1.0);
    }`);

  /* ── 2. Eclairer ───────────────────────────────────────────────────── */
  const P_RENDU = programme(`#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 sortie;
    uniform sampler2D uChamp;
    uniform vec2  uTexel;
    uniform float uTemps, uRatio;

    float alea(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      // La normale vient du gradient du champ. Une lumiere rasante transforme
      // un creux de quelques milliemes en ombre franche.
      float hx = texture(uChamp, vUv + vec2(uTexel.x, 0.0)).r
               - texture(uChamp, vUv - vec2(uTexel.x, 0.0)).r;
      float hy = texture(uChamp, vUv + vec2(0.0, uTexel.y)).r
               - texture(uChamp, vUv - vec2(0.0, uTexel.y)).r;
      float h  = texture(uChamp, vUv).r;

      vec3 nrm = normalize(vec3(-hx * 26.0, -hy * 26.0, 1.0));
      vec3 lum = normalize(vec3(-0.62, 0.52, 0.58));   // rasante, venue du coin

      float diff = max(dot(nrm, lum), 0.0);
      float spec = pow(max(dot(reflect(-lum, nrm), vec3(0.0, 0.0, 1.0)), 0.0), 30.0);
      float occl = smoothstep(-0.35, 0.15, h);         // le fond des sillons est sombre

      // Le gravier : grain fin, presque monochrome, tres sombre.
      float grain = alea(floor(vUv * vec2(uRatio, 1.0) * 900.0)) * 0.5
                  + alea(floor(vUv * vec2(uRatio, 1.0) * 320.0)) * 0.5;

      vec3 pierre = vec3(0.105, 0.132, 0.142) * (0.72 + grain * 0.56);

      vec3 col = pierre * (0.55 + diff * 1.25) * (0.5 + occl * 0.7);
      // Le jade se depose dans les creux, comme de la mousse.
      col += vec3(0.063, 0.725, 0.506) * (1.0 - occl) * 0.15;
      // Le violet ne touche que les aretes eclairees.
      col += vec3(0.486, 0.227, 0.929) * spec * 0.85;
      col += vec3(0.62, 1.0, 0.86) * spec * 0.35;

      vec2 c = vUv - 0.5;
      col *= 1.0 - 0.55 * dot(c * vec2(uRatio * 0.55, 1.0), c * vec2(uRatio * 0.55, 1.0));
      col += (alea(vUv * 800.0 + uTemps) - 0.5) * 0.016;

      sortie = vec4(col, 1.0);
    }`);

  if (!P_GRAVER || !P_RENDU) return null;

  /* ── Le quad et les cibles ─────────────────────────────────────────── */
  const quad = gl.createVertexArray();
  gl.bindVertexArray(quad);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function cible() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, N, N, 0, gl.RED, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo };
  }
  let A = cible(), B = cible();

  const dessiner = (c) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, c ? c.fbo : null);
    gl.viewport(0, 0, c ? N : toile.width, c ? N : toile.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  let ratio = 1;
  const dpr = Math.min(devicePixelRatio || 1, petit ? 1.25 : 1.5);
  function redimensionner() {
    const r = toile.getBoundingClientRect();
    toile.width  = Math.max(1, Math.floor(r.width  * dpr));
    toile.height = Math.max(1, Math.floor(r.height * dpr));
    ratio = toile.width / Math.max(1, toile.height);
  }
  redimensionner();
  addEventListener('resize', redimensionner);

  /* ── Le rateau ─────────────────────────────────────────────────────── */
  function ratisser(ax, ay, bx, by, force = 1) {
    let dx = bx - ax, dy = by - ay;
    const l = Math.hypot(dx * ratio, dy);
    if (l < 1e-5) { dx = 1; dy = 0; }
    const px = -dy, py = dx;
    const n = Math.hypot(px, py) || 1;

    gl.useProgram(P_GRAVER.p);
    gl.bindVertexArray(quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(P_GRAVER.u.uChamp, 0);
    gl.uniform2f(P_GRAVER.u.uA, ax, ay);
    gl.uniform2f(P_GRAVER.u.uB, bx, by);
    gl.uniform2f(P_GRAVER.u.uPerp, px / n, py / n);
    gl.uniform1f(P_GRAVER.u.uRatio, ratio);
    gl.uniform1f(P_GRAVER.u.uLargeur, 0.105);
    gl.uniform1f(P_GRAVER.u.uDents, 5.0);
    gl.uniform1f(P_GRAVER.u.uForce, 0.20 * force);
    dessiner(B);
    const t = A; A = B; B = t;
  }

  function afficher(t) {
    gl.useProgram(P_RENDU.p);
    gl.bindVertexArray(quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(P_RENDU.u.uChamp, 0);
    gl.uniform2f(P_RENDU.u.uTexel, 1 / N, 1 / N);
    gl.uniform1f(P_RENDU.u.uTemps, t);
    gl.uniform1f(P_RENDU.u.uRatio, ratio);
    dessiner(null);
  }

  /* ── Le motif d'accueil ────────────────────────────────────────────── */
  /* Un jardin sec vide ne se comprend pas : on trace d'abord des ondes
     concentriques autour d'une pierre absente, comme dans un vrai karesansui.
     Le visiteur comprend alors qu'il peut ratisser par-dessus. */
  function motifInitial() {
    /* Le champ ratisse en passes paralleles, puis UN seul anneau autour d'une
       pierre. Plusieurs anneaux rapproches se recouvrent : les dents tournent
       d'un segment a l'autre et le resultat vire au moire, pas au jardin. */
    for (let i = 0; i <= 7; i++) {
      const y = -0.05 + i * 0.165;
      ratisser(-0.08, y, 1.08, y + 0.012, 0.85);
    }
    const cx = 0.30, cy = 0.5, r = 0.23;
    const pas = 44;
    for (let i = 0; i < pas; i++) {
      const a1 = (i / pas) * Math.PI * 2, a2 = ((i + 1) / pas) * Math.PI * 2;
      ratisser(cx + Math.cos(a1) * r / ratio, cy + Math.sin(a1) * r,
               cx + Math.cos(a2) * r / ratio, cy + Math.sin(a2) * r, 0.9);
    }
  }
  motifInitial();

  /* ── Entrees ───────────────────────────────────────────────────────── */
  let px2 = null, py2 = null;
  const placer = (e) => {
    const r = toile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (px2 !== null) ratisser(px2, py2, x, y, 1);
    px2 = x; py2 = y;
  };
  toile.addEventListener('pointermove', placer, { passive: true });
  toile.addEventListener('pointerdown', e => { px2 = null; placer(e); });
  toile.addEventListener('pointerleave', () => { px2 = null; });

  /* ── Boucle ────────────────────────────────────────────────────────── */
  if (sobre) {
    afficher(0);
    addEventListener('resize', () => { redimensionner(); afficher(0); });
    return { statique: true, ratisser, afficher, motifInitial };
  }

  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; },
                           { threshold: 0.01 }).observe(toile);
  setTimeout(() => { if (!visible) visible = true; }, 2500);

  const debut = performance.now();
  (function boucle() {
    if (visible) afficher((performance.now() - debut) / 1000);
    requestAnimationFrame(boucle);
  })();

  return { statique: false, ratisser, afficher, motifInitial };
}
