/**
 * Toutes les donnees du site, au meme endroit.
 *
 * Source unique : la fiche Planity publique de Sousi Beauty, relevee le
 * 7 aout 2026, catalogue entierement deplie. Les intitules, les prix, les
 * durees et les descriptions sont **les siens, mot pour mot**.
 *
 * Regle : rien ne s'invente. C'est ce qui a fait echouer la maquette de
 * L'Art Esthetique, dont les 7 soins et leurs prix etaient fabriques.
 */

export const MARQUE = 'Sousi Beauty';
export const PRATICIENNE = 'Saliha';
export const EQUIPE = ['Saliha', 'Olga'];

export const ADRESSE = '12 place des Halles, 67000 Strasbourg';
export const ADRESSE_COURTE = 'Place des Halles, Strasbourg';
export const TELEPHONE = '07 84 95 03 95';
export const TELEPHONE_TEL = '+33784950395';
export const INSTAGRAM = 'https://www.instagram.com/sousi_beauty_/';
export const INSTAGRAM_HANDLE = '@sousi_beauty_';

export const AVIS = {
  note: '4,8',
  nombre: 227,
  source: 'Planity',
  detail: [
    { critere: 'Accueil', note: '4,9' },
    { critere: 'Propreté', note: '4,9' },
    { critere: 'Cadre & ambiance', note: '4,9' },
    { critere: 'Qualité de la prestation', note: '4,8' },
  ],
};

/** « Vous sublimez est notre vocation depuis 15 ans » — sa bio Instagram. */
export const DEPUIS_ANS = 15;

export const HORAIRES = [
  { jour: 'Lundi au samedi', creneau: '10h00 – 18h00' },
  { jour: 'Dimanche', creneau: 'Fermé' },
];

/** Sa presentation, reprise de sa fiche Planity sans la reecrire. */
export const PRESENTATION = [
  'Nous vous accueillons pour vous faire découvrir toutes les techniques esthétiques, vous rendre encore plus belle et plus sûre de vous.',
  'Du maquillage éphémère pour une soirée à des techniques de maquillage semi-permanent (4 à 10 semaines) ou permanent (dermopigmentation), nous vous conseillons pour vous embellir selon vos envies et ce qui vous convient le mieux.',
  'Prendre soin de soi, se sentir belle, c’est avant tout une façon de rester féminine et d’avoir confiance en soi, quel que soit votre âge ou les aléas de la vie.',
];


/**
 * Ses photos — les 9 de sa fiche Planity, prises par un photographe.
 * Ce sont ses vrais murs, sa vraie cabine, son vrai comptoir. Rien de genere.
 */
export const PHOTOS = [
  { src: '/photos/photo-01.webp', alt: 'L’accueil de Sousi Beauty : comptoir clair, logo doré sur un mur à lattes noires' },
  { src: '/photos/photo-02.webp', alt: 'L’institut Sousi Beauty à Strasbourg' },
  { src: '/photos/photo-03.webp', alt: 'Le coin d’attente, fauteuils en velours beige devant la vitrine' },
  { src: '/photos/photo-04.webp', alt: 'Un espace de soin de l’institut' },
  { src: '/photos/photo-05.webp', alt: 'Détail de l’aménagement de l’institut' },
  { src: '/photos/photo-06.webp', alt: 'La cabine de soin : table drapée de blanc, lampe loupe, appareil d’hydrafacial' },
  { src: '/photos/photo-07.webp', alt: 'Le poste de travail d’une praticienne' },
  { src: '/photos/photo-08.webp', alt: 'Les produits de soin sur les étagères de l’institut' },
  { src: '/photos/photo-09.webp', alt: 'Vue d’ensemble de l’institut Sousi Beauty' },
];


export type Prestation = {
  nom: string;
  duree: string;
  prix: number;
  /** `true` quand la fiche indique « à partir de ». */
  apd?: boolean;
  description?: string;
};

export type Famille = {
  id: string;
  titre: string;
  chapeau?: string;
  prestations: Prestation[];
};

/**
 * Les cinq signatures — celles qu'elle met en avant, celles qui portent ses
 * prix, celles qu'elle photographie. Le reste du catalogue vit dans LA_CARTE.
 */
export const SIGNATURES: Prestation[] = [
  {
    nom: 'Microblading',
    duree: '1 h 30',
    prix: 230,
    description:
      'Une technique poil à poil qui restructure vos sourcils de façon naturelle. À l’aide d’une aiguille plate, les poils sont redessinés un à un et les éventuels trous comblés, en respectant la morphologie naturelle de vos sourcils.',
  },
  {
    nom: 'Powder brows ou microshading',
    duree: '1 h 30',
    prix: 260,
    description:
      'Un ombrage doux, en points sur du poil à poil ou en points seuls selon le résultat souhaité. Le sourcil est dessiné et densifié en conservant le côté naturel : le regard est sublimé, sans effet compact.',
  },
  {
    nom: 'Lèvres complètes micro lips',
    duree: '1 h 30',
    prix: 300,
    description:
      'Le maquillage permanent « full lips » colore l’intégralité des lèvres dans une teinte choisie, pour un rendu naturel ou sophistiqué.',
  },
  {
    nom: 'Eye-liner poudré',
    duree: '2 h',
    prix: 240,
    description:
      'Le trait de l’œil en version estompée, tenue longue durée.',
  },
  {
    nom: 'Microneedling — visage et cou',
    duree: '1 h 30',
    prix: 120,
    description:
      'Le microneedling stimule chaque couche de peau et régénère le collagène naturel. Il agit sur l’acné, les cicatrices, les cernes, les pores dilatés, les rides, les taches et les vergetures.',
  },
];

/**
 * Le catalogue complet, dans l'ordre et avec les intitules de sa fiche.
 * 12 familles, 150 lignes : c'est un archetype 6, catalogue filtrable, et il
 * lui faut deux niveaux — sinon la visiteuse fait defiler 150 lignes.
 */
export const LA_CARTE: Famille[] = [
  {
    id: 'semi-permanent',
    titre: 'Maquillage semi-permanent',
    chapeau:
      'Le microblading tient entre 6 mois et 1 an. Le microshading et le powder brows tiennent entre 6 mois et 3 ans, voire plus. La durée varie selon votre type de peau.',
    prestations: [
      { nom: 'Microblading', duree: '1 h 30', prix: 230 },
      { nom: 'Microblading — retouche fixatrice 1 mois', duree: '1 h', prix: 60 },
      { nom: 'Microblading — retouche 4 à 6 mois', duree: '1 h', prix: 90 },
      { nom: 'Microblading — retouche annuelle', duree: '1 h', prix: 120 },
      { nom: 'Powder brows ou microshading', duree: '1 h 30', prix: 260 },
      { nom: 'Powder brows — retouche fixatrice 1 mois', duree: '1 h', prix: 60 },
      { nom: 'Powder brows — retouche 4 à 6 mois', duree: '1 h', prix: 100 },
      { nom: 'Powder brows — retouche annuelle', duree: '1 h', prix: 160 },
      { nom: 'Rattrapage sourcils virés au rouge ou au gris', duree: '20 min', prix: 40 },
      { nom: 'Eye-liner haut', duree: '1 h 30', prix: 160 },
      { nom: 'Eye-liner haut — retouche 1 mois', duree: '1 h', prix: 60 },
      { nom: 'Eye-liner haut — retouche annuelle', duree: '1 h', prix: 90 },
      { nom: 'Eye-liner bas', duree: '1 h 30', prix: 150 },
      { nom: 'Eye-liner bas — retouche 1 mois', duree: '45 min', prix: 50 },
      { nom: 'Eye-liner bas — retouche annuelle', duree: '1 h', prix: 90 },
      { nom: 'Eye-liner poudré', duree: '2 h', prix: 240 },
      { nom: 'Eye-liner poudré — retouche 1 mois', duree: '1 h', prix: 60 },
      { nom: 'Eye-liner poudré — retouche 2 à 3 ans', duree: '2 h', prix: 160 },
      { nom: 'Lèvres — contour', duree: '1 h 15', prix: 160 },
      { nom: 'Lèvres contour — retouche 1 mois', duree: '1 h', prix: 60 },
      { nom: 'Lèvres complètes micro lips', duree: '1 h 30', prix: 300 },
      { nom: 'Micro lips — retouche 1 mois', duree: '1 h', prix: 100 },
      { nom: 'Micro lips — retouche annuelle', duree: '1 h', prix: 150 },
      { nom: 'Grain de beauté, retouche comprise', duree: '20 min', prix: 70 },
      { nom: 'Taches de rousseur', duree: '1 h', prix: 130 },
      { nom: 'Taches de rousseur — retouche 1 mois', duree: '40 min', prix: 50 },
      { nom: 'Détatouage sourcils ou lèvres', duree: '20 min', prix: 100 },
      { nom: 'Microneedling et cocktail vitaminé', duree: '1 h', prix: 420 },
    ],
  },
  {
    id: 'regard',
    titre: 'Regard — rehaussement et teintures',
    chapeau: 'Le rehaussement offre un regard ouvert : les cils sont plus courbés, plus brillants, et paraissent plus noirs.',
    prestations: [
      { nom: 'Rehaussement de cils', duree: '45 min', prix: 60 },
      { nom: 'Rehaussement de cils avec teinture', duree: '1 h', prix: 65 },
      { nom: 'Mascara permanent', duree: '30 min', prix: 60 },
      { nom: 'Brow lift', duree: '30 min', prix: 45 },
      { nom: 'Teinture des cils', duree: '20 min', prix: 22 },
      { nom: 'Teinture des sourcils', duree: '20 min', prix: 17 },
      { nom: 'Teinture des cils et sourcils', duree: '20 min', prix: 25 },
      { nom: 'Teinture henné végétal', duree: '30 min', prix: 27 },
      { nom: 'Formule — rehaussement + mascara permanent', duree: '1 h', prix: 90 },
      { nom: 'Formule — rehaussement ou mascara permanent + teinture', duree: '45 min', prix: 65 },
      { nom: 'Formule — brow lift + épilation des sourcils + teinture', duree: '45 min', prix: 70 },
    ],
  },
  {
    id: 'extensions',
    titre: 'Extensions de cils',
    chapeau: 'Des cils en fibre de soie, des bouquets faits à la main, une épaisseur de 0,07 et une courbure C ou D choisie selon votre base.',
    prestations: [
      { nom: 'Pose cil à cil en soie', duree: '1 h 20', prix: 80 },
      { nom: 'Cil à cil — remplissage 2 semaines', duree: '40 min', prix: 60, apd: true },
      { nom: 'Pose mixte en soie', duree: '1 h 30', prix: 95 },
      { nom: 'Mixte — remplissage 2 semaines', duree: '1 h', prix: 70 },
      { nom: 'Volume russe', duree: '1 h 30', prix: 110 },
      { nom: 'Volume russe — remplissage 2 semaines', duree: '40 min', prix: 75, apd: true },
      { nom: 'Volume intense — Hollywood', duree: '1 h 45', prix: 125 },
      { nom: 'Volume intense — remplissage 2 semaines', duree: '40 min', prix: 90, apd: true },
      { nom: 'Dépose des extensions', duree: '15 min', prix: 15 },
    ],
  },
  {
    id: 'technologies',
    titre: 'Technologies — microneedling, hydrafacial, carbon peel',
    prestations: [
      { nom: 'Microneedling — visage et cou', duree: '1 h 30', prix: 120 },
      { nom: 'Microneedling visage et cou — pack 3 séances', duree: '1 h 30', prix: 300 },
      { nom: 'Microneedling — visage, cou et décolleté', duree: '1 h 30', prix: 150 },
      { nom: 'Microneedling visage, cou, décolleté — pack 3 séances', duree: '1 h 30', prix: 390 },
      { nom: 'Hydrafacial — la séance', duree: '1 h 30', prix: 110 },
      { nom: 'Hydrafacial — pack 3 séances', duree: '1 h 30', prix: 290 },
      { nom: 'Carbon peel visage', duree: '1 h', prix: 120 },
      { nom: 'Carbon peel visage — 3 séances', duree: '1 h', prix: 310 },
      { nom: 'Carbon peel aisselles', duree: '30 min', prix: 70 },
    ],
  },
  {
    id: 'soins-visage',
    titre: 'Soins du visage',
    prestations: [
      { nom: 'Soin revitalisant, hydratant', duree: '1 h', prix: 65 },
      { nom: 'Soin purifiant anti-points noirs', duree: '1 h', prix: 65 },
      { nom: 'Soin anti-âge repulpant', duree: '1 h', prix: 80 },
      { nom: 'Soin éclat express', duree: '30 min', prix: 40 },
      { nom: 'Soin au collagène véritable anti-âge', duree: '1 h', prix: 90 },
      { nom: 'Pose de masque express', duree: '30 min', prix: 30 },
      { nom: 'Soin anti-acné', duree: '1 h', prix: 100 },
    ],
  },
  {
    id: 'mary-cohr',
    titre: 'Soins visage Mary Cohr',
    prestations: [
      { nom: 'Multi pureté — soin purifiant anti-imperfections', duree: '40 min', prix: 55 },
      { nom: 'PhytOxygène — soin oxygénant détoxifiant', duree: '50 min', prix: 85 },
      { nom: 'Dermo Peeling — soin peeling rénovateur', duree: '50 min', prix: 115 },
      { nom: 'CatioVital Jeunesse — anti-âge avec énergie cellulaire', duree: '1 h', prix: 90 },
      { nom: 'Age Signes Reverse — soin immunité anti-âge', duree: '50 min', prix: 125 },
      { nom: 'CatioVital Lifting — lifting avec stimulation musculaire', duree: '1 h', prix: 120 },
      { nom: 'Age Firming — lifting fermeté', duree: '50 min', prix: 120 },
      { nom: 'Eye Lifting — anti-rides, anti-poches, anti-cernes', duree: '40 min', prix: 75 },
      { nom: 'Soin I.H.C', duree: '45 min', prix: 120 },
    ],
  },
  {
    id: 'epilation',
    titre: 'Épilation à la cire — femme',
    prestations: [
      { nom: 'Sourcils', duree: '15 min', prix: 12 },
      { nom: 'Sourcils + teinture', duree: '30 min', prix: 25 },
      { nom: 'Restructuration des sourcils', duree: '20 min', prix: 19 },
      { nom: 'Restructuration des sourcils + teinture', duree: '30 min', prix: 30 },
      { nom: 'Lèvres ou menton', duree: '15 min', prix: 10 },
      { nom: 'Sourcils + lèvres + menton', duree: '30 min', prix: 27 },
      { nom: 'Nez ou oreilles', duree: '15 min', prix: 8 },
      { nom: 'Joues', duree: '15 min', prix: 15 },
      { nom: 'Cou', duree: '15 min', prix: 15 },
      { nom: 'Tout le visage', duree: '30 min', prix: 40 },
      { nom: 'Demi-jambes', duree: '20 min', prix: 21 },
      { nom: 'Trois quarts de jambes', duree: '25 min', prix: 25 },
      { nom: 'Cuisses', duree: '20 min', prix: 20 },
      { nom: 'Jambes entières', duree: '30 min', prix: 30 },
      { nom: 'Demi-ventre', duree: '10 min', prix: 10 },
      { nom: 'Ventre entier', duree: '20 min', prix: 18 },
      { nom: 'Demi-dos', duree: '15 min', prix: 14 },
      { nom: 'Dos entier', duree: '25 min', prix: 22 },
      { nom: 'Torse entier', duree: '20 min', prix: 23 },
      { nom: 'Épaules', duree: '15 min', prix: 15 },
      { nom: 'Demi-bras', duree: '15 min', prix: 18 },
      { nom: 'Bras complets', duree: '20 min', prix: 25 },
      { nom: 'Aisselles', duree: '15 min', prix: 14 },
      { nom: 'Maillot simple', duree: '15 min', prix: 14 },
      { nom: 'Maillot échancré', duree: '30 min', prix: 19 },
      { nom: 'Maillot américain', duree: '25 min', prix: 26 },
      { nom: 'Maillot intégral', duree: '25 min', prix: 33 },
      { nom: 'Sillon inter-fessier', duree: '10 min', prix: 10 },
      { nom: 'Maillot intégral avec sillon inter-fessier', duree: '30 min', prix: 35 },
      { nom: 'Fesses', duree: '15 min', prix: 18 },
      {
        nom: 'Soin vajacial',
        duree: '1 h',
        prix: 80,
        description:
          'Épilation complète du maillot et du sillon, gommage sous vapozone, extraction des poils incarnés, masque éclaircissant, sérum hydratant et ralentisseur de pousse.',
      },
      { nom: 'Forfait — demi-jambes + maillot classique ou aisselles', duree: '20 min', prix: 29 },
      { nom: 'Forfait — demi-jambes + maillot classique + aisselles', duree: '30 min', prix: 40 },
      { nom: 'Forfait — demi-jambes + maillot échancré + aisselles', duree: '30 min', prix: 45 },
      { nom: 'Forfait — demi-jambes + maillot intégral + aisselles', duree: '40 min', prix: 58 },
      { nom: 'Forfait — jambes complètes + maillot classique ou aisselles', duree: '45 min', prix: 38 },
      { nom: 'Forfait — jambes complètes + maillot classique + aisselles', duree: '1 h', prix: 47 },
      { nom: 'Forfait — jambes complètes + maillot échancré + aisselles', duree: '1 h', prix: 52 },
      { nom: 'Forfait — jambes complètes + maillot intégral + aisselles', duree: '1 h 15', prix: 67 },
    ],
  },
  {
    id: 'epilation-homme',
    titre: 'Épilation à la cire — homme',
    prestations: [
      { nom: 'Sourcils', duree: '15 min', prix: 14 },
      { nom: 'Joues', duree: '15 min', prix: 17 },
      { nom: 'Cou', duree: '15 min', prix: 20 },
      { nom: 'Barbe', duree: '25 min', prix: 20 },
      { nom: 'Nez ou oreilles', duree: '15 min', prix: 9 },
      { nom: 'Jambes entières', duree: '30 min', prix: 38 },
      { nom: 'Ventre', duree: '20 min', prix: 20 },
      { nom: 'Demi-dos', duree: '20 min', prix: 16 },
      { nom: 'Dos entier', duree: '30 min', prix: 30 },
      { nom: 'Torse entier', duree: '30 min', prix: 30 },
      { nom: 'Épaules', duree: '20 min', prix: 18 },
      { nom: 'Demi-bras', duree: '20 min', prix: 22 },
      { nom: 'Bras entier', duree: '30 min', prix: 30 },
      { nom: 'Aisselles', duree: '15 min', prix: 16 },
    ],
  },
  {
    id: 'definitive',
    titre: 'Épilation définitive',
    chapeau: 'Des forfaits de 6 séances existent. Plus d’informations à l’institut ou par téléphone.',
    prestations: [
      { nom: 'Inter-sourcilier', duree: '15 min', prix: 20 },
      { nom: 'Menton, joue, mains, cou ou lèvre', duree: '20 min', prix: 40 },
      { nom: 'Aisselles ou maillot simple', duree: '20 min', prix: 60 },
      { nom: 'Ventre', duree: '20 min', prix: 70 },
      { nom: 'Maillot échancré, torse ou épaule', duree: '30 min', prix: 80 },
      { nom: 'Maillot intégral avec inter-fessier', duree: '30 min', prix: 110 },
      { nom: 'Bras entier, demi-jambe ou cuisses', duree: '30 min', prix: 130 },
      { nom: 'Dos complet', duree: '30 min', prix: 150 },
      { nom: 'Jambes entières', duree: '40 min', prix: 180 },
    ],
  },
  {
    id: 'mains-pieds',
    titre: 'Mains et pieds',
    prestations: [
      { nom: 'Manucure', duree: '20 min', prix: 19 },
      { nom: 'Manucure spa', duree: '40 min', prix: 30 },
      { nom: 'Manucure + pose vernis semi-permanent', duree: '40 min', prix: 45 },
      { nom: 'Dépose + manucure + pose vernis semi-permanent', duree: '1 h', prix: 54 },
      { nom: 'Soin à la paraffine — mains', duree: '15 min', prix: 20 },
      { nom: 'Limage + coupage', duree: '10 min', prix: 7 },
      { nom: 'Pose vernis longue durée', duree: '20 min', prix: 16 },
      { nom: 'Pose vernis semi-permanent avec limage et coupage', duree: '35 min', prix: 33 },
      { nom: 'Dépose vernis semi-permanent', duree: '15 min', prix: 12 },
      { nom: 'Pose de gel sur ongles naturels', duree: '1 h', prix: 45 },
      { nom: 'Pose de gel sur ongles naturels + couleur ou french', duree: '1 h 15', prix: 50 },
      { nom: 'Pose de gel avec capsules + french ou gel de couleur', duree: '1 h 30', prix: 65, apd: true },
      { nom: 'Retrait gel', duree: '25 min', prix: 24 },
      { nom: 'Décor d’ongles, à l’unité', duree: '3 min', prix: 2 },
      { nom: 'Beauté des pieds express', duree: '20 min', prix: 19 },
      { nom: 'Beauté des pieds spa', duree: '40 min', prix: 42 },
      { nom: 'Beauté des pieds express + vernis semi-permanent', duree: '35 min', prix: 42 },
      { nom: 'Beauté des pieds spa + vernis semi-permanent', duree: '1 h 15', prix: 65 },
      { nom: 'Soin calluspeeling', duree: '30 min', prix: 40 },
      { nom: 'Soin calluspeeling + vernis semi-permanent', duree: '1 h', prix: 62 },
      { nom: 'Soin paraffine — pieds', duree: '15 min', prix: 25 },
    ],
  },
  {
    id: 'corps',
    titre: 'Soins du corps',
    prestations: [
      { nom: 'Gommage corporel', duree: '30 min', prix: 50 },
      { nom: 'Soin du dos — nettoie, adoucit, purifie', duree: '50 min', prix: 60 },
      { nom: 'Modelage relaxant aux huiles essentielles', duree: '1 h', prix: 70 },
      { nom: 'Modelage californien', duree: '1 h', prix: 70 },
      { nom: 'Modelage du dos', duree: '30 min', prix: 45 },
    ],
  },
  {
    id: 'sourire',
    titre: 'Blanchiment dentaire',
    prestations: [
      { nom: 'Une séance', duree: '1 h', prix: 100 },
      { nom: 'Pack 2 séances — sourire extra white', duree: '1 h', prix: 150 },
      { nom: 'Entretien après 1 an', duree: '40 min', prix: 80 },
      { nom: 'Pose strass dentaire', duree: '10 min', prix: 20, apd: true },
    ],
  },
];

export const FAQ = [
  {
    q: 'Combien de temps tient un maquillage permanent ?',
    r: 'Le microblading tient entre 6 mois et 1 an. Le microshading et le powder brows tiennent entre 6 mois et 3 ans, voire plus. Cette durée varie selon votre type de peau et votre système de défense, qui diffèrent d’une personne à l’autre.',
  },
  {
    q: 'Pourquoi une retouche à un mois ?',
    r: 'C’est la retouche fixatrice. Elle se prend un mois après la séance et fait partie du protocole : c’est elle qui fixe le résultat une fois la peau cicatrisée. Elle est facturée 60 € pour les sourcils comme pour l’eye-liner.',
  },
  {
    q: 'Microblading ou powder brows, je choisis quoi ?',
    r: 'Le microblading dessine les poils un à un : c’est le rendu le plus proche d’un sourcil naturel, et il tient de 6 mois à 1 an. Le powder brows crée un ombrage en points : il densifie davantage, tient de 6 mois à 3 ans, et sublime le regard sans effet compact.',
  },
  {
    q: 'Mes sourcils ont viré au rouge ou au gris, vous pouvez rattraper ?',
    r: 'Oui. Le rattrapage de sourcils virés au rouge ou au gris est une prestation à part entière, à 40 €. Si le pigment doit être retiré, le détatouage sourcils ou lèvres est à 100 €.',
  },
  {
    q: 'Que fait le microneedling ?',
    r: 'Il stimule chaque couche de peau et régénère le collagène naturel. Il agit sur l’acné, les cicatrices, l’excès de sébum, les cernes, les points noirs, les pores dilatés, les rides, les taches et les vergetures.',
  },
  {
    q: 'Où êtes-vous exactement ?',
    r: 'Au 12 place des Halles, à Strasbourg, dans le centre commercial des Halles — à côté de la station Ancienne Synagogue / Les Halles. Ouvert du lundi au samedi de 10 h à 18 h.',
  },
];

/* ------------------------------------------------------------------ *
 * LES UNIVERS — la refonte du systeme de prix.
 *
 * 165 prestations dans 12 accordeons sur une seule page, c'etait un
 * tableur. On passe a QUATRE univers, un par page, chacun avec sa propre
 * URL : c'est aussi ce qui fait le referencement local, une page par
 * intention de recherche.
 *
 * Chaque univers annonce son PRIX D'ENTREE, pas une moyenne. C'est le
 * chiffre que la visiteuse cherche : « a partir de combien ».
 * ------------------------------------------------------------------ */

export type Univers = {
  id: string;
  page: string;
  titre: string;
  sousTitre: string;
  intro: string;
  photo: string;
  alt: string;
  /** identifiants des familles de LA_CARTE qui composent cet univers */
  familles: string[];
  /**
   * La prestation d'appel : celle qu'on annonce en « a partir de ».
   *
   * Ce n'est PAS le minimum du catalogue. Le minimum de l'univers epilation
   * est un decor d'ongle a 2 EUR, celui du maquillage permanent un rattrapage
   * a 40 EUR : deux chiffres vrais, et deux promesses fausses. On designe donc
   * la premiere vraie prestation de chaque univers, a la main.
   */
  appel: { nom: string; prix: number };
};

export const UNIVERS: Univers[] = [
  {
    id: 'permanent',
    page: 'maquillage-permanent',
    titre: 'Maquillage permanent',
    sousTitre: 'Sourcils, lèvres, eye-liner',
    intro:
      'Microblading, powder brows, micro lips, eye-liner. Le trait tient de six mois a trois ans selon la technique et votre peau. La retouche fixatrice a un mois fait partie du protocole, jamais un supplement surprise.',
    photo: '/photos/photo-05.webp',
    alt: 'Un espace de soin de l’institut Sousi Beauty',
    familles: ['semi-permanent'],
    appel: { nom: 'Eye-liner bas', prix: 150 },
  },
  {
    id: 'peau',
    page: 'soins',
    titre: 'Le soin de la peau',
    sousTitre: 'Microneedling, hydrafacial, carbon peel, Mary Cohr',
    intro:
      'Trois technologies et une gamme d’institut. Le microneedling regenere le collagene, l’hydrafacial nettoie en profondeur, le carbon peel resserre les pores. Les soins Mary Cohr completent a la main.',
    photo: '/photos/photo-06.webp',
    alt: 'La cabine de soin de l’institut, table drapee et appareil d’hydrafacial',
    familles: ['technologies', 'soins-visage', 'mary-cohr', 'corps'],
    appel: { nom: 'Soin éclat express', prix: 40 },
  },
  {
    id: 'regard',
    page: 'regard',
    titre: 'Le regard',
    sousTitre: 'Extensions, rehaussement, teintures',
    intro:
      'Cil a cil, mixte, volume russe ou Hollywood, en fibre de soie et bouquets faits main. Ou le rehaussement, qui recourbe vos cils naturels sans rien ajouter.',
    photo: '/photos/photo-08.webp',
    alt: 'Les produits de soin sur les etageres de l’institut',
    familles: ['regard', 'extensions'],
    appel: { nom: 'Teinture des sourcils', prix: 17 },
  },
  {
    id: 'corps',
    page: 'epilation',
    titre: 'Épilation et beauté',
    sousTitre: 'Cire, définitive, mains et pieds, sourire',
    intro:
      'L’epilation a la cire pour elles et pour eux, l’epilation definitive par forfaits de six seances, la beaute des mains et des pieds, et le blanchiment dentaire.',
    photo: '/photos/photo-09.webp',
    alt: 'Vue d’ensemble de l’institut Sousi Beauty',
    familles: ['epilation', 'epilation-homme', 'definitive', 'mains-pieds', 'sourire'],
    appel: { nom: 'Épilation sourcils', prix: 12 },
  },
];

/** Les familles d'un univers, dans l'ordre declare. */
export function famillesDe(u: Univers): Famille[] {
  return u.familles
    .map((id) => LA_CARTE.find((f) => f.id === id))
    .filter((f): f is Famille => Boolean(f));
}

/** Le prix d'appel de l'univers — une vraie prestation, designee a la main. */
export function prixDEntree(u: Univers): number {
  return u.appel.prix;
}

/** Combien de prestations dans cet univers. */
export function nbPrestations(u: Univers): number {
  return famillesDe(u).reduce((n, f) => n + f.prestations.length, 0);
}
