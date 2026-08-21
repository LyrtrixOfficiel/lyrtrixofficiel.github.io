/**
 * Donnees du site.
 *
 * Tout ce que Brigitte peut modifier seule vit dans `content/*.json`, edite
 * depuis `/admin`. Ce fichier ne fait que les lire et les typer : il ne
 * contient plus aucune valeur en dur qui soit susceptible de changer.
 *
 * Les tarifs etaient auparavant recopies a trois endroits (accueil, page
 * tarifs, carte de chaque page de soin). Ils n'ont plus qu'une source.
 */

import coordonnees from '../../content/coordonnees.json';
import tarifs from '../../content/tarifs.json';
import soins from '../../content/soins.json';
import textes from '../../content/textes.json';

/** Tous les textes des pages, editables depuis /admin. */
export const T = textes;

export type Route =
  | 'accueil'
  | 'soin1'
  | 'soin2'
  | 'soin3'
  | 'tarifs'
  | 'contact'
  | 'mentions';

/**
 * L'adresse en une ligne, sans virgule orpheline.
 *
 * La plupart des praticiens ne publient pas leur numero de rue : `rue` est
 * alors vide, et « {rue}, {cp} {ville} » donnait « , 60390 Auneuil » sur le
 * hero, dans les cartes et dans la description Google.
 */
export const ADRESSE = [coordonnees.rue, `${coordonnees.codePostal} ${coordonnees.ville}`]
  .filter((x) => x && x.trim())
  .join(', ');

export const SITE = {
  marque: coordonnees.marque,
  praticien: coordonnees.praticien,
  metier: coordonnees.metier,
  metierCourt: coordonnees.metierCourt,
  email: coordonnees.email,
  horaires: coordonnees.horaires,
  telephone: coordonnees.telephone,
  telephoneLien: coordonnees.telephoneLien,
  adresse: {
    rue: coordonnees.rue,
    codePostal: coordonnees.codePostal,
    ville: coordonnees.ville,
    region: coordonnees.region,
  },
  facebook: coordonnees.facebook,
  siret: coordonnees.siret,
  ape: coordonnees.ape,
  hebergeur: coordonnees.hebergeur,
};

export const AVERTISSEMENT = textes.commun.avertissement;

export const URLS: Record<Route, string> = {
  accueil: '/',
  soin1: '/soin-1.html',
  soin2: '/soin-2.html',
  soin3: '/soin-3.html',
  tarifs: '/tarifs.html',
  contact: '/contact.html',
  mentions: '/mentions-legales.html',
};

/**
 * Fonds video, generes pour ce site (Veo 3.1, 8 s, muets, 16:9).
 * Chaque entree a son poster WebP : il s'affiche avant que la video charge.
 */
export const VIDEOS = {
  fleurBlanche: { src: '/video/fleur-blanche.mp4', poster: '/video/fleur-blanche.webp' },
  onde: { src: '/video/onde.mp4', poster: '/video/onde.webp' },
  vapeur: { src: '/video/vapeur.mp4', poster: '/video/vapeur.webp' },
  epi: { src: '/video/epi.mp4', poster: '/video/epi.webp' },
  fleurs: { src: '/video/fleurs.mp4', poster: '/video/fleurs.webp' },
} as const;

/**
 * Les deux photos du praticien : son portrait, et son cabinet.
 *
 * Vides par defaut, et c'est **volontaire**. Le gabarit est ne du site de
 * Matthieu Chretien : ses photos etaient restees dans `public/photos`, et
 * chaque site copie affichait donc son visage sur l'accueil et sa piece sur
 * la page contact — sous le nom de quelqu'un d'autre. Indefendable, et fatal
 * le jour ou un prospect fait une recherche d'image.
 *
 * Tant que le praticien ne nous a pas donne les siennes, les deux
 * emplacements retombent sur un fond video : aucune personne, aucune piece,
 * aucun soin represente. On ne remplit ces champs qu'avec SES fichiers.
 */
export const PHOTOS: { portrait: string; cabinet: string; legendeCabinet: string } = {
  portrait: '',
  cabinet: '',
  legendeCabinet: '',
};

/** La ligne d'accroche du pied de page. */
export const BASELINE =
  (textes.accueil as { baseline?: string }).baseline ||
  `${coordonnees.metierCourt} à ${coordonnees.ville}.`;

/* --- visuels : lies au code, pas au CMS --------------------------------- */

/* Un fond video par soin. Aucun ne represente un soin, une personne ni un
   resultat : une onde qui se propage, des fleurs retroeclairees, du granit
   mouille. Les trois ont ete generes pour ce site — il ne reste plus rien
   des visuels de Brigitte. */
const VISUELS: Record<string, { video: keyof typeof VIDEOS }> = {
  soin1: { video: 'onde' },
  soin2: { video: 'fleurs' },
  soin3: { video: 'vapeur' },
};

export const SOINS = soins.soins.map((s) => ({
  ...s,
  route: s.route as Route,
  ...VISUELS[s.route],
}));

/* `tarif` de soins.json n'est plus lu : le prix affiche sur les cartes vient
   de la grille tarifaire (voir `prixDuSoin`), source unique. */

/* --- tarifs --------------------------------------------------------------- */

export type LigneTarif = { label: string; prix: string; soin: string };

export const TARIFS = tarifs;

/** Les lignes d'un soin donne, pour la carte de sa page. */
export const tarifsDuSoin = (route: Route): { label: string; prix: string }[] =>
  tarifs.groupes
    .flatMap((g) => g.lignes)
    .filter((l) => l.soin === route)
    .map(({ label, prix }) => ({ label, prix }));

/**
 * Le prix « a partir de » d'un soin : la premiere ligne qui lui est rattachee.
 * Sert au badge de la carte d'accueil et a la pastille de son hero, pour que
 * ces trois affichages ne puissent pas diverger d'une grille modifiee.
 */
export const prixDuSoin = (route: Route): string => tarifsDuSoin(route)[0]?.prix ?? '';

/** Une ligne par groupe pour l'apercu de l'accueil : la premiere de chaque. */
export const APERCU_TARIFS: { label: string; prix: string }[] = [
  ...tarifs.groupes[0].lignes.map(({ label, prix }) => ({ label, prix })),
  ...tarifs.groupes.slice(1).map((g) => ({
    label: `${g.titre} — ${g.lignes[0].label}`,
    prix: g.lignes[0].prix,
  })),
];

/**
 * La note affichee sous chaque carte de tarif.
 *
 * `trim()` parce que sans lui, un praticien qui ne renseigne ni moyen de
 * paiement ni bon cadeau produisait la chaine «&nbsp;» — vraie au sens de
 * JavaScript, donc un paragraphe vide s'inserait sous chaque tarif.
 */
export const NOTE_TARIF = `${tarifs.paiement} ${tarifs.bonsCadeaux}`.trim();

/** Le titre d'un soin, pour les libelles de section. Vient de soins.json. */
export const titreDuSoin = (route: Route) =>
  SOINS.find((s) => s.route === route)?.titre ?? '';
