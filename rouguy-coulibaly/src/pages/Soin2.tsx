import { ArrowUpRight, Phone } from 'lucide-react';
import Hero from '../components/Hero';
import BlurText from '../components/BlurText';
import FadingVideo from '../components/FadingVideo';
import Rayons from '../components/Rayons';
import {
  Avertissement,
  BoutonPlein,
  BoutonVerre,
  Filet,
  Pastille,
  Puce,
  Reveal,
} from '../components/ui';
import { AppelFinal, CarteTarif, Etapes, Prose } from '../components/soin';
import { prixDuSoin, titreDuSoin, SITE, T, tarifsDuSoin, VIDEOS } from '../lib/site';

export default function Soin2() {
  return (
    <>
      <Hero
        route="soin2"
        video={VIDEOS.fleurs.src}
        poster={VIDEOS.fleurs.poster}
        badge={
          <>
            <Pastille>{prixDuSoin('soin2')}</Pastille>
            <span className="text-xs font-light text-white/80">{T.soin2.heroBadge}</span>
          </>
        }
        titre={T.soin2.heroTitre}
        sous={T.soin2.heroSous}
        actions={
          <>
            <BoutonPlein href={SITE.telephoneLien}>
              <Phone className="h-4 w-4" />
              Prendre rendez-vous
            </BoutonPlein>
            <BoutonVerre href="#processus">
              Le processus
              <ArrowUpRight className="h-4 w-4" />
            </BoutonVerre>
          </>
        }
      />

      <section
        id="contenu"
        className="relative overflow-hidden bg-black px-5 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_0.72fr] lg:gap-20">
          <div>
            <Reveal>
              <Avertissement />
            </Reveal>

            <div className="mt-14">
              <Reveal>
                <Puce>{titreDuSoin('soin2')}</Puce>
              </Reveal>
              <BlurText
                as="h2"
                text={T.soin2.titre}
                decalage={65}
                className="max-w-3xl text-3xl leading-[1.06] text-white sm:text-4xl md:text-5xl"
              />
              <Reveal delai={120}>
                <Prose className="mt-8">
                  {T.soin2.paragraphes.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </Prose>

                {/* Optionnel : sans objectif, il restait un filet et un
                    soleil orange posés à côté de rien. */}
                {T.soin2.objectif && (
                  <>
                    <Filet className="my-9 max-w-[62ch]" />

                    <p className="flex max-w-[62ch] items-start gap-3.5">
                      <Rayons taille={18} className="mt-2 shrink-0 text-amber" anime={false} />
                      <span className="font-display text-[1.7rem] leading-[1.12] text-white sm:text-3xl">
                        {T.soin2.objectif}
                      </span>
                    </p>
                  </>
                )}
              </Reveal>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delai={100}>
              <CarteTarif
                lignes={tarifsDuSoin('soin2')}
                note={T.soin2.noteTarif}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- les etapes, sur fond video ---------------------------------
          Optionnelle : tous les praticiens ne decoupent pas leur seance en
          etapes. Si `etapes` est vide dans textes.json, la section disparait
          au lieu d'afficher un titre sans contenu. */}
      {T.soin2.etapes.some((e) => e.titre) && (
      <section id="processus" className="relative overflow-hidden bg-black">
        <FadingVideo
          src={VIDEOS.fleurBlanche.src}
          poster={VIDEOS.fleurBlanche.poster}
          className="fondu-bords fond-video-court absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/82" />

        {/* la fleur s'ouvre derriere le texte, sans jamais le gener */}

        <div className="relative z-10 px-5 py-24 sm:px-6 md:px-12 md:py-32 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              {/* La petite etiquette reprenait mot pour mot le grand titre
                  juste en dessous. */}
              <Puce>Le déroulé</Puce>
            </Reveal>
            <BlurText
              as="h2"
              text={T.soin2.processusTitre}
              decalage={70}
              className="max-w-3xl text-4xl leading-[0.98] text-white sm:text-5xl md:text-6xl lg:text-7xl"
            />

            <div className="mt-14">
              <Etapes items={T.soin2.etapes} />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ---- deroulement de la seance ----------------------------------
          Optionnelle, meme raison que la section precedente. */}
      {T.soin2.seance.some((e) => e.titre) && (
      <section className="relative overflow-hidden bg-black px-5 py-24 sm:px-6 md:px-12 md:py-28 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Puce>Déroulement de la séance</Puce>
          </Reveal>
          <BlurText
            as="h2"
            text={T.soin2.seanceTitre}
            decalage={70}
            className="max-w-3xl text-4xl leading-[1] text-white sm:text-5xl"
          />

          <ol className="mt-12">
            {T.soin2.seance.map((e, i) => (
              <Reveal as="li" key={e.titre} delai={i * 80}>
                <div className="grid gap-3 border-t border-white/10 py-7 md:grid-cols-[auto_1fr_2fr] md:items-baseline md:gap-8">
                  <span className="font-display text-3xl text-amber">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-2xl text-white">{e.titre}</h3>
                  <p className="text-[15px] font-light leading-relaxed text-white/70">{e.texte}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delai={120}>
            <p className="liquid-glass mt-8 max-w-[70ch] rounded-2xl px-5 py-4 text-sm font-light leading-relaxed text-white/70">
              <span className="text-amber">Note.</span> {T.soin2.note}
            </p>
          </Reveal>
        </div>
      </section>
      )}

      <AppelFinal
        fond="fleurs"
        titre={T.soin2.ctaTitre}
        texte={`${T.soin2.ctaTexte} ${SITE.telephone}.`}
      />
    </>
  );
}
