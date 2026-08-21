import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Layout } from './components/Layout';
import type { Route } from './components/Nav';
import Accueil from './pages/Accueil';
import PageUnivers from './pages/PageUnivers';
import Tarifs from './pages/Tarifs';
import InstitutPage from './pages/InstitutPage';
import { UNIVERS } from './data/site';

/**
 * Site multipage : chaque .html porte son `data-page` sur <html>.
 * Le meme bundle sert toutes les pages, Rollup partage les morceaux communs.
 */
const univers = (page: string) => {
  const u = UNIVERS.find((x) => x.page === page)!;
  return () => <PageUnivers univers={u} />;
};

const PAGES: Record<Route, () => ReactElement> = {
  accueil: Accueil,
  'maquillage-permanent': univers('maquillage-permanent'),
  soins: univers('soins'),
  regard: univers('regard'),
  epilation: univers('epilation'),
  tarifs: Tarifs,
  institut: InstitutPage,
};

const page = (document.documentElement.dataset.page ?? 'accueil') as Route;
const Page = PAGES[page] ?? Accueil;

/**
 * Rattrapage de l'ancre.
 *
 * Le navigateur traite `#technologies` au chargement du HTML, donc AVANT que
 * React ait rendu la section : il ne trouve rien et reste en haut de page.
 * Les liens de familles de l'accueil tombaient tous sur le hero. On refait le
 * saut une fois le rendu peint.
 */
function rattraperAncre() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const cible = document.getElementById(id);
      if (!cible) return;
      const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
      cible.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
    })
  );
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Layout route={page}>
      <Page />
    </Layout>
  </StrictMode>
);

rattraperAncre();
