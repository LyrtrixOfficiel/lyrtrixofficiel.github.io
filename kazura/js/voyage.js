/* ══════════════════════════════════════════════════════════════════════════
   LE VOYAGE
   --------------------------------------------------------------------------
   Un seul monde, une seule camera, un seul bouton : le defilement.

   POURQUOI ON REFAIT L'ACCUEIL AINSI. Le site actuel est une SUITE DE
   SECTIONS, chacune avec sa scene, sa camera, son eclairage et son moteur de
   rendu. Chaque piece est correcte, et l'ensemble ne raconte rien : on passe
   d'un objet a un autre par des coupes, comme dans un catalogue.

   Sur igloo.inc, il n'y a pas de coupe. On avance dans un espace, et c'est
   cette continuite qui donne la sensation de jeu video, bien plus que le
   rendu. Le defilement n'y fait pas defiler une page : il fait AVANCER.

   LES CINQ TEMPS
     1  Le nom se forme en particules, tres pres, dans le noir.
     2  La camera recule. On decouvre qu'on etait sur une feuille de kudzu.
     3  On longe la liane jusqu'a un portail de pierre envahi.
     4  On le traverse.
     5  On prend de la hauteur : la plante entiere, et la maquette au bout.

   CE QUI EST DIFFERENT DES SECTIONS. Rien n'apparait ni ne disparait : tout
   est deja la, a sa place dans l'espace, et c'est la camera qui va le voir.
   Un objet qu'on a depasse reste derriere soi. C'est ce qui fait qu'on croit
   a un lieu plutot qu'a un diaporama.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { BLASON } from './blason.js';

const JADE   = new THREE.Color('#10B981');
const JADE_F = new THREE.Color('#04352A');
const VIOLET = new THREE.Color('#7C3AED');
const NUIT   = new THREE.Color('#04060A');

const alea = (a, b) => a + Math.random() * (b - a);

/* ══ LE RAIL ══════════════════════════════════════════════════════════════
   Une position et un point vise pour chaque temps. Entre deux reperes, on
   interpole le long d'une courbe lissee : c'est ce qui evite les a-coups aux
   changements de direction, qu'on lit tout de suite comme un montage.

   Les valeurs sont donnees a la main plutot que calculees. Un rail de camera
   est une decision de mise en scene, pas un probleme d'optimisation. */
const REPERES = [
  { t: 0.00, oeil: [0.00, 0.10,  2.15], vise: [0.0,  0.05, -0.6] },
  { t: 0.12, oeil: [0.35, 0.35,  4.20], vise: [0.0,  0.10, -0.4] },
  { t: 0.24, oeil: [1.10, 1.05,  7.20], vise: [0.0,  0.20, -0.2] },
  { t: 0.38, oeil: [2.40, 2.10, 12.80], vise: [0.4,  1.10,  3.0] },
  { t: 0.52, oeil: [1.20, 2.60, 26.00], vise: [0.2,  2.40, 40.0] },
  { t: 0.66, oeil: [0.20, 2.55, 39.00], vise: [0.0,  2.55, 52.0] },
  { t: 0.78, oeil: [0.00, 2.50, 50.50], vise: [0.0,  2.40, 62.0] },
  { t: 0.88, oeil: [0.00, 2.60, 60.50], vise: [0.0,  2.60, 74.0] },
  { t: 1.00, oeil: [1.20, 3.00, 66.50], vise: [0.0,  2.60, 82.0] }
];

function courbeDe(cle) {
  return new THREE.CatmullRomCurve3(
    REPERES.map(r => new THREE.Vector3(...r[cle])), false, 'catmullrom', 0.35);
}

/* Le rail n'est pas parcouru a vitesse constante : les reperes ne sont pas
   equidistants dans le temps. On transforme donc le temps du recit en
   abscisse sur la courbe, en interpolant entre deux reperes. */
function abscisse(t) {
  const n = REPERES.length - 1;
  for (let i = 0; i < n; i++) {
    const a = REPERES[i].t, b = REPERES[i + 1].t;
    if (t <= b || i === n - 1) {
      const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
      return (i + k) / n;
    }
  }
  return 1;
}

export async function monterLeVoyage(toile, options = {}) {
  const petit = matchMedia('(max-width: 860px)').matches || options.petit;
  const sobre = document.documentElement.dataset.mouvement !== 'anime';

  let rendu;
  try {
    rendu = new THREE.WebGLRenderer({
      canvas: toile, antialias: !petit, alpha: false, powerPreference: 'high-performance'
    });
  } catch (e) { return null; }
  rendu.setClearColor(NUIT, 1);
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = NUIT;
  /* ══ LE BROUILLARD FAIT LA PROFONDEUR ══════════════════════════════════
     C'est le procede le moins cher et le plus payant releve chez igloo : ce
     qui est loin palit vers la couleur du fond. Sans lui, un objet a soixante
     unites a exactement le meme contraste qu'un objet a deux, et l'oeil perd
     toute notion de distance dans une scene sans horizon. */
  scene.fog = new THREE.FogExp2(NUIT, 0.019);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 260);
  const railOeil = courbeDe('oeil');
  const railVise = courbeDe('vise');

  /* ══ UNE SEULE CONDITION DE LUMIERE POUR TOUT LE VOYAGE ════════════════
     Une cle froide devant, un contre-jour jade derriere, un rebond violet
     tres bas. Les memes trois lampes du debut a la fin : c'est ce qui fait
     que la feuille, le portail et les lianes semblent etre au meme endroit. */
  /* ══ LA CLE VIENT DU COTE DU VOYAGEUR ══════════════════════════════════
     Elle etait posee en +z, c'est-a-dire DERRIERE tout ce qu'on regarde,
     puisque la camera avance dans ce sens. La face du portail tournee vers
     nous ne recevait donc que le contre-jour violet, et la pierre ressortait
     indigo uniforme apres avoir ete emeraude uniforme.

     Une lampe directionnelle eclaire dans le sens position vers origine : il
     faut donc la placer du cote d'ou l'on vient pour qu'elle frappe ce qu'on
     voit. Haut, a gauche, et devant : la lumiere descend sur les objets a
     mesure qu'on les approche. */
  const cle = new THREE.DirectionalLight(0xDCF2FF, 2.4);
  cle.position.set(-8, 12, -10);
  scene.add(cle);
  /* ══ LE CONTRE-JOUR EST VIOLET, PAS JADE ═══════════════════════════════
     Il etait jade a 4,6, ce qui est le bon reglage pour du feuillage qu'on
     regarde par transparence. Sur de la PIERRE, opaque, la meme lampe donnait
     un portail EMERAUDE UNIFORME, lisse comme du plastique moule : plus rien
     ne disait que c'etait un materiau lourd.

     Le violet est deja la contre-couleur de la maison, et sur une pierre
     grise il fait exactement ce qu'un ciel de nuit fait sur un mur : il la
     refroidit sans la teindre. Les tiges et les feuilles, elles, n'utilisent
     pas les lampes de la scene mais leur propre direction de lumiere, ecrite
     dans leur nuanceur : ce reglage ne les touche pas. */
  /* Et le contre-jour derriere, en +z : c'est lui qui detache les silhouettes
     du brouillard et qui pose un liseré sur les aretes lointaines. */
  const contre = new THREE.DirectionalLight(0x8B5CF6, 1.9);
  contre.position.set(9, 5, 42);
  scene.add(contre);
  /* Un remplissage tres bas, depuis le fond du couloir. Sans lui, le dos du
     portail ne recoit QUE le contre-jour violet : quand on le depasse et
     qu'on se retourne, la pierre devient un aplat indigo, alors que de face
     elle est grise. Une lampe pale suffit a lui rendre sa matiere des deux
     cotes, ce qui est bien la moindre des choses pour un objet qu'on
     traverse. */
  /* ══ UNE LAMPE QUI N'ECLAIRE QUE LE DEBUT DU VOYAGE ════════════════════
     En reorientant les lampes pour que la pierre du portail cesse d'etre un
     aplat, j'ai retire a la feuille le jade qui la faisait vivre : elle est
     ressortie vert sauge, terne, alors que c'est le premier objet du site et
     qu'il porte tout le premier temps.

     Une seule condition de lumiere pour tout le voyage reste la regle, mais
     une regle n'interdit pas une LAMPE POSEE QUELQUE PART. Une source de
     proximite avec sa portee est une chose qu'on comprend en la voyant :
     elle eclaire ce qui est pres d'elle et rien d'autre, exactement comme
     une lampe dans une piece. Trente unites plus loin, dans le couloir, elle
     n'existe plus, et la pierre garde le reglage qui lui convient. */
  const lampeFeuille = new THREE.PointLight(0x6EE7B7, 70, 26, 2);
  lampeFeuille.position.set(3.0, 2.4, 6.5);
  scene.add(lampeFeuille);

  const remplissage = new THREE.DirectionalLight(0xBFE9DA, 1.0);
  remplissage.position.set(-4, 8, 62);
  scene.add(remplissage);

  scene.add(new THREE.HemisphereLight(0x1E6B57, 0x050A08, 0.9));

  /* ══ UN ENVIRONNEMENT, SINON LA PIERRE N'A RIEN A REFLETER ═════════════
     Un materiau physique se definit par ce qu'il renvoie du monde autour de
     lui. Sans environnement, ses reflets valent zero : il ne reste que le
     diffus, et toute matiere finit en peinture mate, quelle que soit sa
     rugosite. C'est ce qui manquait le plus au portail.

     Trois bandes suffisent : un ciel jade tres sombre, un horizon violet, un
     sol noir. Trois kilo-octets de degrade calcules sur place valent mieux
     qu'une carte HDR d'un mega-octet qu'il faudrait telecharger. */
  const ciel = document.createElement('canvas');
  ciel.width = 16; ciel.height = 128;
  const cx = ciel.getContext('2d');
  const deg = cx.createLinearGradient(0, 0, 0, 128);
  deg.addColorStop(0.00, '#0D2620');
  deg.addColorStop(0.42, '#12141C');
  deg.addColorStop(0.58, '#161320');
  deg.addColorStop(1.00, '#030407');
  cx.fillStyle = deg; cx.fillRect(0, 0, 16, 128);
  const texCiel = new THREE.CanvasTexture(ciel);
  texCiel.mapping = THREE.EquirectangularReflectionMapping;
  texCiel.colorSpace = THREE.SRGBColorSpace;
  scene.environment = texCiel;

  const monde = new THREE.Group();
  scene.add(monde);

  /* ── Le materiau du feuillage ───────────────────────────────────────── */
  const empreinteVide = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  empreinteVide.needsUpdate = true;

  const matFeuillage = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: {
      uEmpreinte: { value: empreinteVide }, uTemps: { value: 0 },
      uJade: { value: JADE }, uViolet: { value: VIOLET },
      uBrouillard: { value: NUIT }, uDensite: { value: scene.fog.density }
    },
    vertexShader: /* glsl */`
      attribute float aGraine;
      attribute float aCase;
      varying vec2 vUv;
      varying float vGraine, vProfondeur;
      varying vec3 vNormalMonde;
      uniform float uTemps;
      void main() {
        float miroir = aGraine < 0.5 ? -1.0 : 1.0;
        float u = miroir < 0.0 ? 1.0 - uv.x : uv.x;
        vUv = vec2((u + aCase) * 0.5, uv.y);
        vGraine = aGraine;
        vec3 p = vec3(position.x * miroir, position.y, position.z);
        p.xy += vec2(sin(uTemps * 0.5 + aGraine * 6.28),
                     cos(uTemps * 0.4 + aGraine * 4.13)) * 0.05;
        vec4 m = instanceMatrix * vec4(p, 1.0);
        vNormalMonde = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
        vec4 vue = viewMatrix * modelMatrix * m;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform sampler2D uEmpreinte;
      uniform vec3 uJade, uViolet, uBrouillard;
      uniform float uDensite;
      varying vec2 vUv;
      varying float vGraine, vProfondeur;
      varying vec3 vNormalMonde;
      void main() {
        vec4 t = texture2D(uEmpreinte, vUv);
        if (t.a < 0.42) discard;
        vec3 N = normalize(vNormalMonde);
        vec3 L = normalize(vec3(0.45, 0.35, -1.0));
        float dos  = pow(clamp(dot(-N, L), 0.0, 1.0), 1.5);
        float face = clamp(dot(N, L), 0.0, 1.0);
        float tr = dos * mix(0.42, 1.75, fract(vGraine * 2.0));
        vec3 col = t.rgb * 0.060 + t.rgb * uJade * 1.55 * tr + uViolet * face * 0.10;
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(col, clamp(0.30 + tr * 0.60, 0.0, 0.95));
      }
    `
  });

  new THREE.TextureLoader().load('assets/feuilles-empreinte.webp', tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = Math.min(8, rendu.capabilities.getMaxAnisotropy());
    matFeuillage.uniforms.uEmpreinte.value = tex;
    empreinteVide.dispose();
  });

  /* ── Le materiau des tiges ──────────────────────────────────────────── */
  const matTige = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: {
      uJade: { value: JADE }, uJadeF: { value: JADE_F }, uViolet: { value: VIOLET },
      uBrouillard: { value: NUIT }, uDensite: { value: scene.fog.density }
    },
    vertexShader: /* glsl */`
      attribute vec3 aCentre;
      varying vec2 vUv;
      varying vec3 vNormalMonde, vVersOeil;
      varying float vProfondeur;
      void main() {
        vUv = uv;
        /* Les deux bouts se pincent vers l'axe : un tube ouvert montre son
           interieur, et une ellipse claire au bout d'une tige se lit
           immediatement comme une PAILLE coupee. */
        float effile = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.90, uv.x);
        vec3 pincee = mix(aCentre, position, effile);
        vec4 m = modelMatrix * vec4(pincee, 1.0);
        vNormalMonde = normalize(mat3(modelMatrix) * normal);
        vVersOeil = normalize(cameraPosition - m.xyz);
        vec4 vue = viewMatrix * m;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uJade, uJadeF, uViolet, uBrouillard;
      uniform float uDensite;
      varying vec2 vUv;
      varying vec3 vNormalMonde, vVersOeil;
      varying float vProfondeur;
      void main() {
        vec3 N = normalize(vNormalMonde), V = normalize(vVersOeil);
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        vec3 L = normalize(vec3(0.45, 0.35, -1.0));
        float dos = pow(clamp(dot(-N, L), 0.0, 1.0), 2.2);
        vec3 col = uJadeF * 0.16 + uJade * dos * 1.20 + uViolet * fres * 0.20;
        float nerv = pow(abs(sin(vUv.y * 3.14159 * 5.0 + sin(vUv.x * 2.3) * 0.55)), 14.0);
        col += uJade * nerv * 0.22;
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(col, clamp(0.09 + fres * 0.26 + dos * 0.34, 0.0, 1.0));
      }
    `
  });

  /* ══ LE COULOIR DE LIANES ═════════════════════════════════════════════
     Elles ne remplissent pas l'espace : elles le BORDENT. Deux haies qui
     s'ecartent de l'axe du voyage, pour que le regard file vers le portail
     au lieu de se perdre. C'est tout ce que le decor a a faire ici. */
  const feuillesPos = [];
  const NB_LIANES = petit ? 14 : 38;
  const SEG = petit ? 70 : 130;
  const RAD = petit ? 6 : 9;

  for (let i = 0; i < NB_LIANES; i++) {
    const cote = i % 2 ? 1 : -1;
    /* La moitie des lianes est semee entre zero et cinquante, la ou le
       couloir etait vide entre la feuille et le portail : sans elles, on
       traverse quinze unites sans rien voir passer, et le voyage s'arrete
       alors qu'il continue. */
    const z0 = i % 2 ? alea(-4, 50) : alea(-4, 82);
    const ecart = alea(4.0, 9.2) * cote;
    const montee = alea(7, 17);
    /* ══ UN ALEA PAR LIANE, JAMAIS PAR POINT ══════════════════════════════
       La derive en profondeur etait ecrite `u * alea(-6, 6)` DANS la boucle :
       chaque point de controle recevait donc sa propre derive, tiree au sort
       independamment de ses voisins. Le resultat n'etait pas une tige mais un
       ECLAIR EN ZIGZAG, et vingt-deux eclairs faisaient un fouillis de rubans
       froisses ou l'on ne reconnaissait plus rien.

       Une plante est lisse : ce qui varie d'une plante a l'autre est tire une
       fois, ce qui varie le long d'une meme plante suit une fonction continue.
       C'est la meme regle que pour le bruit d'une surface, et je l'avais
       oubliee en recopiant vite. */
    const points = [];
    const N = 40;
    const mx = alea(0.6, 1.8), ph = alea(0, 6.283);
    const derive = alea(-7, 7);
    const serpent = alea(1.6, 3.6);
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      points.push(new THREE.Vector3(
        ecart + Math.sin(u * 3.2 * mx + ph) * 1.6 + Math.sin(u * 8.1 * mx) * 0.5,
        -3 + u * montee,
        z0 + Math.cos(u * 2.4 + ph) * serpent + u * derive
      ));
    }
    const courbe = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(courbe, SEG, alea(0.10, 0.30), RAD, false);

    const pos = geo.attributes.position, uvs = geo.attributes.uv;
    const centres = new Float32Array(pos.count * 3);
    const pc = new THREE.Vector3();
    for (let v = 0; v < pos.count; v++) {
      courbe.getPointAt(Math.min(1, Math.max(0, uvs.getX(v))), pc);
      centres[v * 3] = pc.x; centres[v * 3 + 1] = pc.y; centres[v * 3 + 2] = pc.z;
    }
    geo.setAttribute('aCentre', new THREE.BufferAttribute(centres, 3));
    monde.add(new THREE.Mesh(geo, matTige));

    const nf = petit ? 7 : 13;
    for (let k = 0; k < nf; k++) {
      const u = 0.1 + (k / nf) * 0.85 + alea(-0.03, 0.03);
      const uc = Math.min(0.999, Math.max(0.001, u));
      feuillesPos.push({
        p: courbe.getPointAt(uc),
        tangente: courbe.getTangentAt(uc),
        taille: alea(0.55, 1.45)
      });
    }
  }

  /* ── Le feuillage, en instances ─────────────────────────────────────── */
  const LARG_F = 1.31, HAUT_F = 1.0;
  const geoF = new THREE.PlaneGeometry(LARG_F, HAUT_F);
  geoF.translate(LARG_F / 2, HAUT_F / 2, 0);
  const feuilles = new THREE.InstancedMesh(geoF, matFeuillage, feuillesPos.length);
  const aGrn = new Float32Array(feuillesPos.length);
  const aCas = new Float32Array(feuillesPos.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ech = new THREE.Vector3();
  const versLeHaut = new THREE.Vector3(0, 1, 0);
  const axeY = new THREE.Vector3(0, 1, 0), axeX = new THREE.Vector3(1, 0, 0);
  const dehors = new THREE.Vector3();

  feuillesPos.forEach((f, i) => {
    q.setFromUnitVectors(versLeHaut, f.tangente.clone().normalize());
    q.multiply(new THREE.Quaternion().setFromAxisAngle(axeY, Math.random() * Math.PI * 2));
    q.multiply(new THREE.Quaternion().setFromAxisAngle(axeX, alea(-0.55, 0.30)));
    ech.setScalar(f.taille);
    /* Le petiole se pose sur la PEAU de la tige, jamais sur son axe : attache
       au centre, il disparait dans le tube et la feuille semble en jaillir. */
    dehors.set(1, 0, 0).applyQuaternion(q).multiplyScalar(0.11);
    m4.compose(f.p.clone().add(dehors), q, ech);
    feuilles.setMatrixAt(i, m4);
    aGrn[i] = Math.random();
    aCas[i] = Math.random() < 0.5 ? 0 : 1;
  });
  geoF.setAttribute('aGraine', new THREE.InstancedBufferAttribute(aGrn, 1));
  geoF.setAttribute('aCase', new THREE.InstancedBufferAttribute(aCas, 1));
  feuilles.instanceMatrix.needsUpdate = true;
  feuilles.frustumCulled = false;
  monde.add(feuilles);

  /* ══ LES POUSSIERES EN SUSPENSION ═════════════════════════════════════
     Elles ne decorent pas : elles donnent l'ECHELLE et la vitesse. Sans un
     grain quelconque entre la camera et le sujet, un deplacement de vingt
     unites dans le vide ne se voit pas, et le voyage n'avance plus. */
  const NB_P = petit ? 400 : 1400;
  const posP = new Float32Array(NB_P * 3), grnP = new Float32Array(NB_P);
  for (let i = 0; i < NB_P; i++) {
    posP[i * 3]     = alea(-16, 16);
    posP[i * 3 + 1] = alea(-4, 16);
    posP[i * 3 + 2] = alea(-6, 96);
    grnP[i] = Math.random();
  }
  const geoP = new THREE.BufferGeometry();
  geoP.setAttribute('position', new THREE.BufferAttribute(posP, 3));
  geoP.setAttribute('aGraine', new THREE.BufferAttribute(grnP, 1));

  const matP = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTemps: { value: 0 }, uEchelle: { value: 400 }, uJade: { value: JADE } },
    vertexShader: /* glsl */`
      attribute float aGraine;
      uniform float uTemps, uEchelle;
      varying float vG;
      void main() {
        vG = aGraine;
        vec3 p = position;
        p.y += sin(uTemps * 0.25 + aGraine * 6.28) * 0.9;
        p.x += cos(uTemps * 0.19 + aGraine * 4.1) * 0.7;
        vec4 vue = viewMatrix * modelMatrix * vec4(p, 1.0);
        /* Une poussiere donne l'echelle : des qu'elle devient une TACHE, elle
           la detruit. A un demi-ecran de facteur, celles qui passaient pres
           faisaient soixante-dix pixels de diametre et couvraient le sujet. */
        gl_PointSize = min(20.0, uEchelle * (0.4 + aGraine * 0.8) / max(0.6, -vue.z));
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uJade;
      varying float vG;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = dot(d, d);
        if (r > 0.25) discard;
        float a = smoothstep(0.25, 0.0, r);
        gl_FragColor = vec4(mix(uJade, vec3(0.75, 0.9, 1.0), vG) * a, a * 0.5);
      }
    `
  });
  const poussieres = new THREE.Points(geoP, matP);
  poussieres.frustumCulled = false;
  monde.add(poussieres);

  /* ══ LES DEUX MODELES ═════════════════════════════════════════════════
     Ils arrivent apres coup, et la scene tourne sans eux. Trois mega-octets
     de matiere ne doivent jamais retenir la premiere image : le visiteur voit
     le decor et les poussieres pendant que la feuille se telecharge, et elle
     se pose dans un monde deja vivant au lieu d'ouvrir sur un ecran noir. */
  const chargeur = new GLTFLoader();
  let feuilleGeante = null, portail = null;

  async function poserFeuille() {
    const g = await chargeur.loadAsync('modeles/feuille-kudzu.glb');
    const o = g.scene;
    const b = new THREE.Box3().setFromObject(o);
    const t = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    o.position.sub(c);
    o.scale.setScalar(5.2 / Math.max(t.x, t.y, t.z));
    o.traverse(m => {
      if (!m.isMesh) return;
      const mt = m.material;
      mt.side = THREE.DoubleSide;
      /* three ne sait pas diffuser sous la surface. Une emission tres basse
         pilotee par la texture de base en fait autant pour ce qu'on en voit :
         le limbe s'eclaire par l'interieur avec SES nervures. */
      if ('emissive' in mt) {
        mt.emissive = new THREE.Color(0x0C5540);
        mt.emissiveMap = mt.map || null;
        mt.emissiveIntensity = 0.62;
      }
    });
    feuilleGeante = new THREE.Group();
    feuilleGeante.add(o);
    /* Posee de biais, jamais de face : de face c'est un logo, de trois quarts
       c'est un objet. */
    feuilleGeante.position.set(0.1, 0.25, -0.4);
    feuilleGeante.rotation.set(-0.22, 0.55, 0.12);
    monde.add(feuilleGeante);

    triFeuille = compter(o);
    poidsFeuille = poidsDe('modeles/feuille-kudzu.glb');
    o.traverse(m => {
      if (m.isMesh && m.material?.map?.image && !defFeuille) {
        defFeuille = m.material.map.image.width + ' × ' + m.material.map.image.height;
      }
    });
  }

  async function poserPortail() {
    const g = await chargeur.loadAsync('modeles/portail.glb');
    const o = g.scene;
    const b = new THREE.Box3().setFromObject(o);
    const t = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    o.position.sub(c);
    o.scale.setScalar(9.5 / Math.max(t.x, t.y, t.z));
    o.traverse(m => {
      if (!m.isMesh || !m.material) return;
      const mt = m.material;
      /* Meshy sort ses materiaux prevus pour un rendu neutre. Ici la pierre
         doit BOIRE la lumiere et ne la rendre que sur ses aretes : sans
         metalness a zero elle ressort en chrome des qu'on lui donne un
         environnement. */
      if ('metalness' in mt) mt.metalness = 0;
      if ('roughness' in mt) mt.roughness = Math.min(1, (mt.roughness ?? 1) * 1.05 + 0.08);
      mt.envMapIntensity = 0.85;
      mt.needsUpdate = true;
    });
    portail = new THREE.Group();
    portail.add(o);
    portail.position.set(0, 3.2, 55);
    monde.add(portail);

    triPortail = compter(o);
    poidsPortail = poidsDe('modeles/portail.glb');
  }

  /* ── Dimensions ─────────────────────────────────────────────────────── */
  function mesurer() {
    const r = toile.getBoundingClientRect();
    const L = Math.max(2, Math.round(r.width)), H = Math.max(2, Math.round(r.height));
    camera.aspect = L / H;
    camera.updateProjectionMatrix();
    rendu.setPixelRatio(Math.min(devicePixelRatio || 1, petit ? 1.6 : 2));
    rendu.setSize(L, H, false);
    matP.uniforms.uEchelle.value = H * 0.055;
  }
  mesurer();
  addEventListener('resize', mesurer, { passive: true });

  /* ── L'avancee ──────────────────────────────────────────────────────── */
  let avance = 0, avanceVisee = 0, visible = true, actif = true;
  let dernier = performance.now();
  const pOeil = new THREE.Vector3(), pVise = new THREE.Vector3();

  function peindre(dt) {
    /* L'avance suit sa consigne avec du retard. Un rail qui colle au
       defilement au pixel pres donne une camera nerveuse ; le meme rail
       amorti donne une camera qui a du poids, et c'est tout ce qui separe
       une demonstration technique d'un plan de cinema. */
    const a = 1 - Math.pow(1 - 0.085, dt * 60);
    avance += (avanceVisee - avance) * a;

    const u = abscisse(avance);
    /* ══ getPoint ET NON getPointAt ═══════════════════════════════════════
       getPointAt parcourt la courbe a VITESSE CONSTANTE, en abscisse
       curviligne. Or nos reperes sont tres inegalement espaces : deux unites
       entre les premiers, treize entre les derniers. A vingt-deux centiemes
       du recit, la camera etait deja a dix-neuf unites de la feuille au lieu
       de huit, et le deuxieme temps se jouait dans un cadre vide.

       getPoint suit le PARAMETRE : un repere par intervalle, exactement la ou
       on l'a place. La camera va donc lentement pres du sujet et vite dans le
       couloir, ce qui est aussi ce qu'on veut. */
    railOeil.getPoint(u, pOeil);
    railVise.getPoint(u, pVise);
    camera.position.copy(pOeil);
    camera.lookAt(pVise);

    const t = performance.now() / 1000;
    if (!sobre) {
      matFeuillage.uniforms.uTemps.value = t;
      matP.uniforms.uTemps.value = t;
      if (feuilleGeante) feuilleGeante.rotation.y = 0.55 + Math.sin(t * 0.13) * 0.10;
      if (sceau) {
        sceau.rotation.y = Math.sin(t * 0.16) * 0.42;
        sceau.rotation.x = Math.sin(t * 0.11) * 0.10;
      }
    }
    rendu.render(scene, camera);
  }

  function battre(maintenant) {
    if (!actif) return;
    requestAnimationFrame(battre);
    const dt = Math.min(0.05, Math.max(0, (maintenant - dernier) / 1000));
    dernier = maintenant;
    if (!visible) return;
    peindre(dt);
  }
  requestAnimationFrame(battre);

  /* ══ LES INSTRUMENTS SONT ACCROCHES AU MONDE ═══════════════════════════
     C'est ici qu'ils prennent tout leur sens. Sur une page en sections, une
     etiquette suit un objet qui tourne sur lui-meme. Ici elle suit un objet
     DEPASSE PAR LA CAMERA : elle glisse, elle sort du cadre, elle revient si
     l'on remonte. Le visiteur comprend en trois secondes qu'il se deplace
     dans un lieu et non dans une page, et il n'a fallu l'ecrire nulle part.

     Chaque etiquette s'efface d'elle-meme quand son point sort du cadre :
     c'est le module qui s'en charge, et c'est pour cela qu'on peut en poser
     autant qu'il y a d'objets sans encombrer un seul instant. */
  let instruments = null;
  const ancres = [];
  import('./instruments.js').then(({ monterLesInstruments, monterLeCompteur }) => {
    const compteur = monterLeCompteur();
    instruments = monterLesInstruments(toile, camera, { dans: toile.parentElement });

    const pose = (point, titre, valeur, cote, vers, portee) => {
      ancres.push(point.clone());
      instruments.poser({ point: point.clone(), titre, valeur, cote, vers, longueur: 120, portee });
    };

    pose(new THREE.Vector3(1.55, 1.25, -0.35), 'PUERARIA_MONTANA',
      () => triFeuille ? triFeuille.toLocaleString('fr') + ' triangles' : 'chargement…',
      'droite', 'haut', 26);
    pose(new THREE.Vector3(-1.30, -0.60, -0.35), 'MATIERE',
      () => defFeuille ? defFeuille + '  ·  ' + poidsFeuille.toLocaleString('fr') + ' Ko' : 'chargement…',
      'gauche', 'bas', 26);
    pose(new THREE.Vector3(4.4, 5.4, 55), 'PORTAIL',
      () => triPortail ? triPortail.toLocaleString('fr') + ' triangles  ·  ' + poidsPortail.toLocaleString('fr') + ' Ko' : 'chargement…',
      'droite', 'haut', 46);
    pose(new THREE.Vector3(-4.6, 0.2, 55), 'CADENCE',
      () => compteur.ms() ? compteur.ms().toFixed(1) + ' ms par image' : 'mesure…',
      'gauche', 'bas', 46);
    pose(new THREE.Vector3(3.4, 5.0, 82), 'SCEAU_KAZURA',
      () => formesSceau ? formesSceau + ' formes  ·  verre, indice 1,66' : 'chargement…',
      'droite', 'haut', 34);
  }).catch(e => console.warn('instruments indisponibles', e));

  /* Les vraies mesures que les etiquettes affichent. Elles restent a zero
     tant que le modele n'est pas la, et l'etiquette dit « chargement » : on
     n'invente jamais un chiffre pour combler un vide. */
  let triFeuille = 0, defFeuille = '', poidsFeuille = 0;
  let triPortail = 0, poidsPortail = 0, formesSceau = 0;

  /* Le poids se releve dans la chronometrie du navigateur, jamais en dur : un
     chiffre ecrit a la main devient faux au premier changement de modele, et
     personne ne pense a le corriger. */
  function poidsDe(fichier) {
    try {
      const e = performance.getEntriesByType('resource').filter(r => r.name.endsWith(fichier)).pop();
      return e && e.encodedBodySize ? Math.round(e.encodedBodySize / 1024) : 0;
    } catch (e) { return 0; }
  }
  function compter(objet) {
    let n = 0;
    objet.traverse(o => {
      const g = o.geometry;
      if (!g || !g.attributes || !g.attributes.position) return;
      n += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    return Math.round(n);
  }

  /* ══ CE QU'IL Y A APRES LE PORTAIL ═════════════════════════════════════
     Il n'y avait rien : passe la porte, le voyage se terminait dans un cadre
     vide ou seules quelques poussieres passaient. Un parcours qui n'aboutit
     nulle part n'est pas un parcours, c'est un couloir.

     Ce qu'on y met est le SCEAU de la maison, le meme trace que celui grave
     sur les cartes de visite, importe de la piece qui le dessine deja. On le
     rencontre a la fin comme une signature : le voyage a traverse la plante,
     franchi la porte, et il arrive sur la marque. */
  let sceau = null;
  function poserLeSceau() {
    const donnees = new SVGLoader().parse(BLASON);
    const groupe = new THREE.Group();
    const matiere = new THREE.MeshPhysicalMaterial({
      /* La couleur de base d'un verre MULTIPLIE la lumiere qui le traverse :
         une teinte sombre ici et il ne passe plus rien. On tient donc le
         corps presque blanc et on colore par l'attenuation, qui est faite
         pour cela. */
      color: 0xF2FFFA, metalness: 0, roughness: 0.08,
      transmission: 1, thickness: 2.6, ior: 1.66,
      attenuationColor: new THREE.Color(0x0FA97A), attenuationDistance: 3.4,
      iridescence: 0.45, iridescenceIOR: 1.32, iridescenceThicknessRange: [110, 460],
      envMapIntensity: 2.2, side: THREE.DoubleSide
    });
    let n = 0;
    for (const chemin of donnees.paths) {
      for (const forme of SVGLoader.createShapes(chemin)) {
        const g = new THREE.ExtrudeGeometry(forme, {
          depth: 15, curveSegments: 22,
          bevelEnabled: true, bevelThickness: 2.1, bevelSize: 1.7,
          bevelOffset: 0, bevelSegments: 4
        });
        /* Le repere SVG descend, celui de three monte. */
        g.scale(1, -1, 1);
        g.computeVertexNormals();
        groupe.add(new THREE.Mesh(g, matiere));
        n++;
      }
    }
    /* ══ UN VERRE A BESOIN DE QUELQUE CHOSE DERRIERE LUI ═══════════════
       Le sceau etait un aplat sombre au bout du voyage, alors qu'il est
       exactement le meme materiau que celui de la page d'accueil, ou il
       brille. La difference n'est pas dans le verre, elle est dans ce qu'il y
       a a traverser : ici, rien. Un materiau a transmission refracte le monde
       derriere lui, et derriere celui-ci il n'y avait que du brouillard noir.

       Une lueur posee au fond suffit. Elle n'eclaire pas la scene, elle donne
       au verre une matiere a plier, et c'est ce pliage qu'on lit comme du
       verre. Attention : la cible de transmission ne contient QUE les objets
       opaques, donc cette lueur doit etre opaque pour se voir a travers. */
    const lueur = document.createElement('canvas');
    lueur.width = lueur.height = 256;
    const lx = lueur.getContext('2d');
    const rd = lx.createRadialGradient(128, 128, 6, 128, 128, 128);
    rd.addColorStop(0.00, '#145846');
    rd.addColorStop(0.30, '#0B2E27');
    rd.addColorStop(0.62, '#070F18');
    rd.addColorStop(1.00, '#04060A');
    lx.fillStyle = rd; lx.fillRect(0, 0, 256, 256);
    const texLueur = new THREE.CanvasTexture(lueur);
    texLueur.colorSpace = THREE.SRGBColorSpace;
    const fond = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 44),
      /* Un plan de three regarde vers +z. On avance dans ce sens, donc on lui
         voit le DOS, et le dos d'une face est elimine par defaut : la lueur
         etait bien la, invisible, et le sceau restait une silhouette noire.
         Deux faces plutot qu'une rotation : le plan sert des deux cotes si un
         jour la camera repasse derriere. */
      /* `toneMapped: false` : sans cela le bord du plan se VOIT. Le fond de
         l'ecran est peint avec la couleur de nuit telle quelle, alors que le
         plan, lui, passe par la courbe de tonalite du rendu. Les deux noirs
         cessent d'etre le meme noir, et un rectangle plus clair apparait au
         milieu de l'image, avec deux aretes verticales franches. */
      new THREE.MeshBasicMaterial({ map: texLueur, fog: false, toneMapped: false, side: THREE.DoubleSide })
    );
    fond.position.set(0, 2.6, 99);
    monde.add(fond);

    const b = new THREE.Box3().setFromObject(groupe);
    const c = b.getCenter(new THREE.Vector3()), t = b.getSize(new THREE.Vector3());
    groupe.children.forEach(m => m.geometry.translate(-c.x, -c.y, -c.z));
    groupe.scale.setScalar(6.0 / Math.max(t.x, t.y));
    groupe.position.set(0, 2.6, 82);
    monde.add(groupe);
    sceau = groupe;
    formesSceau = n;
  }

  poserFeuille().catch(e => console.warn('feuille indisponible', e));
  poserPortail().catch(e => console.warn('portail indisponible', e));
  try { poserLeSceau(); } catch (e) { console.warn('sceau indisponible', e); }

  return {
    /* Le seul bouton : zero au depart, un a l'arrivee. */
    avancer(t) { avanceVisee = Math.min(1, Math.max(0, t)); },
    montrer(v) { if (v && !visible) dernier = performance.now(); visible = v; },
    /* Poser d'autorite, pour les controles : la piece peint par son chemin
       normal, mais sans attendre l'amortissement. */
    poser(t, n = 60) {
      avanceVisee = avance = Math.min(1, Math.max(0, t));
      for (let i = 0; i < n; i++) peindre(1 / 60);
      return this.bilan();
    },
    _camera: camera, _scene: scene, _peindre: () => peindre(1 / 60),
    async sonder(n = 30) {
      const { sonderToile } = await import('./sonde.js');
      visible = true;
      return sonderToile(rendu, toile, peindre, n);
    },
    instruments: { placer: () => instruments?.placer(), bilan: () => instruments?.bilan() },
    detruire() {
      actif = false;
      instruments?.detruire();
      removeEventListener('resize', mesurer);
      scene.traverse(o => { o.geometry?.dispose?.(); });
      matTige.dispose(); matFeuillage.dispose(); matP.dispose();
      rendu.dispose();
    },
    bilan() {
      let tri = 0;
      scene.traverse(o => {
        const g = o.geometry;
        if (!g || !g.attributes || !g.attributes.position) return;
        const n = g.index ? g.index.count : g.attributes.position.count;
        tri += (n / 3) * (o.isInstancedMesh ? o.count : 1);
      });
      return {
        avance: +avance.toFixed(3), visee: +avanceVisee.toFixed(3),
        oeil: [+camera.position.x.toFixed(2), +camera.position.y.toFixed(2), +camera.position.z.toFixed(2)],
        triangles: Math.round(tri),
        feuille: !!feuilleGeante, portail: !!portail,
        toile: [toile.width, toile.height],
        appels: rendu.info.render.calls
      };
    }
  };
}
