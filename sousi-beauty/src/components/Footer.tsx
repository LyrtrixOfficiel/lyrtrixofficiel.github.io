import { ADRESSE, HORAIRES, INSTAGRAM, INSTAGRAM_HANDLE, MARQUE, TELEPHONE, TELEPHONE_TEL } from '../data/site';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';

/** Adresse, horaires et contact en texte reel — c'est ce qui fait le SEO local. */
export function Footer() {
  return (
    <footer className="border-t border-white/12">
    <div className="pad-x pt-14 pb-12">
      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl text-white">{MARQUE}</p>
          <p className="micro mt-3 text-white/65">Institut de beauté · Strasbourg</p>
        </div>

        <div>
          <p className="micro text-or">Où</p>
          <p className="mt-3 text-white/65">{ADRESSE}</p>
        </div>

        <div>
          <p className="micro text-or">Horaires</p>
          <ul className="mt-3 text-white/65">
            {HORAIRES.map((h) => (
              <li key={h.jour}>
                {h.jour} — {h.creneau}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="micro text-or">Contact</p>
          <p className="mt-3">
            <a href={`tel:${TELEPHONE_TEL}`} className="inline-flex min-h-11 items-center text-white/65 hover:text-white">
              {TELEPHONE}
            </a>
          </p>
          <p>
            <a href={INSTAGRAM} {...LIEN_EXTERNE} className="inline-flex min-h-11 items-center text-white/65 hover:text-white">
              {INSTAGRAM_HANDLE}
            </a>
          </p>
          <p>
            <a href={lienRdv('footer')} {...LIEN_EXTERNE} className="inline-flex min-h-11 items-center text-or">
              Prendre rendez-vous
            </a>
          </p>
        </div>
      </div>

      <p className="micro mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/65">
        <span>© {new Date().getFullYear()} {MARQUE}</span>
        <span>Rendez-vous en ligne assurés par Planity</span>
        <a href="./institut.html#mentions" className="inline-flex min-h-11 items-center hover:text-white">Mentions légales</a>
      </p>
    </div>
    </footer>
  );
}
