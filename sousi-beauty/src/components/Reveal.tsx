import { useCallback, type ElementType, type ReactNode } from 'react';

/**
 * Apparition au scroll, en transition CSS. L'observateur se debranche des que
 * l'element est passe — un seul declenchement, et plus rien qui tourne.
 */
export function Reveal({
  children,
  delai = 0,
  className = '',
  id,
  as = 'div',
}: {
  children: ReactNode;
  delai?: number;
  className?: string;
  id?: string;
  as?: 'div' | 'li' | 'section' | 'article' | 'p';
}) {
  const attacher = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Balise = as as ElementType;

  return (
    <Balise
      ref={attacher}
      id={id}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delai}ms` } as React.CSSProperties}
    >
      {children}
    </Balise>
  );
}
