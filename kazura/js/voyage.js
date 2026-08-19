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
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass }       from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { BLASON } from './blason.js';
import { monterLePaysage, hauteurSol, NIVEAU_EAU } from './paysage.js';

const JADE   = new THREE.Color('#10B981');
const JADE_F = new THREE.Color('#04352A');
const VIOLET = new THREE.Color('#7C3AED');
const NUIT   = new THREE.Color('#04060A');

const alea = (a, b) => a + Math.random() * (b - a);

/* ══ LES RAIS DE LUMIERE ═══════════════════════════════════════════════════
   Le procede porte un nom savant, diffusion volumetrique, et se resume a une
   idee simple : on part du point ou se trouve la source, et on etire l'image
   dans toutes les directions qui s'en eloignent. Ce qui est clair laisse une
   trainee, ce qui est sombre n'en laisse pas.

   POURQUOI C'EST LE MEILLEUR RAPPORT DE CETTE PAGE. Quand on approche du
   portail, la lueur qui est derriere lui traverse l'anneau : les rais sortent
   de l'ouverture et balaient la pierre. On ne peut pas obtenir cela en
   ajoutant des objets, parce que ce n'est pas un objet, c'est de la lumiere
   dans de la poussiere. Vingt lignes, et la scene cesse d'etre un rendu pour
   devenir une prise de vue. */
const RAIS = {
  uniforms: {
    tDiffuse: { value: null },
    uCentre:  { value: new THREE.Vector2(0.5, 0.5) },
    uForce:   { value: 0.0 },
    uDensite: { value: 0.52 },
    uSeuil:   { value: 0.74 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform vec2  uCentre;
    uniform float uForce, uDensite, uSeuil;
    varying vec2 vUv;

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uForce < 0.001) { gl_FragColor = base; return; }

      /* Vingt-quatre pas. En dessous on voit les marches, au-dessus on paie
         sans rien gagner : la trainee est un fondu, pas un detail. */
      const int PAS = 24;
      vec2 ecart = (vUv - uCentre) * (uDensite / float(PAS));
      vec2 p = vUv;
      float poids = 1.0;
      vec3 somme = vec3(0.0);

      for (int i = 0; i < PAS; i++) {
        p -= ecart;
        vec3 c = texture2D(tDiffuse, p).rgb;
        /* Seules les zones DEJA claires laissent une trainee. Sans ce seuil,
           tout l'ecran bave et l'image devient une bouillie laiteuse. */
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        somme += c * smoothstep(uSeuil, uSeuil + 0.35, l) * poids;
        poids *= 0.93;
      }
      gl_FragColor = vec4(base.rgb + somme * (uForce / float(PAS)), base.a);
    }
  `
};

/* ══ L'ETALONNAGE, LE GRAIN ET LA VIGNETTE ════════════════════════════════
   La derniere passe, celle qui fait qu'une image ressemble a de la pellicule
   plutot qu'a une capture d'ecran. Trois choses, dans cet ordre :

   LE GRAIN. Un rendu numerique est PARFAITEMENT propre, et c'est exactement
   ce qui le trahit. Aucune image tournee n'est propre. Un grain tres fin, qui
   bouge, suffit a faire douter l'oeil.

   LA VIGNETTE. Tout objectif assombrit ses bords. Sans elle, le cadre est
   uniforme et le regard n'est pas tenu au centre.

   L'ETALONNAGE. On separe les ombres et les hautes lumieres et on les teinte
   dans des sens opposes : les ombres vers le bleu-violet, les hautes lumieres
   vers le jade. C'est la maniere dont on tient une palette au cinema, et
   c'est ce qui donne a deux plans tres differents l'air d'appartenir au meme
   film. */
const ETALON = {
  uniforms: {
    tDiffuse: { value: null },
    uTemps:   { value: 0 },
    uGrain:   { value: 0.038 },
    uVignette:{ value: 0.42 },
    uOmbre:   { value: new THREE.Color(0x1A1533) },
    uHaute:   { value: new THREE.Color(0xBFF3E0) }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTemps, uGrain, uVignette;
    uniform vec3 uOmbre, uHaute;
    varying vec2 vUv;

    /* Un hachage a partir de la PARTIE FRACTIONNAIRE, jamais un sinus
       multiplie par un grand nombre : loin de l'origine, cette formule-la
       s'effondre en taches de cinquante pixels. Deja paye une fois. */
    float bruit(vec2 p) {
      vec3 q = fract(vec3(p.xyx) * 0.1031);
      q += dot(q, q.yzx + 33.33);
      return fract((q.x + q.y) * q.z);
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;

      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      /* ══ ON TEINTE, ON N'ECRASE PAS ══════════════════════════════════════
         Ma premiere version multipliait les ombres par la couleur de teinte :
         un facteur de zero virgule deux sur tout ce qui etait sombre, donc la
         quasi-totalite d'une scene de nuit. L'image entiere est tombee au
         noir, il n'est reste que les reflets speculaires, et le portail de
         pierre s'est transforme en eclats blancs sur fond noir.

         Un etalonnage AJOUTE de la couleur la ou il en veut. Il ne retire pas
         de lumiere : c'est le travail de l'exposition, qui est reglee ailleurs
         et une seule fois. */
      float ombre = 1.0 - smoothstep(0.0, 0.30, l);
      col += uOmbre * ombre * 0.12;
      col += uHaute * smoothstep(0.55, 1.0, l) * 0.08;

      vec2 c = vUv - 0.5;
      col *= 1.0 - uVignette * dot(c, c) * (1.0 + dot(c, c));

      col += (bruit(vUv * 1024.0 + fract(uTemps) * 91.7) - 0.5) * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

/* ══ LE RAIL ══════════════════════════════════════════════════════════════
   Une position et un point vise pour chaque temps. Entre deux reperes, on
   interpole le long d'une courbe lissee : c'est ce qui evite les a-coups aux
   changements de direction, qu'on lit tout de suite comme un montage.

   Les valeurs sont donnees a la main plutot que calculees. Un rail de camera
   est une decision de mise en scene, pas un probleme d'optimisation. */
/* ══ LE RAIL ══════════════════════════════════════════════════════════════
   Une position et un point vise pour chaque temps.

   UNE REGLE ABSOLUE, APPRISE EN LA VIOLANT : la camera ne regarde JAMAIS en
   arriere. Mon premier rail ouvrait en visant z negatif, puis visait z positif
   au troisieme temps : cent quatre-vingts degres de rotation quelque part au
   milieu, et Matheo l'a senti tout de suite, « la camera elle tourne tres
   brutalement ». On ne peut pas lisser un demi-tour, on peut seulement ne pas
   le faire.

   Le point vise est donc TOUJOURS devant l'oeil, et la profondeur de l'oeil ne
   recule jamais. Le mouvement d'ouverture, celui ou l'on decouvre qu'on etait
   sur une feuille, ne se fait plus en reculant la camera : c'est la FEUILLE
   qui s'eloigne, portee par l'air, et on la suit. Une feuille qui derive est
   d'ailleurs plus juste qu'une camera qui recule, parce qu'elle a une raison
   de bouger.

   Les valeurs sont posees a la main. Un rail de camera est une decision de
   mise en scene, pas un probleme d'optimisation. */
const REPERES = [
  { t: 0.00, oeil: [ 1.10, 2.45,  5.60], vise: [ 2.10, 2.25,  9.30] },
  { t: 0.13, oeil: [ 0.70, 2.60,  7.20], vise: [ 2.60, 2.55, 13.60] },
  { t: 0.26, oeil: [ 0.20, 2.85, 10.50], vise: [ 3.10, 2.90, 20.00] },
  { t: 0.40, oeil: [-0.30, 3.05, 16.00], vise: [ 1.60, 2.90, 30.00] },
  { t: 0.54, oeil: [ 0.20, 3.00, 25.00], vise: [ 0.40, 2.85, 42.00] },
  { t: 0.68, oeil: [ 0.10, 2.90, 38.00], vise: [ 0.00, 2.80, 55.00] },
  { t: 0.80, oeil: [ 0.00, 2.80, 50.00], vise: [ 0.00, 2.70, 66.00] },
  { t: 0.90, oeil: [ 0.00, 3.30, 61.00], vise: [ 0.00, 3.30, 78.00] },
  /* Le dernier temps leve les yeux : le sceau passe au tiers bas et le
     PAYSAGE s'ouvre derriere lui, lac, monts et ciel. C'est la seule image du
     voyage ou l'on voit jusqu'a l'horizon, et c'est pour cela qu'elle arrive
     en dernier. */
  { t: 1.00, oeil: [ 0.70, 6.40, 68.50], vise: [ 0.00, 6.10, 92.00] }
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
  /* L'exposition remonte apres la mise au noir de la vegetation : la regle
     des quatre-vingts pour cent porte sur la REPARTITION des valeurs, pas sur
     l'exposition generale. En la laissant basse, le sujet lui-meme devenait
     invisible et l'image ne disait plus rien, ce qui est l'autre facon de la
     rater. */
  rendu.toneMappingExposure = 1.30;

  const scene = new THREE.Scene();
  scene.background = NUIT;
  /* ══ LE BROUILLARD FAIT LA PROFONDEUR ══════════════════════════════════
     C'est le procede le moins cher et le plus payant releve chez igloo : ce
     qui est loin palit vers la couleur du fond. Sans lui, un objet a soixante
     unites a exactement le meme contraste qu'un objet a deux, et l'oeil perd
     toute notion de distance dans une scene sans horizon. */
  /* ══ LE BROUILLARD S'ACCORDE A L'HORIZON, PAS AU NOIR ══════════════════
     Il etait dense et de la couleur de la nuit : tout ce qui depassait
     soixante unites disparaissait, ce qui allait tres bien tant qu'il n'y
     avait rien au-dela. Maintenant qu'il y a des monts a cinq cents unites,
     un brouillard noir les effacerait purement et simplement.

     On le desserre et on le teinte vers le bleu de l'horizon. Les monts
     s'estompent alors vers cette teinte, qui est plus SOMBRE que la lueur du
     ciel derriere eux : ils restent donc lisibles en silhouette tout en
     perdant leur contraste avec la distance. C'est exactement la perspective
     atmospherique, et c'est elle qui fabrique l'echelle. */
  const BRUME = new THREE.Color('#08161C');
  scene.fog = new THREE.FogExp2(BRUME, 0.0058);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 1600);
  /* Declare ICI, et non plus bas avec le reste du mouvement : `mesurer` est
     appelee au montage, donc AVANT tout ce qui suit. Une variable en `let`
     lue avant sa ligne de declaration n'est pas indefinie, elle jette, et la
     piece entiere tombait sur une zone morte temporelle. */
  let reculEcran = 1;
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

  /* ══ LA LAMPE RASANTE DE LA PREMIERE IMAGE ═════════════════════════════
     L'ouverture montre la feuille de tres pres, dans le noir, pendant que le
     nom se forme. Matheo a dit de cette image qu'elle n'etait pas jolie, et il
     avait raison : une feuille eclairee de face est un APLAT. Sa nervation
     existe pourtant, elle est dans sa carte de relief, en deux mille
     quarante-huit points de cote.

     Une carte de relief ne se voit QUE si la lumiere arrive presque parallele
     a la surface : c'est l'angle qui fabrique les micro-ombres, pas la
     resolution. On pose donc une lampe sur le cote, a la hauteur du limbe,
     assez pres pour que sa chute soit rapide. Elle ne sert qu'a l'ouverture et
     s'eteint exactement quand le monde s'allume : deux lumieres pour deux
     moments, jamais les deux en meme temps. */
  const rasante = new THREE.PointLight(0xCFF3E6, 60, 17, 2);
  rasante.position.set(6.8, 3.5, 8.7);
  scene.add(rasante);

  const remplissage = new THREE.DirectionalLight(0xBFE9DA, 0.55);
  remplissage.position.set(-4, 8, 62);
  scene.add(remplissage);

  const ambiance = new THREE.HemisphereLight(0x1E6B57, 0x050A08, 0.9);
  scene.add(ambiance);

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

  /* Le paysage d'abord : c'est lui qui fixe l'echelle de tout le reste, et
     c'est sur son sol que les lianes vont s'enraciner. */
  const paysage = monterLePaysage(scene, { petit, nuit: '#04060A', horizon: '#0F4038' });

  /* ── Le materiau du feuillage ───────────────────────────────────────── */
  const empreinteVide = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  empreinteVide.needsUpdate = true;

  /* ══ LA VEGETATION EST OPAQUE ══════════════════════════════════════════
     Elle etait transparente et n'ecrivait pas sa profondeur, ce qui etait le
     bon reglage tant qu'elle etait un decor pose sur du noir : rien a occulter,
     rien derriere. Maintenant qu'il y a un ciel, un lac et des monts, une
     plante translucide qui ne s'occulte pas devient un RUBAN PLAT : elle laisse
     passer le fond a travers elle, elle se melange a ses voisines, et vingt
     tiges empilees font une masse bleue sans forme.

     Une feuille arrete la lumiere. Une tige aussi. En les rendant opaques on
     recupere d'un coup l'occultation, donc la profondeur, donc la silhouette
     contre l'horizon, qui est ce qui rend une plante lisible de nuit. Le
     decoupage se fait deja au seuil dans le nuanceur, il n'y a rien a ajouter. */
  const matFeuillage = new THREE.ShaderMaterial({
    transparent: false, side: THREE.DoubleSide, depthWrite: true,
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
        /* ══ CE QUI ECLAIRE UNE FEUILLE DE FACE, LA NUIT, C'EST LE CIEL ═══
           Le terme de face etait teinte en violet, ce qui passait inapercu
           tant que la feuille etait a trente pour cent d'opacite. Devenue
           opaque, la moitie du feuillage est ressortie EN VIOLET : des
           petales de plastique accroches a des tiges.

           De nuit, une face tournee vers le haut recoit la voute, qui est
           bleu-vert tres sourd. On lui donne cette couleur-la, et on remonte
           le corps de la feuille, qui n'a plus besoin d'etre efface par
           l'opacite pour rester discret. */
        /* ══ LA REGLE DES QUATRE-VINGTS POUR CENT ═════════════════════════
           Dans une image de nuit qui tient, la tres grande majorite du cadre
           est SOUS quinze pour cent de luminosite, et une seule chose est
           claire. C'est vrai d'Hokusai comme d'igloo.

           Mon feuillage etait a mi-valeur partout : cinquante feuilles vertes
           moyennes, egalement eclairees, sur un fond de meme valeur. Rien ne
           se detachait de rien, et l'ensemble se lisait comme un economiseur
           d'ecran plutot que comme une nuit.

           On divise donc par trois. Ce qu'on perd en lisibilite de chaque
           feuille, on le gagne en lisibilite de l'IMAGE : le regard va enfin
           quelque part, vers la seule zone qui reste claire. */
        vec3 col = t.rgb * 0.055
                 + t.rgb * uJade * 0.62 * tr
                 + t.rgb * vec3(0.30, 0.42, 0.52) * face * 0.11;
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
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
    transparent: false, side: THREE.DoubleSide, depthWrite: true,
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
        /* ══ UNE TIGE N'EST PAS EGALE SUR SA LONGUEUR ══════════════════════
           Elle etait eclairee de la meme facon d'un bout a l'autre, et vingt
           tiges translucides qui se recouvrent additionnent leurs opacites :
           sous le halo, elles devenaient des TUBES DE NEON cyan, et elles
           mangeaient toutes les images du voyage.

           Trois frequences sans rapport simple donnent des passages sombres
           et des passages clairs qui ne se repetent jamais. C'est ce qui
           separe une plante d'un tube de verre : la plante a de l'ombre sur
           elle-meme. */
        float grain = 0.52
          + 0.30 * sin(vUv.x * 11.3 + 1.7)
          + 0.18 * sin(vUv.x * 27.1 + 4.1)
          + 0.12 * sin(vUv.x * 53.7);
        grain = clamp(grain, 0.10, 1.0);

        /* Un corps presque noir et une arete qui s'allume : c'est la seule
           facon dont une plante se lit devant un horizon eclaire. Le violet
           redevient un accent sur le contour, pas une teinte de fond. */
        /* Meme raison pour l'arete des tiges : un liseré violet franc sur
           chaque tube faisait un reseau de neons mauves. Le ciel, lui, pose un
           reflet froid et discret, et le violet ne revient que dans les hautes
           lumieres, par l'etalonnage, ou il a sa place. */
        vec3 col = uJadeF * 0.22
                 + uJade * dos * 0.30 * grain
                 + vec3(0.26, 0.40, 0.50) * fres * 0.13;
        float nerv = pow(abs(sin(vUv.y * 3.14159 * 5.0 + sin(vUv.x * 2.3) * 0.55)), 14.0);
        col += uJade * nerv * 0.09 * grain;
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  /* ══ LE COULOIR DE LIANES ═════════════════════════════════════════════
     Elles ne remplissent pas l'espace : elles le BORDENT. Deux haies qui
     s'ecartent de l'axe du voyage, pour que le regard file vers le portail
     au lieu de se perdre. C'est tout ce que le decor a a faire ici. */
  const feuillesPos = [];
  /* ══ LA DENSITE FAIT LA MOITIE DE L'EFFET ══════════════════════════════
     Un cadre a moitie noir n'est pas sobre, il est vide. Sur igloo, chaque
     image est PLEINE : il y a toujours quelque chose au premier plan, quelque
     chose au fond, et de la matiere entre les deux. C'est cette superposition
     qui donne la profondeur, bien plus que le brouillard.

     On monte donc a soixante lianes, dont un tiers tres loin et tres pales :
     elles ne se lisent pas comme des objets, elles font le fond du decor. */
  const NB_LIANES = petit ? 14 : 36;
  const SEG = petit ? 70 : 130;
  const RAD = petit ? 6 : 9;

  for (let i = 0; i < NB_LIANES; i++) {
    const cote = i % 2 ? 1 : -1;
    /* Un tiers des lianes est repousse tres loin sur les cotes : elles
       sortent du champ de la mise au point, le flou les dissout, et il reste
       une masse vegetale sans detail. C'est exactement ce qu'on veut d'un
       arriere-plan : de la presence, pas de l'information. */
    const loin = i % 3 === 2;
    /* La moitie des lianes est semee entre zero et cinquante, la ou le
       couloir etait vide entre la feuille et le portail : sans elles, on
       traverse quinze unites sans rien voir passer, et le voyage s'arrete
       alors qu'il continue. */
    const z0 = i % 2 ? alea(-4, 50) : alea(-4, 82);
    const ecart = (loin ? alea(17, 30) : alea(4.6, 10.0)) * cote;
    const montee = loin ? alea(16, 30) : alea(7, 17);
    /* ══ ELLES PARTENT DU SOL, PAS DE NULLE PART ═══════════════════════════
       Elles demarraient toutes a moins trois, une hauteur inventee, dans un
       monde qui n'avait pas de sol. Maintenant qu'il y en a un, une tige qui
       commence au-dessus ou en dessous se voit immediatement : au-dessus elle
       flotte, en dessous elle sort d'un trou. On demande donc au terrain sa
       hauteur a l'endroit exact ou la liane prend racine. */
    const solLiane = hauteurSol(ecart, z0) - 0.6;
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
        solLiane + u * montee,
        z0 + Math.cos(u * 2.4 + ph) * serpent + u * derive
      ));
    }
    const courbe = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(courbe, loin ? Math.round(SEG * 0.5) : SEG, loin ? alea(0.16, 0.36) : alea(0.09, 0.26), loin ? 6 : RAD, false);

    const pos = geo.attributes.position, uvs = geo.attributes.uv;
    const centres = new Float32Array(pos.count * 3);
    const pc = new THREE.Vector3();
    for (let v = 0; v < pos.count; v++) {
      courbe.getPointAt(Math.min(1, Math.max(0, uvs.getX(v))), pc);
      centres[v * 3] = pc.x; centres[v * 3 + 1] = pc.y; centres[v * 3 + 2] = pc.z;
    }
    geo.setAttribute('aCentre', new THREE.BufferAttribute(centres, 3));
    monde.add(new THREE.Mesh(geo, matTige));

    const nf = loin ? (petit ? 3 : 5) : (petit ? 5 : 9);
    for (let k = 0; k < nf; k++) {
      const u = 0.1 + (k / nf) * 0.85 + alea(-0.03, 0.03);
      const uc = Math.min(0.999, Math.max(0.001, u));
      feuillesPos.push({
        p: courbe.getPointAt(uc),
        tangente: courbe.getTangentAt(uc),
        taille: loin ? alea(1.8, 3.4) : alea(0.55, 1.45)
      });
    }
  }

  /* ══ LE BOSQUET DE LA FIN ══════════════════════════════════════════════
     Le dernier plan se jouait dans un cadre noir avec un objet au milieu. Une
     arrivee doit etre un LIEU, pas un fond de studio : on plante donc une
     douzaine de lianes autour du sceau, assez ecartees pour ne pas le cacher
     et assez proches pour le tenir. Elles cadrent, elles donnent l'echelle, et
     elles disent que la plante est arrivee jusque-la. */
  for (let i = 0; i < (petit ? 6 : 14); i++) {
    const ang = (i / (petit ? 6 : 14)) * Math.PI * 2 + alea(-0.55, 0.55);
    const r0 = alea(11.0, 24.0);
    const points = [];
    const N = 32;
    const ph = alea(0, 6.283), mx = alea(0.7, 1.6);
    const montee = alea(11, 22);
    const solBosquet = hauteurSol(Math.cos(ang) * r0, 82 + Math.sin(ang) * (r0 * 0.55)) - 0.6;
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      points.push(new THREE.Vector3(
        Math.cos(ang) * (r0 + Math.sin(u * 2.6 * mx + ph) * 1.9),
        solBosquet + u * montee,
        82 + Math.sin(ang) * (r0 * 0.55) + Math.cos(u * 2.1 + ph) * 2.6 + u * alea(-5, 5)
      ));
    }
    const courbe = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(courbe, petit ? 60 : 110, alea(0.09, 0.24), petit ? 6 : 8, false);
    const pos = geo.attributes.position, uvs = geo.attributes.uv;
    const centres = new Float32Array(pos.count * 3);
    const pc = new THREE.Vector3();
    for (let v = 0; v < pos.count; v++) {
      courbe.getPointAt(Math.min(1, Math.max(0, uvs.getX(v))), pc);
      centres[v * 3] = pc.x; centres[v * 3 + 1] = pc.y; centres[v * 3 + 2] = pc.z;
    }
    geo.setAttribute('aCentre', new THREE.BufferAttribute(centres, 3));
    monde.add(new THREE.Mesh(geo, matTige));
    for (let k = 0; k < (petit ? 5 : 10); k++) {
      const u = 0.12 + (k / (petit ? 5 : 10)) * 0.82 + alea(-0.03, 0.03);
      const uc = Math.min(0.999, Math.max(0.001, u));
      feuillesPos.push({ p: courbe.getPointAt(uc), tangente: courbe.getTangentAt(uc), taille: alea(0.5, 1.1) });
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
  const NB_P = petit ? 700 : 2600;
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
  let feuilleGeante = null, portail = null, matiereFeuille = null;

  async function poserFeuille() {
    const g = await chargeur.loadAsync('modeles/feuille-kudzu.glb');
    const o = g.scene;
    const b = new THREE.Box3().setFromObject(o);
    const t = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    o.position.sub(c);
    o.scale.setScalar(7.4 / Math.max(t.x, t.y, t.z));
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
        matiereFeuille = mt;
      }
    });
    feuilleGeante = new THREE.Group();
    feuilleGeante.add(o);
    /* Posee de biais, jamais de face : de face c'est un logo, de trois quarts
       c'est un objet. */
    /* Sa place de depart : juste devant l'oeil, de biais. De face elle serait
       un logo, de trois quarts c'est un objet. Elle ne restera pas la : c'est
       elle qui ouvre le voyage en s'eloignant. */
    feuilleGeante.position.set(2.10, 2.25, 9.30);
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

      /* ══ ON LAISSE LA MOUSSE ENVAHIR LA PIERRE ═══════════════════════════
         Le portail etait la seule surface du monde a n'avoir qu'une couleur
         peinte, uniforme, sans grain. Tant qu'il etait le seul objet eclaire
         du cadre, ca passait ; entoure d'un sol qui a de la matiere et d'un
         feuillage photographie, il ressortait TERNE, comme une maquette posee
         dans un decor.

         Le texte du site dit « un portail de pierre ENVAHI ». On le rend vrai
         plutot que de l'ecrire : la meme mousse que le sol se depose sur ses
         faces tournees vers le haut, la ou l'eau stagne et ou la lumiere
         arrive, et pas sur ses parois verticales, ou rien ne tient. C'est
         cette regle-la, et non la texture, qui fait qu'on y croit.

         onBeforeCompile plutot qu'un materiau a nous : on garde tout
         l'eclairage physique de three, ses ombres et son environnement, et on
         n'ajoute que les quelques lignes qui manquent. Reecrire le materiau
         entier pour poser de la mousse serait payer mille lignes pour dix. */
      if (paysage?.mousse) {
        mt.onBeforeCompile = (nuanceur) => {
          nuanceur.uniforms.uMousse = { value: paysage.mousse };
          nuanceur.uniforms.uMousseRelief = { value: paysage.mousseRelief };

          /* Les morceaux injectes sont ecrits en GABARITS DE CHAINE, avec de
             vrais retours a la ligne. Une premiere version les assemblait par
             concatenation avec des sequences d'echappement : elles n'ont pas
             survecu a l'outil qui a ecrit le fichier, les chaines se sont
             ouvertes sur plusieurs lignes, et toute la piece est tombee sur une
             erreur de syntaxe. Du code destine a un compilateur GLSL se lit
             mieux ecrit tel qu'il sera compile. */
          nuanceur.vertexShader = nuanceur.vertexShader
            .replace('#include <common>', /* glsl */`
              #include <common>
              varying vec3 vPosMonde;
              varying vec3 vNormMonde;
            `)
            .replace('#include <begin_vertex>', /* glsl */`
              #include <begin_vertex>
              vPosMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;
              vNormMonde = normalize(mat3(modelMatrix) * objectNormal);
            `);

          nuanceur.fragmentShader = nuanceur.fragmentShader
            .replace('#include <common>', /* glsl */`
              #include <common>
              uniform sampler2D uMousse;
              uniform sampler2D uMousseRelief;
              varying vec3 vPosMonde;
              varying vec3 vNormMonde;
              vec3 triMousse(sampler2D c, vec3 p, vec3 n, float e) {
                vec3 m = pow(abs(n), vec3(4.0));
                m /= (m.x + m.y + m.z);
                return texture2D(c, p.yz * e).rgb * m.x
                     + texture2D(c, p.xz * e).rgb * m.y
                     + texture2D(c, p.xy * e).rgb * m.z;
              }
            `)
            .replace('#include <map_fragment>', /* glsl */`
              #include <map_fragment>
              vec3 nM = normalize(vNormMonde);

              // La mousse tient sur ce qui regarde le ciel. Le seuil est doux :
              // une limite nette ferait un autocollant.
              float versHaut = smoothstep(0.02, 0.55, nM.y);

              // Et elle est INEGALE : une plaque continue sur toute la pierre se
              // lirait comme une couche de peinture verte. Le bruit vient de la
              // mousse elle-meme, prise a une echelle beaucoup plus large.
              float plaques = smoothstep(0.24, 0.58, triMousse(uMousse, vPosMonde, nM, 0.055).g);

              // ══ ELLE POUSSE AUSSI DANS LES CREUX ═══════════════════════
              // Une arche n'a presque aucune face tournee vers le ciel : en ne
              // gardant que ce critere, la mousse ne se posait nulle part. Or
              // sur une ruine, elle prend d'abord dans les JOINTS et les
              // renfoncements, la ou l'eau reste. On n'a pas d'occlusion
              // calculee, mais la texture de pierre en porte deja la trace :
              // ses zones sombres SONT ses creux. On s'en sert.
              float creux = smoothstep(0.40, 0.10, dot(diffuseColor.rgb, vec3(0.333)));
              float mou = max(versHaut, creux * 0.85) * plaques;

              vec3 tapis = triMousse(uMousse, vPosMonde, nM, 0.34);
              diffuseColor.rgb = mix(diffuseColor.rgb, tapis * vec3(0.42, 0.68, 0.48), mou * 0.86);

              // Et un grain de pierre partout, tres faible : c'est ce qui retire
              // a la surface son aspect de plastique moule.
              float grain = triMousse(uMousseRelief, vPosMonde, nM, 0.62).b;
              diffuseColor.rgb *= 0.86 + grain * 0.30;
            `);
        };
        /* Un materiau dont on change le programme doit etre recompile, et
           three ne le devine pas : sans cette cle il reutilise le programme
           deja mis en cache pour un materiau identique et l'injection n'a
           aucun effet, silencieusement. */
        mt.customProgramCacheKey = () => 'portail-mousse';
      }

      mt.needsUpdate = true;
    });
    portail = new THREE.Group();
    portail.add(o);
    portail.position.set(0, 3.2, 55);
    monde.add(portail);

    triPortail = compter(o);
    poidsPortail = poidsDe('modeles/portail.glb');
  }

  /* ══ LA CHAINE DE POST-TRAITEMENT ══════════════════════════════════════
     C'est ce qui manquait entierement, et c'est le gouffre entre un rendu et
     un plan de cinema. Un moteur ne sort jamais une image finie : il sort une
     matiere premiere, propre, nette partout, sans halo et sans grain. Aucune
     image tournee n'a jamais eu ces qualites-la, et c'est precisement a cela
     que l'oeil reconnait du calcul.

     Cinq passes, dans l'ordre ou une salle de montage les poserait :

       1. le rendu de la scene ;
       2. la PROFONDEUR DE CHAMP. Une camera a une distance de mise au point
          et tout ce qui n'y est pas se dissout. C'est le procede le plus
          puissant de la liste : il dit ou regarder sans un mot ;
       3. les RAIS de lumiere, qui sortent de l'ouverture du portail ;
       4. le HALO sur ce qui est deja lumineux, tres bas ;
       5. l'ETALONNAGE, le grain et la vignette.

     Le seuil du halo est haut : un halo qui prend tout lave l'image. Ici il ne
     doit attraper que la lueur, les eclats de verre et le mot en particules. */
  const composer = new EffectComposer(rendu);
  composer.addPass(new RenderPass(scene, camera));

  const flou = new BokehPass(scene, camera, {
    focus: 3.0, aperture: 0.00016, maxblur: petit ? 0.006 : 0.012
  });
  if (!petit) composer.addPass(flou);

  const rais = new ShaderPass(RAIS);
  composer.addPass(rais);

  /* Le seuil est HAUT. A 0,72 le halo attrapait le corps des tiges et non
     leurs aretes : vingt tubes translucides qui se recouvrent additionnent
     leurs opacites, passent le seuil sur toute leur longueur, et la liane
     devient un tube de neon. Un halo doit prendre les eclats, jamais la
     matiere. */
  const halo = new UnrealBloomPass(new THREE.Vector2(1, 1), petit ? 0.34 : 0.48, 0.78, 0.90);
  composer.addPass(halo);

  const etalon = new ShaderPass(ETALON);
  etalon.uniforms.uGrain.value = petit ? 0.028 : 0.038;
  composer.addPass(etalon);

  /* La conversion vers l'espace de l'ecran se fait EN DERNIER, une seule fois.
     Sans cette passe, la chaine rend en lineaire et toute l'image ressort
     delavee : c'est la faute la plus frequente quand on ajoute un composer a
     une scene qui marchait. */
  composer.addPass(new OutputPass());

  /* Le point vise par la mise au point suit le rail : c'est toujours ce que la
     camera regarde qui est net. Une mise au point fixe rendrait floue la seule
     chose qu'on veut montrer des que la camera bouge. */
  const versLumiere = new THREE.Vector3(0, 2.6, 99);

  /* ── Dimensions ─────────────────────────────────────────────────────── */
  function mesurer() {
    const r = toile.getBoundingClientRect();
    const L = Math.max(2, Math.round(r.width)), H = Math.max(2, Math.round(r.height));
    camera.aspect = L / H;
    camera.updateProjectionMatrix();

    /* ══ UN CADRE VERTICAL VOIT BEAUCOUP MOINS LARGE ══════════════════════
       Le champ d'une camera se donne en VERTICAL ; l'horizontal en decoule par
       la proportion de l'ecran. Sur un grand ecran a 1,78, on voit tres large ;
       sur un telephone a 0,46, le meme reglage ne montre qu'un quart de cette
       largeur. Tous les plans se retrouvent serres, et le dernier passait
       carrement sous le texte.

       On ne touche pas au champ, qui changerait la perspective et donc le
       dessin : on RECULE, ce qu'un chef operateur fait exactement dans ce cas.
       Le rail reste le meme, sa lecture s'adapte a l'ecran. */
    const recul = Math.min(1.5, Math.max(1, 1 + (1.35 - camera.aspect) * 0.55));
    reculEcran = recul;
    /* ══ ON PLAFONNE LA DEFINITION QUAND IL Y A DU POST-TRAITEMENT ═══════
       A deux fois la definition de l'ecran, le tampon fait 3415 sur 1222, et
       CHAQUE passe le retraverse : la profondeur de champ, les rais, le halo,
       l'etalonnage. C'est quatre fois quatre millions de pixels par image.

       Un plafond a une fois et demie retire quarante-cinq pour cent des pixels
       sans que rien ne se voie, parce que le grain et le halo mangent de toute
       facon la nettete du dernier demi-point. La finesse d'un rendu ne se joue
       pas la, elle se joue dans la matiere. */
    rendu.setPixelRatio(Math.min(devicePixelRatio || 1, petit ? 1.4 : 1.5));
    rendu.setSize(L, H, false);
    composer.setSize(L, H);
    halo.setSize(L, H);
    matP.uniforms.uEchelle.value = H * 0.055;
  }
  mesurer();
  addEventListener('resize', mesurer, { passive: true });

  /* ══ LA CAMERA REPOND A LA MAIN ════════════════════════════════════════
     Un rail seul donne un train fantome : le parcours est le meme a chaque
     passage, rien ne depend de celui qui regarde, et l'oeil le sent en trois
     secondes. Chez igloo, tout repond au curseur, et c'est une bonne moitie
     de la sensation de jeu video.

     Deux degres de liberte suffisent, et TRES PEU : la camera se decale de
     quelques dixiemes d'unite selon la position du pointeur, perpendiculaire
     a sa direction de marche. On ne prend pas la main au visiteur, on lui
     laisse sentir qu'il tient quelque chose.

     Et par-dessus, une respiration : deux sinus lents et sans rapport, une
     amplitude minuscule. Aucune camera portee n'est parfaitement immobile, et
     une camera parfaitement immobile est le signe le plus sur d'un calcul. */
  const main = { x: 0, y: 0 }, mainVue = { x: 0, y: 0 };
  const suivreMain = e => {
    main.x = (e.clientX / Math.max(1, innerWidth)) * 2 - 1;
    main.y = (e.clientY / Math.max(1, innerHeight)) * 2 - 1;
  };
  addEventListener('pointermove', suivreMain, { passive: true });

  /* ── L'avancee ──────────────────────────────────────────────────────── */
  let avance = 0, avanceVisee = 0, visible = true, actif = true;
  let dernier = performance.now();
  const pOeil = new THREE.Vector3(), pVise = new THREE.Vector3();
  const avant = new THREE.Vector3(), lateral = new THREE.Vector3();
  const HAUT = new THREE.Vector3(0, 1, 0);

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
    /* Le recul se fait sur l'axe du regard : la composition ne bouge pas, elle
       respire. Un decalage lateral, lui, changerait le cadrage. */
    if (reculEcran > 1.001) {
      pOeil.sub(pVise).multiplyScalar(reculEcran).add(pVise);
      /* ══ ET ON VISE UN PEU PLUS BAS ═══════════════════════════════════
         Sur un ecran vertical, le texte occupe le tiers du bas : un sujet
         cadre au centre se retrouve DERRIERE lui. En abaissant le point vise,
         le sujet remonte dans l'image et les deux cessent de se disputer la
         meme place. C'est le meme geste qu'un cadreur qui laisse de l'air
         sous son sujet pour un bandeau. */
      pVise.y -= (reculEcran - 1) * 4.2;
    }
    const a2 = 1 - Math.pow(1 - 0.06, dt * 60);
    mainVue.x += (main.x - mainVue.x) * a2;
    mainVue.y += (main.y - mainVue.y) * a2;

    /* Le decalage se fait dans le repere de la MARCHE, pas dans celui du
       monde : sinon la camera glisse vers le nord quel que soit le sens dans
       lequel elle avance, et le geste cesse d'avoir un rapport avec l'image. */
    avant.copy(pVise).sub(pOeil).normalize();
    lateral.crossVectors(avant, HAUT).normalize();

    const t0 = performance.now() / 1000;
    const respire = sobre ? 0 : 1;
    pOeil.addScaledVector(lateral, mainVue.x * 0.55 + Math.sin(t0 * 0.23) * 0.10 * respire);
    pOeil.y += -mainVue.y * 0.32 + Math.sin(t0 * 0.31) * 0.07 * respire;

    camera.position.copy(pOeil);
    camera.lookAt(pVise);
    /* Le roulis, minuscule et decorrele du reste. C'est ce qui empeche
       l'horizon d'etre une regle parfaite. */
    if (!sobre) camera.rotation.z += Math.sin(t0 * 0.17) * 0.010 + mainVue.x * 0.012;

    /* ══ LE NOIR DU PREMIER TEMPS ══════════════════════════════════════════
       Le recit dit : « le nom se forme en particules, TRES PRES, DANS LE
       NOIR ». Or la feuille etait eclairee a pleine puissance des la premiere
       image, et le nom, fait de particules de jade translucides, devenait
       parfaitement invisible sur un limbe vert vif. Il etait bien peint : il
       ne se voyait pas, ce qui est pire, parce qu'aucune sonde ne le signale.

       La lumiere monte donc avec le recul. On ouvre dans le noir, le nom se
       tient seul, puis la lumiere vient et l'on DECOUVRE qu'on etait pose sur
       une feuille. C'est le meme geste qu'un fondu depuis le noir, sauf qu'ici
       ce n'est pas l'image qui s'eclaircit, c'est le monde qui s'allume. */
    const jour = Math.min(1, Math.max(0, (avance - 0.045) / 0.175));
    const doux = jour * jour * (3 - 2 * jour);
    /* On ne baisse pas jusqu'a zero : il reste un huitieme de lumiere, juste
       assez pour deviner une silhouette et comprendre qu'il y a quelque chose
       la. Le noir complet ne serait pas mysterieux, il serait vide. */
    const k = 0.12 + 0.88 * doux;
    lampeFeuille.intensity = 70 * doux;
    rasante.intensity = 60 * (1 - doux) * (1 - Math.min(1, avance / 0.30));
    cle.intensity = 2.4 * k;
    contre.intensity = 1.9 * k;
    remplissage.intensity = 1.0 * k;
    ambiance.intensity = 0.9 * k;
    if (matiereFeuille) {
      matiereFeuille.emissiveIntensity = 0.62 * doux;
      matiereFeuille.envMapIntensity = k;
    }

    const t = performance.now() / 1000;
    if (!sobre) {
      matFeuillage.uniforms.uTemps.value = t;
      matP.uniforms.uTemps.value = t;
      /* ══ C'EST LA FEUILLE QUI PART, PAS LA CAMERA QUI RECULE ═════════════
         Le premier temps demandait de reculer pour decouvrir qu'on etait pose
         sur une feuille. Reculer obligeait la camera a se retourner ensuite,
         et un demi-tour ne se lisse pas.

         Une feuille arrachee DERIVE. Elle monte, elle s'ecarte, elle tourne
         sur elle-meme, et elle s'eloigne de qui la regarde. On obtient
         exactement le meme recit, la camera n'a plus qu'a avancer, et le
         mouvement a en plus une cause : le vent. Un mouvement dont on comprend
         la cause ne se remarque pas comme un mouvement de camera. */
      if (feuilleGeante) {
        const d = Math.min(1, avance / 0.42);
        const e = d * d * (3 - 2 * d);
        feuilleGeante.position.set(
          2.10 + e * 5.40 + Math.sin(t * 0.31) * 0.22,
          2.25 + e * 3.10 + Math.sin(t * 0.44) * 0.16,
          9.30 + e * 17.5
        );
        feuilleGeante.rotation.y = 0.55 + e * 1.15 + Math.sin(t * 0.13) * 0.10;
        feuilleGeante.rotation.z = 0.12 + e * 0.55 + Math.sin(t * 0.19) * 0.07;
        feuilleGeante.rotation.x = -0.22 + Math.sin(t * 0.23) * 0.09;
      }
      if (sceau) {
        sceau.rotation.y = Math.sin(t * 0.16) * 0.42;
        sceau.rotation.x = Math.sin(t * 0.11) * 0.10;
      }
    }

    /* ── La mise au point suit le regard ────────────────────────────────── */
    flou.uniforms.focus.value = Math.max(0.6, camera.position.distanceTo(pVise));
    /* L'ouverture se referme quand on est loin : de pres, un fond dissous
       isole le sujet ; de loin, le meme reglage brouillerait tout le decor
       qu'on vient de traverser. */
    flou.uniforms.aperture.value = 0.00030 * (1 - avance * 0.62) + 0.00004;

    /* ── Les rais partent de la lueur, quand elle est devant nous ────────── */
    const p = versLumiere.clone().project(camera);
    const devant = p.z < 1;
    rais.uniforms.uCentre.value.set(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
    /* Ils ne s'allument que dans la seconde moitie du voyage, et s'eteignent
       des que la source sort du cadre : des rais qui viennent d'un point
       invisible se lisent comme un defaut d'optique, pas comme de la lumiere. */
    const dedans = devant && Math.abs(p.x) < 1.5 && Math.abs(p.y) < 1.5;
    /* ══ UN RAI DE LUMIERE EST UNE LUEUR, PAS UN LASER ══════════════════
       A 1,35 de force et 0,86 d'etalement, la passe tirait un TRAIT VIOLET en
       travers du cadre : elle prenait le liseré du portail pour une source et
       l'etirait sur la moitie de l'ecran. Un rai doit se deviner, se perdre
       dans la poussiere, et disparaitre des qu'on regarde ailleurs.

       On coupe aussi la force quand la source s'ecarte du centre : de biais,
       une trainee radiale ne ressemble plus a de la lumiere mais a un defaut
       de capteur. */
    const centre = 1 - Math.min(1, Math.hypot(p.x, p.y) / 1.1);
    /* Ils montent a l'approche du portail et S'ETEIGNENT une fois franchi.
       Leur role est de faire sentir la lumiere qui passe par l'ouverture ;
       apres, ils n'ont plus d'ouverture a traverser et ils ne font plus que
       transformer le sceau en etoile. */
    const monte = Math.min(1, Math.max(0, (avance - 0.44) / 0.20));
    const descend = 1 - Math.min(1, Math.max(0, (avance - 0.80) / 0.10));
    const veut = dedans ? monte * descend * 0.44 * centre : 0;
    rais.uniforms.uForce.value += (veut - rais.uniforms.uForce.value) * 0.08;

    if (instruments && feuilleGeante) {
      for (let i = 0; i < 2; i++) {
        const r = instruments.releve(i);
        if (r) r.point.copy(ancresFeuille[i])
                 .applyEuler(feuilleGeante.rotation)
                 .add(feuilleGeante.position);
      }
    }
    paysage.avancer(t);
    paysage.suivre(camera);
    etalon.uniforms.uTemps.value = t;
    composer.render();
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
  /* Les deux premiers releves sont accroches a la FEUILLE, qui derive : leurs
     points doivent deriver avec elle, sinon les etiquettes designent l'endroit
     ou elle etait au chargement. */
  const ancresFeuille = [
    new THREE.Vector3( 1.30, 1.35, -0.30),
    new THREE.Vector3(-1.30, -1.55, -0.30)
  ];
  import('./instruments.js').then(({ monterLesInstruments, monterLeCompteur }) => {
    const compteur = monterLeCompteur();
    instruments = monterLesInstruments(toile, camera, { dans: options.releves || toile.parentElement });

    const pose = (point, titre, valeur, cote, vers, portee) => {
      ancres.push(point.clone());
      instruments.poser({ point: point.clone(), titre, valeur, cote, vers, longueur: 120, portee });
    };

    pose(new THREE.Vector3(3.4, 3.6, 9.0), 'PUERARIA_MONTANA',
      () => triFeuille ? triFeuille.toLocaleString('fr') + ' triangles' : 'chargement…',
      'droite', 'haut', 26);
    pose(new THREE.Vector3(0.8, 0.7, 9.0), 'MATIERE',
      () => defFeuille ? defFeuille + '  ·  ' + poidsFeuille.toLocaleString('fr') + ' Ko' : 'chargement…',
      'gauche', 'bas', 26);
    pose(new THREE.Vector3(4.4, 5.4, 55), 'PORTAIL',
      () => triPortail ? triPortail.toLocaleString('fr') + ' triangles  ·  ' + poidsPortail.toLocaleString('fr') + ' Ko' : 'chargement…',
      'droite', 'haut', 46);
    pose(new THREE.Vector3(-4.6, 0.2, 55), 'CADENCE',
      () => compteur.ms() ? compteur.ms().toFixed(1) + ' ms par image' : 'mesure…',
      'gauche', 'bas', 46);
    pose(new THREE.Vector3(3.4, 6.6, 82), 'SCEAU_KAZURA',
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
    /* ══ AU BOUT DU VOYAGE, LE SCEAU EST MASSIF, PAS TRANSPARENT ═══════════
       Il etait du meme verre que celui de la page d'accueil, et il y est
       superbe. Ici il explosait : un materiau a transmission ramene vers
       l'avant toute la lumiere qui est derriere lui, le halo la reprend, et le
       flou de profondeur de champ, dont le noyau est carre, etalait la tache
       en CARRE VIOLET LUMINEUX au milieu du cadre. Trois effets qui exaltent
       chacun les hautes lumieres se multiplient au lieu de s'additionner.

       Sur l'accueil, le sceau est seul devant un fond calme et sans
       post-traitement : le verre y a sa place. Au bout du voyage il est vu de
       loin, devant une couronne de lumiere, a travers toute la chaine. Un
       corps massif et poli y tient beaucoup mieux : il rend la lumiere sur ses
       aretes au lieu de la laisser passer, donc le blason se LIT.

       Le meme objet n'appelle pas le meme materiau dans deux mises en scene.
       C'est de la direction artistique, pas une incoherence. */
    const matiere = new THREE.MeshPhysicalMaterial({
      color: 0x0C4436,
      metalness: 0.04,
      /* Plus rugueux qu'il n'y parait necessaire : chaque cran de brillance
         gagne ici revient en tache blanche apres le halo. Un corps mat dont
         seule l'arete s'allume laisse LIRE les trois folioles, ce qui est la
         seule chose qu'on lui demande. */
      roughness: 0.46,
      clearcoat: 0.35,
      /* ══ UN VERNIS TROP LISSE EST UN MIROIR ══════════════════════════
         A 0,06 de rugosite, la lampe violette se reflechissait en un point
         minuscule et extremement lumineux. Le halo l'a repris, le flou l'a
         etale, et il en restait un CARRE VIOLET sur le blason. Une haute
         lumiere concentree est toujours le point de depart de ce genre
         d'accident : en depolissant le vernis, le meme reflet s'etale sur
         une large plage, ne depasse jamais le seuil du halo, et devient ce
         qu'il aurait toujours du etre, un lustre. */
      clearcoatRoughness: 0.30,
      /* Une emission tres basse pour que le corps ne tombe jamais au noir
         complet quand rien ne l'eclaire de face. */
      emissive: new THREE.Color(0x03170F),
      emissiveIntensity: 1.0,
      envMapIntensity: 0.55,
      side: THREE.DoubleSide
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
    /* La lueur artificielle qui servait de fond au sceau est retiree : il y a
       maintenant un vrai horizon derriere lui, un lac et des monts. Un faux
       fond pose a quinze unites derriere un objet est une bequille ; des qu'on
       a un monde, il devient un rectangle lumineux qu'on voit pour ce qu'il
       est. */

    const b = new THREE.Box3().setFromObject(groupe);
    const c = b.getCenter(new THREE.Vector3()), t = b.getSize(new THREE.Vector3());
    groupe.children.forEach(m => m.geometry.translate(-c.x, -c.y, -c.z));
    groupe.scale.setScalar(6.0 / Math.max(t.x, t.y));
    groupe.position.set(0, 4.2, 82);
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
      removeEventListener('pointermove', suivreMain);
      scene.traverse(o => { o.geometry?.dispose?.(); });
      paysage.detruire();
      matTige.dispose(); matFeuillage.dispose(); matP.dispose();
      composer.dispose?.();
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
