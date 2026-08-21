import { useMemo, useState } from 'react';
import { FAMILLES, FAMILLE_RESUME, PRESTATIONS, type Famille } from '../data/site';
import { LIEN_EXTERNE, lienReservation } from '../lib/booking';
import { TitreSection } from './TitreSection';

/**
 * Catalogue filtrable — archetype 6.
 *
 * 17 prestations sur 6 familles : sans filtre, la visiteuse fait defiler
 * 17 lignes sur telephone avant de trouver son prix. Le filtre est une liste
 * de boutons, pas un `select` : on voit les six familles d'un coup.
 *
 * Prix et durees en texte reel — jamais une image.
 */
export function Prestations() {
  const [filtre, setFiltre] = useState<Famille | 'Tout'>('Tout');

  const visibles = useMemo(
    () => (filtre === 'Tout' ? PRESTATIONS : PRESTATIONS.filter((p) => p.famille === filtre)),
    [filtre]
  );

  const onglets: (Famille | 'Tout')[] = ['Tout', ...FAMILLES];

  return (
    <section className="section pad-x" id="prestations" aria-labelledby="titre-prestations">
      <TitreSection
        numero="02"
        id="titre-prestations"
        chapeau="Les tarifs sont les mêmes qu’en réservation. Un remplissage se prend entre 2 et 4 semaines après la pose — au-delà, c’est une pose complète."
      >
        Prestations et tarifs
      </TitreSection>

      {/* Filtre par famille */}
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrer par famille">
        {onglets.map((f) => {
          const actif = filtre === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              aria-pressed={actif}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                actif
                  ? 'border-accent bg-accent text-bg'
                  : 'border-white/12 text-muted hover:border-accent/50 hover:text-text'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Chapeau de la famille selectionnee */}
      {filtre !== 'Tout' && (
        <p className="mesure mt-6 text-muted">{FAMILLE_RESUME[filtre]}</p>
      )}

      {/* La grille */}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <li
            key={`${p.famille}-${p.nom}`}
            className="flex flex-col rounded-xl border border-white/8 bg-surface p-5"
          >
            <p className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
              {p.famille}
            </p>
            <h3 className="mt-2 font-medium">{p.nom}</h3>
            {p.description && <p className="mt-1.5 text-sm text-muted">{p.description}</p>}
            <p className="mt-4 flex items-baseline gap-2 font-display text-2xl">
              {p.prix} €<span className="text-[length:var(--micro)] font-sans text-muted">
                {formaterDuree(p.duree)}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <a
          href={lienReservation('prestations')}
          {...LIEN_EXTERNE}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent font-medium text-bg transition-opacity hover:opacity-90"
          style={{ paddingInline: 'var(--btn-px)', paddingBlock: 'var(--btn-py)' }}
        >
          Réserver
        </a>
      </div>
    </section>
  );
}

function formaterDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} h ${r}` : `${h} h`;
}
