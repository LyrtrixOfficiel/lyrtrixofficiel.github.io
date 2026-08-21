import { SITE } from '../lib/site';

/**
 * La marque, en typographie.
 *
 * Le gabarit affichait `logo.webp` : le soleil dessine a la main de Brigitte,
 * avec son propre lettrage « Energie & Bien-etre / Brigitte Baradel ». Laisse
 * tel quel, le site de Matthieu portait la marque d'une autre — le genre de
 * detail qui tue une premiere impression.
 *
 * Matthieu n'a pas de logo. En attendant qu'il en ait un, la marque est donc
 * purement typographique : son nom en serif editoriale, son metier en
 * capitales espacees dessous. C'est un parti pris tenable, pas un pis-aller —
 * beaucoup de praticiens s'en tiennent la, et ca vieillit mieux qu'un symbole
 * mal dessine.
 *
 * `compact` sert dans la barre de navigation, ou la ligne de metier ne tient
 * pas.
 */
export default function Marque({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span
        className={`font-display text-white ${
          compact ? 'text-xl sm:text-2xl' : 'text-4xl sm:text-5xl'
        }`}
      >
        {SITE.praticien}
      </span>
      {!compact && (
        <span className="mt-3 text-[11px] font-light tracking-[0.22em] text-amber uppercase">
          Réflexologue · Fleurs de Bach
        </span>
      )}
      {compact && (
        <span className="mt-1.5 text-[9px] font-light tracking-[0.18em] text-amber/80 uppercase">
          Réflexologue
        </span>
      )}
    </span>
  );
}
