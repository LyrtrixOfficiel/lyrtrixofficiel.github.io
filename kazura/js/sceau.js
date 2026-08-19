/* ══════════════════════════════════════════════════════════════════════════
   LE SCEAU DE VERRE
   --------------------------------------------------------------------------
   Le blason de Kazura, taille dans du verre et rendu image par image.

   POURQUOI PAS UN MODELE TELECHARGE. Un maillage genere ailleurs est un objet
   mort : sa geometrie approche le logo au lieu de l'etre, il pese des megaoctets,
   et il contredit le seul argument du site, qui est que rien ici n'est une
   image enregistree. Le blason est un dessin vectoriel ; l'extruder donne la
   forme EXACTE, au controle de Bezier pres, pour quelques kilo-octets de code.

   CE QUI FAIT QUE CA RESSEMBLE A DU VERRE, dans l'ordre d'importance :
     1. les biseaux. Une arete vive ne renvoie aucune lumiere et le volume
        retombe en carton decoupe. C'est le biseau qui allume le contour ;
     2. la refraction avec une epaisseur reelle, pas une transparence ;
     3. quelque chose DERRIERE a deformer. Un verre devant du vide est
        invisible : les points lumineux du fond sont la pour se tordre ;
     4. un environnement dessine a la main. Le reflet raconte la piece dans
        laquelle l'objet se trouve, ici un jardin de nuit, jade en bas et
        violet en haut, avec une seule arete blanche pour l'eclat.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { monterLeCiel }    from './ciel.js';
import { SVGLoader }        from 'three/addons/loaders/SVGLoader.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }       from 'three/addons/postprocessing/ShaderPass.js';

/* Le blason, sans le fond sombre du favicon : trois folioles dans un anneau.
   Ecrit ici plutot que charge, pour que le module ne dependent d'aucun fichier
   et que la forme soit versionnee avec le code qui l'extrude. */
const BLASON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g fill="#000" fill-rule="evenodd">
    <path d="M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z"/>
    <path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>
    <path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(120 50 50)"/>
    <path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(240 50 50)"/>
    <circle cx="50" cy="50" r="4.6"/>
  </g>
</svg>`;

const alea = (a, b) => a + Math.random() * (b - a);

/* ── Les poussieres ─────────────────────────────────────────────────────── */
/* Leur seul role est d'etre deformees. Un verre pose devant du noir ne se voit
   pas : c'est la ligne de points qui se tord au passage du volume qui dit au
   visiteur que la refraction est calculee et non peinte. */
function faireLesPoussieres() {
  const N = 150;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const tail = new Float32Array(N);
  const jade = new THREE.Color(0x10B981), violet = new THREE.Color(0xA78BFA);

  for (let i = 0; i < N; i++) {
    pos[i * 3]     = alea(-6.5, 6.5);
    pos[i * 3 + 1] = alea(-4.0, 4.0);
    pos[i * 3 + 2] = alea(-7.0, -1.6);        // toutes DERRIERE le sceau
    const c = Math.random() < 0.62 ? jade : violet;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    tail[i] = alea(0.035, 0.11);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  g.setAttribute('aTaille',  new THREE.BufferAttribute(tail, 1));

  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTemps: { value: 0 }, uEchelle: { value: 300 } },
    vertexShader: `
      attribute float aTaille;
      varying vec3 vCouleur;
      varying float vScint;
      uniform float uTemps;
      uniform float uEchelle;
      void main() {
        vCouleur = color;
        vec3 p = position;
        p.y += sin(uTemps * 0.35 + position.x * 1.7) * 0.10;
        p.x += cos(uTemps * 0.28 + position.z * 1.3) * 0.08;
        vScint = 0.55 + 0.45 * sin(uTemps * 1.6 + position.y * 5.0);
        vec4 vue = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * vue;
        gl_PointSize = aTaille * uEchelle / max(0.001, -vue.z);
      }`,
    fragmentShader: `
      varying vec3 vCouleur;
      varying float vScint;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        if (r > 0.5) discard;
        float a = pow(1.0 - r * 2.0, 2.6);
        gl_FragColor = vec4(vCouleur * (1.4 + vScint), a * vScint);
      }`
  });
  m.vertexColors = true;
  return new THREE.Points(g, m);
}

/* ── Le fond, c'est-a-dire le sujet ─────────────────────────────────────── */
/* Le poste le plus rentable de tout le module, et le moins evident.

   PIEGE A CONNAITRE. three ne peint dans la cible de transmission que les
   objets OPAQUES. Un fond en fusion additive, si joli soit-il, appartient a la
   liste des transparents : le verre ne le voit jamais et se calcule devant du
   noir. C'est ce qui rendait le blason noir malgre une epaisseur correcte. Ce
   plan est donc opaque, et c'est lui le fond de la scene.

   LES BARRES OBLIQUES. Une lueur diffuse traversee reste une lueur diffuse, et
   personne ne voit qu'elle a ete deviee. Une ligne DROITE, elle, se brise en
   entrant dans le volume, et cette cassure est le seul indice qui dise a l'oeil
   que la refraction est calculee. C'est ce qui fait la difference entre un logo
   pose sur un halo et un objet en verre. */
function faireLeFond() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 768;
  const x = c.getContext('2d');

  x.fillStyle = '#05080E';
  x.fillRect(0, 0, 1024, 768);

  const lueur = (cx, cy, r, couleur, force) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,   `rgba(${couleur},${force})`);
    g.addColorStop(0.5, `rgba(${couleur},${force * 0.34})`);
    g.addColorStop(1,   `rgba(${couleur},0)`);
    x.fillStyle = g;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  };
  /* Decentrees, et larges. Centrees et serrees, elles dessinaient un second
     disque qui entrait en concurrence avec l'anneau du blason. */
  lueur(300, 560, 620, '16,185,129', 0.85);
  lueur(790, 190, 540, '124,58,237', 0.75);
  lueur(560, 380, 220, '190,255,232', 0.30);

  /* TROIS barres, pales, et d'une seule famille de couleur. La premiere version
     en comptait sept, epaisses, alternant vert et violet : la cassure se voyait
     tres bien, et le sceau n'etait plus qu'un obstacle au milieu d'un jeu de
     lasers. Une barre doit rester un indice, jamais le sujet. Le vert et le
     violet cote a cote fabriquent en plus un arc-en-ciel que la dispersion
     amplifie, alors qu'un jade pale et un blanc restent dans la charte. */
  x.globalCompositeOperation = 'lighter';
  x.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const d = (i + 0.5) / 3;
    const centre = 1 - Math.abs(d - 0.5) * 2;
    x.strokeStyle = `rgba(${i === 1 ? '236,255,246' : '150,240,205'},${(0.10 + 0.11 * centre).toFixed(3)})`;
    x.lineWidth = 1.4 + 2.0 * centre;
    x.beginPath();
    x.moveTo(-120 + d * 1450, -60);
    x.lineTo(-520 + d * 1450, 828);
    x.stroke();
  }
  x.globalCompositeOperation = 'source-over';

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  /* Opaque, sans transparence ni fusion : c'est la condition pour entrer dans
     la cible de transmission. Assez loin pour que la deviation soit franche,
     car plus la source est proche du volume, moins elle se decale en le
     traversant. */
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 22),
    new THREE.MeshBasicMaterial({ map: t })
  );
  m.position.z = -9;
  return m;
}

/* ── La dispersion ──────────────────────────────────────────────────────── */
/* three 0.161 n'a pas encore d'axe de dispersion sur le materiau physique. On
   la simule apres coup : les trois couches de couleur sont echantillonnees a
   des ecarts differents, croissants vers les bords. Ce n'est pas la vraie
   physique du prisme, mais c'est le signe que l'oeil lit comme du verre. */
const DISPERSION = {
  uniforms: { tDiffuse: { value: null }, uForce: { value: 0.5 } },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uForce;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      vec2 ecart = d * dot(d, d) * uForce;
      vec4 v = texture2D(tDiffuse, vUv);
      gl_FragColor = vec4(
        texture2D(tDiffuse, vUv - ecart).r,
        v.g,
        texture2D(tDiffuse, vUv + ecart).b,
        v.a);
    }`
};

/* ══ Montage ════════════════════════════════════════════════════════════ */
export function monterLeSceau(toile, options = {}) {
  /* La decision est prise une seule fois, par kazura.js, a partir de l'adresse,
     du choix garde et du reglage systeme. On la lit, on ne la refait pas. */
  const sobre = document.documentElement.dataset.mouvement !== 'anime';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: false });
  } catch (e) { return null; }

  const petit = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, petit ? 1.0 : 1.25));
  renderer.setClearColor(0x060910, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0, 7.4);

  /* Le ciel de la maison, partage avec le portail de pierre : deux objets
     eclaires par deux ciels differents n'appartiennent pas au meme monde. */
  const env = monterLeCiel(renderer, scene);

  const fond = faireLeFond();
  scene.add(fond);

  const poussieres = faireLesPoussieres();
  scene.add(poussieres);

  /* Deux lampes seulement. L'essentiel de l'eclairage vient de l'environnement ;
     celles-ci ne servent qu'a poser un eclat franc sur les biseaux du haut. */
  const cle = new THREE.DirectionalLight(0xEAFFF6, 2.6);
  cle.position.set(-3.2, 4.0, 4.5);
  scene.add(cle);
  const contre = new THREE.DirectionalLight(0x8B5CF6, 1.8);
  contre.position.set(3.6, -2.2, -3.0);
  scene.add(contre);

  /* ── La forme ─────────────────────────────────────────────────────────── */
  const groupe = new THREE.Group();
  scene.add(groupe);

  const matiere = new THREE.MeshPhysicalMaterial({
    /* Blanc, toujours, sur un materiau transmissif : la teinte doit venir de
       l'attenuation dans l'epaisseur, sinon on obtient du plastique vert. */
    color: 0xffffff,
    metalness: 0,
    roughness: 0.045,
    transmission: 1,
    /* L'epaisseur et la distance d'attenuation se lisent ensemble : c'est leur
       RAPPORT qui donne la densite. A 1.25 pour 1.35, le verre absorbait
       presque tout et rendait un blason noir. A 0.9 pour 3.2, la lumiere
       traverse et ne se teinte qu'en chemin, ce qui est le comportement du
       jade et non celui de l'encre. */
    thickness: 0.9,
    ior: 1.66,
    attenuationColor: new THREE.Color(0x0FA97A),
    attenuationDistance: 3.2,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    iridescence: 0.5,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [110, 460],
    envMapIntensity: 2.6,
    side: THREE.DoubleSide
  });

  const donnees = new SVGLoader().parse(BLASON);
  const geos = [];
  for (const chemin of donnees.paths) {
    for (const forme of SVGLoader.createShapes(chemin)) {
      const g = new THREE.ExtrudeGeometry(forme, {
        depth: 15,
        curveSegments: 26,
        /* Le biseau est le poste qui compte. Trop fin, l'arete reste vive et le
           volume retombe a plat ; trop epais, les folioles se referment. */
        bevelEnabled: true,
        bevelThickness: 2.1,
        bevelSize: 1.7,
        bevelOffset: 0,
        bevelSegments: 5
      });
      geos.push(g);
    }
  }

  /* Le repere SVG descend, celui de three monte : sans ce retournement le
     blason est a l'envers. L'echelle negative inverse le sens d'enroulement des
     faces, d'ou `DoubleSide` sur le materiau et un recalcul des normales. */
  const sceau = new THREE.Group();
  for (const g of geos) {
    g.scale(1, -1, 1);
    g.computeVertexNormals();
    sceau.add(new THREE.Mesh(g, matiere));
  }

  /* Centrer sur le volume reel plutot que sur le viewBox : le blason ne remplit
     pas ses 100 unites, et un centrage nominal le laisse decale. */
  const boite = new THREE.Box3().setFromObject(sceau);
  const centre = boite.getCenter(new THREE.Vector3());
  const taille = boite.getSize(new THREE.Vector3());
  sceau.children.forEach(m => m.geometry.translate(-centre.x, -centre.y, -centre.z));
  const k = 3.35 / Math.max(taille.x, taille.y);
  sceau.scale.setScalar(k);
  groupe.add(sceau);

  /* ── Post-traitement ──────────────────────────────────────────────────── */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  let bloom = null;
  if (!petit) {
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.7, 0.86);
    composer.addPass(bloom);
  }
  const dispersion = new ShaderPass(DISPERSION);
  dispersion.uniforms.uForce.value = petit ? 0.16 : 0.30;
  composer.addPass(dispersion);

  /* ── Dimensions ───────────────────────────────────────────────────────── */
  function mesurer() {
    const r = toile.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width));
    const h = Math.max(2, Math.round(r.height));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    if (bloom) bloom.setSize(w, h);
    poussieres.material.uniforms.uEchelle.value = h * 0.55;
  }
  mesurer();
  window.addEventListener('resize', mesurer);

  /* ── Le geste ─────────────────────────────────────────────────────────── */
  /* On vise une rotation, on l'atteint par amortissement. L'amortissement est
     calcule sur le temps ecoule et non par image : sinon le mouvement change de
     vitesse avec la cadence, ce qui se voit surtout a la molette. */
  const vise = { x: 0, y: 0 };
  const vu   = { x: 0, y: 0 };
  let survol = 0, survolCible = 0;

  /* On ecoute la FENETRE, pas la toile. En n'ecoutant que la toile, l'objet ne
     repondait que si le curseur etait pose dessus : partout ailleurs il ne
     restait que le balancement au ralenti, et Matheo le decrivait exactement
     comme il fallait, « il bouge tres aleatoirement ». Il ne repondait pas au
     hasard, il ne repondait pas du tout. En suivant le pointeur partout, il
     regarde la souris des l'instant ou on le voit. */
  const suivre = e => {
    if (!visible) return;
    const r = toile.getBoundingClientRect();
    if (!r.width) return;
    const nx = (e.clientX - (r.left + r.width / 2))  / (r.width / 2);
    const ny = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
    /* Borne large : au dela de deux demi-largeurs la rotation ne suit plus,
       sinon le sceau finit de dos des qu'on sort du cadre. */
    vise.y = Math.max(-1.6, Math.min(1.6, nx)) * 0.48;
    vise.x = Math.max(-1.6, Math.min(1.6, ny)) * 0.32;
    /* Le verre ne s'eclaircit que quand la souris est vraiment dessus : c'est
       la recompense du survol, elle doit rester rare pour se voir. */
    survolCible = (Math.abs(nx) < 1 && Math.abs(ny) < 1) ? 1 : 0;
  };
  window.addEventListener('pointermove', suivre, { passive: true });

  /* ── Entree ───────────────────────────────────────────────────────────── */
  /* Le sceau arrive par la tranche et pivote jusqu'a se presenter de face. Une
     tranche montre l'epaisseur, donc dit tout de suite que c'est un volume et
     non un aplat. En mode sobre il est simplement la, deja de face. */
  let entree = sobre ? 1 : 0;

  /* ── Boucle ───────────────────────────────────────────────────────────── */
  let visible = true, actif = true, dernier = performance.now();
  let cumul = 0, images = 0, degrade = false;

  function jauger(dt) {
    cumul += dt; images++;
    if (images < 45) return;
    const moyenne = cumul / images;
    cumul = 0; images = 0;
    if (moyenne > 0.024 && !degrade) {
      /* On sacrifie le halo avant la definition : le halo coute beaucoup et se
         remarque peu, la definition est ce qui tient les aretes du verre. */
      if (bloom && bloom.enabled) { bloom.enabled = false; degrade = true; return; }
      renderer.setPixelRatio(Math.max(0.75, renderer.getPixelRatio() * 0.75));
      mesurer();
      degrade = true;
    }
  }

  /* Le travail d'une image, isole de la boucle. Un seul chemin de peinture,
     donc la sonde mesure bien ce que la page dessine et non une copie. */
  let horloge = 0;
  function peindre(dt) {
    jauger(dt);
    horloge += dt;
    const maintenant = horloge * 1000;

    const a = 1 - Math.pow(1 - 0.12, dt * 60);
    vu.x += (vise.x - vu.x) * a;
    vu.y += (vise.y - vu.y) * a;
    survol += (survolCible - survol) * a;

    if (entree < 1) entree = Math.min(1, entree + dt * 0.55);
    const e = 1 - Math.pow(1 - entree, 3);

    const t = maintenant / 1000;
    groupe.rotation.y = (1 - e) * -Math.PI * 0.5 + vu.y + (sobre ? 0 : Math.sin(t * 0.22) * 0.13);
    groupe.rotation.x = vu.x + (sobre ? 0 : Math.sin(t * 0.31) * 0.07);
    groupe.position.y = sobre ? 0 : Math.sin(t * 0.45) * 0.055;
    sceau.scale.setScalar(k * (0.86 + 0.14 * e));

    /* Le verre s'eclaircit quand on le touche : l'attenuation recule, donc la
       lumiere traverse plus loin dans l'epaisseur. */
    matiere.attenuationDistance = 3.2 + survol * 2.2;
    matiere.iridescence = 0.5 + survol * 0.28;
    dispersion.uniforms.uForce.value = (petit ? 0.16 : 0.30) * (1 + survol * 0.6);

    if (!sobre) poussieres.material.uniforms.uTemps.value = t;
    composer.render();
  }

  function battre(maintenant) {
    if (!actif) return;
    requestAnimationFrame(battre);
    /* Le plancher a zero n'est pas une precaution de style. `maintenant` est
       l'horodatage du DEBUT de l'image courante ; si l'horloge a ete remise
       depuis, la difference est NEGATIVE et l'entree reculait au lieu
       d'avancer, ce qui laissait le sceau de profil tant qu'on defilait. */
    const dt = Math.min(0.05, Math.max(0, (maintenant - dernier) / 1000));
    dernier = maintenant;
    if (!visible) return;
    peindre(dt);
  }
  requestAnimationFrame(battre);

  return {
    /* Une toile plein cadre coupe toujours l'observateur : c'est a l'appelant
       de dire quand la section est reellement a l'ecran. Sans ce interrupteur,
       le sceau continue de calculer sa refraction en bas de page. */
    /* On ne remet l'horloge qu'au passage de cache a visible. La remettre a
       chaque appel la reculerait sans cesse : cette methode est appelee a
       chaque image par l'abonne au defilement, pas une fois par apparition. */
    montrer(v) { if (v && !visible) dernier = performance.now(); visible = v; },
    detruire() {
      actif = false;
      window.removeEventListener('resize', mesurer);
      window.removeEventListener('pointermove', suivre);
      groupe.traverse(o => { o.geometry?.dispose?.(); });
      matiere.dispose();
      poussieres.geometry.dispose();
      poussieres.material.dispose();
      env.dispose();
      fond.geometry.dispose(); fond.material.map.dispose(); fond.material.dispose();
      composer.dispose?.();
      renderer.dispose();
    },
    /* La sonde : elle peint par le chemin normal puis relit le tampon.
       Voir js/sonde.js pour pourquoi elle existe. */
    async sonder(n = 40) {
      const { sonderToile } = await import('./sonde.js');
      visible = true;
      return sonderToile(renderer, toile, peindre, n);
    },
    /* Poignees de service. */
    _scene: scene, _matiere: matiere, _camera: camera,
    bilan() {
      let sommets = 0;
      groupe.traverse(o => { if (o.geometry) sommets += o.geometry.attributes.position.count; });
      return { sommets, formes: geos.length, definition: renderer.getPixelRatio(),
               halo: bloom ? bloom.enabled : false, entree };
    }
  };
}
