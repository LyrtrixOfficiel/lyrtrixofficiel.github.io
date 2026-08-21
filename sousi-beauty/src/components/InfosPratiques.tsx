import { Reveal } from './Reveal';
import { Carte } from './Carte';
import { ADRESSE, HORAIRES, TELEPHONE, TELEPHONE_TEL } from '../data/site';
import { TitreSection } from './TitreSection';

/**
 * Infos pratiques.
 *
 * L'adresse est publiee en entier, contrairement a Madame Cils : Sousi Beauty
 * est un local dans un centre commercial, pas une activite en residence. La
 * question de confidentialite ne se pose pas, et l'adresse est un argument.
 *
 * Trois colonnes de texte sur du noir, c'etait le passage le plus vide du
 * site. La carte prend maintenant la moitie de la largeur et les trois blocs
 * s'empilent a cote : meme information, plus de vide.
 */
export function InfosPratiques() {
  return (
    <Reveal className="section pad-x" id="infos">
      <TitreSection eyebrow="Venir" id="titre-infos">
        Place des Halles,
        <br />
        Strasbourg
      </TitreSection>

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Carte className="min-h-[22rem]" />

        <div className="grid gap-px overflow-hidden rounded-[1.4rem] bg-white/10">
          <Bloc titre="Adresse">
            <p className="text-white">{ADRESSE}</p>
            <p className="mt-2 text-sm text-white/65">
              Dans le centre commercial des Halles, à côté de la station Ancienne
              Synagogue / Les Halles.
            </p>
          </Bloc>

          <Bloc titre="Horaires">
            <dl>
              {HORAIRES.map((h) => (
                <div key={h.jour} className="flex justify-between gap-4 py-1">
                  <dt className="text-white/65">{h.jour}</dt>
                  <dd className="font-display text-lg text-white">{h.creneau}</dd>
                </div>
              ))}
            </dl>
          </Bloc>

          <Bloc titre="Contact">
            <a
              href={`tel:${TELEPHONE_TEL}`}
              className="font-display inline-flex min-h-11 items-center text-2xl text-white transition-colors duration-500 hover:text-or"
            >
              {TELEPHONE}
            </a>
            <p className="mt-1 text-sm text-white/65">
              Une prestation qui n’est pas dans la carte se demande par téléphone.
            </p>
          </Bloc>
        </div>
      </div>
    </Reveal>
  );
}

/** Une case du bloc de droite. Le `gap-px` du parent dessine les separations. */
function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="bg-nuit p-6 sm:p-7">
      <h3 className="micro text-or">{titre}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
