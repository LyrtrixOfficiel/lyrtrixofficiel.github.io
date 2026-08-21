import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from '../lib/motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll Reveal — entree des sections au defilement.
 * Valeurs exactes issues de library/blocks/reactbits/scrollreveal.md :
 *   baseOpacity 0.1 · baseRotation 3 deg · blurStrength 4 px · stagger 0.05
 */
export function Reveal({
  children,
  className,
  id,
  style,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduit) {
      gsap.set(el.children, { opacity: 1, y: 0, rotate: 0, filter: 'none' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0.1, y: 28, rotate: 3, filter: 'blur(4px)' },
        {
          opacity: 1,
          y: 0,
          rotate: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            once: true,
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [reduit]);

  return (
    <section ref={ref} id={id} className={className} style={style}>
      {children}
    </section>
  );
}
