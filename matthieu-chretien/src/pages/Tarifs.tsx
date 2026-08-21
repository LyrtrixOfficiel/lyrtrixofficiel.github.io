import { ArrowUpRight, CreditCard, Gift, Phone } from 'lucide-react';
import Hero from '../components/Hero';
import Rayons from '../components/Rayons';
import { BoutonPlein, BoutonVerre, Pastille, Reveal } from '../components/ui';
import { AppelFinal } from '../components/soin';
import { SITE, TARIFS, URLS, VIDEOS, type Route } from '../lib/site';

/* Les groupes viennent de content/tarifs.json, editable depuis /admin.
   Le lien « En savoir plus » est deduit : si toutes les lignes d'un groupe
   pointent vers le meme soin, on va sur sa page ; si elles sont melangees, on
   va a la liste des soins ; si aucune n'a de page (pressotherapie), on renvoie
   au contact, seul endroit ou l'on peut reellement se renseigner. */
const GROUPES = TARIFS.groupes.map((g) => {
  const soins = [...new Set(g.lignes.map((l) => l.soin).filter(Boolean))] as Route[];
  const lien =
    soins.length === 1 ? URLS[soins[0]] : soins.length > 1 ? `${URLS.accueil}#soins` : URLS.contact;
  return {
    titre: g.titre,
    lien,
    lignes: g.lignes.map((l) => ({
      label: l.label,
      prix: l.prix,
      lien: l.soin ? URLS[l.soin as Route] : undefined,
    })),
  };
});

export default function Tarifs() {
  return (
    <>
      <Hero
        route="tarifs"
        video={VIDEOS.epi.src}
        poster={VIDEOS.epi.poster}
        badge={
          <>
            <Pastille>Tarifs</Pastille>
            <span className="text-xs font-light text-white/80">
              CB, espèces ou chèque · bons cadeaux
            </span>
          </>
        }
        titre="Mes tarifs"
        sous={`${TARIFS.paiement} Possibilité de commander des bons cadeaux par courrier, mail ou téléphone.`}
        actions={
          <>
            <BoutonPlein href={SITE.telephoneLien}>
              <Phone className="h-4 w-4" />
              {SITE.telephone}
            </BoutonPlein>
            <BoutonVerre href={URLS.contact}>
              Me contacter
              <ArrowUpRight className="h-4 w-4" />
            </BoutonVerre>
          </>
        }
      />

      <section
        id="contenu"
        className="relative overflow-hidden bg-black px-5 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto max-w-4xl">
          {GROUPES.map((g, gi) => (
            <Reveal key={g.titre} delai={gi * 90} className="mb-16 last:mb-0">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h2 className="flex items-center gap-3 font-display text-4xl text-white sm:text-5xl">
                  <Rayons taille={20} className="shrink-0 text-amber" anime={false} />
                  {g.titre}
                </h2>
                {g.lien && (
                  <a
                    href={g.lien}
                    className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-amber transition-opacity hover:opacity-75"
                  >
                    En savoir plus
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </div>

              <ul className="liquid-glass mt-7 rounded-[1.5rem] px-6 py-2 sm:px-8">
                {g.lignes.map((l) => (
                  <li
                    key={l.label}
                    className="flex items-baseline gap-4 border-b border-white/10 py-5 last:border-0"
                  >
                    {l.lien ? (
                      <a
                        href={l.lien}
                        className="text-[15px] font-light text-white/85 transition-colors hover:text-amber sm:text-base"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <span className="text-[15px] font-light text-white/85 sm:text-base">
                        {l.label}
                      </span>
                    )}
                    <span
                      className="h-px min-w-6 flex-1"
                      style={{
                        background:
                          'repeating-linear-gradient(90deg, rgba(255,255,255,.26) 0 2px, transparent 2px 6px)',
                      }}
                    />
                    <span className="whitespace-nowrap font-display text-2xl text-amber sm:text-3xl">
                      {l.prix}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Reveal>
              <div className="liquid-glass h-full rounded-[1.5rem] p-6">
                <CreditCard className="h-5 w-5 text-amber" />
                <h3 className="mt-4 font-display text-3xl text-white">Paiement</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-white/70">
                  {TARIFS.paiement}
                </p>
              </div>
            </Reveal>
            <Reveal delai={90}>
              <div className="liquid-glass h-full rounded-[1.5rem] p-6">
                <Gift className="h-5 w-5 text-amber" />
                <h3 className="mt-4 font-display text-3xl text-white">Bons cadeaux</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-white/70">
                  {TARIFS.bonsCadeaux}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delai={120}>
            <p className="mt-10 text-xs font-light leading-relaxed text-white/40">
              Les soins proposés sont conçus pour compléter une routine de bien-être. Ils ne
              sauraient en aucun cas remplacer un suivi médical.
            </p>
          </Reveal>
        </div>
      </section>

      <AppelFinal
        titre="Un appel, et c'est réservé."
        texte={`Appelez-moi au ${SITE.telephone}, je vous répondrai avec plaisir.`}
      />
    </>
  );
}
