import type { ReactNode } from 'react';

/**
 * Titre de section — filet au-dessus, eyebrow en capitales espacees, puis le
 * Garamond. C'est la composition de la planche 1 de la DA, reprise a chaque
 * section pour que la page ait une seule grammaire.
 */
export function TitreSection({
  eyebrow,
  id,
  children,
  chapeau,
}: {
  eyebrow: string;
  id: string;
  children: ReactNode;
  chapeau?: string;
}) {
  return (
    <header className="border-t border-white/12 pt-6">
      <p className="micro text-or">{eyebrow}</p>
      <h2
        id={id}
        className="font-display mt-5 text-white"
        style={{ fontSize: 'var(--h2)' }}
      >
        {children}
      </h2>
      {chapeau && <p className="mesure mt-6 text-white/65">{chapeau}</p>}
    </header>
  );
}
