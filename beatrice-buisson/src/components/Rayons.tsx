/**
 * Le soleil — motif de fond.
 *
 * Motif herite du gabarit : un soleil levant, des rayons
 * fins de longueurs inegales, quelques points, deux etoiles. On en tire ici
 * une version reduite, reutilisable comme puce de section, marqueur de liste
 * et filigrane. C'est la marque de fabrique : elle revient partout.
 */
export default function Rayons({
  taille = 28,
  anime = true,
  className = '',
  couleur = 'currentColor',
}: {
  taille?: number;
  anime?: boolean;
  className?: string;
  couleur?: string;
}) {
  /* longueurs irregulieres : le trace du logo n'est pas regulier non plus */
  const rayons = [
    { a: -90, l: 11 },
    { a: -67, l: 7 },
    { a: -45, l: 10 },
    { a: -22, l: 6.5 },
    { a: 0, l: 11 },
    { a: 22, l: 6.5 },
    { a: 45, l: 10 },
    { a: 67, l: 7 },
    { a: 90, l: 11 },
    { a: 112, l: 7 },
    { a: 135, l: 10 },
    { a: 157, l: 6.5 },
    { a: 180, l: 11 },
    { a: 202, l: 6.5 },
    { a: 225, l: 10 },
    { a: 247, l: 7 },
  ];

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke={couleur} strokeWidth="1.15" strokeLinecap="round">
        {rayons.map((r, i) => {
          const rad = (r.a * Math.PI) / 180;
          const x1 = 16 + Math.cos(rad) * 5.5;
          const y1 = 16 + Math.sin(rad) * 5.5;
          const x2 = 16 + Math.cos(rad) * (5.5 + r.l);
          const y2 = 16 + Math.sin(rad) * (5.5 + r.l);
          return (
            <line
              key={r.a}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              opacity={i % 2 === 0 ? 0.9 : 0.5}
              className={anime ? 'rayon' : undefined}
              style={anime ? { animationDelay: `${i * 90}ms` } : undefined}
            />
          );
        })}
      </g>
      <circle cx="16" cy="16" r="2.6" fill={couleur} opacity=".92" />
    </svg>
  );
}
