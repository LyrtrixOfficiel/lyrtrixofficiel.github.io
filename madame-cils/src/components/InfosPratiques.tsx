import { Reveal } from './Reveal';
import { TitreSection } from './TitreSection';
import {
  ACCES,
  HORAIRES,
  REGLES,
  STATIONNEMENT,
  TELEPHONE,
  TELEPHONE_TEL,
  ZONE,
} from '../data/site';

/**
 * Infos pratiques.
 *
 * L'acces en transports est affiche en texte : c'est l'objection numero un pour
 * un rendez-vous de 2 h dans une commune peripherique. Les regles annoncees
 * (paiement, adresse communiquee apres reservation) sont affichees et non
 * cachees : les cacher genere des annulations.
 *
 * Zone seulement — l'adresse exacte n'apparait nulle part.
 */
export function InfosPratiques() {
  return (
    <Reveal className="section pad-x" id="infos">
      <TitreSection numero="04" id="titre-infos">
        Infos pratiques
      </TitreSection>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Horaires
          </h3>
          <dl className="mt-3">
            {HORAIRES.map((h) => (
              <div key={h.jour} className="flex justify-between gap-4 border-b border-white/6 py-2">
                <dt className="text-muted">{h.jour}</dt>
                <dd>{h.creneau}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Où et comment venir
          </h3>
          <p className="mt-3">{ZONE}</p>
          <ul className="mt-3 space-y-1.5 text-muted">
            {ACCES.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <h4 className="mt-5 text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Stationnement
          </h4>
          <ul className="mt-2 space-y-1.5 text-muted">
            {STATIONNEMENT.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <p className="mt-4">
            <a
              href={`tel:${TELEPHONE_TEL}`}
              className="inline-flex min-h-11 items-center text-accent underline underline-offset-4"
            >
              {TELEPHONE}
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            À savoir avant de venir
          </h3>
          <ul className="mt-3 space-y-3 text-muted">
            {REGLES.map((r) => (
              <li key={r} className="border-l border-accent/40 pl-3">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
