/* ══════════════════════════════════════════════════════════════════════════
   LA NUEE
   --------------------------------------------------------------------------
   Le nom du studio n'est pas ecrit. Il est TENU, par deux cent soixante mille
   particules qui se rassemblent pour le former et se dispersent des qu'on
   descend. Remontez, elles reviennent le reprendre.

   POURQUOI CA NE PEUT PAS SE FAIRE EN JAVASCRIPT. Deplacer 262 144 points
   demanderait, a chaque image, autant de tours de boucle sur le processeur :
   a soixante images par seconde cela fait quinze millions d'operations par
   seconde rien que pour les additionner, sans compter le bruit. Le navigateur
   n'y arriverait pas.

   ALORS LE CALCUL EST FAIT PAR LA CARTE GRAPHIQUE, et le detour merite d'etre
   compris parce qu'il est le coeur de la piece. On range les positions dans
   une IMAGE : un carre de 512 sur 512, ou chaque point de couleur ne porte
   pas un rouge et un vert mais un x et un y. Faire avancer les particules
   revient alors a peindre une image a partir d'une autre, ce que la carte
   fait par millions de points a la fois. On garde deux images et on alterne :
   on lit dans l'une, on peint dans l'autre, puis on echange. C'est la seule
   facon d'ecrire un resultat qui depend de l'etat precedent quand on n'a pas
   le droit de lire et d'ecrire au meme endroit.

   LA TURBULENCE EST UN ROTATIONNEL. Un bruit ordinaire pousse les particules
   dans tous les sens et elles finissent par s'agglutiner ou se vider. On prend
   donc le rotationnel d'un champ de bruit, ce qui donne un champ dont la
   divergence est nulle : rien ne s'accumule, rien ne se creuse, ca tourbillonne
   comme de la fumee. C'est exactement le meme argument que la soustraction du
   gradient dans la simulation d'encre, et c'est la meme physique.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Les programmes ────────────────────────────────────────────────────── */

const SOMMET_PLEIN = `#version 300 es
in vec2 aCoin;
out vec2 vUv;
void main() { vUv = aCoin * 0.5 + 0.5; gl_Position = vec4(aCoin, 0.0, 1.0); }`;

/* Le bruit et son rotationnel. Ecrits une fois, colles dans les programmes
   qui en ont besoin. */
const BRUIT = `
vec3 hache3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float bruit3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dot(hache3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                     dot(hache3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hache3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                     dot(hache3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hache3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                     dot(hache3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hache3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                     dot(hache3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}
vec3 champ(vec3 p) {
  return vec3(bruit3(p), bruit3(p + 31.416), bruit3(p - 17.234));
}
/* Le rotationnel par differences finies. Trois evaluations de plus par axe,
   et en echange un champ ou rien ne s'accumule jamais. */
vec3 rotationnel(vec3 p) {
  const float e = 0.14;
  vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 px1 = champ(p + dx), px0 = champ(p - dx);
  vec3 py1 = champ(p + dy), py0 = champ(p - dy);
  vec3 pz1 = champ(p + dz), pz0 = champ(p - dz);
  return vec3(
    (py1.z - py0.z) - (pz1.y - pz0.y),
    (pz1.x - pz0.x) - (px1.z - px0.z),
    (px1.y - px0.y) - (py1.x - py0.x)
  ) / (2.0 * e);
}`;

const SIMULATION = `#version 300 es
precision highp float;
in vec2 vUv;
layout(location = 0) out vec4 sortiePos;
layout(location = 1) out vec4 sortieVit;

uniform sampler2D uPos;
uniform sampler2D uVit;
uniform sampler2D uCible;

uniform float uCohesion;    /* 1 : le mot est tenu. 0 : la nuee est libre. */
uniform float uDt;
uniform float uTemps;
uniform vec3  uSouris;      /* xy en unites du monde, z = force */
uniform vec2  uEtendue;
${BRUIT}

void main() {
  vec4 P = texture(uPos, vUv);
  vec4 V = texture(uVit, vUv);
  vec3 p = P.xyz;
  vec3 v = V.xyz;
  vec3 cible = texture(uCible, vUv).xyz;
  float graine = V.w;

  /* Le rappel vers la lettre. Un ressort, et un ressort seul ne s'arrete
     jamais : c'est l'amortissement plus bas qui le pose. La raideur depend
     de la cohesion, donc quand elle tombe le mot ne se disloque pas d'un
     coup, il se laisse emporter. */
  /* LE RESSORT EST FRANC. A 26, les particules mettaient trop longtemps a se
     poser et le mot restait flou sur ses bords : Matheo l'a dit tout de
     suite, « le KAZURA est mal fait ». Un mot fait de points ne vaut que par
     la NETTETE de son contour ; en dessous, il ressemble a une tache. */
  vec3 versCible = cible - p;
  v += versCible * (52.0 * uCohesion) * uDt;

  /* La turbulence. Elle grandit quand la cohesion tombe : tenue, la nuee
     fremit a peine ; libre, elle part en fumee. L'echelle depend de la
     graine, donc deux particules voisines ne suivent jamais la meme veine. */
  /* ══ LA TURBULENCE NE SE CALCULE PAS QUAND LE MOT EST TENU ═════════════
     C'est la correction la plus rentable de tout le fichier, et elle a ete
     trouvee par une mesure indirecte : la cohesion mettait NEUF secondes a
     monter la ou elle devrait mettre une seconde, donc la boucle tournait
     vers sept images par seconde au lieu de soixante.

     Le coupable est juste en dessous. Le rotationnel demande six evaluations
     du champ, chacune faite de trois bruits, chacun de huit hachages a trois
     sinus : plus de quatre cents sinus par particule et par image. Sur
     262 144 particules, cela fait cent treize MILLIONS de sinus par image.

     Or, mot tenu, l'amplitude vaut 0,045 : on payait cent treize millions de
     sinus pour un fremissement invisible. On sort donc avant de les calculer.
     Le heros passe l'essentiel de son temps dans cet etat, donc l'essentiel
     du temps ce calcul ne se fait plus du tout. */
  float ampleur = mix(2.35, 0.045, uCohesion);
  if (ampleur > 0.09) {
    vec3 q = p * mix(0.55, 1.30, graine) + vec3(0.0, uTemps * 0.11, uTemps * 0.05);
    v += rotationnel(q) * ampleur * uDt;
  }

  /* La derive vers le haut quand elle est libre : une nuee qui se disperse
     a plat retombe en flaque, une nuee qui monte devient du pollen. */
  v.y += (1.0 - uCohesion) * 0.42 * uDt;

  /* La main. Une repulsion douce en un sur la distance au carre, bornee pour
     qu'un curseur pose sur une lettre ne l'envoie pas a l'autre bout. */
  vec2 d = p.xy - uSouris.xy;
  float d2 = dot(d, d) + 0.0016;
  float pousse = uSouris.z * 0.055 / d2;
  v.xy += normalize(d + 1e-6) * min(pousse, 5.5) * uDt;

  /* L'amortissement, independant de la cadence : a trente images comme a
     cent vingt, une particule perd la meme part de son elan par seconde.

     IL EST FORT QUAND LE MOT EST TENU, faible quand la nuee est libre, et je
     l'avais ecrit dans l'autre sens. Consequence : a pleine cohesion le
     ressort tirait vers la lettre sans que rien ne l'arrete, donc chaque
     particule oscillait autour de sa destination sans jamais s'y poser. On
     obtenait un nuage violet de la forme du mot, mais pas le mot. Une
     particule qui rejoint sa place doit y etre RETENUE, c'est tout le role de
     l'amortissement, et c'est la moitie d'un ressort qu'on oublie. */
  /* ══ IL EST CRITIQUE, ET IL SE CALCULE ═════════════════════════════════
     Matheo : « quand on revient, ca secoue, et ca secoue beaucoup trop
     longtemps ». Ce n'etait pas une impression, c'etait la valeur du
     coefficient, et un ressort amorti se regle par une formule, pas a vue.

     Raideur k = 52, donc pulsation propre w = racine(52) = 7,21 par seconde.
     Un ressort cesse d'osciller quand son taux d'amortissement g atteint
     2 w, soit 14,4. L'ancienne valeur, 0,006 par seconde elevee a dt, valait
     g = -ln(0,006) = 5,12 : un tiers du necessaire. Le systeme etait donc
     franchement SOUS-AMORTI, il oscillait a 1,15 hertz et mettait pres d'une
     seconde a s'eteindre. Trois allers-retours visibles : la secousse.

     On prend 14,9, tout juste au-dela du critique : le mot rejoint sa forme
     par le chemin le plus court et ne la depasse jamais. Ecrit en
     exponentielle plutot qu'en puissance parce que g EST le nombre qui se
     compare a 2 w ; sous forme de base elevee a dt, on ne peut pas le lire.

     Nuee libre, on garde un frottement tres faible : elle doit pouvoir
     deriver. C'est le meme fluide, ce n'est pas le meme regime. */
  v *= exp(-uDt * mix(0.60, 14.9, uCohesion));

  p += v * uDt;

  /* Le domaine est referme sur lui-meme. Une particule qui sort par le haut
     rentre par le bas : la nuee ne se vide donc jamais, meme apres une
     minute passee libre, et rien n'a besoin d'etre recycle a la main.

     SES BORNES VIENNENT DU CADRE, elles ne sont pas ecrites en dur. Fixees a
     1,6 alors que le mot s'etendait jusqu'a 1,90, elles teleportaient les
     lettres des deux bouts de l'autre cote : on lisait AZUR au lieu de
     KAZURA, et la faute n'etait ni dans la cible ni dans le ressort. Regle a
     retenir : un domaine periodique doit TOUJOURS contenir ce qu'on y met,
     et sa taille se deduit, elle ne se devine pas. */
  p.x = mod(p.x + uEtendue.x, uEtendue.x * 2.0) - uEtendue.x;
  p.y = mod(p.y + uEtendue.y, uEtendue.y * 2.0) - uEtendue.y;
  p.z = clamp(p.z, -0.9, 0.9);

  sortiePos = vec4(p, P.w);
  sortieVit = vec4(v, graine);
}`;

const SOMMET_POINTS = `#version 300 es
in vec2 aIndex;
uniform sampler2D uPos;
uniform sampler2D uVit;
uniform vec2  uCadre;
uniform float uTaille;
uniform float uCohesion;
out float vVitesse;
out float vProfondeur;
out float vBord;
out float vFondu;

void main() {
  vec3 p = texture(uPos, aIndex).xyz;
  vec4 V = texture(uVit, aIndex);
  vVitesse = length(V.xyz);
  float graine = V.w;

  /* ══ LA NUEE SE DISSOUT, ELLE NE S'ETEINT PAS D'UN BLOC ════════════════
     Matheo : « les boules devraient se dissoudre, tranquillement, peu importe
     la vitesse ». Elle disparaissait par l'opacite de sa BOITE : tout le
     rectangle baissait ensemble, ce qui se lit comme un calque qu'on efface
     et pas comme une matiere qui s'en va.

     Chaque particule a maintenant son propre moment de disparition, tire de sa
     graine. Elles s'eteignent donc les unes apres les autres, sur un
     intervalle de cohesion et non sur un intervalle de temps : la dissolution
     dure exactement ce que dure la descente de la cohesion, et celle-ci est
     bornee en vitesse. Le geste du visiteur decide OU, jamais COMBIEN DE
     TEMPS. */
  float seuil = graine * 0.58;
  vFondu = smoothstep(seuil, seuil + 0.40, uCohesion);

  /* ══ LE CADRE INVISIBLE ════════════════════════════════════════════════
     Matheo : « j'ai l'impression qu'il y a un cadre invisible ». Il y en avait
     un, et c'est le domaine periodique de la simulation : une particule qui
     sort par la droite rentre par la gauche, donc la nuee libre dessinait le
     RECTANGLE exact de son domaine, arete nette, dans le noir.

     On ne peut pas retirer le domaine, il est ce qui empeche la nuee de se
     vider. On rend sa couture invisible : les particules s'eteignent en
     approchant du bord, et se rallument de l'autre cote. La teleportation a
     toujours lieu, elle n'a plus de temoin.

     ══ ET LE BORD QUI COUPE EST CELUI DE LA TOILE, PAS CELUI DU DOMAINE ══════
     Premiere version, l'extinction visait la couture : elle est a 1,62 fois le
     cadre en hauteur, or la TOILE s'arrete a 1,0. Les particules etaient donc
     tranchees net par le bord de la toile bien avant d'avoir commence a
     s'eteindre, et le rectangle etait toujours la, un peu plus petit. J'avais
     corrige le bon defaut au mauvais endroit.

     La regle : une chose qui se coupe a un bord doit s'eteindre sur CE bord-la,
     et le premier a couper est toujours le plus proche. Ici c'est la toile. Le
     mot, lui, ne va pas au-dela de six dixiemes du cadre : il ne peut pas etre
     mordu par un fondu qui commence a deux tiers. */
  vec2 bord = abs(p.xy) / uCadre;
  vBord = max(bord.x, bord.y);

  /* ══ MOT TENU, LA PROFONDEUR NE TEINTE PLUS RIEN ═══════════════════════
     La couleur baissait de vingt pour cent avec la profondeur propre a chaque
     particule. Sur un nuage c'est le relief ; sur un mot plat, c'est du bruit
     de luminosite qui pique la lettre de trous sombres et brouille sa FORME,
     qui est justement ce qu'on veut lire. Meme raison que pour la position :
     un mot n'a pas d'epaisseur. */
  vProfondeur = mix(p.z, 0.0, uCohesion);

  /* Une perspective legere, tenue a la main. Une vraie matrice n'apporterait
     rien ici et couterait un calcul de plus par particule : ce qu'on veut,
     c'est que ce qui est au fond soit un peu plus petit et un peu plus loin
     du centre, pas une camera. */
  float k = 1.0 / (1.0 + p.z * 0.30);

  /* ══ LA PERSPECTIVE S'EFFACE QUAND LE MOT EST TENU ═════════════════════
     C'est ICI qu'etaient les lettres deformees, et le symptome le disait :
     Matheo a remarque que « le z et le u, ca va » et que toutes les autres
     etaient mal formees. Le Z et le U sont les deux lettres du MILIEU.

     La position a l'ecran etait multipliee par le facteur de perspective, qui
     depend de la profondeur propre a chaque particule. Deux particules visant
     le meme point de la lettre mais tirees a des profondeurs differentes
     atterrissaient donc a des endroits differents, ECARTES DU CENTRE en
     proportion de leur distance a l'axe. Au centre, zero ecart : le mot y
     etait net. Aux extremites, un dixieme d'unite de monde, soit plusieurs
     fois l'epaisseur d'une contre-forme : le K, le R et les A se bouchaient.

     La profondeur garde tout son sens quand la nuee est libre : c'est elle
     qui donne du volume au nuage. Elle n'en a aucun quand le mot est tenu,
     puisqu'un mot est plat. On la fait donc disparaitre avec la cohesion, et
     la lettre retrouve exactement le dessin de la police.

     La TAILLE du point, elle, continue de suivre la profondeur : ce qui est
     au fond reste plus petit, et cela ne deplace rien. */
  float kPos = mix(k, 1.0, uCohesion);
  vec2 e = p.xy * kPos;
  gl_Position = vec4(e.x / uCadre.x, e.y / uCadre.y, 0.0, 1.0);

  /* Les particules grossissent en se dispersant. Une nuee libre faite de
     points aussi fins qu'un mot serre disparait a l'oeil. */
  /* Le point grossit quand la nuee se disperse, pour que le nuage garde de la
     matiere, et MAIGRIT quand le mot est tenu : un gros point deborde la
     lettre et lui mange ses contres. A pleine cohesion on descend sous un
     pixel et demi, ce qui donne une arete nette.

     ET IL CESSE DE SUIVRE LA PROFONDEUR quand le mot est tenu, pour la meme
     raison que la couleur : des points de tailles melees sur un aplat font
     une bouillie, des points de taille egale font une MASSE, et c'est une
     masse qu'on lit comme une lettre. */
  gl_PointSize = uTaille * kPos * mix(1.90, 1.12, uCohesion);
}`;

const FRAGMENT_POINTS = `#version 300 es
precision highp float;
in float vVitesse;
in float vProfondeur;
in float vBord;
in float vFondu;
out vec4 sortie;
uniform float uCohesion;

void main() {
  /* Un point carre se voit tout de suite. On taille un disque, et on le fait
     fondre sur ses bords : c'est ce degrade, et rien d'autre, qui fait que
     deux cent mille points se lisent comme une matiere et non comme du bruit. */
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c) * 4.0;
  float a = exp(-r * 4.4);

  /* La dissolution particule par particule, et l'extinction avant la couture
     du domaine. Les deux se posent ici, sur l'alpha, parce que les deux sont
     des questions de PRESENCE et non de forme. */
  a *= vFondu;
  a *= 1.0 - smoothstep(0.66, 1.0, vBord);
  if (a < 0.004) discard;

  /* Le jade pour ce qui est calme, le violet pour ce qui file. La couleur
     dit donc la vitesse, et pendant la dispersion la nuee vire d'elle-meme
     vers le violet sans qu'on ait a l'animer. */
  vec3 jade   = vec3(0.055, 0.760, 0.520);
  vec3 violet = vec3(0.560, 0.320, 0.980);
  vec3 blanc  = vec3(0.880, 1.000, 0.960);
  float f = smoothstep(0.05, 1.25, vVitesse);
  vec3 col = mix(jade, violet, f);
  col = mix(col, blanc, smoothstep(0.55, 1.0, uCohesion) * 0.34);

  /* Ce qui est loin est plus sombre. Sans cette ligne, la nuee est plate. */
  col *= 0.55 + 0.45 * (1.0 - clamp(vProfondeur * 0.5 + 0.5, 0.0, 1.0));

  sortie = vec4(col * a, a);
}`;

/* ══════════════════════════════════════════════════════════════════════════ */

/* Les demi-cotes du domaine periodique, en parts du cadre. Une seule source :
   la simulation les utilise pour refermer le monde sur lui-meme, le dessin
   pour eteindre les particules avant la couture. */
const ETENDUE = [1.34, 1.62];

export async function monterLaNuee(toile, options = {}) {
  const gl = toile.getContext('webgl2', {
    alpha: true, antialias: false, premultipliedAlpha: true,
    powerPreference: 'high-performance', depth: false
  });
  if (!gl) return null;
  /* Sans le rendu vers des textures a virgule flottante, il n'y a pas de
     memoire ou ranger des positions : la piece n'existe pas. On le dit et on
     rend la main, le mot dessine reprend sa place. */
  if (!gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('OES_texture_float_linear');

  const petit = innerWidth < 760;
  /* ══ LE CARRE DE SIMULATION SUIT LA TOILE ═══════════════════════════════
     512 sur 512 fait 262 144 particules, quelle que soit la place ou on les
     met. Sur une toile de 2234 sur 698, cela fait 0,17 particule par pixel a
     simuler pour 0,72 a dessiner : on payait donc a simuler ce qu'on ne
     dessinait pas. Le carre se cale desormais sur la surface reelle, borne
     entre 256 et 448, et le nombre de particules divise par deux ou trois
     sans qu'on voie la difference. */
  /* 448 sur grand ecran, soit 200 704 particules. A 384 le mot ressortait
     comme un saupoudrage : lisible, mais faible. Un mot fait de points ne
     vaut que par sa DENSITE autant que par la nettete de son contour. */
  /* On remonte a 512, soit 262 144. La mesure le justifie maintenant qu'elle
     existe : le releve compte 130 000 points d'encre sur un grand ecran, donc
     448 n'en donnait qu'UNE ET DEMIE par point. Le compte juste est deux, et
     il se lit dans `parPoint`. Ce que ca coute est paye ailleurs : depuis que
     la nuee s'eteint des que le mot est parti, elle ne calcule plus rien
     pendant les neuf dixiemes du voyage. */
  const TAILLE = options.taille || (petit ? 320 : 512);
  const N = TAILLE * TAILLE;

  /* ── Compilation ────────────────────────────────────────────────────── */
  function compiler(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source.trim());
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('nuee, programme refuse :', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  function programme(vs, fs) {
    const v = compiler(gl.VERTEX_SHADER, vs), f = compiler(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('nuee, liaison refusee :', gl.getProgramInfoLog(p));
      return null;
    }
    gl.deleteShader(v); gl.deleteShader(f);
    return p;
  }

  const progSim = programme(SOMMET_PLEIN, SIMULATION);
  const progPts = programme(SOMMET_POINTS, FRAGMENT_POINTS);
  if (!progSim || !progPts) return null;

  const u = (p, noms) => Object.fromEntries(noms.map(n => [n, gl.getUniformLocation(p, n)]));
  const uSim = u(progSim, ['uPos', 'uVit', 'uCible', 'uCohesion', 'uDt', 'uTemps', 'uSouris', 'uEtendue']);
  const uPts = u(progPts, ['uPos', 'uVit', 'uCadre', 'uTaille', 'uCohesion']);

  /* ── Les surfaces ───────────────────────────────────────────────────── */
  function texture(donnees) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TAILLE, TAILLE, 0, gl.RGBA, gl.FLOAT, donnees);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /* ══ LA CIBLE ════════════════════════════════════════════════════════
     Ou chaque particule doit se rendre pour que le mot apparaisse. On ecrit
     le mot dans un canevas ordinaire, on relit ses points, et on garde ceux
     qui sont dans l'encre. Chaque particule recoit ensuite l'un d'eux, tire
     au hasard : c'est ce tirage qui fait que la lettre se remplit de facon
     egale au lieu de se dessiner ligne par ligne.

     LE MOT EST MESURE, PAS DEVINE. On demande sa largeur reelle a la police
     chargee, puis on choisit le corps pour qu'il tienne dans le cadre. Un
     corps fixe deborde des que la fenetre change, et sur l'ecran de 3440
     pixels de Matheo il occupait le tiers de la place. */
  function fabriquerLaCible(mot, mondeX, mondeY) {
    /* ══ LE RELEVE SE CALE SUR L'ECRAN ═════════════════════════════════════
       Il etait ecrit en dur, 1800 points de large. Ce nombre n'a de sens que
       compare a la taille REELLE a laquelle le mot sera peint : en dessous,
       l'arete des lettres est quantifiee par gros paliers ; au-dessus, on
       releve un detail que personne ne verra en payant une passe sur des
       millions de pixels.

       Un point du releve vaut donc un pixel de la toile. La formule dit
       exactement cela : la toile couvre deux fois le cadre, le releve en
       couvre `mondeX`, le rapport donne la part de la toile qu'il occupe. Sur
       l'ecran de Matheo, 2040 pixels de toile donnent 1673 : le 1800 d'avant
       etait juste, mais par chance, et il ne l'etait que la. */
    const L = Math.max(700, Math.min(petit ? 1500 : 2600,
                       Math.round(toile.width * (mondeX / (2 * largeurMonde)))));
    const Hc = Math.round(L * (mondeY / mondeX));
    const c = document.createElement('canvas');
    c.width = L; c.height = Hc;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000'; g.fillRect(0, 0, L, Hc);

    /* Le mot occupe 68 % du canevas de cible, pas 94. La toile deborde son
       cadre de 36 % pour laisser de la place a la dispersion : a 94 % le mot
       finissait a 110 % de la largeur de la fenetre et se coupait aux deux
       bouts. Ce qu'on regle ici est une part de la TOILE, pas de l'ecran, et
       les deux ne sont pas la meme chose. */
    const cible = L * 0.68;
    let corps = Hc * 0.9;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 26; i++) {
      g.font = '800 ' + corps.toFixed(1) + 'px Archivo, system-ui, sans-serif';
      const w = g.measureText(mot).width;
      if (Math.abs(w - cible) < cible * 0.01) break;
      corps *= cible / Math.max(w, 1);
      if (corps > Hc * 1.6) { corps = Hc * 1.6; break; }
    }
    g.font = '800 ' + corps.toFixed(1) + 'px Archivo, system-ui, sans-serif';
    g.letterSpacing = Math.round(corps * 0.04) + 'px';
    g.fillStyle = '#fff';
    g.fillText(mot, L / 2, Hc / 2);

    const px = g.getImageData(0, 0, L, Hc).data;
    /* ══ ON RELEVE L'ENCRE PIXEL PAR PIXEL ═══════════════════════════════
       On la relevait un point sur deux, ce qui suffit en nombre : la lettre en
       contient plus que la nuee n'a de particules. Mais un pas de deux cree une
       GRILLE, et les particules s'y alignent : le mot sortait en damier.

       Le remede d'origine etait un tremblement de deux pixels pour combler la
       grille. Il comblait aussi les contre-formes, qui n'en font que six. On
       supprime donc la grille a la source plutot que de la masquer : un point
       par pixel, un tremblement bien sous le pixel, et les deux problemes
       tombent ensemble. Le releve coute une passe sur huit cent mille pixels,
       une fois par changement de taille de fenetre.

       ON COMPTE AVANT D'ECRIRE. Le releve tenait dans un tableau ordinaire
       qu'on allongeait point par point : sur un grand ecran cela fait un
       million d'entrees, donc autant de reallocations et huit fois la place
       d'un tableau typé. Deux passes sur des entiers coutent moins qu'une
       passe qui redimensionne. */
    let nEncre = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] > 128) nEncre++;
    if (!nEncre) return null;
    const encre = new Int32Array(nEncre * 2);
    for (let y = 0, n = 0; y < Hc; y++) {
      for (let x = 0; x < L; x++) {
        if (px[(y * L + x) * 4] > 128) { encre[n++] = x; encre[n++] = y; }
      }
    }
    releve = { corps: Math.round(corps), largeurTexte: Math.round(g.measureText(mot).width),
               canevas: [L, Hc], encre: nEncre, parPoint: +(N / nEncre).toFixed(2),
               mondeX: +mondeX.toFixed(3), mondeY: +mondeY.toFixed(3) };

    /* ══ ON BAT L'ENCRE AVANT DE LA DISTRIBUER ═══════════════════════════
       Le parcours regulier ci-dessous garantit une couverture uniforme, et
       c'est pour cela qu'il existe. Mais il parcourt l'encre DANS L'ORDRE OU
       ON L'A RELEVEE, c'est-a-dire ligne par ligne : avec un pas de 1,49
       point, chaque ligne recoit un sous-ensemble regulier, et ces regularites
       se dephasent d'une ligne a l'autre. Le mot ressortait tisse d'un moire
       fin, tres visible sur un aplat.

       En battant la liste une fois, deux indices voisins ne designent plus des
       pixels voisins : la regularite du parcours reste, sa trace spatiale
       disparait. Melange a graine fixe, pour que le mot soit identique d'une
       visite a l'autre. */
    let bat = 987654321;
    const dé = () => { bat = (bat * 1103515245 + 12345) >>> 0; return bat / 4294967296; };
    for (let i = encre.length / 2 - 1; i > 0; i--) {
      const j = (dé() * (i + 1)) | 0;
      const ax = encre[i * 2], ay = encre[i * 2 + 1];
      encre[i * 2] = encre[j * 2]; encre[i * 2 + 1] = encre[j * 2 + 1];
      encre[j * 2] = ax; encre[j * 2 + 1] = ay;
    }

    const data = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      /* ══ UN TIRAGE REPARTI, PAS UN TIRAGE AU HASARD ══════════════════
         Tirer chaque destination au hasard dans la lettre semble juste et ne
         l'est pas : le hasard fait des paquets. Sur deux cent mille tirages,
         certaines zones recoivent trois fois plus de points que leurs
         voisines, et la lettre ressort grumeleuse, plus dense par endroits,
         trouee ailleurs. C'est ce qui donnait au mot son air sale.

         On parcourt donc l'encre REGULIEREMENT, un point tous les nEncre/N,
         avec un jeu d'un intervalle pour casser la regularite visible. La
         couverture devient uniforme et la lettre prend un grain de velours
         au lieu d'un grain de sable. */
      /* ══ ET LE PARCOURS EST EXACT, PLUS APPROXIMATIF ═══════════════════
         Il y avait un `+ Math.random()` dans l'indice, pose pour « casser la
         regularite visible ». Il la cassait deux fois, puisque la liste est
         desormais BATTUE : le desordre spatial etait deja acquis, et ce jeu ne
         faisait plus qu'une chose, rendre le nombre de particules par point
         d'encre ALEATOIRE. Certains points en recevaient quatre, d'autres
         zero. C'est de la que venait le mitage de la lettre, ces trous sombres
         qu'on voit en agrandissant le mot : pas d'un manque de particules,
         d'un tirage inegal de celles qu'on avait.

         Sans lui, chaque point d'encre recoit exactement le meme nombre de
         particules, a une pres. La lettre devient une masse pleine, et une
         masse pleine se lit par sa FORME, qui est tout ce qu'on lui demande. */
      const k = Math.min(nEncre - 1, (i * nEncre / N) | 0);
      const x = encre[k * 2], y = encre[k * 2 + 1];
      /* LE JEU DOIT COUVRIR TOUT L'ECART DE LA GRILLE. L'encre est relevee un
         point sur deux ; un jeu d'un seul pixel laissait donc une ligne vide
         sur deux, et le tirage reparti, qui parcourt l'encre ligne par ligne,
         rendait ces vides parfaitement reguliers. Le mot sortait raye
         d'horizontales. On joue donc sur DEUX pixels, centres sur le point
         releve, et la grille disparait. */
      /* ══ LE TREMBLEMENT DOIT RESTER SOUS LE PIXEL ═══════════════════════
         Il etait de deux pixels, pour corriger un moirage d'echantillonnage.
         Le remede a fait pire que le mal : deux pixels d'etalement sur des
         contres de lettre qui en font six, et les trous du A, du R et du K se
         bouchent. Matheo l'a dit exactement : « on n'arrive pas a distinguer
         les espaces ou ils devraient etre pour que les lettres soient bien
         formees ».

         A six dixiemes de pixel, le moirage reste casse parce que le tirage
         est different pour chaque particule, et l'arete de la lettre redevient
         une arete. Ce qui compte pour casser une trame n'est pas l'amplitude
         du bruit, c'est qu'il soit decorrele. */
      /* ══ IL VAUT EXACTEMENT UN PIXEL, NI PLUS NI MOINS ══════════════════
         Six dixiemes, c'etait encore une valeur choisie a vue entre deux
         defauts. La bonne valeur se demontre : un pixel du releve REPRESENTE
         un carre du plan, et l'echantillon juste d'un carre est un tirage
         uniforme DANS ce carre. Moins d'un pixel laisse des couloirs vides
         entre les colonnes de points, et ces couloirs forment un reseau qui
         bat avec la grille de l'ecran : c'est le tissu qu'on voyait courir
         dans les lettres. Plus d'un pixel deborde sur le voisin, et les
         contre-formes se bouchent.

         A un pixel pile, les positions couvrent le plan sans trou ni
         recouvrement, la trame disparait sans que l'arete bouge d'un
         cheveu. */
      data[i * 4]     = ((x + Math.random() - 0.5) / L - 0.5) * mondeX;
      data[i * 4 + 1] = (0.5 - (y + Math.random() - 0.5) / Hc) * mondeY;
      data[i * 4 + 2] = (Math.random() - 0.5) * 0.55;
      data[i * 4 + 3] = 1;
    }
    return data;
  }

  /* ── Etat initial ───────────────────────────────────────────────────── */
  const posInit = new Float32Array(N * 4);
  const vitInit = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 1.5;
    posInit[i * 4]     = Math.cos(a) * r * 1.6;
    posInit[i * 4 + 1] = Math.sin(a) * r;
    posInit[i * 4 + 2] = (Math.random() - 0.5) * 0.8;
    posInit[i * 4 + 3] = 1;
    vitInit[i * 4 + 3] = Math.random();
  }

  let texPos = [texture(posInit), texture(null)];
  let texVit = [texture(vitInit), texture(null)];
  let texCible = texture(null);
  let lu = 0;

  const cadres = [gl.createFramebuffer(), gl.createFramebuffer()];
  for (let i = 0; i < 2; i++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, cadres[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPos[i], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, texVit[i], 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return null;
    }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  /* ── Les tampons ────────────────────────────────────────────────────── */
  const quad = gl.createVertexArray();
  gl.bindVertexArray(quad);
  const tampQuad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampQuad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aCoin = gl.getAttribLocation(progSim, 'aCoin');
  gl.enableVertexAttribArray(aCoin);
  gl.vertexAttribPointer(aCoin, 2, gl.FLOAT, false, 0, 0);

  const nuage = gl.createVertexArray();
  gl.bindVertexArray(nuage);
  const index = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    index[i * 2]     = ((i % TAILLE) + 0.5) / TAILLE;
    index[i * 2 + 1] = (((i / TAILLE) | 0) + 0.5) / TAILLE;
  }
  const tampIndex = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampIndex);
  gl.bufferData(gl.ARRAY_BUFFER, index, gl.STATIC_DRAW);
  const aIndex = gl.getAttribLocation(progPts, 'aIndex');
  gl.enableVertexAttribArray(aIndex);
  gl.vertexAttribPointer(aIndex, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  /* ── Cadre du monde ─────────────────────────────────────────────────── */
  let largeurMonde = 3.2, hauteurMonde = 1.0, definition = 1, dessinees = N;

  /* ══ UN OEIL DE PAPIER, POUR LES INSTRUMENTS ═══════════════════════════
     La nuee n'a pas de camera : elle projette a la main, en divisant la
     position du monde par le cadre. C'est une projection orthographique, et
     une orthographique s'ecrit tres bien sous la forme de matrices que la
     couche d'instruments sait lire.

     On fabrique donc une camera de papier : identite pour le monde, et une
     projection qui ne fait que diviser par le cadre. Aucune dependance a
     three, aucune duplication de la formule de projection, et les etiquettes
     restent accrochees au mot exactement comme les points le sont.

     Colonnes d'abord, comme partout en OpenGL. */
  const fauxOeil = {
    matrixWorldInverse: { elements: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] },
    projectionMatrix:   { elements: [1,0,0,0, 0,1,0,0, 0,0,-0.02,0, 0,0,0,1] }
  };
  function mesurer() {
    const r = toile.getBoundingClientRect();
    if (!r.width || !r.height) return;
    definition = Math.min(devicePixelRatio || 1, petit ? 1.5 : 2);
    toile.width  = Math.round(r.width * definition);
    toile.height = Math.round(r.height * definition);
    /* ══ LA DENSITE SE DEDUIT DE LA SURFACE ═══════════════════════════
       Sur telephone, les memes particules tombaient dans une toile huit fois
       plus petite : 1,6 particule par pixel contre 0,6 sur grand ecran. Comme
       le melange est additif, chaque pixel recevait la lumiere de plusieurs
       particules et la nuee ressortait en TACHE BLANCHE saturee, ou le mot
       ne se lisait plus du tout. Ce n'etait pas un probleme de reglage
       d'ecran, c'etait une densite non bornee.

       On plafonne donc a un peu plus d'une demi-particule par pixel, ce qui
       tient la meme matiere sur toutes les tailles d'ecran. Les particules
       en trop ne sont pas detruites, elles ne sont pas dessinees : la
       simulation reste entiere et la densite redevient juste des que la
       fenetre grandit. */
    dessinees = Math.min(N, Math.max(20000, Math.round(toile.width * toile.height * 0.72)));

    hauteurMonde = 1.0;
    const neuve = hauteurMonde * (r.width / r.height);
    /* La cible ne se refait que si le cadre a vraiment change de forme.
       Reconstruire 262 144 destinations coute quatre mega-octets a ecrire, et
       un observateur de taille peut se declencher a chaque image pendant
       qu'on tire un bord de fenetre. Un pour cent d'ecart est le seuil : en
       dessous, personne ne verrait la difference. */
    const change = Math.abs(neuve - largeurMonde) > largeurMonde * 0.01;
    largeurMonde = neuve;
    fauxOeil.projectionMatrix.elements[0] = 1 / largeurMonde;
    fauxOeil.projectionMatrix.elements[5] = 1 / hauteurMonde;
    if (change || !cibleFaite) { poserLaCible(); cibleFaite = true; }
  }
  let cibleFaite = false;

  let releve = null;
  let motCourant = toile.dataset.mot || 'KAZURA';
  function poserLaCible() {
    /* On vise 82 % de la largeur du cadre : le mot doit respirer, et sur un
       ecran tres large il ne doit pas non plus devenir une ligne d'horizon. */
    const data = fabriquerLaCible(motCourant, largeurMonde * 1.64, hauteurMonde * 1.64);
    if (!data) return;
    gl.bindTexture(gl.TEXTURE_2D, texCible);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TAILLE, TAILLE, 0, gl.RGBA, gl.FLOAT, data);
  }

  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }

  /* ON N'APPELLE PAS LA MESURE, ON LA FAIT DECLENCHER PAR L'ELEMENT. Montee
     pendant que le seuil d'entree couvre encore la page, la toile n'a aucune
     taille : la mesure sortait sans rien faire et la nuee restait sur les
     300 sur 150 par defaut d'un canevas, donc un timbre-poste flou au milieu
     d'un ecran de 3440. Un observateur de redimensionnement remesure des que
     l'element prend sa vraie place, quelle qu'en soit la raison, et il couvre
     aussi le changement de fenetre : une seule voie au lieu de deux. */
  mesurer();
  const oeil = new ResizeObserver(() => mesurer());
  oeil.observe(toile);

  /* ── La main ────────────────────────────────────────────────────────── */
  const souris = { x: 99, y: 99, f: 0 };
  const suivre = e => {
    const r = toile.getBoundingClientRect();
    if (!r.width) return;
    souris.x = ((e.clientX - r.left) / r.width - 0.5) * 2 * largeurMonde;
    souris.y = (0.5 - (e.clientY - r.top) / r.height) * 2 * hauteurMonde;
    souris.f = 1;
  };
  addEventListener('pointermove', suivre, { passive: true });
  addEventListener('pointerleave', () => { souris.f = 0; }, { passive: true });

  /* ── Boucle ─────────────────────────────────────────────────────────── */
  let cohesion = 0, cohesionVisee = 1, visible = true, actif = true;
  let dernier = performance.now(), temps = 0;
  let cumul = 0, images = 0, allege = false, dort = false;

  /* La cohesion suit sa consigne avec du retard : le mot ne claque pas, il
     se rassemble. Le retard est plus long a la dispersion qu'au rappel,
     parce qu'une chose qui se defait doit prendre son temps et une chose
     qui revient doit paraitre decidee.

     ══ CE LISSAGE-CI EST DEVENU UN LISSAGE, PAS UNE DUREE ══════════════════
     Il valait 0,055 et 0,030 par image, soit trois dixiemes et six dixiemes de
     seconde de constante de temps. Or la page du voyage borne DEJA la vitesse
     de la consigne, pour que le geste du visiteur ne decide pas de la duree.
     Les deux retards s'ajoutaient : pres de trois secondes pour reformer le
     mot, ce que Matheo a resume par « c'est beaucoup trop long pour se
     remettre a l'original ».

     Deux amortisseurs en serie sur le meme mouvement, c'est un de trop. Celui
     d'ici redevient ce qu'il aurait toujours du etre : de quoi arrondir un
     saut de consigne, un dixieme de seconde, rien de plus. La DUREE se decide
     la ou elle se voit, chez l'appelant. */
  function rapprocher(dt) {
    const rappel = cohesionVisee > cohesion ? 0.13 : 0.085;
    cohesion += (cohesionVisee - cohesion) * (1 - Math.pow(1 - rappel, dt * 60));
  }

  function pas(dt) {
    temps += dt;

    gl.bindVertexArray(quad);
    gl.useProgram(progSim);
    gl.bindFramebuffer(gl.FRAMEBUFFER, cadres[1 - lu]);
    gl.viewport(0, 0, TAILLE, TAILLE);

    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texPos[lu]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texVit[lu]);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texCible);
    gl.uniform1i(uSim.uPos, 0);
    gl.uniform1i(uSim.uVit, 1);
    gl.uniform1i(uSim.uCible, 2);
    gl.uniform1f(uSim.uCohesion, cohesion);
    gl.uniform1f(uSim.uDt, Math.min(dt, 1 / 30));
    gl.uniform1f(uSim.uTemps, temps);
    gl.uniform3f(uSim.uSouris, souris.x, souris.y, souris.f);
    gl.uniform2f(uSim.uEtendue, ETENDUE[0] * largeurMonde, ETENDUE[1] * hauteurMonde);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    lu = 1 - lu;
  }

  function peindre() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, toile.width, toile.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /* Melange additif : deux particules qui se superposent donnent plus de
       lumiere, jamais moins. C'est ce qui fait qu'une lettre dense s'allume
       toute seule pendant que la nuee dispersee reste un voile. */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.bindVertexArray(nuage);
    gl.useProgram(progPts);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texPos[lu]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texVit[lu]);
    gl.uniform1i(uPts.uPos, 0);
    gl.uniform1i(uPts.uVit, 1);
    gl.uniform2f(uPts.uCadre, largeurMonde, hauteurMonde);
    gl.uniform1f(uPts.uTaille, (petit ? 1.25 : 1.5) * definition);
    gl.uniform1f(uPts.uCohesion, cohesion);
    gl.drawArrays(gl.POINTS, 0, allege ? (dessinees / 2) | 0 : dessinees);
    gl.disable(gl.BLEND);
  }

  function battre(maintenant) {
    if (!actif) return;
    requestAnimationFrame(battre);
    const dt = Math.min(0.05, Math.max(0, (maintenant - dernier) / 1000));
    dernier = maintenant;
    if (!visible) return;

    cumul += dt; images++;
    if (images >= 90) {
      const moyenne = cumul / images; cumul = 0; images = 0;
      /* Un seul palier, et il retire la moitie des particules plutot que de
         baisser la definition : sur une nuee, c'est la densite qui coute, et
         c'est aussi ce qui se remarque le moins quand elle baisse. */
      if (moyenne > 0.027 && !allege) allege = true;
    }

    rapprocher(dt);

    /* ══ UNE NUEE ETEINTE NE SE CALCULE PAS ════════════════════════════════
       Passe la premiere descente, la cohesion reste a zero pour les neuf
       dixiemes du voyage. La nuee continuait a simuler deux cent mille
       particules et a les peindre, toutes invisibles depuis qu'elles se
       dissolvent : c'est le pire moment pour depenser, puisque c'est celui ou
       la scene en trois dimensions demande tout.

       Et c'est le regime le PLUS cher : cohesion nulle, la turbulence tourne a
       pleine amplitude, donc les cent treize millions de sinus par image que
       la garde plus haut evite quand le mot est tenu. On dort, et on efface
       une fois en s'endormant pour ne pas laisser un reste a l'ecran. */
    const eteinte = cohesion < 0.0025 && cohesionVisee < 0.0025;
    if (eteinte) {
      if (!dort) {
        dort = true;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, toile.width, toile.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      return;
    }
    dort = false;

    pas(dt);
    peindre();
  }
  requestAnimationFrame(battre);

  /* ══ LES INSTRUMENTS DU MOT ════════════════════════════════════════════
     Trois releves accroches a la nuee. Le troisieme est le meilleur du site :
     la cohesion est la consigne que le defilement tourne, et elle passe de
     zero a un sous les yeux du visiteur pendant que les lettres se forment.
     Un chiffre qui bouge exactement au rythme de ce qu'on regarde explique
     la piece sans une phrase de legende.

     Les ancres sont donnees en FRACTIONS du cadre, jamais en unites fixes :
     le cadre suit la forme de la fenetre, et une ancre figee a 1,2 sortirait
     du mot sur un ecran etroit pour se planter dans le vide sur un large. */
  /* Une page qui possede DEJA une couche d'instruments accrochee a son monde
     n'a pas besoin de celle de la nuee : sept etiquettes a l'ecran ne se
     lisent plus, elles se comptent. Le voyage l'eteint pour cette raison. */
  let instruments = null;
  /* Les ancres sont posees SUR le mot, au bord du dessin, jamais dans le vide :
     une croix qui ne touche rien ne designe rien. Les deux premieres tiennent
     l'arete haute des lettres et leur etiquette monte dans le noir au-dessus ;
     la troisieme tient l'arete basse et la sienne descend.

     Les valeurs sont mesurees sur le releve de la nuee : le mot occupe environ
     cinquante-cinq centiemes du cadre en largeur, vingt-huit en hauteur. */
  const ANCRES = [
    { x:  0.40, y:  0.27, cote: 'droite', vers: 'haut', l: 112 },
    { x: -0.45, y:  0.27, cote: 'gauche', vers: 'haut', l: 112 },
    { x:  0.13, y: -0.28, cote: 'droite', vers: 'bas',  l: 128 }
  ];
  (options.instruments === false ? Promise.reject(new Error('eteints')) : import('./instruments.js' + (options.version || ''))).then(({ monterLesInstruments }) => {
    instruments = monterLesInstruments(toile, fauxOeil, { dans: toile.parentElement });
    const point = i => ({ x: ANCRES[i].x * largeurMonde, y: ANCRES[i].y * hauteurMonde, z: 0 });
    /* ══ ELLES S'EFFACENT AVEC LE MOT ══════════════════════════════════════
       Une etiquette accrochee a une chose qui se dissout doit se dissoudre
       avec elle, sinon elle reste a designer du vide. Elle suit donc la
       cohesion, comme les particules, et part un peu AVANT elles : une
       legende qui survit a son sujet est plus genante qu'une legende qui
       manque. */
    const avecLeMot = () => (cohesion - 0.34) / 0.42;
    const pose = (i, titre, valeur) => instruments.poser({
      point: point(i), titre, valeur, montre: avecLeMot,
      cote: ANCRES[i].cote, vers: ANCRES[i].vers, longueur: ANCRES[i].l
    });
    pose(0, 'KAZURA_NUEE', () => (allege ? (dessinees / 2) | 0 : dessinees).toLocaleString('fr') + ' particules');
    pose(1, 'SIMULATION',  () => TAILLE + ' × ' + TAILLE + '  ·  flottant 32 bits');
    pose(2, 'COHESION',    () => cohesion.toFixed(3));
    /* Le cadre change avec la fenetre : les ancres se recalculent, sinon
       elles glissent hors du mot au premier changement de forme. */
    const recaler = () => ANCRES.forEach((a, i) => {
      const p = instruments.releve(i);
      if (p) { p.point.x = a.x * largeurMonde; p.point.y = a.y * hauteurMonde; }
    });
    addEventListener('resize', recaler, { passive: true });
    recaler();
  }).catch(e => { if (e && e.message !== 'eteints') console.warn('instruments indisponibles', e); });

  return {
    /* La couche d'instruments, exposee pour pouvoir la FORCER a se replacer.
       Elle se replace d'elle-meme a chaque image, ce qui suffit partout sauf
       dans un panneau d'essai qui ne compose pas : la, aucune image n'a lieu,
       les etiquettes restent la ou elles ont ete creees, et on mesure des
       positions qui n'existent nulle part. Deux fois ce soir j'ai failli
       corriger une mise en page d'apres ces chiffres-la. */
    instruments: { placer: () => instruments?.placer(), bilan: () => instruments?.bilan() },
    /* La consigne, entre zero et un. C'est le seul bouton de la piece, et
       c'est le defilement qui le tourne. */
    tenir(v) { cohesionVisee = Math.max(0, Math.min(1, v)); },
    montrer(v) { if (v && !visible) dernier = performance.now(); visible = v; },
    /* La sonde, partagee avec toutes les pieces. Voir js/sonde.js. */
    async sonder(n = 40) {
      const { sonderToile } = await import('./sonde.js');
      visible = true;
      return sonderToile(gl, toile, () => { pas(1 / 60); peindre(); }, n);
    },
    /* La poignee de reglage : elle avance la simulation et peint, par le
       CHEMIN NORMAL. Elle sert quand l'onglet n'est pas au premier plan, cas
       ou le navigateur gele les images et ou la nuee reste figee sur son
       etat de depart. Ce qu'elle montre est donc bien ce que la page fait. */
    avancer(images = 60, dt = 1 / 60) {
      dort = false;
      for (let i = 0; i < images; i++) { rapprocher(dt); pas(dt); }
      peindre();
      return this.bilan();
    },
    ecrire(mot) { motCourant = mot; poserLaCible(); },
    detruire() {
      actif = false;
      instruments?.detruire();
      oeil.disconnect();
      removeEventListener('pointermove', suivre);
      texPos.concat(texVit, [texCible]).forEach(t => gl.deleteTexture(t));
      cadres.forEach(c => gl.deleteFramebuffer(c));
      gl.deleteProgram(progSim); gl.deleteProgram(progPts);
    },
    bilan() {
      return {
        particules: allege ? (dessinees / 2) | 0 : dessinees,
        elevees: N,
        cote: TAILLE,
        cohesion: +cohesion.toFixed(3),
        visee: +cohesionVisee.toFixed(3),
        allege,
        definition: +definition.toFixed(2),
        cadre: [+largeurMonde.toFixed(3), +hauteurMonde.toFixed(3)],
        releve,
        toile: [toile.width, toile.height]
      };
    }
  };
}
