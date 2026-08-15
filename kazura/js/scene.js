/* ==========================================================================
   KAZURA 葛 - la montee
   --------------------------------------------------------------------------
   Une camera monte dans le noir. Autour d'elle, des lianes de verre poussent
   au rythme du defilement : le scroll ne fait pas glisser une image, il fait
   grandir la plante.

   Comment la croissance est obtenue. Chaque liane est un tube genere le long
   d'une courbe. Sur `TubeGeometry`, la coordonnee `uv.x` avance le long du
   tube, de 0 au pied a 1 a la pointe. Il suffit donc de jeter les fragments
   dont `uv.x` depasse un uniforme `uPousse` pour que le tube apparaisse
   progressivement, du pied vers la pointe, sans regenerer aucune geometrie.
   Un liseré lumineux pose juste sous ce seuil donne le bourgeon en train de
   s'ouvrir.

   Le meme seuil pilote les feuilles, qui portent en attribut leur position le
   long de la tige : une feuille n'existe que si la liane l'a deja depassee.
   ========================================================================== */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';

const JADE    = new THREE.Color('#10B981');
const JADE_F  = new THREE.Color('#04352A');
const VIOLET  = new THREE.Color('#7C3AED');
const VIOLET_C= new THREE.Color('#A78BFA');

export function monterLaScene(toile, options = {}) {
  /* La decision est prise une seule fois, par kazura.js, a partir de l'adresse,
     du choix garde et du reglage systeme. On la lit, on ne la refait pas. */
  const sobre = document.documentElement.dataset.mouvement !== 'anime';
  const petit = window.innerWidth < 820;

  /* Budget adapte a la machine. Sur un telephone on divise tout par deux et
     on coupe le bloom, qui est de loin la passe la plus chere. */
  const NB_LIANES = petit ? 9 : 18;
  const SEGMENTS  = petit ? 90 : 160;
  const RADIAUX   = petit ? 6 : 10;
  const NB_FEUILLES = petit ? 8 : 15;
  const HAUTEUR   = 60;

  const renderer = new THREE.WebGLRenderer({
    canvas: toile, antialias: !petit, alpha: false,
    powerPreference: 'high-performance', stencil: false, depth: true
  });
  /* Plafond volontairement bas. Le bloom repasse cinq fois sur l'image en
     descendant puis en remontant : chaque pixel coute une dizaine de fois son
     prix. A 1,75 la scene etait deux fois plus chere qu'a 1,25 sans que
     personne ne voie la difference sur un fond sombre et flou. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, petit ? 1.2 : 1.35));
  renderer.setClearColor(0x04060A, 1);

  const scene = new THREE.Scene();
  /* Brouillard leger. A 0,028 la colonne disparaissait entierement : le
     materiau est deja sombre, le fond est noir, et le brouillard achevait
     d'effacer les tiges avant qu'on ne les voie. */
  scene.fog = new THREE.FogExp2(0x04060A, 0.013);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
  camera.position.set(0, 0, 9);

  /* ── Le fond photographique ────────────────────────────────────────── */
  /* Le procedural seul rendait une scene maigre : quelques tiges dans du noir.
     L'image de synthese produite pour le hero a une densite qu'aucun shader
     ecrit en une nuit n'egale. On ne choisit donc pas : elle devient le fond
     du monde, les tiges poussent devant, et TOUT passe sous le meme
     etalonnage (bloom, aberration, vignette, grain). C'est ce passage commun
     qui fait tenir les deux ensemble au lieu de les juxtaposer.

     Le plan est accroche a la camera, donc il la suit sans jamais bouger a
     l'ecran, et il est mis a l'echelle pour couvrir le champ quel que soit le
     format de la fenetre. */
  const DIST_FOND = 70;
  const fond = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    /* `fog: false` est indispensable. Un materiau basique subit le brouillard
       de la scene par defaut, et a soixante-dix unites il en mangeait plus de
       la moitie : l'image ressortait delavee, comme une tache sombre. Le fond
       n'est pas dans le monde, il EST le monde : il ne doit rien recevoir. */
    new THREE.MeshBasicMaterial({
      depthWrite: false, depthTest: false, toneMapped: false, fog: false
    })
  );
  fond.renderOrder = -1;
  fond.position.z = -DIST_FOND;
  camera.add(fond);
  scene.add(camera);

  new THREE.TextureLoader().load(
    options.fond || 'assets/hero.webp',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      fond.material.map = tex;
      /* Assombri pour que le texte reste lisible par-dessus : le hero porte
         un titre en grand, pas une galerie. */
      /* Le texte se detache par un puits sombre local (voir `.hero::after`),
         pas en noyant toute l'image : a 0,55 la richesse de la photo etait
         perdue et il ne restait qu'une bouillie sombre. */
      fond.material.color.setScalar(0.92);
      fond.material.needsUpdate = true;
      cadrerLeFond(tex);
    },
    undefined,
    () => { fond.visible = false; }
  );

  /* Couvre le champ sans deformer l'image : on compare le rapport de l'image
     a celui de la fenetre et on deborde du cote qui manque. */
  function cadrerLeFond(tex) {
    if (!tex?.image) return;
    const hauteurVue = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * DIST_FOND;
    const largeurVue = hauteurVue * camera.aspect;
    const rImage = tex.image.width / tex.image.height;
    const rVue = camera.aspect;
    if (rImage > rVue) fond.scale.set(hauteurVue * rImage, hauteurVue, 1);
    else fond.scale.set(largeurVue, largeurVue / rImage, 1);
  }

  /* ── Le materiau des tiges ─────────────────────────────────────────── */
  const matTige = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uPousse:  { value: 0 },
      uTemps:   { value: 0 },
      uJade:    { value: JADE },
      uJadeF:   { value: JADE_F },
      uViolet:  { value: VIOLET },
      uVioletC: { value: VIOLET_C },
      uBrouillard: { value: new THREE.Color(0x04060A) },
      uDensite: { value: scene.fog.density }
    },
    vertexShader: /* glsl */`
      attribute float aDecalage;   // retard de pousse propre a chaque liane
      varying vec2  vUv;
      varying vec3  vNormalMonde;
      varying vec3  vVersOeil;
      varying float vDecalage;
      varying float vProfondeur;

      void main() {
        vUv = uv;
        vDecalage = aDecalage;
        vec4 monde = modelMatrix * vec4(position, 1.0);
        vNormalMonde = normalize(mat3(modelMatrix) * normal);
        vVersOeil = normalize(cameraPosition - monde.xyz);
        vec4 vue = viewMatrix * monde;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uPousse, uTemps, uDensite;
      uniform vec3  uJade, uJadeF, uViolet, uVioletC, uBrouillard;
      varying vec2  vUv;
      varying vec3  vNormalMonde, vVersOeil;
      varying float vDecalage, vProfondeur;

      void main() {
        /* Le seuil de pousse, decale liane par liane pour qu'elles ne
           montent pas toutes ensemble comme un rideau. */
        float seuil = clamp(uPousse * (1.0 + vDecalage) - vDecalage, 0.0, 1.0);
        if (vUv.x > seuil) discard;

        vec3 N = normalize(vNormalMonde);
        vec3 V = normalize(vVersOeil);

        // Fresnel : le verre s'allume sur ses aretes, pas au centre.
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

        // Fausse diffusion sous la surface : la lumiere vient de derriere et
        // traverse la matiere. C'est la SEULE source de vert vif : une tige
        // eclairee de face doit rester sombre, sinon on obtient du neon.
        vec3 L = normalize(vec3(-0.35, 0.55, -1.0));
        float dos = pow(clamp(dot(-N, L), 0.0, 1.0), 2.2);

        /* Corps presque noir. La version precedente melangeait jadeF vers jade
           sur toute la surface : les tiges etaient lumineuses partout, le
           bloom les lavait, et la scene virait au cyan surexpose. Un verre
           sombre qui ne s'allume que sur ses aretes lit comme du verre.
           (Pas d'accent grave ici : on est dans un gabarit de chaine.) */
        vec3 col = uJadeF * 0.5;
        col += uJade   * dos  * 0.85;
        col += uViolet * fres * 0.60;

        // Le bourgeon. A 3.2 il brulait en taches blanches geantes.
        float front = smoothstep(seuil - 0.03, seuil, vUv.x);
        col += vec3(0.55, 1.00, 0.80) * front * 0.55;

        // Nervure longitudinale, pour que le tube ne soit pas lisse et mort.
        float nerv = pow(abs(sin(vUv.y * 3.14159 * 5.0 + vUv.x * 26.0)), 16.0);
        col += uJade * nerv * 0.28;

        // Brouillard applique a la main : le materiau est personnalise, donc
        // celui de la scene ne s'y applique pas tout seul.
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));

        /* La scene est un DECOR : elle passe derriere le texte, jamais devant.
           Une opacite pleine la faisait rivaliser avec le contenu, une opacite
           trop basse la rendait invisible sur le fond photographique. */
        float alpha = 0.17 + fres * 0.38 + front * 0.26;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `
  });

  /* ── Le materiau des feuilles ──────────────────────────────────────── */
  const matFeuille = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uPousse: { value: 0 },
      uTemps:  { value: 0 },
      uJade:   { value: JADE },
      uViolet: { value: VIOLET },
      uBrouillard: { value: new THREE.Color(0x04060A) },
      uDensite: { value: scene.fog.density }
    },
    vertexShader: /* glsl */`
      attribute float aLong;      // position de la feuille le long de la tige
      attribute float aDecalage;
      attribute float aGraine;    // pour desynchroniser le frisson
      varying vec2  vUv;
      varying float vOuverte;
      varying float vGraine;
      varying float vProfondeur;
      uniform float uPousse, uTemps;

      void main() {
        vUv = uv;
        vGraine = aGraine;
        float seuil = clamp(uPousse * (1.0 + aDecalage) - aDecalage, 0.0, 1.0);

        // La feuille s'ouvre sur les cinq centiemes qui suivent son point
        // d'attache, puis reste ouverte.
        vOuverte = smoothstep(aLong, aLong + 0.05, seuil);

        vec3 p = position * vOuverte;
        // Un frisson tres lent, pour que rien ne soit jamais parfaitement fixe.
        p.xy += vec2(sin(uTemps * 0.55 + aGraine * 6.28),
                     cos(uTemps * 0.42 + aGraine * 4.13)) * 0.045 * vOuverte;

        vec4 monde = instanceMatrix * vec4(p, 1.0);
        vec4 vue = viewMatrix * modelMatrix * monde;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3  uJade, uViolet, uBrouillard;
      uniform float uTemps, uDensite;
      varying vec2  vUv;
      varying float vOuverte, vGraine, vProfondeur;

      void main() {
        if (vOuverte < 0.01) discard;

        /* Silhouette de feuille, dessinee dans le carre : deux arcs qui se
           rejoignent en pointe. Moins cher qu'une texture, et net a toutes
           les tailles. */
        vec2 p = vUv * 2.0 - 1.0;
        float largeur = (1.0 - p.y * p.y) * 0.72;
        float d = abs(p.x) - largeur;
        if (d > 0.0) discard;

        float bord = smoothstep(0.0, -0.42, d);
        float nervure = smoothstep(0.05, 0.0, abs(p.x)) * 0.6
                      + smoothstep(0.035, 0.0, abs(abs(p.x) - largeur * 0.5)) * 0.25;

        vec3 col = mix(uJade * 0.30, uJade * 1.25, bord);
        col += uViolet * (1.0 - bord) * 0.85;
        col += vec3(0.72, 1.0, 0.88) * nervure * 0.55;

        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));

        gl_FragColor = vec4(col, vOuverte * (0.30 + bord * 0.62));
      }
    `
  });

  /* ── Generation des lianes ─────────────────────────────────────────── */
  /* Chaque liane est une helice bruitee : elle tourne autour de l'axe de
     montee en s'ecartant et se rapprochant, ce qui donne un enroulement
     credible sans simulation. Deux lianes ne se ressemblent jamais parce que
     rayon, pas de vis, sens de rotation et bruit sont tires au hasard. */
  const alea = (a, b) => a + Math.random() * (b - a);
  const feuillesPos = [];
  const groupe = new THREE.Group();
  scene.add(groupe);

  for (let i = 0; i < NB_LIANES; i++) {
    /* CHAQUE LIANE A SON PROPRE AXE. Avant, toutes s'enroulaient autour du
       meme centre a des rayons differents : vues ensemble, elles semblaient
       tourner les unes autour des autres comme les brins d'un cable. Matheo
       l'a dit exactement, « elles tournent entre elles, c'est bizarre ». Rien
       dans une plante ne fait ca. */
    const axeX = alea(-7, 7);
    const axeZ = alea(-9, 6);
    const sens = Math.random() < 0.5 ? -1 : 1;

    /* UNE LIANE MONTE, ELLE NE FAIT PAS LA VIS. L'ancienne valeur allait de
       3,4 a 7 tours complets sur la hauteur : c'est un ressort, pas une tige.
       Entre un demi-tour et deux tours, on voit la torsion sans lire un
       tire-bouchon. Et le rayon de cette torsion devient petit, parce que ce
       n'est plus une orbite autour d'un poteau, c'est un enroulement sur soi. */
    const tours  = alea(0.45, 1.9) * sens;
    const torsad = alea(0.5, 2.0);
    const phase  = alea(0, Math.PI * 2);

    /* LE MEANDRE, qui donne desormais la forme. Trois frequences sans rapport
       simple entre elles : leur somme ne se repete jamais, donc la tige
       serpente au lieu de suivre un motif. C'est ce qui manquait pour qu'on
       lise une plante ayant cherche son chemin plutot qu'une courbe calculee. */
    const mx = alea(0.7, 1.7), mz = alea(0.7, 1.7);
    const px = alea(0, 6.283), pz = alea(0, 6.283);
    const ampleur = alea(1.1, 3.2);

    const yDepart = alea(-6, 2);
    const hauteur = alea(HAUTEUR * 0.55, HAUTEUR * 1.15);
    const ondul   = alea(0.5, 2.2);

    const points = [];
    const N = 64;
    for (let j = 0; j <= N; j++) {
      const t = j / N;
      const a = phase + t * Math.PI * 2 * tours;
      const r = torsad * (1 + Math.sin(t * Math.PI * ondul) * 0.25);
      points.push(new THREE.Vector3(
        axeX + Math.cos(a) * r
             + Math.sin(t * 3.1 * mx + px)       * ampleur
             + Math.sin(t * 7.7 * mx + px * 2.1) * ampleur * 0.32,
        yDepart + t * hauteur,
        axeZ + Math.sin(a) * r
             + Math.cos(t * 2.7 * mz + pz)       * ampleur
             + Math.cos(t * 6.3 * mz + pz * 1.7) * ampleur * 0.28
      ));
    }

    const courbe = new THREE.CatmullRomCurve3(points);
    // Tiges plus fines : a 0,11 de rayon on obtenait des tuyaux, pas des tiges.
    const geo = new THREE.TubeGeometry(courbe, SEGMENTS, alea(0.085, 0.215), RADIAUX, false);

    const decalage = alea(0.0, 0.75);
    const dec = new Float32Array(geo.attributes.position.count).fill(decalage);
    geo.setAttribute('aDecalage', new THREE.BufferAttribute(dec, 1));

    groupe.add(new THREE.Mesh(geo, matTige));

    // Points d'ancrage des feuilles, releves sur la courbe.
    for (let k = 0; k < NB_FEUILLES; k++) {
      const t = 0.12 + (k / NB_FEUILLES) * 0.85 + alea(-0.03, 0.03);
      feuillesPos.push({
        p: courbe.getPointAt(Math.min(0.999, Math.max(0.001, t))),
        tangente: courbe.getTangentAt(Math.min(0.999, Math.max(0.001, t))),
        long: t, decalage, taille: alea(0.62, 1.35)
      });
    }
  }

  /* ── Les feuilles, en instances ────────────────────────────────────── */
  const geoFeuille = new THREE.PlaneGeometry(1, 1.5);
  const feuilles = new THREE.InstancedMesh(geoFeuille, matFeuille, feuillesPos.length);
  const aLong = new Float32Array(feuillesPos.length);
  const aDec  = new Float32Array(feuillesPos.length);
  const aGrn  = new Float32Array(feuillesPos.length);
  const mat4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const haut = new THREE.Vector3(0, 1, 0);
  const ech  = new THREE.Vector3();

  feuillesPos.forEach((f, i) => {
    quat.setFromUnitVectors(haut, f.tangente.clone().normalize());
    const tourne = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    quat.multiply(tourne);
    ech.setScalar(f.taille);
    mat4.compose(f.p, quat, ech);
    feuilles.setMatrixAt(i, mat4);
    aLong[i] = f.long;
    aDec[i]  = f.decalage;
    aGrn[i]  = Math.random();
  });
  geoFeuille.setAttribute('aLong', new THREE.InstancedBufferAttribute(aLong, 1));
  geoFeuille.setAttribute('aDecalage', new THREE.InstancedBufferAttribute(aDec, 1));
  geoFeuille.setAttribute('aGraine', new THREE.InstancedBufferAttribute(aGrn, 1));
  feuilles.instanceMatrix.needsUpdate = true;
  feuilles.frustumCulled = false;
  groupe.add(feuilles);

  /* ── Spores en suspension ──────────────────────────────────────────── */
  const NB_SPORES = petit ? 260 : 700;
  const posSpores = new Float32Array(NB_SPORES * 3);
  const grnSpores = new Float32Array(NB_SPORES);
  for (let i = 0; i < NB_SPORES; i++) {
    posSpores[i * 3]     = alea(-16, 16);
    posSpores[i * 3 + 1] = alea(-10, HAUTEUR + 10);
    posSpores[i * 3 + 2] = alea(-16, 10);
    grnSpores[i] = Math.random();
  }
  const geoSpores = new THREE.BufferGeometry();
  geoSpores.setAttribute('position', new THREE.BufferAttribute(posSpores, 3));
  geoSpores.setAttribute('aGraine', new THREE.BufferAttribute(grnSpores, 1));

  const matSpores = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTemps: { value: 0 }, uJade: { value: JADE }, uViolet: { value: VIOLET_C } },
    vertexShader: /* glsl */`
      attribute float aGraine;
      uniform float uTemps;
      varying float vGraine;
      void main() {
        vGraine = aGraine;
        vec3 p = position;
        p.y += sin(uTemps * 0.22 + aGraine * 9.4) * 0.9;
        p.x += cos(uTemps * 0.17 + aGraine * 7.1) * 0.7;
        vec4 vue = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (10.0 + aGraine * 16.0) / max(-vue.z, 0.6);
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision mediump float;
      uniform vec3 uJade, uViolet;
      varying float vGraine;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = pow(1.0 - d * 2.0, 2.6) * (0.20 + vGraine * 0.5);
        gl_FragColor = vec4(mix(uJade, uViolet, vGraine), a);
      }
    `
  });
  scene.add(new THREE.Points(geoSpores, matSpores));

  /* ── Post-traitement ───────────────────────────────────────────────── */
  /* Aberration chromatique, vignette et grain en une seule passe. C'est ce
     qui separe une image de synthese propre d'une image qui a l'air filmee. */
  const passeFinale = {
    uniforms: {
      tDiffuse: { value: null },
      uForce:   { value: 1.0 },
      uTemps:   { value: 0 }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform float uForce, uTemps;
      varying vec2 vUv;

      float alea(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main() {
        vec2 c = vUv - 0.5;
        float r2 = dot(c, c);

        // L'ecart des trois canaux croit vers les bords, comme une optique.
        vec2 ecart = c * r2 * 0.028 * uForce;
        vec3 col;
        col.r = texture2D(tDiffuse, vUv - ecart).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv + ecart).b;

        col *= 1.0 - r2 * 0.58;                         // vignette
        col += (alea(vUv * 900.0 + uTemps) - 0.5) * 0.030;  // grain
        gl_FragColor = vec4(col, 1.0);
      }
    `
  };

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let bloom = null;
  if (!petit) {
    /* Force nettement reduite et seuil releve : a 0,72 et 0,22 le bloom
       saisissait toute la tige et pas seulement ses aretes, ce qui donnait
       des trainees de fibre optique. Il ne doit cueillir que les bourgeons. */
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.55, 0.62);
    composer.addPass(bloom);
  }
  const finale = new ShaderPass(passeFinale);
  finale.renderToScreen = true;
  composer.addPass(finale);

  /* ── Dimensions ────────────────────────────────────────────────────── */
  function redimensionner() {
    const r = toile.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    if (bloom) bloom.setSize(w, h);
    cadrerLeFond(fond.material.map);
  }
  redimensionner();
  window.addEventListener('resize', redimensionner);

  /* ── Boucle ────────────────────────────────────────────────────────── */
  let progression = 0, lisse = 0, souris = { x: 0, y: 0 }, sourisLisse = { x: 0, y: 0 };
  let vivant = true;

  /* PIEGE COUTEUX : la toile est en `position: fixed` et couvre l'ecran, donc
     un IntersectionObserver la declare visible sur TOUTE la page, y compris
     quand son opacite est tombee a zero. La scene continuait alors de peindre
     bloom compris pendant tout le reste du defilement, pour rien. C'est
     l'appelant qui sait si elle sert encore, via `montrer()`. */
  let visible = true;

  window.addEventListener('pointermove', e => {
    souris.x = (e.clientX / window.innerWidth) * 2 - 1;
    souris.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) horloge.getDelta();   // evite un saut au retour
  });

  const horloge = new THREE.Clock();
  let t = 0;

  /* ── Qualite adaptative ────────────────────────────────────────────── */
  /* Une belle scene qui tombe a vingt images par seconde est une mauvaise
     scene. On mesure le temps par image en continu et on se deleste par
     paliers : d'abord le bloom, qui est de loin la passe la plus chere, puis
     la resolution. On ne remonte jamais : remonter provoquerait un
     va-et-vient visible entre deux qualites. */
  const budget = { somme: 0, n: 0, palier: 0, prochainTest: 2.5 };

  function jauger(dt) {
    budget.somme += dt; budget.n++;
    if (t < budget.prochainTest || budget.n < 30) return;
    const moyenne = budget.somme / budget.n;
    budget.somme = 0; budget.n = 0;
    budget.prochainTest = t + 2.5;

    if (moyenne < 0.022 || budget.palier >= 2) return;   // au-dessus de 45 i/s

    budget.palier++;
    if (budget.palier === 1 && bloom) {
      bloom.enabled = false;
      console.info('scene : bloom coupe, la machine ne suivait pas '
                   + Math.round(1 / moyenne) + ' i/s');
    } else {
      renderer.setPixelRatio(Math.max(0.75, renderer.getPixelRatio() * 0.7));
      redimensionner();
      console.info('scene : resolution reduite, ' + Math.round(1 / moyenne) + ' i/s');
    }
  }

  function peindre() {
    const dt = Math.min(horloge.getDelta(), 0.05);
    t += dt;
    if (visible) jauger(dt);

    /* Amorti, et INDEPENDANT DU NOMBRE D'IMAGES. Un facteur fixe par image
       rend la pousse plus rapide sur une machine qui tourne a 144 images et
       saccadee des qu'une image tombe. */
    lisse += (progression - lisse) * (sobre ? 1 : (1 - Math.pow(1 - 0.11, dt * 60)));

    /* La pousse ne part pas de zero. A zero, aucun fragment n'etait dessine et
       le hero s'ouvrait sur un ecran entierement noir : on annoncait une scene
       vivante et on montrait du vide. Un huitieme de croissance des la
       premiere image donne deja une colonne a regarder. */
    const pousse = 0.13 + lisse * 0.87;
    matTige.uniforms.uPousse.value = pousse;
    matFeuille.uniforms.uPousse.value = pousse;
    matTige.uniforms.uTemps.value = t;
    matFeuille.uniforms.uTemps.value = t;
    matSpores.uniforms.uTemps.value = t;
    finale.uniforms.uTemps.value = t;

    // La camera monte le long de la colonne et se laisse pousser par la
    // souris, tres legerement, pour que la scene ait du volume.
    const kSouris = 1 - Math.pow(1 - 0.045, dt * 60);
    sourisLisse.x += (souris.x - sourisLisse.x) * kSouris;
    sourisLisse.y += (souris.y - sourisLisse.y) * kSouris;

    /* La camera doit rester AU NIVEAU du front de pousse, pas au-dessus. Elle
       montait auparavant de 55 unites quand les tiges n'en gagnaient qu'une
       trentaine : elle regardait le vide au-dessus de la plante. */
    const y = -3 + lisse * 34;
    camera.position.y = y;
    camera.position.x = Math.sin(lisse * 2.4) * 1.5 + sourisLisse.x * 1.1;
    camera.position.z = 10 + Math.cos(lisse * 1.7) * 2.2;
    camera.lookAt(sourisLisse.x * 0.9, y + 2.0 - sourisLisse.y * 0.9, 0);

    groupe.rotation.y = lisse * 0.35;

    if (visible) composer.render();
    if (vivant) requestAnimationFrame(peindre);
  }
  peindre();

  return {
    /* Appelee par le defilement : 0 en haut de la page, 1 en bas. */
    avancer(p) { progression = Math.min(1, Math.max(0, p)); },
    /* Coupe le rendu des que la scene n'est plus a l'ecran. */
    montrer(v) { visible = !!v; },
    detruire() {
      vivant = false;
      renderer.dispose();
      composer.dispose?.();
    }
  };
}
