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
  /* Trois paliers au lieu de deux. Le palier « faible » sert aux machines
     modestes, qui recevaient jusqu'ici une image fixe a la place du monde :
     trois lianes qui poussent valent mieux qu'une photographie. */
  const faible = !!options.faible;
  /* Huit lianes au palier faible, pas cinq. Le cout d'une liane tient dans
     ses SEGMENTS et ses cotes, pas dans son existence : on garde donc leur
     nombre, qui fait la densite, et on rabote leur finesse, que personne ne
     compte. Cinq lianes donnaient un decor vide, ce qui revenait au meme que
     l'image fixe qu'on venait de retirer. */
  const NB_LIANES = faible ? 8 : (petit ? 9 : 18);
  const SEGMENTS  = faible ? 54 : (petit ? 90 : 160);
  const RADIAUX   = faible ? 5 : (petit ? 6 : 10);
  const NB_FEUILLES = faible ? 5 : (petit ? 8 : 15);
  const HAUTEUR   = 60;

  const renderer = new THREE.WebGLRenderer({
    canvas: toile, antialias: !petit, alpha: false,
    powerPreference: 'high-performance', stencil: false, depth: true
  });
  /* Plafond volontairement bas. Le bloom repasse cinq fois sur l'image en
     descendant puis en remontant : chaque pixel coute une dizaine de fois son
     prix. A 1,75 la scene etait deux fois plus chere qu'a 1,25 sans que
     personne ne voie la difference sur un fond sombre et flou. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, faible ? 1.0 : (petit ? 1.2 : 1.35)));
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
    /* ══ UN CORPS TRANSPARENT N'ECRIT PAS SA PROFONDEUR ═══════════════════
       C'etait la vraie cause des « metres-rubans ». Le tube est transparent et
       double face : chaque tige dessine donc sa paroi avant ET sa paroi
       arriere. Tant qu'elle ecrivait sa profondeur, la premiere paroi tiree
       barrait toutes celles qui venaient apres, et l'ordre de tirage est
       l'ordre des triangles, c'est-a-dire la segmentation du tube. D'ou des
       barreaux clairs parfaitement reguliers en travers de chaque tige, et
       des tiges HACHEES EN TRONCONS au lieu de courir d'un bord a l'autre.

       J'avais d'abord accuse la nervure du fragment et je l'ai reecrite. Elle
       n'y etait pour rien : le defaut suit la geometrie, pas la formule.
       Verifie en basculant le seul reglage sur la meme image, mêmes lianes.

       Les tiges ne s'occultent plus entre elles. C'est exactement ce qu'on
       veut : du verre se superpose, il ne se decoupe pas. */
    depthWrite: false,
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
      attribute vec3  aCentre;     // le point de l'axe, pour effiler les bouts
      uniform float uPousse;
      varying vec2  vUv;
      varying vec3  vNormalMonde;
      varying vec3  vVersOeil;
      varying float vDecalage;
      varying float vProfondeur;

      void main() {
        vUv = uv;
        vDecalage = aDecalage;

        /* Le pincement aux deux bouts. Six centiemes de la longueur suffisent :
           au-dela la tige devient une aiguille, en deca l'ellipse se voit
           encore. La base se pince un peu plus court que la pointe, parce
           qu'une tige sort du sol franchement et finit en fil. */
        float effile = smoothstep(0.0, 0.035, vUv.x) * smoothstep(1.0, 0.90, vUv.x);

        /* ET LE FRONT DE POUSSE AUSSI. Une tige a mi-croissance est coupee au
           rasoir par le seuil : au loin on ne voit qu'un bourgeon clair, mais
           de pres c'est de nouveau une paille sectionnee. Comme le seuil se
           calcule avec les memes deux valeurs qu'en bas, on peut pincer la
           tige juste avant lui et elle finit en fil au lieu de finir en tube.
           Une pousse qui s'affine, c'est ce qu'on voit sur une vraie plante. */
        float seuilV = clamp(uPousse * (1.0 + aDecalage) - aDecalage, 0.0, 1.0);
        effile *= smoothstep(seuilV, seuilV - 0.045, vUv.x);

        vec3 pincee = mix(aCentre, position, effile);

        vec4 monde = modelMatrix * vec4(pincee, 1.0);
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
        /* ══ UNE TIGE DE NUIT EST PRESQUE NOIRE ════════════════════════
           Les trois nombres etaient 0,5 / 0,85 / 0,60, et le resultat etait
           un faisceau de PAILLES LAVANDE plus claires que le fond, qui
           passaient devant tout et gagnaient chaque regard. Le violet du
           Fresnel bordait chaque tige sur toute sa longueur, ce qui n'arrive
           a aucun corps sombre.

           La regle de la maison veut que presque tout soit noir. Le verre ne
           s'allume qu'a contre-jour, et le violet redevient un accent qu'on
           remarque une fois sur dix au lieu d'une teinte de fond. */
        vec3 col = uJadeF * 0.16;
        col += uJade   * dos  * 1.20;
        col += uViolet * fres * 0.20;

        // Le bourgeon. A 3.2 il brulait en taches blanches geantes.
        float front = smoothstep(seuil - 0.03, seuil, vUv.x);
        col += vec3(0.55, 1.00, 0.80) * front * 0.30;

        /* ══ LA NERVURE COURT LE LONG DE LA TIGE ═══════════════════════════
           Cinq cotes autour de la circonference, qui serpentent tres
           legerement sur la longueur : sans ce serpentement ce sont des rails.

           Cette formule n'a jamais ete la cause des barreaux, contrairement a
           ce que j'ai cru en la reecrivant : ils venaient de l'ecriture de
           profondeur, plus haut. Elle reste quand meme meilleure ainsi, mais
           la lecon est ailleurs : un defaut PARFAITEMENT regulier suit presque
           toujours la geometrie ou l'ordre de tirage, pas une formule de
           couleur. J'aurais du regarder la ou le motif etait deja ecrit. */
        float nerv = pow(abs(sin(vUv.y * 3.14159 * 5.0 + sin(vUv.x * 2.3) * 0.55)), 14.0);
        col += uJade * nerv * 0.22;

        // Brouillard applique a la main : le materiau est personnalise, donc
        // celui de la scene ne s'y applique pas tout seul.
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));

        /* La scene est un DECOR : elle passe derriere le texte, jamais devant.
           Une opacite pleine la faisait rivaliser avec le contenu, une opacite
           trop basse la rendait invisible sur le fond photographique. */
        float alpha = 0.09 + fres * 0.26 + dos * 0.34 + front * 0.30;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `
  });

  /* ── Le materiau des feuilles ──────────────────────────────────────── */
  /* ══ UNE FEUILLE PHOTOGRAPHIEE, PAS UNE FEUILLE DESSINEE ═══════════════
     Elle etait tracee au shader : deux arcs qui se rejoignent en pointe,
     centre vert vif, bord violet. Vu de pres, cinquante de ces formes le long
     de tiges donnaient des YEUX DE CHAT lumineux regulierement espaces. Ce
     n'est pas un reglage a corriger, c'est une impasse : une silhouette
     analytique n'aura jamais les asymetries, les nervures secondaires et les
     accidents de bord qui font qu'on reconnait une feuille.

     C'est la lecon relevee sur igloo.inc, chiffree : 578 Ko de geometrie
     contre 12 400 Ko de textures. Le realisme vient de la MATIERE.

     L'empreinte fait quatorze kilo-octets. Elle est tiree de notre propre
     modele de kudzu par outil-empreinte.html, donc c'est la meme feuille en
     gros plan dans sa section et en decor ici. Rien de generique, rien
     d'achete, et un seul objet a soigner au lieu de deux. */
  const empreinteVide = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  empreinteVide.needsUpdate = true;

  const matFeuille = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uPousse: { value: 0 },
      uTemps:  { value: 0 },
      uJade:   { value: JADE },
      uViolet: { value: VIOLET },
      uEmpreinte: { value: empreinteVide },
      uBrouillard: { value: new THREE.Color(0x04060A) },
      uDensite: { value: scene.fog.density }
    },
    vertexShader: /* glsl */`
      attribute float aLong;      // position de la feuille le long de la tige
      attribute float aDecalage;
      attribute float aGraine;    // pour desynchroniser le frisson
      attribute float aCase;      // laquelle des deux feuilles de l'image
      varying vec2  vUv;
      varying float vOuverte;
      varying float vGraine;
      varying float vProfondeur;
      varying vec3  vNormalMonde;
      uniform float uPousse, uTemps;

      void main() {
        /* ══ DEUX EMPREINTES, ET UNE SUR DEUX RETOURNEE ═══════════════════
           Une seule silhouette repetee cinquante fois se repere en une
           seconde, et des qu'on l'a vue on ne voit plus qu'elle. L'image
           porte donc DEUX feuilles cote a cote, tirees de deux modeles
           differents, et on choisit la case par instance : quatre silhouettes
           en tout avec le retournement, pour vingt-quatre kilo-octets.

           LE RETOURNEMENT DOIT PRENDRE LA GEOMETRIE AVEC LUI, et ma premiere
           version ne retournait que l'image. Le petiole passait alors du bord
           gauche au bord droit du rectangle pendant que l'origine, elle,
           restait a gauche : une feuille sur deux se retrouvait accrochee PAR
           SA POINTE, a une longueur de feuille de sa tige. C'est ce qui
           donnait ces feuilles qui semblaient flotter dans les vides.

           En retournant aussi la position, le petiole revient sur l'origine
           et la feuille part de l'autre cote de la tige. */
        float miroir = aGraine < 0.5 ? -1.0 : 1.0;
        float u = miroir < 0.0 ? 1.0 - uv.x : uv.x;
        vUv = vec2((u + aCase) * 0.5, uv.y);
        vGraine = aGraine;
        float seuil = clamp(uPousse * (1.0 + aDecalage) - aDecalage, 0.0, 1.0);

        // La feuille s'ouvre sur les cinq centiemes qui suivent son point
        // d'attache, puis reste ouverte.
        vOuverte = smoothstep(aLong, aLong + 0.05, seuil);

        vec3 p = vec3(position.x * miroir, position.y, position.z) * vOuverte;
        // Un frisson tres lent, pour que rien ne soit jamais parfaitement fixe.
        p.xy += vec2(sin(uTemps * 0.55 + aGraine * 6.28),
                     cos(uTemps * 0.42 + aGraine * 4.13)) * 0.045 * vOuverte;

        vec4 monde = instanceMatrix * vec4(p, 1.0);
        /* La normale suit l'instance : sans elle toutes les feuilles seraient
           eclairees comme si elles etaient parallelles, et le contre-jour,
           qui est ici la seule source de vert, serait le meme partout. */
        vNormalMonde = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
        vec4 vue = viewMatrix * modelMatrix * monde;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3  uJade, uViolet, uBrouillard;
      uniform float uTemps, uDensite;
      uniform sampler2D uEmpreinte;
      varying vec2  vUv;
      varying float vOuverte, vGraine, vProfondeur;
      varying vec3  vNormalMonde;

      void main() {
        if (vOuverte < 0.01) discard;

        vec4 t = texture2D(uEmpreinte, vUv);
        /* Le decoupage se fait au SEUIL, pas en fondu. Un bord qui s'efface
           sur trois pixels laisse un halo ; cinquante halos qui se recouvrent
           font exactement le brouillard verdatre qu'on cherche a fuir. */
        if (t.a < 0.42) discard;

        /* La meme lampe que les tiges. Une scene qui a deux lumieres a deux
           mondes, et l'oeil le voit avant de savoir le nommer. */
        vec3 N = normalize(vNormalMonde);
        vec3 L = normalize(vec3(-0.35, 0.55, -1.0));
        float dos  = pow(clamp(dot(-N, L), 0.0, 1.0), 1.5);
        float face = clamp(dot(N, L), 0.0, 1.0);

        /* CE QU'ON VOIT D'UNE FEUILLE LA NUIT, C'EST SA TRANSLUCIDITE. Son
           albedo reste presque noir ; c'est la lumiere qui la TRAVERSE qui la
           dessine, et c'est pour cela qu'un feuillage nocturne est vert par
           plaques et non partout. */
        /* CHAQUE FEUILLE A SA PROPRE EPAISSEUR. Sans cette variation, toutes
           celles qui regardent du meme cote ont exactement la meme valeur, et
           cinquante silhouettes du meme vert plat se lisent comme des
           AUTOCOLLANTS poses sur l'image. Dans un vrai feuillage, deux
           feuilles voisines n'ont jamais la meme lumiere : l'une est jeune et
           laisse passer, l'autre est vieille et bouche. */
        /* On replie la graine sur elle-meme : sa moitie basse sert deja au
           miroir, et sans ce repli toutes les feuilles retournees seraient les
           plus fines du lot, ce qui recreerait la regle qu'on vient d'effacer. */
        float epaisseur = mix(0.42, 1.75, fract(vGraine * 2.0));
        float tr = dos * epaisseur;

        vec3 col  = t.rgb * 0.075;
        col += t.rgb * uJade * 1.95 * tr;
        col += uViolet * face * 0.10;

        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrouillard, clamp(b, 0.0, 1.0));

        gl_FragColor = vec4(col, vOuverte * clamp(0.24 + tr * 0.60, 0.0, 0.94));
      }
    `
  });

  /* L'empreinte arrive apres coup : la piece doit peindre sa premiere image
     sans l'attendre. Tant qu'elle n'est pas la, les feuilles se decoupent sur
     une image vide et ne se voient pas, ce qui est exactement ce qu'on veut
     pendant les quelques dizaines de millisecondes que dure l'attente. */
  new THREE.TextureLoader().load('assets/feuilles-empreinte.webp', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    /* Pas de repetition : la feuille est un sujet decoupe, pas un motif. Si
       l'echantillonnage deborde, il ramene un bout du bord oppose et on
       obtient une languette de limbe collee au petiole. */
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    matFeuille.uniforms.uEmpreinte.value = tex;
    empreinteVide.dispose();
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

    /* ══ ON EMPORTE L'AXE DE LA TIGE AVEC LA GEOMETRIE ═══════════════════
       Un TubeGeometry ouvert laisse voir l'INTERIEUR du tube a ses deux
       bouts : une ellipse claire, franche, qu'on lit immediatement comme une
       PAILLE coupee. C'etait le defaut le plus voyant de la scene une fois
       les barreaux partis.

       Le boucher ne resout rien : un cylindre a fond plat reste un cylindre.
       Une vraie tige s'effile jusqu'a un point. Pour effiler dans le shader,
       il faut savoir ou est l'axe : on ramene chaque sommet vers son point de
       courbe, et le tube se pince. On stocke donc ce point par sommet, une
       fois pour toutes, au lieu de le recalculer soixante fois par seconde. */
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;
    const centres = new Float32Array(pos.count * 3);
    const pc = new THREE.Vector3();
    for (let v = 0; v < pos.count; v++) {
      courbe.getPointAt(Math.min(1, Math.max(0, uvs.getX(v))), pc);
      centres[v * 3] = pc.x; centres[v * 3 + 1] = pc.y; centres[v * 3 + 2] = pc.z;
    }
    geo.setAttribute('aCentre', new THREE.BufferAttribute(centres, 3));

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
  /* ══ LE PETIOLE EST L'ORIGINE ══════════════════════════════════════════
     Le rectangle etait centre et son grand cote suivait la tige : les
     feuilles etaient donc COUCHEES LE LONG de la liane, ce que Matheo a
     resume par « elles sont collees a la liane, pas terrible ». Une feuille
     ne longe pas sa tige, elle en sort.

     On decale donc la geometrie pour que le coin bas-gauche, la ou l'empreinte
     a son petiole, tombe sur l'origine. L'instance peut alors etre posee
     exactement sur la tige, et le limbe part vers le premier quadrant. La
     proportion suit celle d'une case de l'image, 420 sur 320 : un rectangle carre
     etirerait la feuille sans qu'on sache pourquoi elle a l'air fausse. */
  const LARG_F = 1.31, HAUT_F = 1.0;   /* la proportion d'une case : 420 sur 320 */
  const geoFeuille = new THREE.PlaneGeometry(LARG_F, HAUT_F);
  geoFeuille.translate(LARG_F / 2, HAUT_F / 2, 0);
  const feuilles = new THREE.InstancedMesh(geoFeuille, matFeuille, feuillesPos.length);
  const aLong = new Float32Array(feuillesPos.length);
  const aDec  = new Float32Array(feuillesPos.length);
  const aGrn  = new Float32Array(feuillesPos.length);
  const aCas  = new Float32Array(feuillesPos.length);
  const mat4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const haut = new THREE.Vector3(0, 1, 0);
  const ech  = new THREE.Vector3();

  const axeY = new THREE.Vector3(0, 1, 0);
  const axeX = new THREE.Vector3(1, 0, 0);
  const dehors = new THREE.Vector3();

  feuillesPos.forEach((f, i) => {
    const tan = f.tangente.clone().normalize();
    /* Le repere local : Y suit la tige, donc la feuille monte en meme temps
       qu'elle s'ecarte, comme une vraie. */
    quat.setFromUnitVectors(haut, tan);
    /* L'azimut : de quel cote de la tige cette feuille sort. Tire au sort,
       sinon toutes les feuilles d'une meme liane partent du meme cote et la
       tige a l'air peignee. */
    const azimut = Math.random() * Math.PI * 2;
    quat.multiply(new THREE.Quaternion().setFromAxisAngle(axeY, azimut));
    /* Le port : une feuille jeune se dresse, une feuille agee retombe. Un
       basculement autour de son propre axe long suffit a donner les deux, et
       c'est cette variete qui empeche de voir la regle. */
    quat.multiply(new THREE.Quaternion().setFromAxisAngle(axeX, alea(-0.55, 0.30)));

    ech.setScalar(f.taille);
    /* Le petiole se pose sur la PEAU de la tige, pas sur son axe : attache au
       centre, il disparait dans le tube et la feuille semble en jaillir. */
    dehors.set(1, 0, 0).applyQuaternion(quat).multiplyScalar(0.13);
    mat4.compose(f.p.clone().add(dehors), quat, ech);
    feuilles.setMatrixAt(i, mat4);
    aLong[i] = f.long;
    aDec[i]  = f.decalage;
    aGrn[i]  = Math.random();
    /* La case est tiree independamment de la graine : la graine sert deja au
       miroir et a l'epaisseur, et s'en resservir lierait la silhouette au
       port, ce qui recreerait une regle visible la ou on cherche du desordre. */
    aCas[i]  = Math.random() < 0.5 ? 0 : 1;
  });
  geoFeuille.setAttribute('aLong', new THREE.InstancedBufferAttribute(aLong, 1));
  geoFeuille.setAttribute('aDecalage', new THREE.InstancedBufferAttribute(aDec, 1));
  geoFeuille.setAttribute('aGraine', new THREE.InstancedBufferAttribute(aGrn, 1));
  geoFeuille.setAttribute('aCase', new THREE.InstancedBufferAttribute(aCas, 1));
  feuilles.instanceMatrix.needsUpdate = true;
  feuilles.frustumCulled = false;
  groupe.add(feuilles);

  /* ── Spores en suspension ──────────────────────────────────────────── */
  const NB_SPORES = faible ? 140 : (petit ? 260 : 700);
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

        /* L'ecart des trois canaux croit vers les bords, comme une optique.
           DIVISE PAR TROIS. A 0,028 les bords de l'ecran portaient des franges
           arc-en-ciel franches, visibles sur toute la hauteur : ce n'etait plus
           un defaut d'objectif, c'etait un effet. Un defaut d'optique se
           remarque quand on le cherche, jamais avant. */
        vec2 ecart = c * r2 * 0.009 * uForce;
        vec3 col;
        col.r = texture2D(tDiffuse, vUv - ecart).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv + ecart).b;

        col *= 1.0 - r2 * 0.58;                         // vignette

        /* ══ LE PUITS CENTRAL ═══════════════════════════════════════════════
           La colonne du milieu s'assombrit. C'est la que se posent le nom, la
           phrase et les boutons, et la scene s'y battait avec eux : rubans,
           gousses vives et franges passaient derriere le mot et le rendaient
           illisible. Le sujet d'une page n'est jamais son decor, et quand les
           deux se disputent le meme endroit c'est toujours au decor de ceder.

           Il est LARGE et TRES DOUX : un cercle net se verrait comme une
           tache, alors qu'une bande verticale attenuee se lit comme une
           profondeur de champ. */
        vec2 pu = vec2(c.x * 1.15, c.y * 2.30);
        col *= 1.0 - 0.62 * exp(-dot(pu, pu) * 3.2);

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
       vivante et on montrait du vide.

       LE SOCLE PASSE DE 13 A 32 POUR CENT. Mesure a la sonde : a 13 %, la
       luminosite moyenne du fond de l'accueil etait de 9 sur 255, c'est-a-dire
       indistinguable du noir. Un huitieme de croissance suffisait sur les
       dix-huit lianes d'un grand ecran, pas sur les huit d'un telephone, et
       c'est justement le telephone ou Matheo n'a rien vu. Il reste plus des
       deux tiers de la croissance pour le defilement. */
    const pousse = 0.32 + lisse * 0.68;
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
    /* Poignees de service : elles servent a essayer un reglage EN DIRECT dans
       la page plutot qu'a recharger apres chaque hypothese. Une comparaison
       faite sur une seule image, toutes choses egales par ailleurs, vaut dix
       rechargements ou tout a change en meme temps. */
    _matTige: matTige, _matFeuille: matFeuille, _peindre: () => peindre(),
    /* Appelee par le defilement : 0 en haut de la page, 1 en bas. */
    avancer(p) { progression = Math.min(1, Math.max(0, p)); },
    /* La sonde : elle peint par le chemin normal puis relit le tampon.
       Voir js/sonde.js pour pourquoi elle existe. */
    async sonder(n = 40) {
      const { sonderToile } = await import('./sonde.js');
      visible = true;
      return sonderToile(renderer, toile, () => peindre(), n);
    },
    /* Coupe le rendu des que la scene n'est plus a l'ecran. */
    montrer(v) { visible = !!v; },
    detruire() {
      vivant = false;
      renderer.dispose();
      composer.dispose?.();
    }
  };
}
