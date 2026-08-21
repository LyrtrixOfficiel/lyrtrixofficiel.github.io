import type { CSSProperties } from 'react';

/**
 * SA marque, retracee.
 *
 * L'ancienne version etait un lotus generique a cinq petales symetriques — une
 * invention. Sa vraie enseigne, en lettres d'or sur le mur a lattes de
 * l'accueil (photo-01), est autre chose : une **corolle qui s'ouvre, et dans
 * son creux un profil de femme** — front, arcade, nez, levres, menton — tourne
 * vers la droite.
 *
 * Les quatre petales sont construits geometriquement (deux quadratiques bombees
 * en sens inverse entre la base et la pointe, a -70/-34/+34/+70 degres de la
 * verticale) et non dessines a la main : c'est ce qui leur donne la meme
 * courbure. Les opacites etagees remplacent les joints sombres de l'enseigne
 * physique — elles separent les pieces quel que soit le fond.
 *
 * ATTENTION : c'est un relevé au trace depuis une photo d'un objet en relief,
 * pris de biais. Ce n'est PAS son fichier d'origine et ca ne peut pas l'etre.
 * Il faut lui demander son logo (AI / EPS / SVG, ou a defaut un PNG a fond
 * transparent) — elle l'a forcement, son enseigniste l'a utilise.
 *
 * `detail` porte le profil. Sous ~26 px il ne se lit plus et encrasse le
 * dessin : les petites tailles ne gardent que la corolle.
 */

const PETALE_EXT_G =
  'M50 80L48 76.2L45.8 72.9L43.5 69.8L41.1 67.2L38.5 64.9L35.8 62.9L33 61.3L30.1 60L27 59.1L23.8 58.5L20.5 58.3L17.1 58.4L13.5 58.9L9.8 59.8L6 61L2 62.5L4 66.2L6.2 69.6L8.5 72.6L10.9 75.3L13.5 77.6L16.2 79.6L19 81.2L21.9 82.5L25 83.4L28.2 83.9L31.5 84.2L34.9 84L38.5 83.5L42.2 82.7L46 81.5Z';

const PETALE_INT_G =
  'M50 80L50.5 74.7L50.6 69.7L50.3 65L49.7 60.5L48.7 56.3L47.3 52.3L45.6 48.5L43.5 45L41 41.8L38.2 38.8L35 36L31.4 33.5L27.5 31.2L23.2 29.2L18.6 27.4L13.5 25.9L13.1 31.1L13 36.1L13.2 40.9L13.9 45.3L14.9 49.6L16.2 53.6L18 57.3L20.1 60.8L22.5 64.1L25.3 67.1L28.5 69.9L32.1 72.4L36 74.6L40.3 76.7L45 78.4Z';

const PETALE_INT_D =
  'M50 80L55 78.4L59.7 76.7L64 74.6L67.9 72.4L71.5 69.9L74.7 67.1L77.5 64.1L79.9 60.8L82 57.3L83.8 53.6L85.1 49.6L86.1 45.3L86.8 40.9L87 36.1L86.9 31.1L86.5 25.9L81.4 27.4L76.8 29.2L72.5 31.2L68.6 33.5L65 36L61.8 38.8L59 41.8L56.5 45L54.4 48.5L52.7 52.3L51.3 56.3L50.3 60.5L49.7 65L49.4 69.7L49.5 74.7Z';

const PETALE_EXT_D =
  'M50 80L54 81.5L57.8 82.7L61.5 83.5L65.1 84L68.5 84.2L71.8 83.9L75 83.4L78.1 82.5L81 81.2L83.8 79.6L86.5 77.6L89.1 75.3L91.5 72.6L93.8 69.6L96 66.2L98 62.5L94 61L90.2 59.8L86.5 58.9L82.9 58.4L79.5 58.3L76.2 58.5L73 59.1L69.9 60L67 61.3L64.2 62.9L61.5 64.9L58.9 67.2L56.5 69.8L54.2 72.9L52 76.2Z';

const PROFIL =
  'M46.7 80L44.6 68L43.5 55L43.5 41.9L44.6 31.1L47.8 22.4L53.3 16.9L58.7 15.8L64.1 18L66.3 23.4L66.3 28.9L65.2 33.2L69.6 38.7L71.7 43L66.3 45.2L64.1 46.3L67.4 48.4L67.4 49.5L64.1 50.6L67.4 52.8L67.4 55L63 57.1L66.3 59.3L65.2 62.6L60.9 68L56.5 74.5L52.2 80Z';

export function Lotus({
  taille = 24,
  className = '',
  anime = true,
  detail,
  style,
}: {
  taille?: number;
  className?: string;
  anime?: boolean;
  detail?: boolean;
  style?: CSSProperties;
}) {
  const avecProfil = detail ?? taille >= 26;

  return (
    <svg
      viewBox="0 0 100 100"
      width={taille}
      height={taille}
      role="img"
      aria-label="Sousi Beauty"
      className={`${anime ? 'petale' : ''} ${className}`}
      style={style}
      fill="currentColor"
    >
      <path d={PETALE_EXT_G} opacity={0.5} />
      <path d={PETALE_EXT_D} opacity={0.5} />
      <path d={PETALE_INT_G} opacity={0.78} />
      <path d={PETALE_INT_D} opacity={0.78} />
      {avecProfil && <path d={PROFIL} />}
    </svg>
  );
}

/**
 * Le nom, dans le script de son enseigne.
 *
 * Le lettrage du mur est un script pinceau monolineaire, epais, tres rond,
 * avec un grand S boucle et un « y » a longue queue — une police commerciale,
 * pas une Google Font. `Pacifico` est le plus proche disponible : meme trait
 * uniforme et epais, memes terminaisons rondes, meme queue de « y ».
 * `Dancing Script`, qu'on avait avant, etait deux fois trop maigre.
 */
export function MotSymbole({ className = '' }: { className?: string }) {
  return <span className={`font-script leading-none ${className}`}>Sousi Beauty</span>;
}
