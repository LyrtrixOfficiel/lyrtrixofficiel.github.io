/**
 * Un seul endroit ou l'URL de reservation existe.
 *
 * On envoie vers Planity, qui est deja en place — on ne le remplace pas par un
 * formulaire maison. Le parametre `utm_content` dit d'ou vient le clic, ce qui
 * permettra a Laura de savoir quelle section remplit son agenda.
 */
const BASE = 'https://www.planity.com/madame-cils-67400-illkirch-graffenstaden';

export function lienReservation(emplacement: string): string {
  return `${BASE}?utm_source=site&utm_medium=cta&utm_content=${emplacement}`;
}

/** Attributs communs a tous les liens sortants. */
export const LIEN_EXTERNE = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
