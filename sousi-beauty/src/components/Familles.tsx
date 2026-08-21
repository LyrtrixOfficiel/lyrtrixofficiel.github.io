import { Reveal } from './Reveal';
import { Lotus } from './Lotus';
import { UNIVERS, famillesDe } from '../data/site';

/**
 * Toutes les familles, cliquables.
 *
 * Remplace l'ancienne section « signatures », qui affichait cinq prestations
 * choisies a la main au milieu de 165. Sur un accueil, cinq soins arbitraires
 * ne repondent a aucune question : la visiteuse ne cherche pas « une
 * prestation », elle cherche LA sienne.
 *
 * Les douze familles sont donc listees, chacune avec son nombre de
 * prestations et son entree la moins chere, et chacune mene a l'ancre de sa
 * famille sur la page de son univers.
 */
export function Familles() {
  return (
    <section className="section pad-x" id="familles" aria-labelledby="titre-familles">
      <Reveal>
        <p className="micro flex items-center gap-2 text-or">
          <Lotus taille={16} anime={false} className="text-or" />
          Toutes les familles
        </p>
        <h2 id="titre-familles" className="font-display mt-4 text-4xl text-white sm:text-5xl">
          Qu’est-ce que vous cherchez&nbsp;?
        </h2>
        <p className="mesure mt-4 text-white/60">
          Douze familles, 165 prestations. Cliquez, vous tombez directement sur les
          tarifs de la vôtre.
        </p>
      </Reveal>

      <div className="mt-12 space-y-12">
        {UNIVERS.map((u, iu) => (
          <div key={u.id}>
            <Reveal delai={iu * 60}>
              <p className="micro text-white/45">{u.titre}</p>
            </Reveal>

            {/* En mobile chaque famille prend la ligne entiere et se lit comme
                une ligne de carte — des pastilles empilees une par ligne
                donnaient une colonne de hauteurs inegales. */}
            <ul className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              {famillesDe(u).map((f, i) => {
                const mini = Math.min(...f.prestations.map((p) => p.prix));
                return (
                  <Reveal as="li" key={f.id} delai={iu * 60 + i * 50}>
                    <a
                      href={`./${u.page}.html#${f.id}`}
                      className="liquid-glass group flex items-center gap-3 rounded-2xl py-3.5 pr-4 pl-4 transition-transform duration-300 hover:scale-[1.04] sm:gap-4 sm:rounded-full sm:py-3 sm:pr-6 sm:pl-5"
                    >
                      <Lotus
                        taille={18}
                        anime={false}
                        className="shrink-0 text-or transition-transform duration-500 group-hover:rotate-12"
                      />
                      <span className="min-w-0 flex-1 text-sm font-light text-white group-hover:text-or-doux">
                        {f.titre}
                      </span>
                      <span className="micro hidden shrink-0 text-white/40 sm:inline">{f.prestations.length}</span>
                      <span className="font-display text-lg whitespace-nowrap text-or">
                        dès {mini}&nbsp;€
                      </span>
                    </a>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
