import { Reveal } from './Reveal';
import { Lotus } from './Lotus';
import { SIGNATURES, PHOTOS } from '../data/site';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';

/**
 * Les cinq signatures — refaites.
 *
 * Ce qui n'allait pas, et qui se voyait sur un ecran de 2000 px : le nom a
 * gauche, le prix a l'extreme droite, 1 500 px de noir entre les deux. La
 * grille en `1fr` etirait la colonne du nom sur toute la largeur disponible.
 *
 * Maintenant : une **carte par signature**, en verre, avec une photo. Le prix
 * est DANS la carte, a moins de 300 px du nom quelle que soit la largeur. Et
 * la section n'est plus une liste de texte sur fond noir : elle a des images.
 */
export function Signatures() {
  return (
    <section className="section pad-x" id="signatures" aria-labelledby="titre-signatures">
      <Reveal>
        <p className="micro text-or">Les signatures</p>
        <h2 id="titre-signatures" className="font-display mt-4 text-4xl text-white sm:text-5xl">
          Le maquillage qui reste
        </h2>
        <p className="mesure mt-4 text-white/60">
          Ce qui fait venir de plus loin que la place des Halles.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SIGNATURES.map((s, i) => (
          <Reveal
            key={s.nom}
            as="article"
            delai={i * 90}
            className={`liquid-glass-strong group relative flex flex-col overflow-hidden rounded-[1.4rem] p-6 transition-transform duration-500 hover:scale-[1.02] ${
              i === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''
            }`}
          >
            <img
              src={PHOTOS[(i * 2 + 3) % PHOTOS.length].src}
              alt=""
              aria-hidden="true"
              width={1600}
              height={1067}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'linear-gradient(180deg, rgba(10,8,7,.80) 0%, rgba(10,8,7,.90) 45%, rgba(10,8,7,.97) 100%)',
              }}
            />

            <p className="micro flex items-center gap-2 text-or-doux">
              <Lotus taille={14} anime={false} className="text-or" />
              {String(i + 1).padStart(2, '0')}
            </p>

            <h3 className="font-display mt-3 text-2xl text-white sm:text-3xl">{s.nom}</h3>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/65">{s.description}</p>

            <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
              <span className="micro text-white/50">{s.duree}</span>
              <span className="font-display text-3xl whitespace-nowrap text-or transition-transform duration-300 group-hover:scale-110">
                {s.prix}&nbsp;€
              </span>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delai={500} className="mt-10">
        <a
          href={lienRdv('signatures')}
          {...LIEN_EXTERNE}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
        >
          Prendre rendez-vous
        </a>
      </Reveal>
    </section>
  );
}
