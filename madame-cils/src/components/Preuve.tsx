import { Reveal } from './Reveal';
import { AVIS, DEPUIS } from '../data/site';

/**
 * Preuve sociale.
 *
 * On affiche 5,0 / 5 sur 214 avis et l'anciennete. Les 734 abonnes Instagram
 * ne sont pas repris : un chiffre ordinaire affaiblit un chiffre rare.
 *
 * Le fond est une lueur generee, abstraite, posee a 34 % sous un voile plein.
 * Elle ne represente rien — c'est un horizon chaud derriere trois chiffres, pas
 * une photo de prestation.
 */
export function Preuve() {
  const annees = new Date().getFullYear() - DEPUIS;
  const chiffres = [
    { valeur: `${AVIS.note} / 5`, legende: `sur ${AVIS.nombre} avis ${AVIS.source}` },
    { valeur: `${annees} ans`, legende: `d’activité à Illkirch, depuis ${DEPUIS}` },
    { valeur: '6 familles', legende: 'de poses, du plus discret au plus dense' },
  ];

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <img
          src="/media/lueur.jpg"
          alt=""
          width={1920}
          height={815}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-[0.34]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0D0A08_0%,#0D0A08D9_28%,#0D0A08D9_72%,#0D0A08_100%)]" />
      </div>

      <Reveal className="section pad-x" id="preuve">
        <ul className="grid gap-8 sm:grid-cols-3">
          {chiffres.map((c) => (
            <li key={c.valeur}>
              <p className="font-display text-3xl text-accent sm:text-4xl">{c.valeur}</p>
              <p className="mt-1 text-muted">{c.legende}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
