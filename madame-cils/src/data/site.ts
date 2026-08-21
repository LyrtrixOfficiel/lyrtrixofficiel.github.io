/**
 * Toutes les donnees du site, au meme endroit.
 *
 * Elles viennent de `clients/madame-cils/brief.json`, lui-meme rempli depuis la
 * fiche Planity publique et l'Instagram @madamecils67 le 5 aout 2026.
 *
 * Regle : les prix, durees et intitules ne s'inventent pas. Si Laura change un
 * tarif, il se change ici et nulle part ailleurs.
 */

export const MARQUE = 'Madame Cils';
export const PRATICIENNE = 'Laura';

/** Zone publiee. L'adresse exacte n'apparait nulle part sur le site : elle est
 *  communiquee par Planity apres confirmation du rendez-vous. */
export const ZONE = 'Illkirch-Graffenstaden — Strasbourg sud';
/** Meme zone, tournee pour une phrase. */
export const ZONE_PROSE = 'Illkirch-Graffenstaden, au sud de Strasbourg';
export const TELEPHONE = '07 89 58 29 75';
export const TELEPHONE_TEL = '+33789582975';
export const INSTAGRAM = 'https://www.instagram.com/madamecils67/';
export const INSTAGRAM_HANDLE = '@madamecils67';

export const AVIS = { note: '5,0', nombre: 214, source: 'Planity' };
export const DEPUIS = 2022;

export const ACCES = [
  'Tram A et E — arrêt Colonne, puis 5 min à pied',
  'Bus 57 et 67 — arrêt Centre de Traumatologie, devant la résidence',
  'Bus 260 et 270 — arrêt Colonne, puis 5 min à pied',
  'Autoroute à 5 min',
];

/** Stationnement et entree — annonces sur sa fiche, jamais avec le nom de la voie. */
export const STATIONNEMENT = [
  'Stationnements visiteurs à l’entrée de la résidence, ou en créneau le long des immeubles.',
  'Merci de ne pas stationner sur les places numérotées.',
  'L’entrée se fait côté parking, pas par le portail privé.',
];

export const HORAIRES = [
  { jour: 'Lundi', creneau: '12h00 – 20h00' },
  { jour: 'Mardi', creneau: '10h00 – 19h30' },
  { jour: 'Mercredi', creneau: '10h00 – 20h00' },
  { jour: 'Jeudi', creneau: '10h00 – 20h00' },
  { jour: 'Vendredi', creneau: '10h00 – 19h00' },
  { jour: 'Samedi', creneau: '10h00 – 15h00' },
  { jour: 'Dimanche', creneau: 'Fermé' },
];

export type Prestation = {
  nom: string;
  famille: Famille;
  prix: number;
  duree: number;
  description?: string;
};

export const FAMILLES = [
  'Cils à cils',
  'Mixte',
  'Volume russe',
  'Poses à effets',
  'Rehaussement',
  'Dépose',
] as const;

export type Famille = (typeof FAMILLES)[number];

/** Ce que chaque famille est, en une phrase. Sert de chapeau a la grille. */
export const FAMILLE_RESUME: Record<Famille, string> = {
  'Cils à cils':
    'Une extension posée sur chaque cil naturel. Le rendu le plus discret : le regard est intensifié, la frange reste légère.',
  Mixte:
    'Des bouquets fins faits à la main sur vos cils naturels. Le compromis entre le cils à cils et le volume russe : plus intense que l’un, plus léger que l’autre.',
  'Volume russe':
    'Des bouquets de plusieurs cils ultrafins sur chaque cil naturel. Le rendu le plus dense.',
  'Poses à effets':
    'Brésilienne et whispy : des longueurs et des bouquets disposés pour dessiner le regard, plutôt que seulement le densifier.',
  Rehaussement:
    'L’alternative aux extensions : vos cils naturels sont recourbés dès la racine, ce qui ouvre le regard. Tenue moyenne d’un à deux mois, selon vos cils.',
  Dépose:
    'Application d’un solvant pour retirer les extensions. La vôtre, ou celle d’un autre institut.',
};

export const PRESTATIONS: Prestation[] = [
  {
    nom: 'Pose complète',
    famille: 'Cils à cils',
    prix: 55,
    duree: 90,
    description: 'Une extension synthétique posée sur chaque cil naturel.',
  },
  { nom: 'Remplissage — 2 semaines', famille: 'Cils à cils', prix: 30, duree: 45 },
  { nom: 'Remplissage — 3 à 4 semaines', famille: 'Cils à cils', prix: 35, duree: 60 },

  {
    nom: 'Pose complète',
    famille: 'Mixte',
    prix: 65,
    duree: 105,
    description: 'Des bouquets fins faits à la main sur vos cils naturels.',
  },
  { nom: 'Remplissage — 2 semaines', famille: 'Mixte', prix: 35, duree: 45 },
  { nom: 'Remplissage — 3 à 4 semaines', famille: 'Mixte', prix: 40, duree: 60 },

  {
    nom: 'Pose complète',
    famille: 'Volume russe',
    prix: 70,
    duree: 120,
    description: 'Des bouquets de cils ultrafins sur chaque cil naturel.',
  },
  { nom: 'Remplissage — 2 semaines', famille: 'Volume russe', prix: 40, duree: 60 },
  { nom: 'Remplissage — 3 à 4 semaines', famille: 'Volume russe', prix: 45, duree: 75 },

  {
    nom: 'Pose brésilienne',
    famille: 'Poses à effets',
    prix: 65,
    duree: 120,
    description: 'Une pose à effet, plus dessinée qu’une pose classique.',
  },
  { nom: 'Remplissage brésilienne — cils YY', famille: 'Poses à effets', prix: 40, duree: 90 },
  {
    nom: 'Pose whispy',
    famille: 'Poses à effets',
    prix: 65,
    duree: 120,
    description: 'Des bouquets plus fins combinés à des extensions plus longues, disposées pour créer un effet de pointes.',
  },
  { nom: 'Remplissage whispy', famille: 'Poses à effets', prix: 40, duree: 90 },

  {
    nom: 'Rehaussement simple',
    famille: 'Rehaussement',
    prix: 30,
    duree: 45,
    description: 'Permanente et fixation. Vos cils naturels recourbés dès la racine.',
  },
  {
    nom: 'Rehaussement + teinture et soin',
    famille: 'Rehaussement',
    prix: 40,
    duree: 60,
    description: 'Permanente, fixation, teinture et soin au botox. Le résultat est davantage accentué.',
  },

  {
    nom: 'Dépose — pose faite ici',
    famille: 'Dépose',
    prix: 10,
    duree: 30,
    description: 'Application d’un solvant pour retirer les extensions.',
  },
  { nom: 'Dépose — pose faite ailleurs', famille: 'Dépose', prix: 15, duree: 30 },
];

/** Photos de Laura, reprises de @madamecils67 avec leur legende d'origine. */
export const GALERIE = [
  { src: '/images/effet-whispy.webp', alt: 'Regard après une pose d’extensions effet whispy', legende: 'Effet whispy' },
  { src: '/images/volume-mixte-brun.webp', alt: 'Pose d’extensions volume mixte en cils bruns', legende: 'Volume mixte, cils bruns' },
  { src: '/images/rehaussement-teinture.webp', alt: 'Cils naturels après un rehaussement avec teinture et soin', legende: 'Rehaussement + teinture' },
  { src: '/images/mixte-courbure-c.webp', alt: 'Pose d’extensions mixte en courbure C', legende: 'Mixte, courbure C' },
  { src: '/images/extensions-colorees.webp', alt: 'Pose d’extensions de cils colorés avec une touche de rose', legende: 'Extensions colorées' },
  { src: '/images/rehaussement-soin.webp', alt: 'Rehaussement de cils avec teinture et soin', legende: 'Rehaussement, 1 h' },
  { src: '/images/cils-a-cils-rose.webp', alt: 'Pose cils à cils avec une touche de rose', legende: 'Cils à cils, touche de rose' },
  { src: '/images/rehaussement-botox.webp', alt: 'Rehaussement de cils avec teinture et soin botox', legende: 'Rehaussement + soin' },
  { src: '/images/cils-a-cils-cc.webp', alt: 'Pose cils à cils en courbure CC', legende: 'Cils à cils, courbure CC' },
  { src: '/images/apercu-poses.webp', alt: 'Aperçu de différentes poses d’extensions de cils', legende: 'Plusieurs poses' },
  { src: '/images/colorees-compil.webp', alt: 'Compilation de poses d’extensions colorées', legende: 'Poses colorées' },
  { src: '/images/rehaussement-reel.webp', alt: 'Regard agrandi après un rehaussement de cils', legende: 'Rehaussement' },
];

/**
 * Comparateur du premier ecran.
 *
 * Ce ne sont PAS deux etats d'un meme regard : ce sont deux prestations
 * differentes, identifiees par la legende de leur publication d'origine. Les
 * etiquettes le disent — un faux avant/apres serait un argument de vente faux.
 */
export const COMPARATEUR = {
  gauche: {
    src: '/images/rehaussement-teinture.webp',
    label: 'Rehaussement',
    alt: 'Cils naturels recourbés après un rehaussement avec teinture et soin',
  },
  droite: {
    src: '/images/volume-mixte-brun.webp',
    label: 'Extensions',
    alt: 'Regard après une pose d’extensions de cils volume mixte',
  },
};

export const REGLES = [
  'Paiement en espèces ou par virement — la carte bancaire n’est pas acceptée.',
  'L’adresse exacte vous est communiquée par Planity après confirmation du rendez-vous.',
  'Un remplissage se prend dans les 2 à 4 semaines qui suivent la pose. Au-delà, c’est une pose complète.',
];

export const FAQ = [
  {
    q: 'Extensions ou rehaussement, je choisis quoi ?',
    r: 'Le rehaussement travaille vos cils naturels : il les recourbe dès la racine, sans rien ajouter. Les extensions ajoutent de la longueur et de la densité. Si vos cils sont déjà longs mais retombent, le rehaussement suffit souvent. Si vous voulez du volume, ce sont les extensions.',
  },
  {
    q: 'Combien de temps ça tient ?',
    r: 'Pour des extensions, un remplissage se prend entre 2 et 4 semaines après la pose, selon la pousse de vos cils naturels. Au-delà de 4 semaines, il reste trop peu d’extensions : la prestation devient une pose complète. Un rehaussement, lui, tient en moyenne un à deux mois — là aussi, cela dépend de vos cils.',
  },
  {
    q: 'Quelle pose pour un premier rendez-vous ?',
    r: 'Le cils à cils, en général. C’est le rendu le plus discret et le plus léger, et il permet de voir comment vos cils naturels réagissent. On ajuste la densité au rendez-vous suivant si vous voulez plus.',
  },
  {
    q: 'Combien de temps dure le rendez-vous ?',
    r: 'De 45 minutes pour un rehaussement ou un remplissage court, à 2 heures pour un volume russe ou une pose à effets. La durée exacte est indiquée sur chaque prestation.',
  },
  {
    q: 'J’ai une pose faite ailleurs, vous la reprenez ?',
    r: 'La dépose d’une pose réalisée ailleurs coûte 15 €. Il faut la prévoir avant une nouvelle pose : on ne remplit pas le travail d’une autre poseuse.',
  },
  {
    q: 'Comment on paie ?',
    r: 'En espèces ou par virement. La carte bancaire n’est pas acceptée — mieux vaut le savoir avant de venir.',
  },
];
