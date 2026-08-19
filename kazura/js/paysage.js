/* ══════════════════════════════════════════════════════════════════════════
   LE PAYSAGE
   --------------------------------------------------------------------------
   Un ciel, un horizon, des monts, un sol, un lac. Autrement dit : un LIEU.

   POURQUOI IL EXISTE. Le voyage se jouait dans du noir. Des lianes, un
   portail et un sceau flottaient dans le vide, sans sol sous eux et sans rien
   derriere. Matheo l'a dit exactement : « il n'y a pas de fond, il n'y a pas
   de sol, il ne se passe rien ». Il avait raison, et c'est le defaut le plus
   grave qu'on puisse avoir : on ne croit pas a un espace dont on ne voit
   jamais les limites.

   Le noir n'est pas une profondeur, c'est une absence. Un objet devant du
   noir n'a AUCUNE distance : rien ne dit s'il est a deux metres ou a deux
   kilometres. Ce qui fabrique la profondeur, c'est une suite de plans qui
   palissent en s'eloignant, et il en faut au moins quatre : le sol sous les
   pieds, l'eau au milieu, les monts au loin, le ciel derriere tout.

   LA REFERENCE EST HOKUSAI, PAS UN JEU VIDEO. Une nuit japonaise : presque
   tout est noir, l'horizon garde une lueur jade, une montagne se decoupe au
   fond, un lac la repete a l'envers. C'est la meme famille que le nom de la
   maison et que son blason.

   RIEN N'EST TIRE AU SORT ICI. Le relief vient d'un bruit a graine fixe : le
   paysage est le MEME a chaque visite. Une montagne qui change de forme quand
   on recharge la page n'est pas une montagne, c'est un economiseur d'ecran.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ── Un bruit lisse, deterministe ─────────────────────────────────────────
   Hachage sur la PARTIE FRACTIONNAIRE. Jamais fract(sin(x) * 43758.5) : cette
   formule-la s'effondre en taches des qu'on s'eloigne de l'origine, et un
   paysage s'etend justement sur des centaines d'unites. Deja paye. */
function hacher(x, y) {
  let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  h = h - Math.floor(h);
  const g = (x * 0.7548776662 + y * 0.5698402909) % 1;
  return ((h + Math.abs(g)) % 1 + 1) % 1;
}
const adoucir = t => t * t * (3 - 2 * t);

function ondul(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = adoucir(x - xi), yf = adoucir(y - yi);
  const a = hacher(xi, yi), b = hacher(xi + 1, yi);
  const c = hacher(xi, yi + 1), d = hacher(xi + 1, yi + 1);
  return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
}
/* Plusieurs octaves : les grandes formes d'abord, le detail ensuite. */
function relief(x, y) {
  return ondul(x, y) * 0.55 + ondul(x * 2.1 + 3.7, y * 2.1 - 1.3) * 0.27
       + ondul(x * 4.3 - 7.1, y * 4.3 + 5.9) * 0.13 + ondul(x * 8.7, y * 8.7) * 0.05;
}

/* ══ LES COTES DU MONDE ═══════════════════════════════════════════════════
   Tout le reste en decoule, et ces nombres sont des decisions de mise en
   scene. Le couloir des lianes va de zero a quatre-vingt-dix ; le lac
   commence la ou il finit ; les monts sont assez loin pour qu'on ne les
   atteigne jamais, ce qui est la definition d'un horizon. */
export const NIVEAU_EAU = -5.4;
const LAC_Z = 205, LAC_RAYON = 108;

export function hauteurSol(x, z) {
  /* La cuvette du lac : une gaussienne large, creusee sous le niveau de
     l'eau. Une berge qui descend en pente douce vaut mieux qu'un bord net :
     c'est la ou l'eau devient transparente que le lac a l'air d'un lac. */
  /* ══ UNE RIVE NE SUIT PAS UN CERCLE ══════════════════════════════════
     La cuvette etait une gaussienne parfaite : sa ligne de rive tombait donc
     sur un cercle exact, qui se lisait en perspective comme un TRAIT DROIT
     traversant tout le cadre sur cinq cents unites. Rien dans un paysage
     n'est aussi regulier, et l'oeil le repere avant de savoir ce que c'est.

     On deforme le rayon par un bruit lent, en fonction de l'angle : des
     avancees, des criques, une rive qu'on ne peut pas resumer d'un mot. */
  const angle = Math.atan2(z - LAC_Z, x);
  const froisse = 1 + (relief(Math.cos(angle) * 1.7 + 5.3, Math.sin(angle) * 1.7 - 2.1) - 0.5) * 0.52
                    + (relief(Math.cos(angle) * 5.1 - 1.7, Math.sin(angle) * 5.1 + 6.4) - 0.5) * 0.20;
  const d = Math.hypot(x * 0.62, (z - LAC_Z) * 0.92) / Math.max(0.35, froisse);
  const cuvette = -11.5 * Math.exp(-(d * d) / (2 * LAC_RAYON * LAC_RAYON * 0.34));

  const h = relief(x * 0.0062 + 11.3, z * 0.0062 - 4.7) * 26
          + relief(x * 0.021 - 2.9, z * 0.021 + 8.1) * 5.2;

  /* On aplanit le couloir que la camera traverse. Un relief sous les pieds
     est une bonne chose, une bosse qui masque le portail n'en est pas une. */
  const couloir = Math.exp(-(x * x) / (2 * 30 * 30))
                * Math.exp(-((z - 45) * (z - 45)) / (2 * 85 * 85));
  return (h - 13 + cuvette) * (1 - couloir * 0.80) - 3.4 * couloir;
}

export function monterLePaysage(scene, options = {}) {
  const petit = !!options.petit;
  const NUIT     = new THREE.Color(options.nuit    || '#04060A');
  const HORIZON  = new THREE.Color(options.horizon || '#0F4038');
  const VIOLET   = new THREE.Color('#3B2A63');

  const groupe = new THREE.Group();
  scene.add(groupe);
  const aJeter = [];

  /* ══ LE CIEL ════════════════════════════════════════════════════════════
     Une sphere vue de l'interieur. Le degrade ne se lit pas sur la hauteur de
     l'ecran mais sur la DIRECTION du regard : c'est ce qui fait que le ciel
     reste juste quand la camera se tourne, ce qu'un degrade de fond en CSS ne
     sait pas faire.

     Les etoiles sont dans le meme nuanceur. Les poser en points couterait un
     objet de plus, et surtout elles bougeraient avec la camera comme un
     essaim de mouches : la, elles sont a l'infini, ou est leur place. */
  const ciel = new THREE.Mesh(
    new THREE.SphereGeometry(900, 40, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uNuit: { value: NUIT }, uHorizon: { value: HORIZON }, uViolet: { value: VIOLET },
        uTemps: { value: 0 }
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uNuit, uHorizon, uViolet;
        uniform float uTemps;
        varying vec3 vDir;

        float hach(vec2 p) {
          vec3 q = fract(vec3(p.xyx) * 0.1031);
          q += dot(q, q.yzx + 33.33);
          return fract((q.x + q.y) * q.z);
        }

        void main() {
          float h = vDir.y;

          /* Trois bandes. Le zenith presque noir, une zone violette a
             mi-hauteur, une lueur jade posee sur l'horizon. La lueur ne monte
             pas haut : une aube qui remplit le ciel eteint tout le reste. */
          vec3 col = mix(uNuit * 0.55, uNuit, smoothstep(-0.1, 0.55, h));
          col += uViolet * exp(-abs(h - 0.20) * 7.5) * 0.16;
          col += uHorizon * exp(-abs(h - 0.006) * 30.0) * 0.95;

          /* Sous l'horizon, le ciel s'eteint : c'est la que le sol et l'eau
             prennent le relais, et un ciel qui continue en dessous se voit a
             travers le moindre trou du terrain. */
          col *= smoothstep(-0.34, -0.02, h);

          /* Les etoiles. Un point sur une grille fine, garde seulement si son
             hachage passe le seuil, avec une taille et un eclat propres. Elles
             s'effacent pres de l'horizon, ou la brume les mange. */
          vec2 g = vDir.xz / max(0.14, abs(vDir.y) + 0.10) * 34.0;
          vec2 cellule = floor(g);
          float a = hach(cellule);
          if (a > 0.965) {
            vec2 dans = fract(g) - 0.5 - (vec2(hach(cellule + 7.3), hach(cellule + 3.1)) - 0.5) * 0.6;
            float r = dot(dans, dans);
            float sc = hach(cellule + 19.7);
            /* Un tres leger scintillement, decorrele d'une etoile a l'autre. */
            float vif = 0.55 + 0.45 * sin(uTemps * (0.6 + sc) + sc * 40.0);
            col += vec3(0.80, 0.92, 1.0) * exp(-r * 240.0) * (0.5 + sc) * vif
                 * smoothstep(0.02, 0.30, h);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  ciel.frustumCulled = false;
  ciel.renderOrder = -10;
  groupe.add(ciel);
  aJeter.push(ciel.geometry, ciel.material);

  /* ══ LES MONTS, EN VRAI RELIEF ═══════════════════════════════════════════
     Ils etaient des SILHOUETTES : des plans verticaux dont on avait decoupe le
     haut. De loin ca tient, et c'est ce que font la plupart des decors ; mais
     une silhouette n'a ni flanc, ni ombre portee, ni arete qui prend la
     lumiere, et surtout elle ne tourne pas quand on se deplace. Un mont qui ne
     tourne pas est un decor peint, et l'oeil s'en rend compte des qu'il bouge.

     POURQUOI PAS UN MODELE TELECHARGE. Un mont n'est pas un objet : c'est un
     champ de hauteur. Un maillage genere en pese des dizaines de mega-octets
     pour une forme qu'on decrit ici en quinze lignes, il arrive avec une
     texture peinte qu'on ne peut plus eclairer, et il faut le recharger a
     chaque fois qu'on veut changer sa taille. Le calcul, lui, donne la
     silhouette exacte, les normales exactes, et une neige qui suit vraiment
     l'altitude et la pente.

     C'est le meme raisonnement que pour le blason : ce qui se DECRIT se
     calcule, ce qui se PHOTOGRAPHIE se telecharge. Une feuille se
     photographie, une montagne se decrit.
     ────────────────────────────────────────────────────────────────────────
     La forme : une base de bruit a aretes, plus un massif dominant a flancs
     concaves. La concavite est la signature d'un grand volcan ; un cone a
     flancs droits fait terril. */
  function faireUnMassif(opt) {
    const { z, largeur, profondeur, hauteurMax, teinte, mont, cotes } = opt;
    const NX = petit ? Math.round(cotes * 0.55) : cotes;
    const NZ = Math.max(12, Math.round(NX * 0.35));

    const geo = new THREE.PlaneGeometry(largeur, profondeur, NX, NZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;

    let cime = 0;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const zz = pos.getZ(i);

      /* Le bruit a aretes : on replie la valeur autour de son milieu, ce qui
         transforme des collines molles en cretes. Trois frequences sans
         rapport simple, pour que la somme ne se repete jamais. */
      let h = (1 - Math.abs(relief(x * 0.0031 + 7.1, zz * 0.0031 - 2.3) * 2 - 1)) * 0.56
            + (1 - Math.abs(relief(x * 0.0089 - 9.1, zz * 0.0089 + 2.2) * 2 - 1)) * 0.30
            + (1 - Math.abs(relief(x * 0.0242 + 4.4, zz * 0.0242 - 6.5) * 2 - 1)) * 0.14;
      const massif = 0.30 + 0.70 * relief(x * 0.00088 - 3.3, zz * 0.0016 + 1.9);
      h = Math.pow(Math.max(0, h), 2.0) * hauteurMax * massif;

      if (mont) {
        const dx = (x - mont.x) / mont.large;
        const dz = (zz - (mont.z || 0)) / (mont.large * 0.82);
        const r = Math.sqrt(dx * dx + dz * dz);
        if (r < 1) {
          /* Le profil. L'exposant sous un fait un flanc CONCAVE, qui s'evase
             vers le pied : c'est ce galbe-la qu'on reconnait, pas la pointe. */
          let c = Math.pow(1 - r, 1.34) * mont.haut;
          /* Les aretes qui descendent du sommet. Sans elles le cone est lisse
             comme un chapeau chinois, et rien ne dit son echelle. */
          const ang = Math.atan2(dz, dx);
          c *= 1 + 0.085 * Math.sin(ang * 9) * Math.pow(r, 0.7)
                 + 0.045 * Math.sin(ang * 21 + 1.4) * Math.pow(r, 0.6);
          h = Math.max(h, c);
        }
      }

      /* Les bords fondent vers le bas : sans cela le massif se termine par une
         falaise verticale a chaque extremite du plan. */
      const bordX = Math.min(1, (largeur * 0.5 - Math.abs(x)) / (largeur * 0.10));
      h *= Math.max(0, Math.min(1, bordX));

      pos.setY(i, h - 14);
      /* Mesuree APRES le decalage : sinon les seuils de neige portent sur une
         echelle differente de celle des sommets, de quatorze unites. */
      if (h - 14 > cime) cime = h - 14;
    }
    geo.computeVertexNormals();

    /* ══ LES MONTS ONT LEUR PROPRE BRUME ═══════════════════════════════════
       En les passant du plan decoupe au vrai relief, je les ai soumis au
       brouillard de la scene. Celui-ci est exponentiel et regle pour un
       couloir de cent unites : a cinq cent soixante, il rend cent pour cent
       de sa couleur, et les monts ONT PURENENT ET SIMPLEMENT DISPARU. Il n'y
       avait plus d'horizon du tout, et aucune erreur nulle part.

       Un brouillard n'a pas la meme loi a cent metres et a un kilometre. On
       les sort donc de la brume commune et on leur en donne une, beaucoup plus
       lente, plafonnee : meme tres loin, une crete garde un reste de contraste,
       sinon le paysage n'a plus de fond. */
    const mat = new THREE.ShaderMaterial({
      fog: false,
      uniforms: {
        uTeinte:  { value: new THREE.Color(teinte) },
        uHorizon: { value: HORIZON },
        uBrume:   { value: new THREE.Color('#08161C') },
        uNeige:   { value: mont ? 1 : 0.35 },
        uCime:    { value: cime }
      },
      vertexShader: /* glsl */`
        varying vec3 vN; varying float vY; varying float vLoin;
        void main() {
          vN = normalize(mat3(modelMatrix) * normal);
          vY = position.y;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vLoin = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uTeinte, uHorizon, uBrume;
        uniform float uNeige, uCime;
        varying vec3 vN; varying float vY; varying float vLoin;
        void main() {
          vec3 N = normalize(vN);
          /* La meme lumiere basse et de face que le sol : c'est elle qui
             dessine les cretes et laisse les versants nord dans le noir. */
          vec3 L = normalize(vec3(0.20, 0.16, 1.0));
          float k = clamp(dot(N, L), 0.0, 1.0);

          /* ══ UN SOMMET SE VOIT LA NUIT ═══════════════════════════════════
             Il etait teinte trop sombre : dans un ciel deja sombre, un massif
             sombre ne fait aucun contraste et disparait. Or c'est exactement
             l'element qu'on veut voir de loin.

             En montagne, la nuit, ce qui se voit est ce qui recoit le ciel :
             les cretes et les faces tournees vers le haut. On remonte donc
             franchement l'ambiante et le versant eclaire. */
          vec3 col = uTeinte * (0.85 + k * 1.45);
          col += uHorizon * pow(k, 2.4) * 0.95;

          /* ══ LA NEIGE TIENT A L'ALTITUDE ET A LA PENTE ═══════════════════
             Une ligne de neige posee sur la seule altitude fait un TRAIT
             HORIZONTAL en travers du massif, ce qu'aucune montagne n'a. La
             neige ne tient pas sur une paroi verticale : on la pondere donc
             par la platitude, et la limite devient une dentelle qui suit les
             pentes, ce qui est exactement ce qu'on voit. */
          float altitude = smoothstep(uCime * 0.40, uCime * 0.86, vY);
          float plat = smoothstep(0.30, 0.78, N.y);
          float neige = uNeige * altitude * plat;
          col = mix(col, uHorizon * 2.4 + vec3(0.125, 0.155, 0.175), neige);

          /* La brume de l'eloignement, plafonnee a quatre-vingt-douze pour
             cent : ce qui reste de contraste est ce qui fait qu'on voit
             encore une montagne, et pas un aplat. */
          float d = vLoin * 0.0016;
          float brume = 1.0 - exp(-d * d);
          col = mix(col, uBrume, clamp(brume, 0.0, 0.80));

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const m = new THREE.Mesh(geo, mat);
    m.position.z = z;
    m.frustumCulled = false;
    groupe.add(m);
    aJeter.push(geo, mat);
    return m;
  }

  /* Trois massifs. Le plus lointain porte le sommet : plus haut que tout le
     reste, isole, et c'est ce RAPPORT qui fait qu'on le regarde, pas sa forme. */
  faireUnMassif({ z: 560, largeur: 2100, profondeur: 620, hauteurMax: 78,
                  /* ══ LE COTE DU MAILLAGE EST CELUI DU SUJET ═════════════
                     A cent quatre-vingt-dix subdivisions sur deux mille cent
                     unites, une maille fait onze unites. Le cone en fait trois
                     cent quatre-vingts de rayon : trente-quatre mailles pour
                     tout son flanc, et l'interpolation lineaire entre elles se
                     voit en FACETTES PLATES sur la pente la plus reguliere du
                     paysage, qui est justement celle qu'on regarde.

                     La finesse ne se choisit pas pour le plan, elle se choisit
                     pour l'objet le plus lisse qu'il porte. */
                  teinte: '#16293C', cotes: petit ? 130 : 320,
                  /* ══ IL EST DECALE, PAS CENTRE ═════════════════════════
                     A quarante unites de l'axe et six cents de distance, il
                     tombait a quatre degres du centre : c'est-a-dire
                     exactement derriere le portail, qui le cachait pendant
                     tout le temps ou on le regarde. Une montagne qu'on ne
                     voit qu'entre deux objets n'existe pas.

                     A droite, parce que le texte occupe la gauche : les deux
                     ne se disputent alors jamais le meme endroit du cadre. */
                  mont: { x: 205, z: 40, large: 380, haut: 212 } });
  faireUnMassif({ z: 372, largeur: 1500, profondeur: 380, hauteurMax: 50,
                  teinte: '#101E2E', cotes: petit ? 70 : 140, mont: null });
  faireUnMassif({ z: 268, largeur: 1150, profondeur: 260, hauteurMax: 28,
                  teinte: '#0A1622', cotes: petit ? 56 : 110, mont: null });

  /* ══ LE SOL ═════════════════════════════════════════════════════════════
     Un vrai relief, pas une image : le terrain se deforme sous la camera, les
     bosses se recouvrent, et c'est ce recouvrement qui donne la distance. Un
     sol plat texture ne trompe personne des qu'on avance dessus. */
  const CT = petit ? 120 : 190;
  const geoSol = new THREE.PlaneGeometry(760, 620, CT, CT);
  geoSol.rotateX(-Math.PI / 2);
  {
    const p = geoSol.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i) + 170;
      p.setY(i, hauteurSol(x, z));
      p.setZ(i, z);
    }
    geoSol.computeVertexNormals();
  }
  /* ══ LA MATIERE DU SOL EST UNE PHOTOGRAPHIE ═══════════════════════════
     Le terrain n'avait qu'une couleur et une normale de maillage : de pres,
     une pente lisse et morte, quel que soit le soin mis a son relief. Un
     relief donne la FORME du sol, il ne donne pas sa MATIERE, et c'est la
     matiere qu'on regarde quand on est dessus.

     C'est la lecon d'igloo, chiffree : douze mille quatre cents kilo-octets de
     texture pour cinq cent soixante-dix-huit de geometrie. On pose donc une
     vraie mousse, photographiee, libre de droits, quatre-vingt-quatorze
     kilo-octets pour les deux cartes.

     PROJECTION TRIPLANAIRE, pas des coordonnees de texture. Le terrain est un
     plan deforme : ses coordonnees s'etirent la ou la pente est raide, et la
     mousse ressort tiree en trainees sur tous les flancs. En projetant depuis
     les trois axes du monde et en melangeant selon la normale, la matiere
     garde partout la meme echelle, y compris sur une falaise.

     DEUX ECHELLES SUPERPOSEES, dont l'une n'est pas un multiple de l'autre :
     une seule repetition se voit au bout de trois carreaux, deux periodes sans
     rapport simple donnent un motif dont on ne retrouve jamais la maille. */
  const chargeurSol = new THREE.TextureLoader();
  const texSol = chargeurSol.load('assets/sol-mousse.webp');
  const texSolRelief = chargeurSol.load('assets/sol-mousse-relief.webp');
  for (const t of [texSol, texSolRelief]) {
    /* Repetition EN MIROIR : un raccord parfait n'existe pas sur une
       photographie, le miroir supprime la couture sans retoucher l'image. */
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    t.anisotropy = 8;
  }
  texSol.colorSpace = THREE.SRGBColorSpace;

  const matSol = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uSombre:  { value: new THREE.Color('#050A0B') },
        uMousse:  { value: new THREE.Color('#0B2A22') },
        uHorizon: { value: HORIZON },
        uEau:     { value: NIVEAU_EAU },
        uMatiere: { value: null },
        uRelief:  { value: null }
      }
    ]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vN; varying vec3 vMonde; varying float vH;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        vMonde = (modelMatrix * vec4(position, 1.0)).xyz;
        vH = vMonde.y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      #include <fog_pars_fragment>
      uniform vec3 uSombre, uMousse, uHorizon;
      uniform float uEau;
      uniform sampler2D uMatiere, uRelief;
      varying vec3 vN; varying vec3 vMonde; varying float vH;

      /* Le melange triplanaire : trois echantillons, ponderes par le carre de
         la normale, ce qui donne une transition douce et sans couture. */
      vec3 tri(sampler2D carte, vec3 p, vec3 n, float ech) {
        vec3 m = pow(abs(n), vec3(4.0));
        m /= (m.x + m.y + m.z);
        return texture2D(carte, p.yz * ech).rgb * m.x
             + texture2D(carte, p.xz * ech).rgb * m.y
             + texture2D(carte, p.xy * ech).rgb * m.z;
      }

      void main() {
        vec3 N = normalize(vN);

        vec3 fine  = tri(uMatiere, vMonde, N, 0.115);
        vec3 large = tri(uMatiere, vMonde, N, 0.0163);
        vec3 matiere = fine * 0.62 + large * 0.68;

        /* Le relief de la photographie vient PERTURBER la normale du
           maillage. C'est lui qui fait qu'une pente cesse d'etre un plan
           incline : la lumiere accroche des milliers d'aspérites qu'aucune
           geometrie raisonnable ne pourrait porter. */
        vec3 rel = tri(uRelief, vMonde, N, 0.115) * 2.0 - 1.0;
        N = normalize(N + vec3(rel.x, 0.0, rel.y) * 0.85);

        /* La lumiere vient de l'horizon, tres bas et de face : c'est elle qui
           dessine les cretes et laisse les creux noirs. */
        vec3 L = normalize(vec3(0.18, 0.13, 1.0));
        float k = clamp(dot(N, L), 0.0, 1.0);

        /* La photographie est diurne et verte ; la scene est nocturne. On ne
           retouche pas le fichier, on l'ECLAIRE : sa valeur module nos deux
           couleurs de nuit au lieu de fournir sa propre couleur. */
        float v = dot(matiere, vec3(0.30, 0.59, 0.11));

        /* ══ UN SOL RECOIT LE CIEL AVANT DE RECEVOIR UNE LAMPE ═══════════
           Il n'etait eclaire que par la lumiere de l'horizon, qui est presque
           rasante : sur une surface horizontale, son produit scalaire vaut
           treize centiemes, eleve a la puissance deux, soit un centieme et
           demi. Le terrain etait donc NOIR, et la mousse qu'on venait d'y
           poser parfaitement invisible.

           C'est physiquement exact et scenographiquement faux. Dehors, la
           nuit, ce qui eclaire le sol n'est pas une source ponctuelle : c'est
           toute la voute au-dessus. Une face tournee vers le haut recoit
           l'hemisphere entier, une face verticale la moitie. On ajoute donc ce
           terme-la, et la matiere apparait enfin. */
        float ciel = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uSombre, uMousse, ciel * ciel * 0.92) * (0.40 + v * 1.30);
        col += uHorizon * pow(k, 3.0) * 0.75 * (0.35 + v);
        /* Une frange plus claire juste au bord de l'eau, comme un sable
           mouille : c'est ce qui fait qu'on lit une RIVE et non une decoupe. */
        col += uHorizon * 0.5 * smoothstep(2.6, 0.0, abs(vH - uEau));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `
  });
  matSol.uniforms.uMatiere.value = texSol;
  matSol.uniforms.uRelief.value = texSolRelief;

  const sol = new THREE.Mesh(geoSol, matSol);
  sol.frustumCulled = false;
  groupe.add(sol);
  aJeter.push(geoSol, matSol, texSol, texSolRelief);

  /* ══ LE LAC ═════════════════════════════════════════════════════════════
     Pas de vraie reflexion : elle couterait un second rendu de toute la scene
     a chaque image, pour un plan d'eau qu'on voit de loin et de biais.

     On refait donc ce que l'eau FAIT, sans le simuler. Une surface d'eau vue
     de loin, c'est trois choses : elle renvoie le ciel d'autant plus qu'on la
     regarde rasante, elle porte un chemin de lumiere qui va droit vers la
     source, et elle ride. Les trois tiennent en un nuanceur, et l'oeil ne
     demande rien de plus a un lac de nuit. */
  const matLac = new THREE.ShaderMaterial({
    transparent: true, fog: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTemps: { value: 0 },
        uHorizon: { value: HORIZON },
        uProfond: { value: new THREE.Color('#040A10') },
        uViolet: { value: VIOLET }
      }
    ]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vMonde;
      void main() {
        vMonde = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      #include <fog_pars_fragment>
      uniform float uTemps;
      uniform vec3 uHorizon, uProfond, uViolet;
      varying vec3 vMonde;

      float vague(vec2 p) {
        return sin(p.x * 0.13 + uTemps * 0.30)
             + sin(p.y * 0.21 - uTemps * 0.23) * 0.8
             + sin((p.x + p.y) * 0.07 + uTemps * 0.11) * 1.2;
      }

      void main() {
        vec3 versOeil = normalize(cameraPosition - vMonde);
        /* Fresnel : de haut on voit le fond, de biais on voit le ciel. C'est
           la seule chose qui distingue vraiment de l'eau d'un miroir pose. */
        float rasant = pow(1.0 - clamp(versOeil.y, 0.0, 1.0), 3.4);

        float r = vague(vMonde.xz) + vague(vMonde.xz * 2.7 + 13.0) * 0.4;

        /* ══ L'EAU RENVOIE MOINS QU'ON NE CROIT ═════════════════════════
           A 1,15 fois la couleur de l'horizon, le lac vu de biais ressortait
           PLUS CLAIR QUE LE CIEL qu'il est cense refleter, et il tirait une
           barre lumineuse en travers de toutes les images. Une surface qui
           renvoie ne peut pas renvoyer plus qu'elle ne recoit. */
        vec3 col = mix(uProfond, uHorizon * 0.34, rasant);
        col += uViolet * rasant * 0.14;

        /* Le chemin de lumiere. Il va vers la source, il s'elargit avec la
           distance, et il est HACHE par les rides : une trainee continue fait
           projecteur de piscine, une trainee brisee fait de l'eau. */
        float axe = exp(-vMonde.x * vMonde.x / 620.0);
        float eclats = pow(max(0.0, 0.5 + 0.5 * sin(r * 3.1)), 11.0);
        /* Le chemin s'eteint tout pres du bord loin : sinon il file jusqu'a
           l'horizon et redevient une barre. */
        float fond = smoothstep(300.0, 150.0, vMonde.z);
        col += uHorizon * axe * eclats * 0.80 * rasant * fond;
        col += vec3(0.85, 1.0, 0.95) * axe * pow(eclats, 2.4) * 0.16 * rasant * fond;

        gl_FragColor = vec4(col, clamp(0.55 + rasant * 0.40, 0.0, 1.0));
        #include <fog_fragment>
      }
    `
  });
  const lac = new THREE.Mesh(new THREE.PlaneGeometry(700, 560, 1, 1), matLac);
  lac.rotation.x = -Math.PI / 2;
  lac.position.set(0, NIVEAU_EAU, LAC_Z);
  lac.frustumCulled = false;
  groupe.add(lac);
  aJeter.push(lac.geometry, matLac);

  return {
    avancer(t) {
      ciel.material.uniforms.uTemps.value = t;
      matLac.uniforms.uTemps.value = t;
    },
    /* Le ciel suit la camera : une sphere de neuf cents unites finit par etre
       depassee si on la laisse plantee a l'origine, et on voit alors sa
       couture par derriere. */
    suivre(camera) { ciel.position.copy(camera.position); },
    _ciel: ciel, _sol: sol, _lac: lac,
    detruire() {
      scene.remove(groupe);
      aJeter.forEach(o => o.dispose?.());
    }
  };
}
