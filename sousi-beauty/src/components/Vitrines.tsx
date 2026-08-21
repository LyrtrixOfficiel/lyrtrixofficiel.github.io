import { UNIVERS, nbPrestations, prixDEntree, type Univers } from '../data/site';
import { Lotus } from './Lotus';

/**
 * Les quatre vitrines en verre — l'entree du site vers les quatre pages.
 *
 * Elles sont construites depuis UNIVERS, la meme source que les pages et que
 * le sommaire des tarifs : un univers ajoute apparait partout, ou nulle part.
 *
 * Chaque carte annonce le PRIX D'ENTREE de son univers. C'est le chiffre que
 * la visiteuse cherche — « a partir de combien » — et il se calcule depuis le
 * catalogue, il ne se saisit pas a la main.
 *
 * Le lisere de verre vient du `mask-composite` : clair en haut ET en bas,
 * invisible au milieu.
 */
export function Vitrines() {
  return (
    <section className="section pad-x" id="univers" aria-labelledby="titre-univers">
      <header className="border-t border-white/12 pt-6">
        <p className="micro text-or">Quatre métiers</p>
        <h2 id="titre-univers" className="font-display mt-5 text-4xl text-white sm:text-5xl">
          Ce pour quoi on vient
        </h2>
      </header>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {UNIVERS.map((u, i) => (
          <Vitrine key={u.id} univers={u} index={i + 1} />
        ))}
      </div>
    </section>
  );
}

function Vitrine({ univers, index }: { univers: Univers; index: number }) {
  return (
    <a
      href={`./${univers.page}.html`}
      className="liquid-glass-strong group relative flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-[1.5rem] p-6 transition-transform duration-500 hover:scale-[1.02] lg:min-h-[28rem]"
    >
      <img
        src={univers.photo}
        alt=""
        aria-hidden="true"
        width={1600}
        height={1067}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,17,15,.62) 0%, rgba(20,17,15,.84) 46%, rgba(20,17,15,.97) 100%)',
        }}
      />

      <p className="micro relative z-10 flex items-center gap-2 text-or-doux">
        <Lotus taille={15} anime={false} className="text-or" />
        {String(index).padStart(2, '0')}
      </p>

      <h3 className="font-display relative z-10 mt-3 text-3xl text-white lg:text-[2.1rem]">
        {univers.titre}
      </h3>
      <p className="micro relative z-10 mt-2 text-white/60">{univers.sousTitre}</p>

      <div className="relative z-10 mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
        <div>
          <p className="micro text-white/55">{univers.appel.nom}</p>
          <p className="font-display text-3xl text-or">dès {prixDEntree(univers)}&nbsp;€</p>
        </div>
        <p className="micro text-right text-white/55">
          {nbPrestations(univers)}
          <br />
          prestations
        </p>
      </div>

      <span className="micro relative z-10 mt-5 inline-flex items-center gap-2 text-white transition-colors duration-300 group-hover:text-or-doux">
        Découvrir
        <span aria-hidden="true">&#8594;</span>
      </span>
    </a>
  );
}
