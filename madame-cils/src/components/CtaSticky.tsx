import { LIEN_EXTERNE, lienReservation } from '../lib/booking';
import { AVIS } from '../data/site';

/**
 * Barre de reservation collee en bas d'ecran sur mobile.
 * Le trafic vient d'un lien en bio Instagram : le CTA ne doit jamais sortir
 * du champ, quel que soit l'endroit ou la visiteuse s'arrete.
 */
export function CtaSticky() {
  return (
    <div className="pad-x fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-bg/95 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[length:var(--micro)] text-muted">
          <span className="text-text">{AVIS.note} / 5</span> · {AVIS.nombre} avis
        </p>
        <a
          href={lienReservation('barre-mobile')}
          {...LIEN_EXTERNE}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-bg"
        >
          Réserver
        </a>
      </div>
    </div>
  );
}
