import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePrefersReducedMotion } from '../lib/motion';

/**
 * Split Text — entree du titre, mot par mot, revele par un masque.
 *
 * Valeurs exactes issues de library/blocks/reactbits/splittext.md :
 *   easing power3.out · duration 1.25 s · stagger 50 ms · threshold 0.1
 *
 * Chaque mot est enferme dans un conteneur `overflow: hidden` et monte depuis
 * le bas : le mot n'apparait pas en fondu, il *entre*. C'est plus net qu'une
 * opacite, et ca ne coute rien de plus — `transform` et `opacity` uniquement.
 *
 * Le decoupage se fait par mot, jamais par caractere : un mot coupe en fin de
 * ligne est illisible, et chaque caractere anime multiplie les noeuds a animer.
 */
export function SplitText({
  text,
  className,
  style,
  id,
  as: Tag = 'h1',
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  as?: 'h1' | 'h2' | 'p';
}) {
  const ref = useRef<HTMLElement>(null);
  const reduit = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mots = el.querySelectorAll<HTMLElement>('[data-mot]');
    if (!mots.length) return;

    // Mouvement reduit : le titre est deja la, on ne fait rien.
    if (reduit) {
      gsap.set(mots, { yPercent: 0, opacity: 1, rotate: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mots,
        { yPercent: 118, opacity: 0, rotate: 2.5 },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration: 1.25,
          ease: 'power3.out',
          stagger: 0.05,
        }
      );
    }, el);
    return () => ctx.revert();
  }, [text, reduit]);

  const mots = text.split(' ');

  return (
    <Tag ref={ref as never} id={id} className={className} style={style}>
      {mots.map((mot, i) => (
        <span key={`${mot}-${i}`} className="masque-mot">
          <span data-mot style={{ display: 'inline-block', willChange: 'transform, opacity' }}>
            {mot}
          </span>
          {i < mots.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}
