import { useEffect, useRef } from 'react';
import { PHOTOS } from '../data/site';
import { usePrefersReducedMotion, useIsDesktop } from '../lib/motion';

/**
 * Le lieu — ses neuf photos, en bande horizontale qui defile au doigt.
 *
 * Une bande plutot qu'une grille : la page est deja longue, et une bande tient
 * en un ecran tout en montrant neuf images. Elle se fait glisser au doigt
 * (`overflow-x`, scroll natif), et la parallaxe verticale alternee entre les
 * tuiles donne la profondeur sur desktop.
 */
export function Galerie() {
  const piste = useRef<HTMLUListElement>(null);
  const reduit = usePrefersReducedMotion();
  const desktop = useIsDesktop();

  useEffect(() => {
    const el = piste.current;
    if (!el || reduit || !desktop) return;

    const tuiles = [...el.querySelectorAll<HTMLElement>('[data-tuile]')];
    let frame = 0;
    let visible = true;

    const boucle = () => {
      const r = el.getBoundingClientRect();
      const p = 1 - (r.top + r.height / 2) / innerHeight; // -1 .. 1
      tuiles.forEach((t, i) => {
        const sens = i % 2 === 0 ? -1 : 1;
        t.style.transform = `translate3d(0, ${(p * 26 * sens).toFixed(2)}px, 0)`;
      });
      frame = visible ? requestAnimationFrame(boucle) : 0;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !frame) frame = requestAnimationFrame(boucle);
        else if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0.02 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
      tuiles.forEach((t) => (t.style.transform = ''));
    };
  }, [reduit, desktop]);

  return (
    <section className="section overflow-hidden" id="lieu" aria-labelledby="titre-lieu">
      <header className="pad-x pt-6">
        <p className="micro text-or">Le lieu</p>
        <h2 id="titre-lieu" className="font-display mt-5" style={{ fontSize: 'var(--h2)' }}>
          Place des Halles,
          <br />
          en vrai
        </h2>
      </header>

      <ul
        ref={piste}
        className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 lg:gap-6"
        style={{ paddingInline: 'max(1.25rem, calc((100vw - 1180px) / 2 + 1.25rem))', scrollbarWidth: 'thin' }}
      >
        {PHOTOS.map((p) => (
          <li
            key={p.src}
            data-tuile
            className="parallaxe w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[31vw]"
          >
            <img
              src={p.src}
              alt={p.alt}
              width={1600}
              height={1067}
              loading="lazy"
              decoding="async"
              className="h-[58vw] w-full object-cover sm:h-[34vw] lg:h-[23vw]"
            />
          </li>
        ))}
      </ul>

      <p className="pad-x micro mt-2 text-white/65">Faites glisser · 9 photos</p>
    </section>
  );
}
