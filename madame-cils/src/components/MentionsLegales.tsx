import { MARQUE, PRATICIENNE, TELEPHONE, TELEPHONE_TEL, ZONE } from '../data/site';
import { LIEN_EXTERNE } from '../lib/booking';

/**
 * Mentions legales — obligatoires, et souvent absentes chez la concurrence.
 *
 * Elles sont sur la meme page, ouvertes par le pied de page, plutot que sur une
 * seconde URL : le site est une page unique, une deuxieme route pour quatre
 * paragraphes serait une complication sans benefice.
 *
 * L'adresse exacte n'y figure pas non plus. La loi impose une adresse de
 * contact permettant de joindre l'editeur : le telephone professionnel publie
 * et la commune y suffisent pour une activite exercee en residence.
 */
export function MentionsLegales() {
  return (
    <section className="section pad-x border-t border-white/8" id="mentions">
      <h2 className="font-display" style={{ fontSize: 'var(--h2)' }}>
        Mentions légales
      </h2>

      <div className="mesure mt-8 space-y-7 text-muted">
        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Éditeur du site
          </h3>
          <p className="mt-2">
            {MARQUE} — {PRATICIENNE} Zimmermann, entrepreneure individuelle.
            <br />
            {ZONE}
            <br />
            SIRET 922 123 112 00018 · APE 9602B, soins de beauté
            <br />
            Téléphone :{' '}
            <a href={`tel:${TELEPHONE_TEL}`} className="text-accent underline underline-offset-4">
              {TELEPHONE}
            </a>
          </p>
          <p className="mt-2 text-[length:var(--micro)]">
            Directrice de la publication : {PRATICIENNE} Zimmermann. L’adresse exacte du
            salon est communiquée lors de la confirmation du rendez-vous.
          </p>
        </div>

        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Hébergement
          </h3>
          <p className="mt-2">
            Netlify, Inc. — 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis.
            <br />
            <a href="https://www.netlify.com" {...LIEN_EXTERNE} className="underline underline-offset-4">
              netlify.com
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Données personnelles
          </h3>
          <p className="mt-2">
            Ce site ne collecte aucune donnée personnelle : il n’y a ni formulaire, ni
            compte, ni outil de mesure d’audience, ni cookie déposé par nos soins.
          </p>
          <p className="mt-2">
            La prise de rendez-vous se fait sur <strong>Planity</strong>, qui est un service
            tiers avec sa propre politique de confidentialité. Les données que vous y
            saisissez sont traitées par Planity, pas par ce site.
          </p>
        </div>

        <div>
          <h3 className="text-[length:var(--micro)] tracking-[0.24em] text-accent uppercase">
            Propriété intellectuelle
          </h3>
          <p className="mt-2">
            Les photographies de réalisations appartiennent à {PRATICIENNE} Zimmermann.
            Les images d’ambiance sont des visuels de synthèse, abstraits : ils ne
            représentent aucune prestation et ne constituent pas un résultat.
          </p>
        </div>
      </div>
    </section>
  );
}
