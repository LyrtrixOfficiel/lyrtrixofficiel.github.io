import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/motion';

/**
 * Fond video du premier ecran.
 *
 * Le visuel est genere, abstrait, et ne represente aucune prestation : des
 * filaments dans une lumiere caramel. C'est une atmosphere, pas un resultat.
 * Les seules photos de resultats du site sont les siennes.
 *
 * Regles tenues :
 * - le LCP reste l'image `poster`, qui est aussi la premiere image de la video.
 *   La video ne se charge qu'apres, et n'entre jamais dans le chemin critique.
 * - `prefers-reduced-motion: reduce` ou `Save-Data` -> la video n'est jamais
 *   montee, le poster reste, seul.
 * - hors viewport ou onglet cache -> lecture mise en pause.
 * - un voile degrade porte le contraste du texte : jamais de texte pose a nu
 *   sur une image.
 */
export function FondVideo({
  posterMobile,
  posterDesktop,
  videoMobile,
  videoDesktop,
}: {
  posterMobile: string;
  posterDesktop: string;
  videoMobile: string;
  videoDesktop: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduit = usePrefersReducedMotion();
  const [monter, setMonter] = useState(false);

  // La video attend que la page soit posee. Le poster, lui, est deja la.
  useEffect(() => {
    if (reduit) return;
    // Connexion limitee ou economie de donnees : on s'en tient au poster.
    const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (conn?.saveData || /2g/.test(conn?.effectiveType ?? '')) return;

    const id = window.setTimeout(() => setMonter(true), 600);
    return () => window.clearTimeout(id);
  }, [reduit]);

  // Lecture coupee hors viewport et onglet cache.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.1 }
    );
    io.observe(v);

    const onVisibilite = () => {
      if (document.hidden) v.pause();
      else if (v.getBoundingClientRect().top < innerHeight) void v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibilite);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibilite);
    };
  }, [monter]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Poster — c'est lui le LCP */}
      <picture>
        <source media="(min-width: 768px)" srcSet={posterDesktop} />
        <img
          src={posterMobile}
          alt=""
          width={1080}
          height={1920}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>

      {/* Pas d'attribut `poster` sur la video : le <picture> ci-dessus joue
          deja ce role, et un `poster` ferait telecharger la variante mobile
          meme sur desktop. La video reste invisible jusqu'a `canplay`. */}
      {monter && (
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[1200ms] ease-out data-[prete=true]:opacity-100"
          onCanPlay={(e) => {
            e.currentTarget.dataset.prete = 'true';
            void e.currentTarget.play().catch(() => {});
          }}
        >
          <source src={videoDesktop} media="(min-width: 768px)" type="video/mp4" />
          <source src={videoMobile} type="video/mp4" />
        </video>
      )}

      {/* Voile de lisibilite — deux couches : une verticale pour le mobile,
          une laterale pour le desktop ou le texte est a gauche. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0D0A08F2_0%,#0D0A08CC_38%,#0D0A08E6_78%,#0D0A08_100%)] lg:bg-[linear-gradient(90deg,#0D0A08_0%,#0D0A08F2_38%,#0D0A08B3_66%,#0D0A0866_100%)]" />
    </div>
  );
}
