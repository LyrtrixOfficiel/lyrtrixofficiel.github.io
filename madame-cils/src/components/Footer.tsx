import {
  HORAIRES,
  INSTAGRAM,
  INSTAGRAM_HANDLE,
  MARQUE,
  TELEPHONE,
  TELEPHONE_TEL,
  ZONE,
} from '../data/site';
import { LIEN_EXTERNE, lienReservation } from '../lib/booking';

/** Zone, horaires et contact en texte reel — c'est ce qui fait le SEO local. */
export function Footer() {
  return (
    <footer className="pad-x border-t border-white/8 pt-12 pb-10">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg">{MARQUE}</p>
          <p className="mt-2 text-muted">Extensions et rehaussement de cils</p>
        </div>

        <div>
          <p className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">Où</p>
          <p className="mt-2 text-muted">{ZONE}</p>
          <p className="mt-1 text-muted">
            L’adresse exacte vous est communiquée après confirmation du rendez-vous.
          </p>
        </div>

        <div>
          <p className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Horaires
          </p>
          <ul className="mt-2 text-muted">
            {HORAIRES.map((h) => (
              <li key={h.jour}>
                {h.jour} — {h.creneau}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Contact
          </p>
          <p className="mt-2">
            <a
              href={`tel:${TELEPHONE_TEL}`}
              className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-text"
            >
              {TELEPHONE}
            </a>
          </p>
          <p>
            <a
              href={INSTAGRAM}
              {...LIEN_EXTERNE}
              className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-text"
            >
              {INSTAGRAM_HANDLE}
            </a>
          </p>
          <p>
            <a
              href={lienReservation('footer')}
              {...LIEN_EXTERNE}
              className="inline-flex min-h-11 items-center text-accent underline underline-offset-4"
            >
              Réserver sur Planity
            </a>
          </p>
        </div>
      </div>

      <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--micro)] text-muted">
        <span>
          © {new Date().getFullYear()} {MARQUE} · Réservation en ligne assurée par Planity
        </span>
        <a href="#mentions" className="underline underline-offset-4 hover:text-text">
          Mentions légales
        </a>
      </p>
    </footer>
  );
}
