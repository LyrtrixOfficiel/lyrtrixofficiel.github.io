import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/motion';

/**
 * Comparateur tactile — la signature du site.
 *
 * Valeurs exactes issues de library/blocks/maison/comparateur-tactile.md :
 *   repos 58 · amortissement 0.08 · arret sous 0.05 · amorce 58 -> 42 -> 58
 *   sur 900 ms en cubic-bezier(0.4, 0, 0.2, 1) · clavier +/- 4
 *
 * Pourquoi un rideau et pas un halo au curseur : 80 a 95 % du trafic vient du
 * lien en bio Instagram. Un halo suit un curseur, et il n'y a pas de curseur
 * sur un telephone.
 *
 * Les deux etiquettes nomment deux prestations reelles. Ce n'est pas un
 * avant/apres : ce sont deux poses differentes, et le dire est le minimum.
 */

type Cote = { src: string; label: string; alt: string };

const REPOS = 58;
const AMORTISSEMENT = 0.08;
const SEUIL_ARRET = 0.05;
const PAS_CLAVIER = 4;

export function Comparateur({
  gauche,
  droite,
  priorite = false,
}: {
  gauche: Cote;
  droite: Cote;
  priorite?: boolean;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const cible = useRef(REPOS);
  const courant = useRef(REPOS);
  const frame = useRef(0);
  const visible = useRef(true);
  const [valeur, setValeur] = useState(REPOS);
  const reduit = usePrefersReducedMotion();

  /** Applique la valeur au DOM sans repasser par React a chaque frame. */
  const poser = useCallback((v: number) => {
    conteneur.current?.style.setProperty('--split', String(v));
  }, []);

  const boucle = useCallback(() => {
    const ecart = cible.current - courant.current;
    if (Math.abs(ecart) < SEUIL_ARRET) {
      courant.current = cible.current;
      poser(courant.current);
      setValeur(Math.round(courant.current));
      frame.current = 0;
      return;
    }
    courant.current += ecart * AMORTISSEMENT;
    poser(courant.current);
    frame.current = requestAnimationFrame(boucle);
  }, [poser]);

  const viser = useCallback(
    (v: number) => {
      const borne = Math.min(100, Math.max(0, v));
      cible.current = borne;
      if (reduit) {
        courant.current = borne;
        poser(borne);
        setValeur(Math.round(borne));
        return;
      }
      setValeur(Math.round(borne));
      if (!frame.current && visible.current) frame.current = requestAnimationFrame(boucle);
    },
    [boucle, poser, reduit]
  );

  const depuisPointeur = useCallback((clientX: number) => {
    const el = conteneur.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * 100;
  }, []);

  /** Boucle coupee hors viewport et onglet cache. */
  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (!e.isIntersecting && frame.current) {
          cancelAnimationFrame(frame.current);
          frame.current = 0;
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);

    const onVisibilite = () => {
      if (document.hidden && frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibilite);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibilite);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  /** Amorce : on montre le geste une fois, a la premiere apparition. */
  useEffect(() => {
    const el = conteneur.current;
    if (!el || reduit) return;

    let joue = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || joue) return;
        joue = true;
        io.disconnect();
        const debut = performance.now();
        const DUREE = 900;
        // cubic-bezier(0.4, 0, 0.2, 1) approxime par sa forme fermee usuelle
        const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const tick = (now: number) => {
          const t = Math.min(1, (now - debut) / DUREE);
          // aller-retour 58 -> 42 -> 58
          const aller = t < 0.5 ? ease(t * 2) : 1 - ease((t - 0.5) * 2);
          const v = REPOS - 16 * aller;
          courant.current = v;
          cible.current = v;
          poser(v);
          if (t < 1) requestAnimationFrame(tick);
          else {
            courant.current = REPOS;
            cible.current = REPOS;
            poser(REPOS);
            setValeur(REPOS);
          }
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [poser, reduit]);

  return (
    <div
      ref={conteneur}
      className="voile relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-surface select-none sm:aspect-[4/5]"
      style={
        {
          '--split': REPOS,
          touchAction: 'pan-y',
        } as React.CSSProperties
      }
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const v = depuisPointeur(e.clientX);
        if (v !== null) viser(v);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const v = depuisPointeur(e.clientX);
        if (v !== null) viser(v);
      }}
    >
      {/* Image de gauche — toujours visible en entier, dessous */}
      <img
        src={gauche.src}
        alt={gauche.alt}
        width={1080}
        height={1350}
        loading={priorite ? 'eager' : 'lazy'}
        fetchPriority={priorite ? 'high' : 'auto'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Image de droite — decoupee par le rideau */}
      <img
        src={droite.src}
        alt={droite.alt}
        width={1080}
        height={1350}
        loading={priorite ? 'eager' : 'lazy'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: 'inset(0 0 0 calc(var(--split) * 1%))' }}
      />

      {/* Le trait + la poignee */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent"
        style={{ left: 'calc(var(--split) * 1%)' }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Comparer ${gauche.label} et ${droite.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valeur}
        aria-valuetext={`${valeur} % de ${droite.label}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') viser(cible.current - PAS_CLAVIER);
          else if (e.key === 'ArrowRight') viser(cible.current + PAS_CLAVIER);
          else if (e.key === 'Home') viser(0);
          else if (e.key === 'End') viser(100);
          else return;
          e.preventDefault();
        }}
        className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-bg"
        style={{ left: 'calc(var(--split) * 1%)' }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
          <path d="M9.5 6 5 12l4.5 6V6Zm5 0v12l4.5-6-4.5-6Z" />
        </svg>
      </div>

      {/* Etiquettes — ce que montrent reellement les deux photos */}
      <span className="label-plat absolute bottom-3 left-3 z-10">{gauche.label}</span>
      <span className="label-plat absolute right-3 bottom-3 z-10">{droite.label}</span>
    </div>
  );
}
