import { Reveal } from './Reveal';
import { Lotus } from './Lotus';
import type { Famille, Prestation } from '../data/site';

/**
 * La carte des prix — refaite une deuxieme fois.
 *
 * Ce qui n'allait toujours pas : sur un ecran large, le nom etait a gauche et
 * le prix a l'extreme droite. Mille pixels de vide entre les deux, l'oeil
 * devait traverser toute la page pour relier « Microblading » a « 230 € ».
 *
 * Ce qui change :
 *   - la liste est bornee a 52rem ET passe en **deux colonnes** au-dessus de
 *     lg. Borner seul ne suffisait pas : mesure faite, l'ecart nom -> prix
 *     restait de 556 px en mediane sur un ecran de 1440. En deux colonnes il
 *     tombe sous 250 px, et la page est deux fois moins longue.
 *   - un **filet de conduite pointille** relie le nom au prix, comme sur une
 *     carte de restaurant. C'est la solution typographique classique a ce
 *     probleme exact, et elle a trois siecles.
 *   - les **forfaits sont separes** des prestations simples : « demi-jambes +
 *     maillot + aisselles » n'a rien a faire au milieu de « sourcils »
 *   - chaque ligne apparait avec 40 ms de decalage sur la precedente
 */
export function TableauPrix({ famille, delai = 0 }: { famille: Famille; delai?: number }) {
  /* Un forfait, c'est une prestation dont le nom annonce une composition. */
  const estForfait = (p: Prestation) =>
    /^forfait|^formule|\bpack\b|^\d+ s[ée]ances/i.test(p.nom) || p.nom.includes(' + ');

  const simples = famille.prestations.filter((p) => !estForfait(p));
  const forfaits = famille.prestations.filter(estForfait);

  return (
    <Reveal as="section" delai={delai} id={famille.id} className="mt-20 scroll-mt-28 first:mt-0">
      <header className="mx-auto max-w-[52rem]">
        <h3 className="font-display flex items-center gap-3 text-3xl text-white sm:text-4xl">
          <Lotus taille={26} anime={false} className="shrink-0 text-or" />
          {famille.titre}
        </h3>
        {famille.chapeau && (
          <p className="mt-4 text-sm leading-relaxed text-white/60">{famille.chapeau}</p>
        )}
      </header>

      <Lignes prestations={simples} depart={delai} />

      {forfaits.length > 0 && (
        <>
          <p className="micro mx-auto mt-12 max-w-[52rem] text-or">
            Forfaits et packs — {forfaits.length}
          </p>
          <Lignes prestations={forfaits} depart={delai + 200} />
        </>
      )}
    </Reveal>
  );
}

function Lignes({ prestations, depart }: { prestations: Prestation[]; depart: number }) {
  return (
    <ul className="mx-auto mt-7 max-w-[52rem] lg:columns-2 lg:gap-x-16">
      {prestations.map((p, i) => (
        <li
          key={p.nom}
          className="ligne-prix group overflow-hidden break-inside-avoid"
          style={{ '--reveal-delay': `${depart + i * 40}ms` } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-3 py-4">
            {/* `min-w-0` et pas `shrink-0` : un intitule long comme
                « Rattrapage sourcils vires au rouge ou au gris » doit pouvoir
                se replier sur deux lignes. En `shrink-0` il poussait le prix
                hors de sa colonne et celui-ci chevauchait la colonne voisine. */}
            <span className="min-w-0 font-light text-balance text-white transition-colors duration-300 group-hover:text-or-doux">
              {p.nom}
            </span>

            {/* le filet de conduite : c'est lui qui relie l'oeil au prix */}
            <span aria-hidden="true" className="conduite" />

            <span className="micro hidden shrink-0 text-white/45 sm:inline">{p.duree}</span>

            <span className="font-display shrink-0 text-2xl whitespace-nowrap text-or transition-transform duration-300 group-hover:scale-105">
              {p.apd && <span className="micro mr-1 font-sans text-white/45">dès</span>}
              {p.prix}&nbsp;€
            </span>
          </div>

          {p.description && (
            <p className="-mt-2 pb-4 text-sm leading-relaxed text-white/50">{p.description}</p>
          )}
          <p className="micro -mt-2 pb-4 text-white/40 sm:hidden">{p.duree}</p>
        </li>
      ))}
    </ul>
  );
}
