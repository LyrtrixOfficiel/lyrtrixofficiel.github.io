import { AVIS } from '../data/site';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';

/**
 * Bandeau de rendez-vous colle en bas d'ecran sur mobile.
 * Creme sur obsidienne, angles vifs, pleine largeur — c'est le CTA de la
 * planche 6 de la DA.
 */
export function CtaSticky() {
  return (
    <div className="liquid-glass-strong safe-bottom fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="pad-x flex items-center justify-between gap-4 py-3">
        <p className="micro text-white/65">
          <span className="text-white">{AVIS.note} / 5</span> · {AVIS.nombre} avis
        </p>
        <a
          href={lienRdv('barre-mobile')}
          {...LIEN_EXTERNE}
          className="micro inline-flex min-h-11 items-center bg-text px-6 text-white"
        >
          Prendre rendez-vous
        </a>
      </div>
    </div>
  );
}
