import { useEffect, useState } from 'react';
import { Lotus, MotSymbole } from './Lotus';
import { UNIVERS } from '../data/site';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';

export type Route = 'accueil' | 'maquillage-permanent' | 'soins' | 'regard' | 'epilation' | 'tarifs' | 'institut';

const LIENS: { page: Route; libelle: string; href: string }[] = [
  ...UNIVERS.map((u) => ({ page: u.page as Route, libelle: u.titre, href: `./${u.page}.html` })),
  { page: 'tarifs', libelle: 'Tarifs', href: './tarifs.html' },
  { page: 'institut', libelle: 'L’institut', href: './institut.html' },
];

/**
 * Navigation. Le nom de la boutique est ecrit EN GRAND, a gauche, sur toutes
 * les pages — c'est la premiere chose qu'on doit lire, et il manquait.
 *
 * La barre devient du verre des qu'on quitte le haut de page. `backdrop-filter`
 * exige qu'aucun ancetre ne soit transforme : la barre est donc en `fixed` sans
 * animation de transform, seule l'opacite du fond change.
 */
export function Nav({ route }: { route: Route }) {
  const [defile, setDefile] = useState(false);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    const onScroll = () => setDefile(scrollY > 24);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        defile ? 'liquid-glass-strong' : ''
      }`}
    >
      <div className="pad-x flex items-center justify-between gap-6 py-3">
        <a href="./index.html" className="group/marque flex min-h-11 items-center gap-3 text-white">
          <Lotus taille={34} className="text-or transition-transform duration-700 group-hover/marque:rotate-[8deg]" />
          <MotSymbole className="text-[1.6rem] sm:text-[2rem]" />
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
          {LIENS.map((l) => (
            <a
              key={l.page}
              href={l.href}
              aria-current={route === l.page ? 'page' : undefined}
              className={`souligne text-sm font-light transition-colors duration-300 hover:text-white ${
                route === l.page ? 'text-or' : 'text-white/70'
              }`}
            >
              {l.libelle}
            </a>
          ))}
          <a
            href={lienRdv(`nav-${route}`)}
            {...LIEN_EXTERNE}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
          >
            Prendre rendez-vous
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          className="micro min-h-11 px-2 text-white lg:hidden"
        >
          {ouvert ? 'Fermer' : 'Menu'}
        </button>
      </div>

      {ouvert && (
        <nav
          id="menu-mobile"
          aria-label="Navigation principale"
          className="liquid-glass-strong pad-x flex flex-col gap-1 pt-2 pb-6 lg:hidden"
        >
          {LIENS.map((l) => (
            <a
              key={l.page}
              href={l.href}
              aria-current={route === l.page ? 'page' : undefined}
              className={`animate-none flex min-h-11 items-center border-b border-white/10 text-base font-light ${
                route === l.page ? 'text-or' : 'text-white/80'
              }`}
            >
              {l.libelle}
            </a>
          ))}
          <a
            href={lienRdv(`menu-${route}`)}
            {...LIEN_EXTERNE}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black"
          >
            Prendre rendez-vous
          </a>
        </nav>
      )}
    </header>
  );
}
