import { Fragment, useCallback, type ElementType } from 'react';

/**
 * Le texte arrive mot par mot : flou 10 px, 50 px plus bas, opacite 0 — puis
 * net, en place. Declenche a l'entree dans le viewport, une seule fois.
 *
 * Tout se joue en **transition CSS avec un delai par mot**, jamais en
 * requestAnimationFrame : c'est le compositeur qui travaille, et l'effet tient
 * meme quand la page est en arriere-plan.
 *
 * L'ESPACE EST DEHORS. Chaque mot est un `inline-block`, et un inline-block
 * rogne l'espace place en fin de boite : mis a l'interieur du span, il
 * disparait et le titre s'affiche « Lemaquillagequireste ». L'espace est donc
 * un noeud texte pose ENTRE deux spans, ou il est rendu normalement.
 *
 * Le texte reste lisible d'un bloc pour les lecteurs d'ecran : ce sont des
 * `span` inline avec de vrais espaces entre eux.
 */
export function BlurText({
  text,
  as = 'h1',
  className = '',
  id,
  style,
  decalage = 100,
  depart = 0,
}: {
  text: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
  id?: string;
  style?: React.CSSProperties;
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
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Balise = as as ElementType;
  const mots = text.split(' ');

  return (
    <Balise ref={attacher} id={id} className={className} style={style}>
      {mots.map((mot, i) => (
        <Fragment key={`${mot}-${i}`}>
          <span
            className="blur-mot"
            style={{ '--mot-delai': `${depart + i * decalage}ms` } as React.CSSProperties}
          >
            {mot}
          </span>
          {i < mots.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Balise>
  );
}
