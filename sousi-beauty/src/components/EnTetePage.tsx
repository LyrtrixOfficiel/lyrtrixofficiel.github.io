import type { ReactNode } from 'react';
import { BlurText } from './BlurText';

/**
 * L'en-tete des pages qui ne sont pas un univers — tarifs, institut.
 *
 * Ces deux pages ouvraient sur `<section className="pad-x bg-nuit">`. Or
 * `.pad-x` plafonne l'element a 1180 px : le fond s'arretait donc lui aussi a
 * 1180 px, et sur un ecran de 2000 px on voyait une bande grise avec du noir de
 * chaque cote. C'est exactement ce qu'on voyait sur les captures.
 *
 * Ici la section prend toute la largeur et porte la photo ; seul le contenu est
 * plafonne. Meme gabarit que les pages d'univers, donc meme densite : plus de
 * page qui s'ouvre sur un titre pose au milieu du noir.
 */
export function EnTetePage({
  titre,
  photo,
  alt,
  chapeau,
  children,
}: {
  titre: string;
  photo: string;
  alt: string;
  chapeau?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      <img
        src={photo}
        alt={alt}
        width={1600}
        height={1067}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,.90) 0%, rgba(0,0,0,.62) 38%, rgba(0,0,0,.78) 72%, rgba(0,0,0,.97) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 68% at 30% 46%, rgba(0,0,0,.82) 0%, rgba(0,0,0,.6) 46%, rgba(0,0,0,.2) 78%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="pad-x relative z-10 pt-36 pb-16">
        <BlurText
          text={titre}
          as="h1"
          depart={200}
          decalage={110}
          className="text-[2.6rem] leading-[0.96] text-white sm:text-6xl lg:text-7xl"
        />
        {chapeau && (
          <div className="fade-rise mesure mt-6 text-white/75" style={{ animationDelay: '0.7s' }}>
            {chapeau}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
