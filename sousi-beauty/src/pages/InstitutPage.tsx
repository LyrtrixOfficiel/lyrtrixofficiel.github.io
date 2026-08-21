import { EnTetePage } from '../components/EnTetePage';
import { Institut } from '../components/Institut';
import { InfosPratiques } from '../components/InfosPratiques';
import { Faq } from '../components/Faq';
import { Galerie } from '../components/Galerie';
import { MentionsLegales } from '../components/MentionsLegales';

/** Tout ce qui n'est pas une prestation : le lieu, l'equipe, la pratique. */
export default function InstitutPage() {
  return (
    <>
      <EnTetePage
        titre="L’institut"
        photo="/photos/photo-03.webp"
        alt="Le coin d’attente de Sousi Beauty, fauteuils en velours beige devant la vitrine"
        chapeau="Place des Halles depuis quinze ans. Le lieu, l’équipe, les horaires, et les réponses aux questions qu’on pose au téléphone."
      />
      <Institut />
      <Galerie />
      <InfosPratiques />
      <Faq />
      <MentionsLegales />
    </>
  );
}
