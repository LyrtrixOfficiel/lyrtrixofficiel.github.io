import { ADRESSE, MARQUE, TELEPHONE, TELEPHONE_TEL } from '../data/site';
import { LIEN_EXTERNE } from '../lib/booking';

/**
 * Mentions legales — obligatoires, mais repliees.
 *
 * La premiere version leur donnait un ecran entier en fin de page. C'est une
 * obligation legale, pas un argument de vente : elles doivent etre accessibles
 * en un clic, pas occuper un douzieme du site.
 */
export function MentionsLegales() {
  return (
    <section className="pad-x pb-4" id="mentions">
      <details className="border-t border-white/12 group">
        <summary className="micro flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 text-white/65 marker:content-none hover:text-white">
          Mentions légales
          <span
            aria-hidden="true"
            className="text-or transition-transform duration-500 group-open:rotate-45"
          >
            +
          </span>
        </summary>

        <div className="mesure grid gap-6 pb-8 text-sm text-white/65 sm:grid-cols-2">
          <p>
            <span className="micro block text-or">Éditeur</span>
            {MARQUE} — SASU, SIREN 900 321 878, APE 9602B.
            <br />
            {ADRESSE}
            <br />
            <a href={`tel:${TELEPHONE_TEL}`} className="underline underline-offset-4">
              {TELEPHONE}
            </a>
          </p>

          <p>
            <span className="micro block text-or">Hébergement</span>
            Netlify, Inc. — 512 2nd Street, Suite 200, San Francisco, CA 94107,
            États-Unis.{' '}
            <a
              href="https://www.netlify.com"
              {...LIEN_EXTERNE}
              className="underline underline-offset-4"
            >
              netlify.com
            </a>
          </p>

          <p>
            <span className="micro block text-or">Données</span>
            Aucune donnée collectée : ni formulaire, ni compte, ni mesure d’audience,
            ni cookie déposé par nos soins. La prise de rendez-vous se fait sur
            Planity, qui a sa propre politique.
          </p>

          <p>
            <span className="micro block text-or">Photographies</span>
            Les photographies de l’institut appartiennent à {MARQUE}.
          </p>
        </div>
      </details>
    </section>
  );
}
