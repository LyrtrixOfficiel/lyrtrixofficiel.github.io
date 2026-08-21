import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Parallaxe de defilement, amortie par ScrollTrigger.
 *
 * `scrub: 0.9` est l'equivalent ScrollTrigger d'un lerp : la position rejoint
 * sa cible en 0,9 s au lieu de coller au pixel de scroll. Aucune valeur ne
 * saute, et on n'anime que `transform`.
 *
 * Desactive sous `prefers-reduced-motion` et sous 1024 px : sur telephone, une
 * parallaxe coute des frames pour un effet qu'on ne voit pas.
 */
export function useParallaxe(
  selecteur: string,
  conteneur: React.RefObject<HTMLElement | null>,
  actif: boolean
) {
  useEffect(() => {
    const el = conteneur.current;
    if (!el || !actif) return;

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>(selecteur).forEach((cible, i) => {
        // Colonnes impaires vers le haut, paires vers le bas : c'est le
        // decalage entre colonnes qui se voit, pas le deplacement absolu.
        const amplitude = i % 2 === 0 ? -42 : 26;
        gsap.to(cible, {
          y: amplitude,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.9,
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [selecteur, conteneur, actif]);
}
