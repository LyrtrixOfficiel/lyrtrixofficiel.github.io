import { useEffect, useRef, useState } from 'react';
import FadingVideo from './FadingVideo';

/**
 * Revelation au curseur.
 *
 * Un disque de 280 px suit le pointeur et decouvre, sous le plan de base, le
 * **meme plan eclairci et desature** : le disque se lit comme une lampe que
 * l'on promene sur l'eau. Le pointeur est lisse (lerp 0,1) pour que le disque
 * traine legerement derriere le doigt.
 *
 * Premiere tentative : reveler une *autre* video. Ca ne marche pas — les
 * quatre plans sont tous chauds, sombres et flous, donc le disque ne se
 * distinguait pas du fond. Le meme plan retraite, lui, tranche nettement, et
 * ne coute aucun telechargement supplementaire (le fichier est deja en cache).
 *
 * Le masque est un `radial-gradient` dont le centre est pilote par deux
 * variables CSS. La version d'origine dessinait le degrade dans un canvas et
 * l'exportait en `toDataURL()` a chaque image : c'est exactement ce qu'il ne
 * faut pas faire, ca fait fondre un telephone. Ici le compositeur fait tout.
 *
 * L'effet ne se monte que sur un ecran large avec un vrai pointeur : sur
 * mobile ce serait une deuxieme video a decoder pour rien, et il n'y a pas de
 * curseur a suivre. Il est aussi coupe sous `prefers-reduced-motion`.
 */
/** eclairci, legerement desature : entre le clair de lune et la bougie */
const TRAITEMENT = 'brightness(2.25) saturate(0.6) contrast(1.12)';

export default function Revelation({
  src,
  poster,
  miroir = false,
  className = '',
}: {
  src: string;
  poster: string;
  /** doit refleter exactement le cadrage du plan de base, miroir compris —
   *  sinon le disque decouvre une image inversee par rapport au fond */
  miroir?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [monter, setMonter] = useState(false);

  useEffect(() => {
    /* L'effet est pilote par l'utilisateur : rien ne bouge tant qu'il ne
       bouge pas. Il n'est donc pas coupe par `prefers-reduced-motion`. */
    const pointeurFin = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setMonter(pointeurFin && window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!monter || !el) return;

    const hote = el.parentElement;
    if (!hote) return;

    let raf = 0;
    let actif = false;
    const cible = { x: 0, y: 0 };
    const lisse = { x: 0, y: 0 };
    let amorce = false;

    const poser = (x: number, y: number) => {
      el.style.setProperty('--rev-x', `${x}px`);
      el.style.setProperty('--rev-y', `${y}px`);
    };

    const boucle = () => {
      raf = requestAnimationFrame(boucle);
      /* lerp 0,1 : le disque traine derriere le doigt, il ne colle pas */
      lisse.x += (cible.x - lisse.x) * 0.1;
      lisse.y += (cible.y - lisse.y) * 0.1;
      poser(lisse.x, lisse.y);
    };

    const surMouvement = (e: PointerEvent) => {
      const r = hote.getBoundingClientRect();
      cible.x = e.clientX - r.left;
      cible.y = e.clientY - r.top;
      if (!amorce) {
        /* premiere position : on se pose dessus sans traverser l'ecran */
        lisse.x = cible.x;
        lisse.y = cible.y;
        amorce = true;
      }
      /* Ecriture immediate : si la boucle est bridee (onglet en arriere-plan,
         economie d'energie), le disque suit quand meme, sans l'adoucissement. */
      poser(lisse.x, lisse.y);
      if (!actif) {
        actif = true;
        el.classList.add('is-active');
      }
    };

    const surSortie = () => {
      actif = false;
      el.classList.remove('is-active');
    };

    hote.addEventListener('pointermove', surMouvement, { passive: true });
    hote.addEventListener('pointerleave', surSortie, { passive: true });
    raf = requestAnimationFrame(boucle);

    return () => {
      cancelAnimationFrame(raf);
      hote.removeEventListener('pointermove', surMouvement);
      hote.removeEventListener('pointerleave', surSortie);
    };
  }, [monter]);

  if (!monter) return null;

  return (
    <div
      ref={ref}
      className={`revelation pointer-events-none absolute inset-0 ${className}`}
      style={{ filter: TRAITEMENT }}
    >
      <FadingVideo
        src={src}
        poster={poster}
        immediat
        className="absolute inset-0 h-full w-full object-cover"
        style={miroir ? { transform: 'scaleX(-1)' } : undefined}
      />
    </div>
  );
}
