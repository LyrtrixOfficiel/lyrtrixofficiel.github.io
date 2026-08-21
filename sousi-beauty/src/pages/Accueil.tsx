import { Hero } from '../components/Hero';
import { Vitrines } from '../components/Vitrines';
import { Preuve } from '../components/Preuve';
import { Familles } from '../components/Familles';
import { Galerie } from '../components/Galerie';
import { Institut } from '../components/Institut';

/**
 * L'accueil n'affiche AUCUNE prestation choisie a la main.
 *
 * Il portait cinq « signatures » selectionnees parmi 165 : arbitraire, et sans
 * utilite pour une visiteuse qui cherche la sienne. Il oriente desormais :
 * quatre univers en vitrine, puis les douze familles cliquables.
 */
export default function Accueil() {
  return (
    <>
      <Hero />
      <Vitrines />
      <Preuve />
      <Familles />
      <Galerie />
      <Institut />
    </>
  );
}
