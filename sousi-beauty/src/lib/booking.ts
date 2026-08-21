/**
 * Un seul endroit ou l'URL de rendez-vous existe.
 *
 * On envoie vers Planity, deja en place, avec un `utm_content` par section :
 * Saliha saura quelle partie de la page remplit son agenda.
 */
const BASE = 'https://www.planity.com/sousi-beauty-67000-strasbourg';

export function lienRdv(emplacement: string): string {
  return `${BASE}?utm_source=site&utm_medium=cta&utm_content=${emplacement}`;
}

export const LIEN_EXTERNE = { target: '_blank', rel: 'noopener noreferrer' } as const;
