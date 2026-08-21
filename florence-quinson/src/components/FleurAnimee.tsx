import type { CSSProperties } from 'react';

/**
 * Une fleur qui s'ouvre, en boucle. Fond de la page Fleurs de Bach.
 *
 * Pourquoi pas une video generee : elle pesterait 300 a 500 ko, il faudrait
 * un poster, elle se recadrerait mal en mobile — exactement le defaut qu'on
 * vient de corriger sur le hero — et une video de « flacons de preparation
 * florale » fabriquerait son produit, que personne n'a vu.
 *
 * Ici : 3 ko de SVG, net a toutes les tailles, aucun recadrage possible
 * puisque le dessin s'adapte a sa boite. Huit petales s'ouvrent en decale,
 * le coeur pulse, l'ensemble respire. Boucle de 9 s.
 *
 * Tout est en CSS. `prefers-reduced-motion` fige la fleur ouverte — elle
 * reste belle a l'arret, ce qui est la seule facon honnete de traiter
 * l'accessibilite : pas de version degradee, la meme image, immobile.
 */

/** Huit petales en couronne, chacun tourne de 45 degres de plus. */
const PETALES = Array.from({ length: 8 }, (_, i) => i);

export default function FleurAnimee({
  className = '',
  opacite = 0.5,
}: {
  className?: string;
  opacite?: number;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      role="presentation"
      aria-hidden="true"
      className={`fleur-animee ${className}`}
      style={{ '--opacite-fleur': opacite } as CSSProperties}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* halo, qui respire */}
      <circle className="fleur-halo" cx="200" cy="200" r="120" strokeWidth="0.6" />
      <circle className="fleur-halo fleur-halo--2" cx="200" cy="200" r="158" strokeWidth="0.4" />

      {/* la corolle */}
      <g className="fleur-corolle">
        {PETALES.map((i) => (
          <g
            key={i}
            className="fleur-petale"
            style={{ '--tour': `${i * 45}deg`, '--rang': i } as CSSProperties}
          >
            {/* un petale, pointe en haut, base au centre */}
            <path
              d="M200 200C176 176 168 140 182 104C190 82 200 68 200 68C200 68 210 82 218 104C232 140 224 176 200 200Z"
              strokeWidth="1.1"
            />
            <path d="M200 188C196 160 196 128 200 96" strokeWidth="0.5" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* etamines */}
      <g className="fleur-coeur">
        {PETALES.map((i) => (
          <line
            key={i}
            x1="200"
            y1="200"
            x2="200"
            y2="176"
            strokeWidth="0.9"
            style={{ transform: `rotate(${i * 45 + 22}deg)`, transformOrigin: '200px 200px' }}
          />
        ))}
        <circle cx="200" cy="200" r="7" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
