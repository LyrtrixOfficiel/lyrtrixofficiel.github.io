import Hero from '../components/Hero';
import { Pastille, Puce, Reveal } from '../components/ui';
import { SITE, VIDEOS } from '../lib/site';

/**
 * Mentions legales.
 *
 * Tout vient de content/coordonnees.json — y compris l'hebergeur, qui etait
 * ecrit en dur : « 1&1 Internet SARL, 7 place de la Gare, Sarreguemines ».
 * C'etait l'hebergeur de Brigitte. Chaque site copie annoncait donc un
 * hebergeur qui n'est pas le sien, sur la seule page du site dont le role est
 * precisement de dire la verite sur qui edite et qui heberge.
 *
 * Les lignes vides sont retirees : le SIRET et le code APE ne sont pas
 * toujours diffuses au registre, et un intitule « APE » suivi de rien n'est
 * pas une mention legale, c'est un trou.
 */
const LIGNES = [
  { label: 'Représentant légal', valeur: [SITE.praticien] },
  {
    label: 'Siège social',
    valeur: [SITE.marque, SITE.adresse.rue, `${SITE.adresse.codePostal} ${SITE.adresse.ville.toUpperCase()}`],
  },
  { label: 'SIRET', valeur: [SITE.siret] },
  { label: 'APE', valeur: [SITE.ape] },
  { label: 'Responsable de publication', valeur: [SITE.praticien] },
  { label: 'Hébergement', valeur: SITE.hebergeur.split(/,\s*/) },
]
  .map((l) => ({ ...l, valeur: l.valeur.filter((v) => v && v.trim()) }))
  .filter((l) => l.valeur.length > 0);

export default function Mentions() {
  return (
    <>
      <Hero
        route="mentions"
        video={VIDEOS.vapeur.src}
        poster={VIDEOS.vapeur.poster}
        badge={
          <>
            <Pastille>Légal</Pastille>
            <span className="text-xs font-light text-white/80">Éditeur et hébergement</span>
          </>
        }
        titre="Mentions légales"
        sous={`${SITE.marque} — ${SITE.metier}.`}
      />

      <section
        id="contenu"
        className="relative overflow-hidden bg-black px-5 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Puce>Mentions légales</Puce>
            <dl className="liquid-glass mt-6 rounded-[1.5rem] px-6 py-2 sm:px-8">
              {LIGNES.map((l) => (
                <div
                  key={l.label}
                  className="grid gap-1 border-b border-white/10 py-5 last:border-0 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6"
                >
                  <dt className="text-[10px] font-light uppercase tracking-[0.22em] text-white/40">
                    {l.label}
                  </dt>
                  <dd className="text-[15px] font-light leading-relaxed text-white/85">
                    {l.valeur.map((v) => (
                      <span key={v} className="block">
                        {v}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>
    </>
  );
}
