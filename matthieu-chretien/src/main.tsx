import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Layout from './components/Layout';
import Accueil from './pages/Accueil';
import Reflexologie from './pages/Reflexologie';
import FleursDeBach from './pages/FleursDeBach';
import ReflexologieAvancee from './pages/ReflexologieAvancee';
import Tarifs from './pages/Tarifs';
import Contact from './pages/Contact';
import Mentions from './pages/Mentions';
import type { Route } from './lib/site';

/**
 * Site multipage : chaque .html porte son `data-page` sur <html>.
 * Le meme bundle sert toutes les pages, Rollup partage les morceaux communs.
 */
const PAGES: Record<Route, () => ReactElement> = {
  accueil: Accueil,
  reflexologie: Reflexologie,
  bach: FleursDeBach,
  avancee: ReflexologieAvancee,
  tarifs: Tarifs,
  contact: Contact,
  mentions: Mentions,
};

const page = document.documentElement.dataset.page ?? 'accueil';
const racine = createRoot(document.getElementById('racine')!);

/* L'espace d'edition n'est pas une page du site : ni navigation, ni pied de
   page, ni barre d'appel. Il est rendu seul.
   Import dynamique : son code part dans un morceau separe, que les visiteurs
   du site ne telechargent jamais. */
if (page === 'admin') {
  void import('./pages/Admin').then(({ default: Admin }) =>
    racine.render(
      <StrictMode>
        <Admin />
      </StrictMode>,
    ),
  );
} else {
  const Page = PAGES[page as Route] ?? Accueil;
  racine.render(
    <StrictMode>
      <Layout>
        <Page />
      </Layout>
    </StrictMode>,
  );
}
