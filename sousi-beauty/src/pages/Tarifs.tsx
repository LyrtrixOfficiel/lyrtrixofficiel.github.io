import { EnTetePage } from '../components/EnTetePage';
import { Reveal } from '../components/Reveal';
import { TableauPrix } from '../components/TableauPrix';
import { LA_CARTE, UNIVERS, famillesDe, prixDEntree } from '../data/site';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';

/**
 * La page tarifs — la reference complete, 165 prestations.
 *
 * Elle garde tout, mais elle est ORGANISEE : un sommaire colle en haut qui
 * donne le prix d'entree de chaque univers, puis les tables dans l'ordre.
 * On peut y arriver en cherchant « tarifs Sousi Beauty » et trouver son prix
 * en deux secondes — c'est le seul travail de cette page.
 */
export default function Tarifs() {
  return (
    <>
      <EnTetePage
        titre="Tous les tarifs"
        photo="/photos/photo-07.webp"
        alt="Le poste de travail d’une praticienne de Sousi Beauty"
        chapeau={`Les ${LA_CARTE.reduce((n, f) => n + f.prestations.length, 0)} prestations de l’institut, avec leur durée et leur prix. Ce sont exactement ceux de la prise de rendez-vous en ligne.`}
      >

        {/* Sommaire : le prix d'entree de chaque univers, cliquable. */}
        <nav aria-label="Sommaire des tarifs" className="fade-in mt-10" style={{ animationDelay: '0.9s' }}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {UNIVERS.map((u) => (
              <li key={u.id}>
                <a
                  href={`#${u.id}`}
                  className="liquid-glass block rounded-[1.25rem] p-5 transition-transform duration-300 hover:scale-[1.03]"
                >
                  <p className="font-display text-xl text-white">{u.titre}</p>
                  <p className="micro mt-2 text-white/55">{u.appel.nom}</p>
                  <p className="font-display text-3xl text-or">dès {prixDEntree(u)}&nbsp;€</p>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </EnTetePage>

      <section className="section pad-x">
        {UNIVERS.map((u) => (
          <div key={u.id} id={u.id} className="scroll-mt-24 pt-10 first:pt-0">
            <Reveal>
              <p className="micro text-or">{u.sousTitre}</p>
              <h2 className="font-display mt-3 text-4xl text-white sm:text-5xl">{u.titre}</h2>
            </Reveal>
            {famillesDe(u).map((f, i) => (
              <TableauPrix key={f.id} famille={f} delai={i * 60} />
            ))}
          </div>
        ))}

        <Reveal className="mt-20">
          <a
            href={lienRdv('tarifs')}
            {...LIEN_EXTERNE}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
          >
            Prendre rendez-vous
          </a>
        </Reveal>
      </section>
    </>
  );
}
