/* ══════════════════════════════════════════════════════════════════════════
   VITRINE · DOMAINE VENT D'EST
   --------------------------------------------------------------------------
   Une vitrine n'est pas une demonstration de technique, c'est un SITE ENTIER.
   Le visiteur ne doit pas se dire « joli effet », il doit se dire « je veux
   ca ». Donc cette page n'a rien de Kazura : sa typographie, ses couleurs, son
   rythme sont ceux d'un domaine alsacien, et Kazura n'y apparait que dans un
   bandeau discret.

   LE PRINCIPE, celui des sites qui gagnent des prix. La page n'est pas une
   pile de sections avec des animations dedans. C'est UN SEUL MONDE en trois
   dimensions, pose une fois pour toutes derriere le texte, et le defilement
   n'y fait qu'une chose : avancer l'heure et deplacer la camera. Rien ne se
   monte ni ne se demonte en route. C'est ce qui donne la continuite qu'un
   empilement de sections ne donne jamais.

   CE QUI EST CALCULE, ET DONC CE QUI NE PESE RIEN. Le ciel, le soleil, les
   collines, les rangs de vigne, la bouteille, le vin, l'etiquette : tout est
   produit par le code. Cette page n'embarque pas une seule photographie, pas
   un seul modele telecharge. Le monde entier tient dans le poids d'une image.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';

/* ══ L'ECHELLE ═══════════════════════════════════════════════════════════
   Une unite vaut dix centimetres. La bouteille fait donc 3,4 unites, soit
   34 cm, la taille reelle d'une flute d'Alsace, et la vallee derriere fait
   plusieurs centaines d'unites. C'est ce rapport, et lui seul, qui donne la
   sensation d'un objet pose dans un vrai paysage plutot que dans une boite. */
const HAUTEUR_BOUTEILLE = 3.4;

/* ══ LA COURSE DU SOLEIL ═════════════════════════════════════════════════
   Une seule valeur, l'heure, entre 0 (nuit) et 1 (nuit d'apres). Tout en
   depend : la position du soleil, la couleur du ciel, celle de la terre,
   la force des rayons. Le defilement ne pilote que cette valeur. */
const CIEL = [
  { h: 0.00, zenith: '#050A18', horizon: '#0C142A', soleil: '#2A3358', rais: 0.00 },
  { h: 0.09, zenith: '#0E1D45', horizon: '#2E3A6B', soleil: '#6E7BB0', rais: 0.22 },
  { h: 0.14, zenith: '#1C3468', horizon: '#D08048', soleil: '#FFB765', rais: 1.00 },
  { h: 0.22, zenith: '#2A5490', horizon: '#E8B98A', soleil: '#FFDCA8', rais: 0.62 },
  { h: 0.40, zenith: '#3E7EBE', horizon: '#C6D8E6', soleil: '#FFF0D4', rais: 0.30 },
  { h: 0.60, zenith: '#4A8FD2', horizon: '#DCE8F0', soleil: '#FFF9EC', rais: 0.20 },
  { h: 0.80, zenith: '#3467A6', horizon: '#E7BC80', soleil: '#FFE2B0', rais: 0.55 },
  { h: 0.88, zenith: '#1B2E5C', horizon: '#C85C2E', soleil: '#FF9040', rais: 1.00 },
  { h: 0.94, zenith: '#101B3E', horizon: '#5A3050', soleil: '#8A4A62', rais: 0.42 },
  { h: 1.00, zenith: '#050A18', horizon: '#0C142A', soleil: '#2A3358', rais: 0.05 }
];

/* ══ LES ACTES ═══════════════════════════════════════════════════════════
   Sept reperes le long du defilement. Entre deux reperes tout s'interpole en
   douceur : la camera, l'ouverture de l'objectif, l'heure, le niveau du vin,
   l'orientation de la bouteille. L'etiquette regarde la camera pile a l'acte
   cinq, ou le texte parle du millesime. */

/* ON N'OUVRE PAS DANS LE NOIR. La premiere version commencait a la nuit
   pleine : c'etait juste sur le papier, et illisible a l'ecran. Un site qui
   s'ouvre sur un rectangle noir a perdu son visiteur avant la premiere ligne.
   Le premier acte se joue donc a l'heure bleue, quand le ciel a deja une
   couleur et que la bouteille se decoupe dessus. La nuit, on la garde pour la
   fin, ou le visiteur a une raison de rester.

   LA CAMERA REGARDE L'HORIZON, presque toujours. Un objectif pose a quarante
   centimetres du sol voit l'horizon a quarante centimetres : viser plus bas
   remplit l'ecran de terre, et c'est ce qui s'est passe a la premiere version,
   ou il ne restait pas un pixel de ciel. La regle : la hauteur visee suit la
   hauteur de la camera, a un ou deux degres pres.

   ELLE PASSE DE GAUCHE A DROITE, avec le soleil. A l'aube elle est du cote
   ou le jour se leve, au couchant de l'autre, si bien qu'aux deux heures
   rasantes le soleil se trouve DERRIERE la bouteille et que le verre
   s'allume par l'interieur. C'est la seule position qui vaille le detour.

   LA CLE place DIT OU LA BOUTEILLE SE TIENT DANS LE CADRE, de moins un a
   gauche a plus un a droite. Ce n'est pas un decalage en unites du monde : le
   code le convertit a chaque image d'apres la largeur reellement visible, qui
   depend de la distance, de l'objectif ET des proportions de la fenetre. Un
   decalage fixe qui compose bien sur un ecran de 3440 pixels jette l'objet
   hors du cadre sur un telephone. Ici, la meme valeur compose des deux cotes.

   La bouteille passe d'un bord a l'autre a chaque acte, et le texte se tient
   toujours en face. Un objet centre et un titre centre ne cohabitent jamais,
   c'est la lecon du bonsai, et elle vaut ici a chaque ecran. */
const ACTES = [
  { p: 0.00, cam: [ 0.00, 1.85,  7.2], vise: [ 0.0, 1.78, 0], fov: 33, heure: 0.090, vin: 0.00, tour: -1.05, place:  0.55, face: 0.00 },
  { p: 0.15, cam: [-3.20, 2.30,  8.0], vise: [-0.3, 2.16, 0], fov: 38, heure: 0.140, vin: 0.00, tour: -0.80, place: -0.50, face: 0.00 },
  { p: 0.33, cam: [-6.40, 3.10, 10.8], vise: [-0.6, 2.94, 0], fov: 46, heure: 0.330, vin: 0.10, tour: -0.52, place:  0.46, face: 0.00 },
  { p: 0.52, cam: [-2.20, 1.85,  7.4], vise: [ 0.0, 1.76, 0], fov: 32, heure: 0.520, vin: 0.92, tour: -0.26, place: -0.50, face: 0.45 },
  { p: 0.70, cam: [ 0.15, 0.82,  2.9], vise: [ 0.0, 0.74, 0], fov: 30, heure: 0.665, vin: 0.92, tour:  0.00, place:  0.44, face: 1.00 },
  { p: 0.87, cam: [ 4.40, 2.35,  8.2], vise: [ 0.3, 2.24, 0], fov: 41, heure: 0.845, vin: 0.92, tour:  0.34, place: -0.46, face: 0.35 },
  { p: 1.00, cam: [ 8.60, 3.20, 12.6], vise: [ 0.6, 3.04, 0], fov: 47, heure: 0.955, vin: 0.92, tour:  0.72, place: -0.52, face: 0.00 }
];

/* ── Petits outils ─────────────────────────────────────────────────────── */
const serre  = (v, a, b) => Math.max(a, Math.min(b, v));
const adouci = t => t * t * (3 - 2 * t);
const entre  = (a, b, t) => a + (b - a) * t;

/* Interpole une liste de reperes sur une cle donnee. Sert pour les actes
   comme pour le ciel : c'est la meme operation. */
function interpoler(liste, cle, valeur, melanger) {
  if (valeur <= liste[0][cle]) return melanger(liste[0], liste[0], 0);
  const dernier = liste[liste.length - 1];
  if (valeur >= dernier[cle]) return melanger(dernier, dernier, 0);
  for (let i = 0; i < liste.length - 1; i++) {
    const a = liste[i], b = liste[i + 1];
    if (valeur >= a[cle] && valeur <= b[cle]) {
      const t = adouci((valeur - a[cle]) / (b[cle] - a[cle] || 1));
      return melanger(a, b, t);
    }
  }
  return melanger(dernier, dernier, 0);
}

/* ══ LE CIEL ═════════════════════════════════════════════════════════════
   Une sphere retournee, peinte par un fragment. Deux couleurs, un disque
   solaire tres serre et un halo large. Le disque part a six fois la valeur
   maximale de l'ecran : c'est ce depassement, et rien d'autre, qui donne au
   flou lumineux de quoi mordre. Un soleil peint a la valeur du blanc ne
   brille pas, il est juste blanc. */
const SOMMET_CIEL = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const FRAGMENT_CIEL = /* glsl */`
  precision highp float;
  varying vec3 vDir;
  uniform vec3  uZenith;
  uniform vec3  uHorizon;
  uniform vec3  uSoleil;
  uniform vec3  uDirSoleil;
  uniform float uEtoiles;
  uniform float uNuages;
  uniform float uTemps;

  float hache(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  float hache2(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float bruit(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hache2(i), hache2(i + vec2(1.0, 0.0)), u.x),
               mix(hache2(i + vec2(0.0, 1.0)), hache2(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float a = 0.0, amp = 0.5;
    for (int i = 0; i < 5; i++) { a += bruit(p) * amp; p *= 2.07; amp *= 0.5; }
    return a;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;

    vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.52));
    col = mix(uHorizon * 0.42, col, smoothstep(-0.14, 0.03, h));

    /* Les etoiles ne se voient qu'en haut et qu'a la nuit. Une grille grossiere,
       un seuil tres haut : seule une cellule sur quelques centaines s'allume. */
    if (uEtoiles > 0.001) {
      vec3 g = floor(d * 260.0);
      float e = hache(g);
      float pic = smoothstep(0.9965, 1.0, e);
      float scint = 0.65 + 0.35 * sin(hache(g + 7.0) * 90.0);
      col += vec3(0.85, 0.9, 1.0) * pic * scint * uEtoiles * smoothstep(-0.02, 0.35, h);
    }

    /* LE DISQUE FAIT LA TAILLE DU SOLEIL, pas celle qu'on aimerait. A la
       puissance 1400 il faisait pres de quatre degres, sept fois le vrai, et
       avec le flou lumineux par-dessus il occupait le tiers de l'ecran :
       l'image ne racontait plus un domaine au couchant, elle racontait un
       effet de soleil. A 6000 il fait un peu moins de deux degres, encore
       genereux, mais on retrouve le paysage autour. */
    float s = max(dot(d, uDirSoleil), 0.0);
    col += uSoleil * pow(s, 6000.0) * 5.0;
    col += uSoleil * pow(s, 90.0) * 0.34;
    col += uSoleil * pow(s, 5.0) * 0.09;

    /* ══ LES NUAGES ══════════════════════════════════════════════════════
       Un ciel uni est un ciel de logiciel. C'est ce qui trahit une image
       calculee avant meme la geometrie : dehors, il y a toujours quelque
       chose en haut.

       PAS DE VOLUME, UNE PROJECTION. On divise la direction du regard par sa
       composante verticale, ce qui revient a chercher ou ce rayon perce une
       couche plate posee tres haut. Les nuages se resserrent alors d'eux-
       memes vers l'horizon, exactement comme le font les vrais, et ca ne
       coute qu'une division.

       Ils sont eclaires par le soleil, donc ils virent a l'orange en meme
       temps que lui, et leur dessous reste sombre. C'est ce contraste-la qui
       fait les ciels de fin de journee. */
    if (uNuages > 0.001 && h > 0.005) {
      vec2 q = d.xz / max(h, 0.055);
      float n = fbm(q * 0.115 + vec2(uTemps * 0.0045, uTemps * 0.0016));
      float epais = smoothstep(0.46, 0.76, n);
      /* L'effacement pres de l'horizon doit rester TRES court. Il etait pose
         jusqu'a 0,20, or dans presque tous les cadrages de cette page on ne
         voit du ciel qu'entre 0 et 0,20 : les nuages existaient, calcules a
         chaque image, et se trouvaient effaces exactement dans la seule bande
         visible. Ils vont donc maintenant jusqu'en bas, comme les vrais. */
      epais *= smoothstep(0.004, 0.045, h);

      float face = max(dot(d, uDirSoleil), 0.0);
      vec3 clair = mix(vec3(1.0), uSoleil, 0.55) * (0.72 + 1.05 * pow(face, 2.2));
      vec3 sombre = mix(uHorizon, uZenith, 0.35) * 0.62;
      vec3 cNuage = mix(sombre, clair, smoothstep(0.42, 0.86, n));

      col = mix(col, cNuage, epais * uNuages);
    }

    gl_FragColor = vec4(col, 1.0);
  }`;

/* ══ LA TERRE ════════════════════════════════════════════════════════════
   Un plan deplace par du bruit, et des rangs de vigne peints dessus.

   POURQUOI LES RANGS SONT PEINTS ET NON MODELISES. Un coteau alsacien porte
   plusieurs milliers de pieds. Les poser en geometrie couterait des millions
   de triangles pour un resultat qui, a cette distance, tient en une rayure
   sombre suivant la pente. Une rayure calculee dans le fragment coute zero,
   et suit le relief exactement.

   LE PLAT AU CENTRE. Le relief est annule dans un rayon de trente unites
   autour de l'origine, sinon la bouteille se retrouve enterree ou en l'air
   selon le bruit. On lit ce plat comme la tournière, la bande de terre nue
   qu'on laisse au bout des rangs pour faire demi-tour avec le tracteur. */
const SOMMET_TERRE = /* glsl */`
  precision highp float;
  varying vec3  vMonde;
  varying vec3  vNormale;
  varying float vHaut;

  /* Le hachage classique, fract(sin(...) * 43758.5), s'effondre loin de
     l'origine : le sinus d'un tres grand nombre n'a plus de chiffres
     significatifs, et le bruit degenere en larges taches douces. C'est ce
     qu'on voyait au premier plan, des flaques pales de cinquante unites.
     Celui-ci travaille sur des parties fractionnaires, donc il tient a
     n'importe quelle distance. */
  float hache(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float bruit(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hache(i), hache(i + vec2(1.0, 0.0)), u.x),
               mix(hache(i + vec2(0.0, 1.0)), hache(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  /* L'ECHELLE EST LE SUJET, pas le bruit. Premiere version : des bosses de
     190 unites, soit dix-neuf metres, qui commencaient a quinze metres de la
     camera. Vu d'un objectif pose a quarante centimetres du sol, ca ne fait
     pas une colline, ca fait un mur, et il ne restait pas un pixel de ciel.
     Les bosses sont donc basses et proches, le versant est haut et LOIN.
     C'est la distance qui fait le paysage, pas l'amplitude.

     Le repere local : le plan est couche par une rotation d'un quart de tour,
     donc son y local part vers le fond de la scene. Un versant qui monte en
     s'eloignant se lit donc sur y, et sur y positif seulement. */
  float relief(vec2 p) {
    vec2 w = p * 420.0;
    /* L'octave de base tourne a 0,55, soit une longueur d'onde de 76 metres.
       Elle etait a 1,7, donc 25 metres, pour cinq metres de haut : ce ne sont
       pas des collines, ce sont des dunes, et a deux cents metres elles
       bouchaient onze degres de ciel. C'est ce qui avalait le soleil couchant,
       et non le coteau qu'on accusait. Somme normalisee au passage : cinq
       octaves d'un bruit entre zero et un totalisent 1,94 et non 1, donc le
       relief penchait vers le haut d'un tiers de son amplitude. */
    float a = 0.0, amp = 1.0, f = 1.0, total = 0.0;
    for (int i = 0; i < 5; i++) { a += bruit(p * 0.55 * f) * amp; total += amp; amp *= 0.5; f *= 2.03; }
    a /= total;

    float d = length(w);
    /* Le plat s'etend jusqu'a soixante unites et le relief ne s'installe
       qu'a cinq cents : ce qui est pres de la camera doit rester bas, sinon
       la moindre bosse devient une montagne. */
    float garde = smoothstep(60.0, 520.0, d);
    float bosses = (a - 0.5) * 70.0;
    /* La plaine du Rhin est PLATE. Du cote ou le soleil se couche, les bosses
       s'aplatissent comme le coteau : c'est ce qui degage la ligne d'horizon
       basse sans laquelle un soleil rasant n'est jamais visible. */
    bosses *= 0.22 + 0.78 * smoothstep(-520.0, 180.0, w.x);

    /* LE VERSANT EST D'UN SEUL COTE, et c'est ce qui sauve le couchant. Un
       coteau qui ferme tout l'horizon avale le soleil bien avant qu'il ne se
       couche : a l'acte du soir, il passait derriere la crete a onze degres
       et les rais n'avaient plus rien a percer. Le relief monte donc vers
       l'est et s'efface vers l'ouest, ce qui est exactement la forme du
       vignoble alsacien : la montagne d'un cote, la plaine du Rhin de
       l'autre. La justesse geographique et le besoin de l'image tombent
       ici sur la meme reponse, ce qui arrive plus souvent qu'on ne croit. */
    float coteau = smoothstep(70.0, 1500.0, w.y) * 300.0;
    coteau *= smoothstep(-420.0, 260.0, w.x);
    return (bosses + coteau) * garde;
  }

  void main() {
    vec3 pos = position;
    vec2 q = vec2(pos.x, pos.y) / 420.0;
    float y = relief(q);
    pos.z += y;

    /* Normale analytique : on echantillonne le relief a droite et devant,
       et on prend le produit vectoriel des deux tangentes. Bien plus net
       qu'une normale moyennee sur des sommets aussi espaces. */
    float e = 3.0;
    float yx = relief(q + vec2(e / 420.0, 0.0));
    float yz = relief(q + vec2(0.0, e / 420.0));
    vec3 tx = normalize(vec3(e, 0.0, yx - y));
    vec3 tz = normalize(vec3(0.0, e, yz - y));
    vNormale = normalize(cross(tx, tz));

    vec4 m = modelMatrix * vec4(pos, 1.0);
    vMonde = m.xyz;
    vHaut  = y;
    gl_Position = projectionMatrix * viewMatrix * m;
  }`;

const FRAGMENT_TERRE = /* glsl */`
  precision highp float;
  varying vec3  vMonde;
  varying vec3  vNormale;
  varying float vHaut;

  uniform vec3  uDirSoleil;
  uniform vec3  uSoleil;
  uniform vec3  uHorizon;
  uniform vec3  uCamera;
  uniform float uNuit;

  /* Le hachage classique, fract(sin(...) * 43758.5), s'effondre loin de
     l'origine : le sinus d'un tres grand nombre n'a plus de chiffres
     significatifs, et le bruit degenere en larges taches douces. C'est ce
     qu'on voyait au premier plan, des flaques pales de cinquante unites.
     Celui-ci travaille sur des parties fractionnaires, donc il tient a
     n'importe quelle distance. */
  float hache(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float bruit(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hache(i), hache(i + vec2(1.0, 0.0)), u.x),
               mix(hache(i + vec2(0.0, 1.0)), hache(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    /* La normale du terrain est calculee dans le repere du plan, avant sa
       rotation. On la remet debout ici : le plan est couche par une rotation
       de moins un quart de tour autour de X, donc y prend z et z prend moins y. */
    vec3 n = normalize(vec3(vNormale.x, vNormale.z, -vNormale.y));

    float dist = length(vMonde.xz - uCamera.xz);

    /* Les rangs. Une periode de dix-huit unites, soit un metre quatre-vingt,
       l'ecartement reel d'un vignoble alsacien, et une bande etroite : le
       feuillage d'un rang fait quarante centimetres sur ces un metre quatre-
       vingt, donc a peine un quart. La premiere version en couvrait le tiers
       avec des bords flous, ce qui donnait des rayures de zebre.

       L'EFFACEMENT SE LIT SUR LA DERIVEE, pas sur la distance. fwidth donne
       de combien de periodes on avance en un pixel : au-dela d'une, la rayure
       n'est plus une rayure, c'est du moire. On la retire exactement la, ce
       qu'un seuil de distance ne sait pas faire puisqu'il ignore l'angle. */
    /* Les rangs sont DROITS. Un leger biais avait ete pose pour les faire
       suivre le relief : a l'ecran ca ne suit rien du tout, ca tourbillonne.
       En Alsace les rangs montent le versant tout droit, et c'est cette
       regularite qui donne le velours qu'on reconnait de loin. */
    float u = vMonde.x / 18.0;
    float r = fract(u);
    float rang = smoothstep(0.40, 0.47, r) * smoothstep(0.60, 0.53, r);
    rang *= smoothstep(0.30, 0.07, fwidth(u));
    /* Aucun rang sur la tournière, la bande nue du premier plan. */
    rang *= smoothstep(15.0, 30.0, length(vMonde.xz));
    /* Les ceps ne sont pas continus : un pied tous les metres. */
    float pieds = smoothstep(0.32, 0.60, bruit(vec2(vMonde.x * 0.10, vMonde.z * 0.11)));
    rang *= mix(0.45, 1.0, pieds);

    /* Des marnes calcaires, pas de la terre de jardin : un beige gris, des
       cailloux plus clairs, et un feuillage sombre. La premiere version
       tirait sur l'ocre orange, ce qui donnait de la Provence. */
    vec3 terre   = vec3(0.238, 0.214, 0.180);
    vec3 caillou = vec3(0.395, 0.378, 0.344);
    vec3 feuille = vec3(0.132, 0.176, 0.086);

    float grain = bruit(vMonde.xz * 0.55) * 0.55 + bruit(vMonde.xz * 2.6) * 0.45;
    float galets = smoothstep(0.66, 0.86, bruit(vMonde.xz * 7.3)) * smoothstep(120.0, 20.0, dist);
    vec3 col = mix(terre, caillou, grain * 0.5 + galets * 0.5);
    col = mix(col, feuille, rang * 0.94);

    /* Eclairage. Le terme diffus classique, plus un rebond du ciel par le haut
       qui empeche les versants a l'ombre de tomber dans le noir absolu. */
    /* Eclairage. Le terme diffus, plus un rebond du ciel par le haut.

       LE REBOND GROSSIT QUAND LE SOLEIL BAISSE. C'est contre-intuitif et
       pourtant c'est ce qui se passe : au zenith, presque toute la lumiere
       vient d'une seule direction et le rebond ne compte pas ; au couchant,
       le soleil n'eclaire plus rien de face et c'est la voute entiere,
       devenue orange, qui fait le travail. Sans ce terme, la terre tombait
       au noir des que le soleil rasait, et on perdait tout le premier plan
       au moment precis ou l'image devenait belle. */
    float diffus = max(dot(n, uDirSoleil), 0.0);
    float ciel   = 0.5 + 0.5 * n.y;
    float bas    = 1.0 - smoothstep(0.02, 0.42, uDirSoleil.y);
    col *= uSoleil * (diffus * 1.35 + 0.06)
         + uHorizon * ciel * (0.26 + 0.34 * bas);
    col *= mix(1.0, 0.34, uNuit);

    /* Brume. Sa densite augmente en profondeur ET vers le bas : c'est ce
       second terme qui met de la vapeur dans le creux de la vallee.

       ELLE NE VA PAS JUSQU'AU CIEL. Melangee franchement vers la couleur de
       l'horizon, qui en plein jour est un bleu tres pale, la crete du fond
       ressortait blanche et se lisait comme de la neige au mois d'aout. Une
       brume reelle ne blanchit jamais completement un relief : elle en garde
       toujours un souvenir sombre. On plafonne donc, et on tire la couleur
       de brume un peu vers le sol plutot que vers le ciel pur. */
    vec3 brume = mix(uHorizon, uHorizon * 0.62 + vec3(0.055, 0.050, 0.044), 0.5);
    float creux = smoothstep(40.0, -80.0, vHaut);
    float voile = 1.0 - exp(-pow(dist / 760.0, 1.55) * 2.2);
    voile = clamp(voile + creux * 0.26 * smoothstep(90.0, 420.0, dist), 0.0, 0.88);
    col = mix(col, brume, voile);

    gl_FragColor = vec4(col, 1.0);
  }`;

/* ══ LES RAIS DU SOLEIL ══════════════════════════════════════════════════
   Le passage qui fait la difference a l'aube et au couchant.

   Le principe est le plus vieux du metier et reste imbattable : pour chaque
   point de l'ecran, on marche en ligne droite VERS le soleil en accumulant ce
   qu'on croise de plus lumineux, avec une perte a chaque pas. Tout ce qui est
   brillant se met a couler vers le soleil, et tout ce qui l'occulte, la
   bouteille au premier chef, decoupe le faisceau. On obtient les rayons
   crepusculaires, sans une seule lumiere de plus dans la scene. */
const RAIS = {
  uniforms: {
    tDiffuse:  { value: null },
    uSoleil:   { value: new THREE.Vector2(0.5, 0.5) },
    uForce:    { value: 0.0 },
    uDensite:  { value: 0.80 },
    uPerte:    { value: 0.955 },
    /* Le seuil dit ce qui a le droit de couler vers le soleil. A 0,58 c'est
       le ciel entier, et l'ecran se remplit d'orange ; a 0,88 ce sont le
       disque et les cretes qu'il allume, donc de vrais rayons. */
    uSeuil:    { value: 0.88 },
    uTeinte:   { value: new THREE.Color(1, 1, 1) }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec2  uSoleil;
    uniform float uForce, uDensite, uPerte, uSeuil;
    uniform vec3  uTeinte;

    /* Vingt pas, pas vingt-huit. Chaque pas est une lecture de texture pour
       CHAQUE pixel de l'ecran : a 2560 sur 950, vingt-huit pas font
       soixante-huit millions de lectures par image, mesurees a onze
       millisecondes. Vingt suffisent, le bruit par pixel cachant le reste. */
    const int PAS = 20;

    void main() {
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      if (uForce < 0.002) { gl_FragColor = vec4(base, 1.0); return; }

      vec2 pas = (vUv - uSoleil) * (uDensite / float(PAS));
      vec2 uv = vUv;
      float poids = 1.0;
      vec3 somme = vec3(0.0);

      /* Un decalage par pixel casse les anneaux concentriques que produit un
         echantillonnage regulier. Sans lui, les rayons se voient par bandes. */
      float bruit = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
      uv -= pas * bruit;

      for (int i = 0; i < PAS; i++) {
        uv -= pas;
        vec3 e = texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).rgb;
        somme += max(e - uSeuil, 0.0) * poids;
        poids *= uPerte;
      }

      gl_FragColor = vec4(base + somme * uTeinte * (uForce / float(PAS)) * 2.1, 1.0);
    }`
};

/* ══ L'ETIQUETTE ═════════════════════════════════════════════════════════
   Dessinee dans un canevas, pas chargee. Le domaine change de millesime tous
   les ans : une etiquette qui se dessine se met a jour en changeant une
   chaine, une etiquette photographiee demande un studio. */
function dessinerLEtiquette(nom, cuvee, annee) {
  const L = 1400, H = 900;
  const c = document.createElement('canvas');
  c.width = L; c.height = H;
  const g = c.getContext('2d');

  /* Le papier. Un ivoire tres legerement chaud, sali par du grain : une
     etiquette parfaitement unie a l'air imprimee, pas encollee. */
  g.fillStyle = '#EFE6D3';
  g.fillRect(0, 0, L, H);
  const img = g.getImageData(0, 0, L, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);

  const or = '#8A6A22';
  g.strokeStyle = or;
  g.lineWidth = 3;
  g.strokeRect(46, 46, L - 92, H - 92);
  g.lineWidth = 1;
  g.strokeRect(62, 62, L - 124, H - 124);

  g.textAlign = 'center';
  g.fillStyle = '#2A2418';

  /* La mention d'appellation, en tout petit et tres espace. C'est ce detail
     de reglementation qui fait qu'une etiquette a l'air vraie. */
  g.font = '500 30px Jost, sans-serif';
  g.letterSpacing = '14px';
  g.fillText('ALSACE GRAND CRU', L / 2, 168);

  g.font = '400 132px "Bodoni Moda", serif';
  g.letterSpacing = '2px';
  g.fillText(nom.toUpperCase(), L / 2, 330);

  g.strokeStyle = or;
  g.beginPath(); g.moveTo(L / 2 - 190, 386); g.lineTo(L / 2 + 190, 386); g.stroke();

  g.fillStyle = or;
  g.font = 'italic 400 96px "Bodoni Moda", serif';
  g.letterSpacing = '0px';
  g.fillText(cuvee, L / 2, 500);

  g.fillStyle = '#2A2418';
  g.font = '500 44px Jost, sans-serif';
  g.letterSpacing = '10px';
  g.fillText('RIESLING', L / 2, 592);

  g.font = '300 78px "Bodoni Moda", serif';
  g.letterSpacing = '6px';
  g.fillText(String(annee), L / 2, 700);

  g.font = '400 26px Jost, sans-serif';
  g.letterSpacing = '6px';
  g.fillStyle = '#5A5040';
  g.fillText('MIS EN BOUTEILLE AU DOMAINE', L / 2, 790);
  /* Un domaine INVENTE ne porte pas une adresse reelle. L'etiquette citait le
     village de Matheo, et la page donnait meme un numero dans une vraie rue :
     une demonstration qui se fait passer pour une maison qui existe est un
     probleme, pas un detail de redaction. */
  g.fillText('VIGNOBLE D’ALSACE · 12,5 % VOL', L / 2, 828);

  g.letterSpacing = '0px';
  return c;
}

/* ══════════════════════════════════════════════════════════════════════════
   LE MONTAGE
   ══════════════════════════════════════════════════════════════════════════ */
export async function monterLaVitrine(toile) {
  const sobre = matchMedia('(prefers-reduced-motion: reduce)').matches
             && !new URLSearchParams(location.search).has('mouvement');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }

  const petit = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, petit ? 1.3 : 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  /* Le compteur se remet a zero a chaque appel de rendu, et un passage en
     compose en fait plusieurs. Sans cette ligne, le bilan ne rapporte que le
     dernier rectangle plein ecran : un triangle, et on se croit leger. */
  renderer.info.autoReset = false;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.15, 3000);

  /* ── Le ciel ──────────────────────────────────────────────────────────── */
  const uCiel = {
    uZenith:    { value: new THREE.Color('#04060D') },
    uHorizon:   { value: new THREE.Color('#0A0F1E') },
    uSoleil:    { value: new THREE.Color('#232845') },
    uDirSoleil: { value: new THREE.Vector3(0, -1, 0) },
    uEtoiles:   { value: 1 },
    uNuages:    { value: 0.72 },
    uTemps:     { value: 0 }
  };
  const matiereCiel = new THREE.ShaderMaterial({
    uniforms: uCiel, vertexShader: SOMMET_CIEL, fragmentShader: FRAGMENT_CIEL,
    side: THREE.BackSide, depthWrite: false, fog: false
  });
  const ciel = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 32), matiereCiel);
  scene.add(ciel);

  /* ══ CE QUE LE VERRE REFLECHIT ═══════════════════════════════════════
     Sans environnement, un verre n'a rien a rendre : il transmet ce qu'il y
     a derriere et c'est tout. Il ressort mou, sans arete, sans ce liseré
     clair qui dit « c'est dur et c'est lisse ». C'est la moitie de ce qui
     fait qu'un objet en verre a l'air d'etre en verre.

     ON NE PHOTOGRAPHIE PAS LA SCENE ENTIERE POUR CA. Une carte
     d'environnement se fabrique en rendant six faces de cube ; le faire avec
     les 220 000 triangles du coteau couterait six fois le prix d'une image.
     On monte donc une scene minuscule qui ne contient que le ciel, avec le
     MEME materiau, donc les memes uniformes : quand l'heure change, ce petit
     ciel change tout seul. Un disque sous l'horizon lui donne un sol, sans
     quoi le verre reflechirait du noir par en dessous. */
  const petitCiel = new THREE.Scene();
  petitCiel.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 20), matiereCiel));
  const solReflet = new THREE.Mesh(
    new THREE.CircleGeometry(30, 24),
    new THREE.MeshBasicMaterial({ color: 0x6A6053, side: THREE.DoubleSide })
  );
  solReflet.rotation.x = -Math.PI / 2;
  solReflet.position.y = -0.6;
  petitCiel.add(solReflet);

  const pmrem = new THREE.PMREMGenerator(renderer);
  let cibleEnv = null, heureCuite = -9, dateCuisson = -9;
  function cuireLEnvironnement(heure, couleurSol) {
    solReflet.material.color.copy(couleurSol);
    const neuf = pmrem.fromScene(petitCiel, 0.03, 0.5, 60);
    cibleEnv?.dispose();
    cibleEnv = neuf;
    scene.environment = neuf.texture;
    heureCuite = heure;
  }

  /* ── La terre ─────────────────────────────────────────────────────────── */
  const uTerre = {
    uDirSoleil: uCiel.uDirSoleil,
    uSoleil:    { value: new THREE.Color('#232845') },
    uHorizon:   uCiel.uHorizon,
    uCamera:    { value: new THREE.Vector3() },
    uNuit:      { value: 1 }
  };
  const terre = new THREE.Mesh(
    /* Cent soixante divisions et pas deux cent trente : le relief a une
       longueur d'onde de soixante-seize metres, une division tous les quinze
       metres le decrit largement. On passe de 105 000 triangles a 51 000, et
       ils sont dessines DEUX fois par image, une pour l'ecran et une pour la
       cible de transmission du verre. */
    new THREE.PlaneGeometry(2400, 2400, petit ? 110 : 160, petit ? 110 : 160),
    new THREE.ShaderMaterial({ uniforms: uTerre, vertexShader: SOMMET_TERRE, fragmentShader: FRAGMENT_TERRE })
  );
  terre.rotation.x = -Math.PI / 2;
  scene.add(terre);

  /* ── Les lumieres ─────────────────────────────────────────────────────── */
  /* Le verre a besoin d'un environnement pour avoir quelque chose a reflechir.
     On le fabrique a partir du ciel lui-meme, une seule fois : la couleur
     changera par les uniformes, l'environnement donne surtout la structure,
     clair en haut, sombre en bas, un point vif la ou est le soleil. */
  const soleil = new THREE.DirectionalLight(0xFFFFFF, 3.0);
  scene.add(soleil);
  const appoint = new THREE.HemisphereLight(0xBFD9F2, 0x2A2216, 0.55);
  scene.add(appoint);

  /* LA LUMIERE DE SERVICE, celle qu'aucune scene ne devrait avoir et que
     toute scene finit par avoir. Elle est accrochee a la camera, tres douce,
     et sert a une seule chose : garantir qu'aux heures sombres la bouteille
     garde un liseré et ne devienne jamais une decoupe noire sur du noir.
     Un chef operateur appelle ca une lampe de rappel, et il n'a pas honte. */
  const rappel = new THREE.DirectionalLight(0xC9D8F0, 0.0);
  scene.add(rappel);

  /* ── La bouteille ─────────────────────────────────────────────────────── */
  /* Le profil d'une flute d'Alsace, releve sur une vraie : un corps
     cylindrique elance, une epaule tres longue qui se resout en un col fin,
     et une bague au sommet. C'est cette silhouette-la, et pas une bordelaise,
     qu'un Alsacien reconnait au premier coup d'oeil. */
  const H = HAUTEUR_BOUTEILLE;
  const profil = [];
  const poser = (r, y) => profil.push(new THREE.Vector2(r, y * H));
  poser(0.000, 0.000); poser(0.300, 0.000); poser(0.352, 0.012);
  poser(0.362, 0.035); poser(0.364, 0.120); poser(0.364, 0.330);
  poser(0.360, 0.400); poser(0.348, 0.452); poser(0.322, 0.510);
  poser(0.286, 0.566); poser(0.244, 0.622); poser(0.203, 0.678);
  poser(0.169, 0.732); poser(0.144, 0.784); poser(0.129, 0.834);
  poser(0.122, 0.880); poser(0.120, 0.940); poser(0.121, 0.964);
  poser(0.137, 0.972); poser(0.140, 0.988); poser(0.128, 1.000);
  poser(0.104, 1.000);

  /* Le profil est LISSE avant d'etre tourne. Vingt-deux points suffisent a
     decrire la silhouette, mais un tour les relie par des segments droits :
     chaque segment recoit alors sa propre normale, et la bouteille se
     retrouve cerclee d'anneaux d'ombre comme un tonneau. Deux cents points
     interpoles par une spline effacent les anneaux sans changer la forme.
     La borne a zero evite qu'un depassement de spline fasse passer un rayon
     du mauvais cote de l'axe, ce qui retourne la surface. */
  const profilLisse = new THREE.SplineCurve(profil).getPoints(220)
    .map(p => new THREE.Vector2(Math.max(0, p.x), p.y));

  const bouteille = new THREE.Group();
  scene.add(bouteille);

  /* ══ L'OMBRE PORTEE ══════════════════════════════════════════════════
     Sans elle, la bouteille ne pose pas, elle flotte : l'oeil cherche le
     point de contact et ne le trouve pas.

     ELLE EST DESSINEE, PAS CALCULEE, et c'est un choix, pas un raccourci.
     Une vraie carte d'ombre demanderait que le coteau la recoive, or le
     coteau a son propre programme de peinture : il faudrait y coudre les
     morceaux de three qui lisent les ombres, pour une tache floue posee sur
     une terre plate. Le studio photo fait pareil depuis toujours, et pour la
     meme raison : ce qui compte n'est pas l'exactitude de l'ombre, c'est
     qu'elle dise ou l'objet touche le sol.

     Elle s'allonge quand le soleil descend, et part a l'oppose de lui. Ce
     sont les deux seules choses que l'oeil verifie. */
  const ombre = new THREE.Group();
  {
    const T = 256;
    const c = document.createElement('canvas');
    c.width = c.height = T;
    const g = c.getContext('2d');
    const d = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
    d.addColorStop(0.00, 'rgba(255,255,255,1)');
    d.addColorStop(0.34, 'rgba(255,255,255,.72)');
    d.addColorStop(1.00, 'rgba(255,255,255,0)');
    g.fillStyle = d;
    g.fillRect(0, 0, T, T);
    const tex = new THREE.CanvasTexture(c);
    const tache = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false,
        color: 0x140F08, blending: THREE.NormalBlending, opacity: 0.55
      })
    );
    tache.rotation.x = -Math.PI / 2;
    /* Un centieme d'unite au-dessus du sol : assez pour gagner le test de
       profondeur, trop peu pour se voir de biais. */
    tache.position.y = 0.012;
    ombre.add(tache);
  }
  scene.add(ombre);

  const verre = new THREE.Mesh(
    new THREE.LatheGeometry(profilLisse, petit ? 64 : 128),
    new THREE.MeshPhysicalMaterial({
      /* ══ LA COULEUR D'UN VERRE TRANSMISSIF EST BLANCHE ══════════════════
         C'est la faute qui a coute le plus de temps sur cette page, et elle
         est instructive. La bouteille sortait en decoupe noire absolue. On
         accuse la transmission, l'environnement, l'ordre de rendu. Ce n'etait
         rien de tout ca : la lumiere qui TRAVERSE est multipliee par la
         couleur de base du materiau. Un vert bouteille, 3C6B3A, vaut 0,045 en
         rouge une fois converti en lumiere reelle, parce que la conversion
         depuis l'ecran est une puissance 2,2. On perdait donc 95 % de la
         lumiere avant meme d'avoir commence a teinter.

         La regle : sur un materiau transmissif, la couleur de base reste
         quasi blanche, et la teinte se fait par ABSORPTION, avec la couleur
         et la distance d'attenuation. C'est d'ailleurs ainsi que le verre
         teinte fonctionne pour de vrai : il n'est pas vert, il absorbe le
         rouge et le bleu sur l'epaisseur qu'on lui traverse. Un verre epais
         est plus vert qu'un verre mince, ce que seul ce modele-la donne. */
      color: new THREE.Color('#EAF3E6'),
      roughness: 0.045,
      metalness: 0.0,
      transmission: 0.98,
      thickness: 0.55,
      ior: 1.52,
      /* Un verre « feuille morte », le vert clair des flutes d'Alsace, et pas
         le vert profond d'une bordelaise. Ce n'est pas un detail d'esthete :
         une bordelaise protege un rouge de la lumiere, une flute doit
         MONTRER un blanc. Avec le vert fonce, le riesling ressortait kaki. */
      attenuationColor: new THREE.Color('#63AC4A'),
      attenuationDistance: 3.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      /* UNE SEULE FACE, et c'est la deuxieme cause du noir. En double face,
         l'interieur du tour se dessine aussi, avec des normales qui regardent
         vers l'interieur donc noires, et rien ne garantit qu'il passe DERRIERE
         l'exterieur : dans un maillage transparent, three trie les objets
         entre eux, jamais les triangles d'un meme objet. On voyait donc la
         doublure sombre par dessus le verre. L'epaisseur est deja rendue par
         le terme volumetrique, la seconde face ne servait a rien. */
      side: THREE.FrontSide,
      envMapIntensity: 1.1
    })
  );
  /* L'ordre des deux pieces transparentes est impose a la main. Le vin et le
     verre sont au meme endroit, donc leur distance a la camera est la meme, et
     le tri par distance rend un ordre arbitraire qui change avec l'angle. */
  verre.renderOrder = 2;
  bouteille.add(verre);

  /* ══ LE VIN ═══════════════════════════════════════════════════════════
     PREMIERE VERSION, FAUSSE : un cylindre de rayon fixe dont on changeait la
     hauteur. Le corps de la bouteille est droit, mais l'epaule d'une flute
     d'Alsace se resserre sur plus de la moitie de sa hauteur ; passe le
     niveau de l'epaule, le cylindre sortait donc du verre et on voyait une
     bague brune flotter autour du col.

     VERSION JUSTE : le vin epouse le profil interieur de la bouteille, et
     c'est un PLAN DE COUPE qui decide du niveau. Deux choses en decoulent
     gratuitement. La surface est parfaitement plate et nette, ce qui est la
     seule chose qui dise « liquide » a l'oeil. Et quand ce plan s'incline, la
     surface reste horizontale pendant que le contenant bouge, ce qui est
     exactement ce que fait un liquide, alors qu'incliner le volume entier
     donnait un bloc de gelatine. */
  const profilVin = profilLisse
    .filter(p => p.y <= H * 0.605)
    .map(p => new THREE.Vector2(p.x * 0.945, Math.max(p.y, H * 0.006)));
  profilVin.push(new THREE.Vector2(0.0001, H * 0.605));

  /* Le rayon interieur a une hauteur donnee, releve sur le meme profil. Il
     sert a tailler le disque de surface : trop petit, un anneau de vide
     apparait le long du verre ; trop grand, le disque perce la bouteille. */
  function rayonInterieur(y) {
    for (let i = 0; i < profilLisse.length - 1; i++) {
      const a = profilLisse[i], b = profilLisse[i + 1];
      if (y >= a.y && y <= b.y && b.y > a.y) {
        return entre(a.x, b.x, (y - a.y) / (b.y - a.y)) * 0.945;
      }
    }
    return 0.34;
  }

  const HAUT_VIN = H * 0.605;
  const vin = new THREE.Mesh(
    new THREE.LatheGeometry(profilVin, petit ? 48 : 96),
    new THREE.MeshPhysicalMaterial({
      /* Meme regle que pour le verre : la couleur reste claire, l'or vient de
         l'absorption. Un riesling est presque transparent en couche mince et
         franchement dore sur toute la hauteur d'une bouteille, ce qu'une
         teinte plate ne sait pas rendre. */
      /* ══ LE VIN EST OPAQUE, ET C'EST OBLIGATOIRE ══════════════════════
         Il etait transmissif, donc invisible : on ne voyait qu'une bouteille
         vide. La raison tient a une regle de three qu'il faut connaitre une
         fois pour toutes. Un materiau transmissif ne refracte pas la scene,
         il refracte une PHOTO de la scene prise juste avant, et cette photo
         ne contient que les objets OPAQUES. Deux transparents l'un derriere
         l'autre ne se voient donc jamais : celui de devant echantillonne un
         fond ou celui de derriere n'existe pas, et l'efface.

         Le vin passe donc opaque. Il entre alors dans la photo, et le verre
         le refracte pour de bon. Ce n'est pas un compromis : un riesling sur
         toute l'epaisseur d'une bouteille est de toute facon opaque. */
      color: new THREE.Color('#C58A1E'),
      roughness: 0.14,
      metalness: 0.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.10,
      /* Une braise interne tres faible. Un vin blanc traverse par le soleil
         rasant s'allume par l'interieur ; sans ce terme il reste un bloc
         sombre des que la lumiere baisse, ce qui est faux et surtout laid. */
      emissive: new THREE.Color('#5A3A06'),
      emissiveIntensity: 0.45,
      envMapIntensity: 1.2
    })
  );
  vin.renderOrder = 1;
  bouteille.add(vin);

  /* Le plan de coupe, et le disque qui bouche ce qu'il ouvre. Sans ce disque
     on verrait l'interieur creux du volume : un liquide coupe net montre son
     vide, exactement comme un fruit qu'on tranche montrerait le sien s'il
     n'avait pas de chair. */
  renderer.localClippingEnabled = true;
  const planVin = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  vin.material.clippingPlanes = [planVin];

  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(1, petit ? 48 : 96),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#E8C878'),
      roughness: 0.045,
      metalness: 0.0,
      /* La surface d'un liquide est d'abord un MIROIR. C'est le reflet du
         ciel dessus, pas la couleur du liquide, qui trahit sa presence. */
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      emissive: new THREE.Color('#4A3208'),
      emissiveIntensity: 0.5,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide
    })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.renderOrder = 1;
  bouteille.add(surface);

  /* La capsule. Un anneau mat sur le col : sans elle, la bouteille a l'air
     d'un flacon de laboratoire. */
  const capsule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.132, 0.126, H * 0.115, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: '#1A1A1C', roughness: 0.42, metalness: 0.65, side: THREE.DoubleSide })
  );
  capsule.position.y = H * 0.945;
  bouteille.add(capsule);

  /* L'etiquette. Un fragment de cylindre pose juste devant le verre, ouvert
     sur les deux tiers de la circonference comme une vraie etiquette de
     flute. Elle regarde le plus Z, donc la camera la voit de face quand la
     bouteille est a l'angle zero. */
  const texEtiquette = new THREE.CanvasTexture(dessinerLEtiquette('Vent d’Est', 'Sonnenglanz', 2021));
  texEtiquette.colorSpace = THREE.SRGBColorSpace;
  texEtiquette.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  /* L'arc de l'etiquette. A 1,24 fois pi, soit 223 degres, le texte partait
     se cacher sur les flancs et on ne lisait « Vent d' » que de face. Une
     etiquette de flute enveloppe un peu moins de la moitie du tour.

     ELLE EPOUSE LE PROFIL, elle n'est pas un cylindre. Le corps de la
     bouteille se resserre deja sur la hauteur de l'etiquette : un cylindre de
     rayon constant colle en haut et decolle de deux millimetres en bas, ce
     qui se voit tout de suite en gros plan et donne un autocollant pose de
     travers. On reprend donc le profil de la bouteille sur cette tranche, et
     on l'ecarte de quatre dixiemes de millimetre, l'epaisseur d'un papier. */
  const arc = Math.PI * 0.86;
  const basEtiquette = H * 0.068, hautEtiquette = H * 0.343;
  const profilEtiquette = profilLisse
    .filter(p => p.y >= basEtiquette && p.y <= hautEtiquette)
    .map(p => new THREE.Vector2(p.x + 0.004, p.y));
  const etiquette = new THREE.Mesh(
    /* Le tour commence a moins un demi-arc, et SANS quart de tour. three
       place l'angle zero d'un tour sur le plus Z, celui qui regarde la
       camera au repos ; le quart de tour que j'avais ajoute envoyait le
       milieu de l'etiquette sur le flanc, et a l'acte du millesime on lisait
       le bord au lieu du nom. */
    new THREE.LatheGeometry(profilEtiquette, 96, -arc / 2, arc),
    new THREE.MeshStandardMaterial({ map: texEtiquette, roughness: 0.78, metalness: 0.0, side: THREE.DoubleSide })
  );
  bouteille.add(etiquette);

  /* ── Les passages ─────────────────────────────────────────────────────── */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  /* Le seuil du flou lumineux est haut, a 0,96 : seul ce qui depasse
     franchement le blanc de l'ecran a le droit de deborder. Regle plus bas,
     il attrapait le ciel entier et le paysage se noyait. */
  const flou = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.40, 0.62, 0.96);
  composer.addPass(flou);

  const rais = new ShaderPass(RAIS);
  rais.renderToScreen = true;
  composer.addPass(rais);

  /* ── Le defilement ────────────────────────────────────────────────────── */
  let avance = 0, avanceLue = 0;
  const lireLeDefilement = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    avanceLue = total > 0 ? serre(scrollY / total, 0, 1) : 0;
  };
  addEventListener('scroll', lireLeDefilement, { passive: true });
  lireLeDefilement();
  avance = avanceLue;

  /* ── Mesure ───────────────────────────────────────────────────────────── */
  function mesurer() {
    const w = innerWidth, h = innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    flou.setSize(w, h);
  }
  mesurer();
  addEventListener('resize', mesurer);

  /* ── Etats interpoles ─────────────────────────────────────────────────── */
  const posCam = new THREE.Vector3(), visee = new THREE.Vector3();
  const axe = new THREE.Vector3(), droite = new THREE.Vector3();
  const cA = new THREE.Color(), cB = new THREE.Color();
  const ecranSoleil = new THREE.Vector3();
  let ballant = 0, vitesseBallant = 0, avancePrec = 0;

  function etatActe(p) {
    return interpoler(ACTES, 'p', p, (a, b, t) => ({
      cam:  [entre(a.cam[0], b.cam[0], t), entre(a.cam[1], b.cam[1], t), entre(a.cam[2], b.cam[2], t)],
      vise: [entre(a.vise[0], b.vise[0], t), entre(a.vise[1], b.vise[1], t), entre(a.vise[2], b.vise[2], t)],
      fov:   entre(a.fov, b.fov, t),
      heure: entre(a.heure, b.heure, t),
      vin:   entre(a.vin, b.vin, t),
      tour:  entre(a.tour, b.tour, t),
      place: entre(a.place, b.place, t),
      face:  entre(a.face, b.face, t)
    }));
  }

  function etatCiel(h) {
    return interpoler(CIEL, 'h', h, (a, b, t) => {
      cA.set(a.zenith); cB.set(b.zenith);
      const zenith = cA.clone().lerp(cB, t);
      cA.set(a.horizon); cB.set(b.horizon);
      const horizon = cA.clone().lerp(cB, t);
      cA.set(a.soleil); cB.set(b.soleil);
      const teinte = cA.clone().lerp(cB, t);
      return { zenith, horizon, teinte, rais: entre(a.rais, b.rais, t) };
    });
  }

  /* ── Boucle ───────────────────────────────────────────────────────────── */
  let actif = true, dernier = performance.now(), cumul = 0, images = 0, palier = 0, horloge = 0;

  function jauger(dt) {
    cumul += dt; images++;
    if (images < 60) return;
    const moyenne = cumul / images; cumul = 0; images = 0;
    /* Trois paliers de delestage, du moins visible au plus visible. On
       commence par la definition, puis par les rais qui sont le poste le plus
       cher a l'ecran, et seulement en dernier par le verre, qui est le sujet.
       On ne sacrifie jamais le sujet en premier. */
    if (moyenne > 0.026 && palier < 3) {
      palier++;
      renderer.setPixelRatio(Math.max(0.7, renderer.getPixelRatio() * 0.78));
      if (palier === 2) { rais.enabled = false; }
      if (palier === 3) {
        flou.enabled = false;
        verre.material.transmission = 0;
        verre.material.opacity = 0.84;
        verre.material.transparent = true;
        verre.material.needsUpdate = true;
      }
      mesurer();
    }
  }

  /* ── UNE IMAGE ────────────────────────────────────────────────────────
     Tout le travail d'une image tient ici, et RIEN ailleurs. La boucle ne
     fait que l'appeler, et la poignee de reglage aussi.

     POURQUOI CETTE SEPARATION. Une poignee de debogage qui recalcule les
     choses de son cote produit des conclusions fausses avec l'autorite d'un
     chiffre : on croit mesurer la scene et on mesure une copie. Ici il n'y a
     qu'un seul chemin de peinture, donc ce qu'on mesure est ce qu'on voit. */
  function peindre(dt) {
    jauger(dt);
    horloge += dt;

    /* Le defilement est amorti ici, pas dans le document. Amortir la page
       elle-meme se paie en confort de lecture ; amortir la seule camera donne
       le glissement de cinema sans toucher au texte. */
    const k = sobre ? 1 : 1 - Math.pow(1 - 0.11, dt * 60);
    avance += (avanceLue - avance) * k;

    const e = etatActe(avance);
    const c = etatCiel(e.heure);

    /* La camera. Le champ change avec l'acte : ouvrir l'objectif en reculant
       exagere la profondeur, c'est le geste qui fait respirer un paysage. */
    posCam.set(e.cam[0], e.cam[1], e.cam[2]);
    visee.set(e.vise[0], e.vise[1], e.vise[2]);

    /* ══ LE CADRAGE DE TELEPHONE ═════════════════════════════════════════
       Un ecran de telephone est haut et etroit, et l'ouverture de l'objectif
       se mesure sur la HAUTEUR : le sujet y est donc bien plus gros que sur
       un ecran large, alors meme qu'il y a moins de place. Et le texte,
       lui, se range en bas. Sans correction, la bouteille descend dans les
       lignes et on lit par-dessus elle.

       Deux gestes, ceux d'un cadreur : on recule un peu, et on VISE PLUS BAS,
       ce qui fait monter le sujet dans le cadre et degage le tiers inferieur
       pour le texte. On ne touche pas a la hauteur de la camera, sinon
       l'horizon remonterait et on perdrait le ciel. */
    if (petit) {
      posCam.x *= 1.18; posCam.z *= 1.18;
      visee.y -= 0.66;
    }
    camera.position.copy(posCam);
    if (Math.abs(camera.fov - e.fov) > 0.01) { camera.fov = e.fov; camera.updateProjectionMatrix(); }

    /* On vise A COTE de la bouteille pour qu'elle se range du bon bord. La
       distance a decaler se calcule sur la demi-largeur reellement visible a
       la distance de l'objet, donc elle se resserre toute seule sur un ecran
       etroit. Le vecteur de droite se prend sur la vraie direction du regard,
       pas sur un axe du monde, sinon le decalage se met a pencher des que la
       camera s'eloigne de l'axe. */
    axe.subVectors(visee, posCam);
    const portee = axe.length() || 1;
    const demiLargeur = portee * Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
    droite.crossVectors(axe, camera.up).normalize();
    visee.addScaledVector(droite, -e.place * demiLargeur);
    camera.lookAt(visee);

    /* Le soleil. Son elevation dessine une arche entre deux nuits, son azimut
       va de l'est a l'ouest. A l'aube comme au couchant il passe derriere la
       bouteille : c'est la que le verre s'allume par l'interieur. */
    /* L'ARCHE DU SOLEIL EST APLATIE AUX EXTREMITES. Un sinus simple monte
       trop vite : a un dixieme de la journee il etait deja a trente-trois
       degres, donc « cinq heures quarante » se jouait en plein midi et
       l'heure doree n'existait pas. La puissance 1,8 rallonge les deux
       bouts, qui sont justement les seuls moments interessants.

       L'azimut reste dans la moitie opposee a la camera, entre 132 et 228
       degres : c'est ce qui garde le soleil DANS le cadre a l'aube et au
       couchant, condition sans laquelle les rais ne se lisent pas. */
    const hh = e.heure;
    const t  = serre((hh - 0.05) / 0.90, 0, 1);
    const el = (-9 + 88 * Math.pow(Math.sin(Math.PI * t), 1.8)) * Math.PI / 180;
    const az = (132 + 96 * hh) * Math.PI / 180;
    uCiel.uDirSoleil.value.set(
      Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)
    ).normalize();

    uCiel.uZenith.value.copy(c.zenith);
    uCiel.uHorizon.value.copy(c.horizon);
    uCiel.uSoleil.value.copy(c.teinte);
    const nuit = serre(1 - (Math.sin(el) + 0.09) / 0.22, 0, 1);
    uCiel.uEtoiles.value = nuit;
    /* Les nuages derivent lentement, et s'effacent la nuit : ils n'ont plus
       rien pour les eclairer, et laisser leur gris sur un ciel etoile
       reviendrait a poser un voile sale sur les etoiles. */
    uCiel.uTemps.value = horloge;
    uCiel.uNuages.value = 0.78 * (1 - nuit * 0.88);

    uTerre.uSoleil.value.copy(c.teinte);
    uTerre.uNuit.value = nuit * 0.86;
    uTerre.uCamera.value.copy(posCam);

    /* ══ QUAND REFAIRE L'ENVIRONNEMENT ═══════════════════════════════════
       Mesure au chronometre du GPU, et elle a fait mal : quatre-vingt-onze
       millisecondes par image pendant la montee du jour, sur une carte a
       deux mille euros. Onze images par seconde. La scene elle-meme ne coute
       rien, moins d'une milliseconde ; c'etait la cuisson de l'environnement,
       declenchee des que l'heure avait bouge d'un quarantieme, donc a peu
       pres tout le temps pendant qu'on defile.

       Trois verrous, et le troisieme est le vrai. Un, le seuil passe au
       vingtieme. Deux, jamais deux cuissons a moins d'un quart de seconde.
       Trois et surtout : ON NE CUIT PAS PENDANT QUE LE DEFILEMENT COURT. Un
       reflet flou dans du verre pendant un mouvement rapide, personne ne le
       regarde ; la saccade qu'il provoque, tout le monde la sent. On attend
       donc que la main se calme, et la cuisson passe inapercue.

       C'est la lecon generale de cette page : ce qui coute cher ne doit pas
       etre supprime, il doit etre fait au moment ou personne ne regarde. */
    const calme = Math.abs(avanceLue - avance) < 0.004;
    if (Math.abs(hh - heureCuite) > (calme ? 0.02 : 0.20)
        && horloge - dateCuisson > 0.25) {
      dateCuisson = horloge;
      cuireLEnvironnement(hh, cA.copy(c.horizon).lerp(c.teinte, 0.35).multiplyScalar(0.55));
    }

    soleil.position.copy(uCiel.uDirSoleil.value).multiplyScalar(300);
    soleil.color.copy(c.teinte);
    soleil.intensity = 0.35 + 3.2 * serre(Math.sin(el) * 3.2, 0, 1);
    appoint.color.copy(c.zenith).lerp(new THREE.Color('#FFFFFF'), 0.35);
    appoint.groundColor.copy(c.horizon).multiplyScalar(0.35);
    appoint.intensity = 0.30 + 0.55 * (1 - nuit);

    /* Le rappel n'existe que quand le soleil manque, et il vient d'en haut a
       gauche de la camera, jamais de face : une lumiere frontale aplatit le
       verre au lieu de le dessiner. */
    rappel.position.set(posCam.x - 3.2, posCam.y + 4.0, posCam.z + 1.6);
    rappel.intensity = 0.30 + 1.55 * nuit;

    /* L'ombre. Elle part a l'oppose du soleil, s'allonge a mesure qu'il
       descend, et s'efface quand il passe sous l'horizon : la nuit, un objet
       n'a plus d'ombre portee, il a juste un contact sombre. */
    const s3 = uCiel.uDirSoleil.value;
    const plat = Math.hypot(s3.x, s3.z) || 0.0001;
    const hauteurSoleil = Math.max(s3.y, 0.06);
    const longueur = serre(plat / hauteurSoleil, 0.55, 5.2);
    ombre.rotation.y = Math.atan2(-s3.x, -s3.z);
    ombre.scale.set(1.55, 1, 1.55 + longueur * 1.25);
    ombre.position.set(-s3.x / plat * longueur * 0.42, 0, -s3.z / plat * longueur * 0.42);
    ombre.children[0].material.opacity = 0.60 * serre(s3.y * 5.5, 0.16, 1);

    /* La bouteille. Elle tourne selon l'acte, et le vin garde de l'elan :
       la vitesse de defilement pousse le berceau, un ressort le ramene. Sans
       ce retard, un liquide n'a pas de masse et on le voit tout de suite. */
    /* A l'acte du millesime, l'etiquette doit se presenter DE FACE, et un
       angle fixe ne suffit pas : la camera est decalee sur le cote d'une
       quantite qui depend des proportions de la fenetre, donc l'angle sous
       lequel on voit la bouteille change avec l'ecran. On vise donc la
       position reelle de la camera, et la cle face dose l'obeissance : a un,
       l'etiquette regarde le visiteur ou qu'il soit ; a zero, la bouteille
       est libre. Entre les deux, elle se tourne doucement vers lui. */
    bouteille.rotation.y = e.tour + e.face * Math.atan2(posCam.x, posCam.z);
    const impulsion = (avance - avancePrec) / Math.max(dt, 0.001);
    avancePrec = avance;
    vitesseBallant += (serre(impulsion * 0.9, -1.4, 1.4) - ballant * 7.5) * dt * 26;
    vitesseBallant *= Math.pow(0.02, dt);
    ballant += vitesseBallant * dt;
    ballant = serre(ballant, -0.16, 0.16);

    /* Le niveau, et le ballant. Le plan reste HORIZONTAL au repos et
       s'incline de quelques degres selon l'elan : c'est le contenant qui
       bouge autour d'un liquide immobile, jamais l'inverse. */
    const niveau = serre(e.vin, 0, 1);
    const yVin = H * 0.012 + niveau * (HAUT_VIN - H * 0.012);
    const gite = sobre ? 0 : ballant;
    planVin.normal.set(Math.sin(gite * 1.6), -1, Math.sin(gite * 0.7)).normalize();
    planVin.constant = yVin * -planVin.normal.y;

    surface.position.y = yVin;
    surface.rotation.set(-Math.PI / 2 + Math.sin(gite * 0.7), 0, Math.sin(gite * 1.6));
    /* Un poil moins large que le verre a cette hauteur : un disque affleurant
       la paroi laisse voir une dentelure la ou les deux maillages se
       coupent, et cette dentelure clignote des que la camera bouge. */
    surface.scale.setScalar(rayonInterieur(yVin) * 0.985);
    vin.visible = surface.visible = e.vin > 0.004;

    /* Les rais. Ils ne servent qu'aux heures rasantes, et seulement si le
       soleil est DANS le cadre : un faisceau qui converge vers un point hors
       de l'ecran ne se lit pas, il salit. */
    ecranSoleil.copy(uCiel.uDirSoleil.value).multiplyScalar(900).project(camera);
    const sx = ecranSoleil.x * 0.5 + 0.5, sy = ecranSoleil.y * 0.5 + 0.5;
    const devant = ecranSoleil.z < 1;
    const cadre = serre(1.6 - 2.2 * Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)), 0, 1);
    rais.uniforms.uSoleil.value.set(sx, sy);
    rais.uniforms.uForce.value = devant ? c.rais * cadre * 0.85 : 0;
    rais.uniforms.uTeinte.value.copy(c.teinte);

    document.documentElement.style.setProperty('--heure', hh.toFixed(4));
    document.documentElement.style.setProperty('--avance', avance.toFixed(4));

    renderer.info.reset();
    composer.render();
  }

  /* ══ LA JAUGE D'IMAGES ═══════════════════════════════════════════════
     Ouvrir la page avec ?mesure=1 affiche le nombre d'images par seconde et
     le palier de delestage en cours.

     POURQUOI DANS LA PAGE ET NON DANS LA CONSOLE. Le seul endroit ou une
     cadence se mesure vraiment est un onglet AU PREMIER PLAN : partout
     ailleurs le navigateur gele les images, et tout ce qu'on lit vaut zero.
     Les chronometres du GPU interroges depuis un onglet d'arriere-plan m'ont
     donne ici des mesures qui se contredisaient entre elles, au point de
     rendre un passage « plus rapide » quand on l'activait. Une jauge posee
     dans la page, elle, ne peut mentir que si la page ment. */
  let jauge = null, tampon = 0, comptees = 0;
  if (new URLSearchParams(location.search).has('mesure')) {
    jauge = document.createElement('div');
    jauge.style.cssText = 'position:fixed;z-index:99;left:12px;top:12px;padding:.5rem .7rem;'
      + 'font:500 12px/1.5 ui-monospace,monospace;color:#9EFFD2;background:rgba(0,0,0,.72);'
      + 'border:1px solid rgba(158,255,210,.3);border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(jauge);
  }

  function battre(maintenant) {
    if (!actif) return;
    requestAnimationFrame(battre);
    const dt = Math.min(0.05, Math.max(0, (maintenant - dernier) / 1000));
    dernier = maintenant;
    peindre(dt);

    if (jauge) {
      tampon += dt; comptees++;
      if (tampon >= 0.5) {
        const ips = comptees / tampon;
        jauge.textContent = ips.toFixed(0) + ' images/s   ' + (1000 / ips).toFixed(1) + ' ms\n'
          + 'palier ' + palier + '   definition ' + renderer.getPixelRatio().toFixed(2) + '\n'
          + renderer.info.render.triangles.toLocaleString('fr') + ' triangles   '
          + renderer.info.render.calls + ' appels';
        tampon = 0; comptees = 0;
      }
    }
  }
  requestAnimationFrame(battre);

  return {
    /* La poignee de reglage. Elle place le defilement et peint une image par
       le CHEMIN NORMAL. Elle sert a verifier la scene quand l'onglet n'est pas
       au premier plan, cas ou le navigateur gele les images et ou tout ce
       qu'on lit vaut zero. Le pas de temps est force a un vingtieme de
       seconde et repete, pour que les amortis aient le temps d'arriver. */
    poser(p, images = 24) {
      avanceLue = serre(p, 0, 1);
      for (let i = 0; i < images; i++) peindre(0.05);
      return this.bilan();
    },
    /* Les pieces elles-memes, pour pouvoir les regler a chaud depuis la
       console. On ne montre pas une copie : ce sont les objets de la scene,
       donc ce qu'on y change se voit a l'image suivante. */
    pieces: { scene, camera, renderer, verre, vin, etiquette, capsule, terre, ciel, soleil, appoint, rappel, composer, flou, rais },
    detruire() {
      actif = false;
      removeEventListener('resize', mesurer);
      removeEventListener('scroll', lireLeDefilement);
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
      composer.dispose?.(); renderer.dispose();
    },
    bilan() {
      const info = renderer.info;
      const e = etatActe(avance);
      const s = uCiel.uDirSoleil.value;
      return {
        avance: +avance.toFixed(3),
        heure:  +e.heure.toFixed(3),
        vin:    +e.vin.toFixed(3),
        tour:   +e.tour.toFixed(3),
        soleil: { y: +s.y.toFixed(3), ecran: [+rais.uniforms.uSoleil.value.x.toFixed(3), +rais.uniforms.uSoleil.value.y.toFixed(3)], rais: +rais.uniforms.uForce.value.toFixed(3) },
        ballant: +ballant.toFixed(4),
        triangles: info.render.triangles,
        appels: info.render.calls,
        textures: info.memory.textures,
        definition: +renderer.getPixelRatio().toFixed(2),
        palier
      };
    }
  };
}
