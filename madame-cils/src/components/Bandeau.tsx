import { FAMILLES } from '../data/site';

/**
 * Bandeau defilant des six familles de poses.
 *
 * Marque de fabrique numero trois. Il dit en une ligne ce que le catalogue met
 * six onglets a dire, et il donne au premier defilement un mouvement qui ne
 * depend d'aucune librairie : deux copies de la liste, une translation CSS
 * infinie, `aria-hidden` sur le double.
 *
 * Sous `prefers-reduced-motion`, l'animation s'arrete : la liste reste lisible,
 * fixe.
 */
export function Bandeau() {
  const items = [...FAMILLES, 'Depuis 2022', '5,0 / 5 sur 214 avis'];

  return (
    <div
      className="bandeau border-y border-white/8 py-4"
      role="marquee"
      aria-label="Les familles de poses proposées"
    >
      <div className="bandeau-piste">
        {[0, 1].map((copie) => (
          <ul
            key={copie}
            className="bandeau-groupe"
            aria-hidden={copie === 1 ? 'true' : undefined}
          >
            {items.map((f) => (
              <li key={`${copie}-${f}`} className="flex shrink-0 items-center gap-6">
                <span className="text-[length:var(--micro)] tracking-[0.3em] whitespace-nowrap uppercase">
                  {f}
                </span>
                <Etoile />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Le separateur du bandeau — un cil stylise, pas une puce ronde. */
function Etoile() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true" className="shrink-0">
      <path
        d="M1 12C4 7 6.5 4.5 13 2"
        fill="none"
        stroke="#d9a277"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
