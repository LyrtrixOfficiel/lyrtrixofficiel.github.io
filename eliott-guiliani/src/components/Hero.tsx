import type { CSSProperties, ReactNode } from 'react';
import FadingVideo from './FadingVideo';
import Revelation from './Revelation';
import BlurText from './BlurText';
import Nav from './Nav';
import type { Route } from '../lib/site';

/**
 * Premier ecran. Une video de fond en fondu continu, un voile qui tient le
 * contraste, et tout le reste pose dessus en verre liquide.
 */
export default function Hero({
  route,
  video,
  poster,
  badge,
  titre,
  sous,
  actions,
  cartes,
  bandeau,
  plein = false,
  cadrage = 'center',
  miroir = false,
  revelation,
}: {
  route: Route;
  video: string;
  poster: string;
  badge: ReactNode;
  titre: string;
  sous: ReactNode;
  actions?: ReactNode;
  cartes?: ReactNode;
  bandeau?: ReactNode;
  plein?: boolean;
  cadrage?: string;
  /**
   * Retourne le plan horizontalement. En `object-fit: cover` sur un ecran
   * plus large que le 16:9, `object-position` horizontal n'a aucun effet :
   * la video remplit deja la largeur. Le miroir est le seul moyen de faire
   * passer le sujet d'un cote a l'autre.
   */
  miroir?: boolean;
  /** active le disque de revelation qui suit le curseur (bureau uniquement) */
  revelation?: boolean;
}) {
  return (
    <section
      className={`relative w-full overflow-hidden bg-black ${
        plein
          ? 'h-[76svh] min-h-[560px] sm:h-svh sm:min-h-[680px]'
          : 'min-h-[520px] sm:min-h-[600px] md:min-h-[660px]'
      }`}
    >
      <FadingVideo
        src={video}
        poster={poster}
        immediat
        className="video-fond fondu-bas absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: cadrage, '--miroir': miroir ? '-1' : '1' } as CSSProperties}
      />

      {revelation && <Revelation src={video} poster={poster} miroir={miroir} />}

      {/* voile : jamais de texte pose sur l'image nue */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,.74) 0%, rgba(0,0,0,.42) 30%, rgba(0,0,0,.52) 62%, rgba(0,0,0,.92) 100%)',
        }}
      />

      <Nav route={route} />

      {/* Voile local : c'est lui qui tient le contraste du texte, pas le
          degrade global — l'image reste lisible sur les cotes. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(54% 56% at 50% 47%, rgba(0,0,0,.76) 0%, rgba(0,0,0,.56) 42%, rgba(0,0,0,.20) 72%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Le rembourrage mobile est nettement plus court : a 812 px de haut, le
          bloc depassait la fenetre et `justify-center` faisait sortir le titre
          par le haut. */}
      <div
        className={`relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center px-5 text-center sm:px-6 ${
          plein ? 'pt-28 pb-24 sm:pt-28 sm:pb-32' : 'pt-28 pb-14 sm:pt-32 sm:pb-16'
        }`}
      >
        {/* `fade-in` et non `fade-rise` : voir index.css, un conteneur de verre
            ne doit jamais etre transforme ni floute pendant son entree, sinon
            son `backdrop-filter` est neutralise et son `overflow: hidden`
            rogne le contenu. */}
        <div
          className="fade-in liquid-glass verre-sur flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-[1.6rem] px-3.5 py-2 sm:rounded-full sm:py-1.5 sm:pr-4 sm:pl-1.5"
          style={{ animationDelay: '0.35s' }}
        >
          {badge}
        </div>

        <BlurText
          text={titre}
          as="h1"
          depart={450}
          decalage={90}
          className={`mt-7 max-w-3xl text-white sm:mt-6 ${
            plein
              ? 'text-[2.15rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[5rem]'
              : 'text-[1.95rem] leading-[1] sm:text-4xl md:text-5xl lg:text-[4.4rem]'
          }`}
        />

        <p
          className="fade-rise mt-6 max-w-xl text-sm font-light leading-relaxed text-white/85 sm:text-base md:text-lg"
          style={{ animationDelay: '0.9s' }}
        >
          {sous}
        </p>

        {actions && (
          <div
            className="fade-rise mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5 lg:justify-start"
            style={{ animationDelay: '1.1s' }}
          >
            {actions}
          </div>
        )}

        {/* Cartes ET bandeau sont masques sur telephone : ils ajoutaient ~200 px,
            repetaient l'adresse et le numero — deja dans la barre d'appel fixe
            et le pied de page — et le bandeau, en `absolute bottom-0`, venait
            se poser sur les boutons quand l'ecran etait court. */}
        {cartes && (
          <div
            className="fade-rise mt-10 hidden flex-wrap items-stretch justify-center gap-4 sm:flex"
            style={{ animationDelay: '1.3s' }}
          >
            {cartes}
          </div>
        )}
      </div>

      {bandeau && (
        <div
          /* pb-24 sur telephone : la barre d'appel fixe occupe les ~76 px du bas */
          className="fade-rise absolute inset-x-0 bottom-0 z-10 hidden flex-col items-center gap-4 px-5 pb-24 sm:flex sm:pb-12 lg:pb-12"
          style={{ animationDelay: '1.45s' }}
        >
          {bandeau}
        </div>
      )}
    </section>
  );
}

/** Carte de statistique en verre, sous les boutons du hero. */
export function CarteVerre({
  icone,
  valeur,
  legende,
}: {
  icone: ReactNode;
  valeur: string;
  legende: string;
}) {
  return (
    <div className="liquid-glass w-[190px] rounded-[1.25rem] p-5 text-left sm:w-[220px]">
      <span className="text-amber">{icone}</span>
      <p className="mt-4 font-display text-4xl leading-none tracking-[-1px] text-white">{valeur}</p>
      <p className="mt-2 text-xs font-light leading-snug text-white/70">{legende}</p>
    </div>
  );
}
