import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GALERIE } from '../data/site';
import { usePrefersReducedMotion, useIsDesktop } from '../lib/motion';
import { useParallaxe } from '../lib/parallaxe';
import { TitreSection } from './TitreSection';

gsap.registerPlugin(ScrollTrigger);

/**
 * Galerie en colonnes (masonry CSS, pas de calcul de position en JS).
 *
 * Valeurs exactes issues de library/blocks/reactbits/masonry.md :
 *   duration 0.6 s · stagger 0.05 · ease power3.out · gap 16 px
 *
 * Par-dessus, une parallaxe de colonne au defilement : les colonnes glissent
 * de -42 et +26 px l'une par rapport a l'autre, `scrub: 0.9`. C'est le
 * decalage entre colonnes qui se voit. Desktop seulement — sur telephone la
 * grille est trop etroite pour que le decalage se lise, et il couterait des
 * frames pour rien.
 */
export function Galerie() {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = usePrefersReducedMotion();
  const desktop = useIsDesktop();

  useParallaxe('[data-colonne]', ref, desktop && !reduit);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tuiles = el.querySelectorAll('[data-tuile]');
    if (!tuiles.length) return;

    if (reduit) {
      gsap.set(tuiles, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        tuiles,
        { opacity: 0, y: 24, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [reduit]);

  // Repartition en colonnes explicites : la parallaxe a besoin de conteneurs
  // reels a deplacer, ce qu'une mise en page `columns` CSS ne donne pas.
  const nbColonnes = desktop ? 3 : 2;
  const colonnes: (typeof GALERIE)[] = Array.from({ length: nbColonnes }, () => []);
  GALERIE.forEach((img, i) => colonnes[i % nbColonnes].push(img));

  return (
    <section className="section pad-x" id="galerie" aria-labelledby="titre-galerie">
      <TitreSection numero="01" id="titre-galerie">
        Ses poses
      </TitreSection>

      <div ref={ref} className="mt-10 flex gap-4">
        {colonnes.map((colonne, ci) => (
          <div key={ci} data-colonne className="parallaxe flex-1 space-y-4">
            {colonne.map((img) => (
              <figure
                key={img.src}
                data-tuile
                className="voile relative overflow-hidden rounded-xl bg-surface"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  width={1080}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 30vw, 45vw"
                  className="w-full"
                />
                <figcaption className="label-plat absolute bottom-2 left-2 z-10">
                  {img.legende}
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
