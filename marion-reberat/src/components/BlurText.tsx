import { useCallback, type ElementType } from 'react';

/**
 * Le texte arrive mot par mot : flou 10 px, 50 px plus bas, opacite 0 — puis
 * net, en place. 100 ms d'ecart entre deux mots. Declenche a l'entree dans le
 * viewport, une seule fois.
 *
 * Le texte reste un seul noeud lisible pour les lecteurs d'ecran : les mots
 * sont des `span` inline, la ponctuation et les espaces sont conserves.
 */
export default function BlurText({
  text,
  as = 'h1',
  className = '',
  decalage = 100,
  depart = 0,
}: {
  text: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
  /** millisecondes entre deux mots */
  decalage?: number;
  /** millisecondes avant le premier mot */
  depart?: number;
}) {
  const attacher = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.querySelectorAll('.blur-mot').forEach((m) => m.classList.add('is-in'));
        io.disconnect();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Balise = as as ElementType;
  const mots = text.split(' ');

  return (
    <Balise ref={attacher} className={className}>
      {mots.map((mot, i) => (
        <span
          key={`${mot}-${i}`}
          className="blur-mot"
          style={{ '--mot-delai': `${depart + i * decalage}ms` } as React.CSSProperties}
        >
          {mot}
          {i < mots.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Balise>
  );
}
