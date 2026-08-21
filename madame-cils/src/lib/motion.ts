import { useEffect, useState } from 'react';

/**
 * En developpement seulement : `?motion=force` ignore la preference systeme.
 *
 * Sans ca, impossible de verifier le chemin anime sur une machine dont l'OS
 * demande de reduire les animations — on ne verrait jamais que le repli.
 * `import.meta.env.DEV` vaut `false` au build : la branche disparait du bundle
 * de production, le drapeau ne peut pas etre active sur le site livre.
 */
function forceMotionEnDev(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('motion') === 'force';
}

/** L'utilisatrice a demande a reduire les animations. */
export function usePrefersReducedMotion(): boolean {
  const [reduit, setReduit] = useState(
    () =>
      !forceMotionEnDev() &&
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    if (forceMotionEnDev()) return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduit(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduit;
}

/**
 * Vrai au-dessus du point de rupture `lg` (1024px).
 * Les effets qui coutent des frames ne sont montes que la : sous `lg`, repli
 * statique.
 */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)');
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}
