import type { ReactNode } from 'react';

/**
 * Titre de section — la numerotation 01 a 06 est une des trois marques de
 * fabrique repetees du site.
 */
export function TitreSection({
  numero,
  id,
  children,
  chapeau,
}: {
  numero: string;
  id: string;
  children: ReactNode;
  chapeau?: string;
}) {
  return (
    <header>
      <p className="numero">{numero}</p>
      <h2 id={id} className="font-display mt-2" style={{ fontSize: 'var(--h2)' }}>
        {children}
      </h2>
      {chapeau && <p className="mesure mt-3 text-muted">{chapeau}</p>}
    </header>
  );
}
