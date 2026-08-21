import type { ReactNode } from 'react';
import { Phone } from 'lucide-react';
import Footer from './Footer';
import { SITE } from '../lib/site';

/** Barre d'appel collee en bas d'ecran — mobile uniquement. */
function BarreAppel() {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/85 px-4 pt-3 pb-3 backdrop-blur-2xl lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-light uppercase tracking-[0.2em] text-white/45">
            {SITE.adresse.ville} · sur rendez-vous
          </p>
          <p className="truncate font-display text-xl leading-tight text-white">
            Prendre rendez-vous
          </p>
        </div>
        <a
          href={SITE.telephoneLien}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black"
        >
          <Phone className="h-4 w-4" />
          Appeler
        </a>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Aller au contenu
      </a>
      {children}
      <Footer />
      <BarreAppel />
    </>
  );
}
