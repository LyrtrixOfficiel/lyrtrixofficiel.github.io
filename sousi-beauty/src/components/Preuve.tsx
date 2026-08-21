import { useEffect, useRef, useState } from 'react';
import { Reveal } from './Reveal';
import { Lotus } from './Lotus';
import { AVIS, DEPUIS_ANS } from '../data/site';
import { usePrefersReducedMotion } from '../lib/motion';

/**
 * La preuve, posee sur une bande video pleine largeur.
 *
 * C'etait la section la plus vide du site : trois chiffres sur du noir. Elle
 * porte maintenant une boucle d'or liquide generee — abstraite, elle ne
 * represente aucune prestation — et les chiffres sont dans des plaques de
 * verre par-dessus.
 *
 * La video suit les memes regles que partout : poster en LCP, montee apres
 * 600 ms, jamais sous `prefers-reduced-motion` ni en `Save-Data`, lecture
 * coupee hors viewport et onglet cache. Boucle en palindrome, 378 kB.
 */
export function Preuve() {
  const video = useRef<HTMLVideoElement>(null);
  const section = useRef<HTMLElement>(null);
  const reduit = usePrefersReducedMotion();
  const [monter, setMonter] = useState(false);

  useEffect(() => {
    if (reduit) return;
    const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (conn?.saveData || /2g/.test(conn?.effectiveType ?? '')) return;
    const id = window.setTimeout(() => setMonter(true), 600);
    return () => window.clearTimeout(id);
  }, [reduit]);

  useEffect(() => {
    const v = video.current;
    const s = section.current;
    if (!v || !s) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(s);

    const onVis = () => {
      if (document.hidden) v.pause();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [monter]);

  const chiffres = [
    { valeur: `${AVIS.note} / 5`, legende: `sur ${AVIS.nombre} avis ${AVIS.source}` },
    { valeur: `${DEPUIS_ANS} ans`, legende: 'de métier, place des Halles' },
    { valeur: '165', legende: 'prestations à la carte' },
  ];

  return (
    <section ref={section} className="relative isolate overflow-hidden py-24 sm:py-32" id="preuve">
      <img
        src="/media/or.jpg"
        alt=""
        aria-hidden="true"
        width={1440}
        height={810}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      {monter && (
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-0 transition-opacity duration-[1200ms] ease-out data-[prete=true]:opacity-100"
          onCanPlay={(e) => {
            e.currentTarget.dataset.prete = 'true';
            void e.currentTarget.play().catch(() => {});
          }}
        >
          <source src="/media/or.mp4" type="video/mp4" />
        </video>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, #000 0%, rgba(0,0,0,.52) 22%, rgba(0,0,0,.52) 78%, #000 100%)',
        }}
      />

      <div className="pad-x">
        <Reveal>
          <p className="micro flex items-center gap-2 text-or-doux">
            <Lotus taille={16} anime={false} className="text-or" />
            Ce qu’en disent ses clientes
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {chiffres.map((c, i) => (
            <Reveal
              as="li"
              key={c.legende}
              delai={i * 110}
              className="liquid-glass rounded-[1.25rem] p-6"
            >
              <p className="font-display text-5xl leading-none text-white">{c.valeur}</p>
              <p className="micro mt-3 text-white/70">{c.legende}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal delai={380}>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
            {AVIS.detail.map((d) => (
              <li key={d.critere} className="micro text-white/60">
                {d.critere} <span className="text-or-doux">{d.note}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
