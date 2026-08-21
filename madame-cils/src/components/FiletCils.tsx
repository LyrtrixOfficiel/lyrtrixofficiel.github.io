/**
 * Filet de cils — marque de fabrique repetee entre les sections.
 *
 * Un filet de separation dessine : des traits effiles, inclines, de hauteur
 * alternee. Il sort du metier de Laura, pas d'un catalogue de separateurs.
 */
export function FiletCils({ className = '' }: { className?: string }) {
  const traits = Array.from({ length: 34 }, (_, i) => i);
  return (
    <div className={`pad-x ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 340 18"
        preserveAspectRatio="none"
        className="h-[18px] w-full opacity-70"
        role="presentation"
      >
        {traits.map((i) => {
          const x = i * 10 + 2;
          const haut = i % 3 === 0 ? 14 : i % 2 === 0 ? 10 : 7;
          return (
            <path
              key={i}
              d={`M ${x} 17 C ${x + 1} ${17 - haut * 0.5}, ${x + 3} ${17 - haut * 0.8}, ${x + 5} ${17 - haut}`}
              stroke="#d9a277"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </svg>
    </div>
  );
}
