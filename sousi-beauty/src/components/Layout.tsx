import type { ReactNode } from 'react';
import { Nav, type Route } from './Nav';
import { Footer } from './Footer';
import { CtaSticky } from './CtaSticky';

/** Coque commune : navigation, contenu, pied de page, barre d'appel mobile. */
export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Aller au contenu
      </a>
      <Nav route={route} />
      <main id="contenu">{children}</main>
      <Footer />
      <CtaSticky />
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </>
  );
}
