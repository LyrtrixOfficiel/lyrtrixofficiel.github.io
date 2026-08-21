import { useEffect, useRef, useState } from 'react';

/**
 * Fond video.
 *
 * Boucle **native** (`loop`), et un seul fondu : celui de l'arrivee, quand la
 * premiere image est prete.
 *
 * Version precedente : un fondu au noir de 550 ms etait declenche a 0,55 s de
 * la fin, puis un fondu d'entree apres le retour a zero. Ca donnait une pulsation
 * sombre toutes les 8 secondes — l'image fixe du poster reapparaissait derriere
 * la video en train de disparaitre, sur une autre image que la sienne. Le saut
 * de la boucle native est bien moins visible sur un plan macro lent que ce
 * battement.
 *
 * Le `src` n'est pose qu'a l'approche du viewport (`rootMargin` 400 px) : une
 * page ne telecharge jamais les videos de ses sections basses. Le poster WebP,
 * lui, est affiche tout de suite — pas de trou noir.
 *
 * `prefers-reduced-motion` ne coupe pas la video : ce reglage vise les
 * mouvements brusques et les parallaxes, pas un plan macro lent. Ce sont les
 * animations d'entree qui sont neutralisees, dans index.css.
 */
export default function FadingVideo({
  src,
  poster,
  immediat = false,
  className = '',
  style,
}: {
  src: string;
  poster: string;
  /** true pour le premier ecran : on ne differe pas le chargement */
  immediat?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [charger, setCharger] = useState(false);

  /* --- decide quand poser le src ------------------------------------- */
  useEffect(() => {
    if (immediat) {
      setCharger(true);
      return;
    }
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCharger(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [immediat]);

  /* --- fondu d'arrivee, une seule fois -------------------------------- */
  useEffect(() => {
    const v = ref.current;
    if (!v || !charger) return;

    let raf = 0;

    const apparaitre = () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const depart = Number(v.style.opacity || 0);
      const pas = () => {
        const k = Math.min(1, (performance.now() - t0) / 700);
        v.style.opacity = String(depart + (1 - depart) * k);
        if (k < 1) raf = requestAnimationFrame(pas);
      };
      raf = requestAnimationFrame(pas);
    };

    const surCharge = () => {
      void v.play().catch(() => {});
      apparaitre();
    };

    /* onglet cache : on met en pause, sinon le decodage tourne pour rien */
    const surOnglet = () => {
      if (document.hidden) v.pause();
      else void v.play().catch(() => {});
    };

    v.addEventListener('loadeddata', surCharge);
    document.addEventListener('visibilitychange', surOnglet);
    if (v.readyState >= 2) surCharge();

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('loadeddata', surCharge);
      document.removeEventListener('visibilitychange', surOnglet);
    };
  }, [charger, src]);

  return (
    <>
      {/* le poster, toujours la, derriere la video */}
      <div
        aria-hidden="true"
        className={className}
        style={{
          backgroundImage: `url(${poster})`,
          backgroundSize: 'cover',
          backgroundPosition: style?.objectPosition ?? 'center',
          ...style,
        }}
      />
      <video
        ref={ref}
        src={charger ? src : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload={immediat ? 'auto' : 'none'}
        aria-hidden="true"
        tabIndex={-1}
        className={className}
        style={{ opacity: 0, ...style }}
      />
    </>
  );
}
