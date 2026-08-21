import { Hero } from './components/Hero';
import { Preuve } from './components/Preuve';
import { Galerie } from './components/Galerie';
import { Prestations } from './components/Prestations';
import { APropos } from './components/APropos';
import { InfosPratiques } from './components/InfosPratiques';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { CtaSticky } from './components/CtaSticky';
import { FiletCils } from './components/FiletCils';
import { Bandeau } from './components/Bandeau';
import { MentionsLegales } from './components/MentionsLegales';

export default function App() {
  return (
    <>
      <a
        href="#prestations"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-bg"
      >
        Aller aux tarifs
      </a>

      <main>
        <Hero />
        <Bandeau />
        <Preuve />
        <FiletCils />
        <Galerie />
        <FiletCils />
        <Prestations />
        <APropos />
        <FiletCils />
        <InfosPratiques />
        <Faq />
        <MentionsLegales />
      </main>

      <Footer />
      <CtaSticky />
      {/* La barre sticky ne doit pas recouvrir la fin du pied de page */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </>
  );
}
