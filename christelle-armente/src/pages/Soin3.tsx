import { ArrowUpRight, Phone } from 'lucide-react';
import Hero from '../components/Hero';
import BlurText from '../components/BlurText';
import FadingVideo from '../components/FadingVideo';
import Rayons from '../components/Rayons';
import {
  Avertissement,
  BoutonPlein,
  BoutonVerre,
  Pastille,
  Puce,
  Reveal,
} from '../components/ui';
import { AppelFinal, CarteTarif, Prose } from '../components/soin';
import { NOTE_TARIF, prixDuSoin, titreDuSoin, SITE, T, tarifsDuSoin, URLS, VIDEOS } from '../lib/site';

/* Les ouvrages de reference sont propres a un praticien qui en cite. La
   plupart n'en citent aucun : `ouvrages` vaut alors [""], et la section
   affichait une carte avec « » et rien dedans, sous un titre vide. */
const OUVRAGES = T.soin3.ouvrages.filter((o) => o && o.trim());

export default function Soin1Avancee() {
  return (
    <>
      <Hero
        route="soin3"
        video={VIDEOS.vapeur.src}
        poster={VIDEOS.vapeur.poster}
        badge={
          <>
            <Pastille>{prixDuSoin('soin3')}</Pastille>
            <span className="text-xs font-light text-white/80">{T.soin3.heroBadge}</span>
          </>
        }
        titre={T.soin3.heroTitre}
        sous={T.soin3.heroSous}
        actions={
          <>
            <BoutonPlein href={SITE.telephoneLien}>
              <Phone className="h-4 w-4" />
              Prendre rendez-vous
            </BoutonPlein>
            <BoutonVerre href={URLS.tarifs}>
              Voir les tarifs
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
                <Puce>{titreDuSoin('soin3')}</Puce>
              </Reveal>
              <BlurText
                as="h2"
                text={T.soin3.titre}
                decalage={55}
                className="max-w-3xl text-3xl leading-[1.06] text-white sm:text-4xl md:text-5xl"
              />
              <Reveal delai={120}>
                <Prose className="mt-8">
                  {T.soin3.paragraphes.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </Prose>
              </Reveal>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delai={100}>
              <CarteTarif lignes={tarifsDuSoin('soin3')} note={NOTE_TARIF} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- la citation, plein cadre ----------------------------------
          Optionnelle : sans citation, cette section occupait un ecran entier
          de video avec, au centre, un soleil et deux lignes vides. */}
      {T.soin3.citation && (
      <section className="relative min-h-screen overflow-hidden bg-black">
        <FadingVideo
          src={VIDEOS.onde.src}
          poster={VIDEOS.onde.poster}
          className="fondu-bords fond-video-court absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/62" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-24 sm:px-6">
          <div className="max-w-4xl text-center">
            <Reveal>
              <Rayons taille={38} className="mx-auto text-amber" />
            </Reveal>
            <BlurText
              as="p"
              decalage={52}
              text={T.soin3.citation}
              className="mt-8 font-display text-[1.6rem] leading-[1.16] text-white sm:text-3xl md:text-[2.6rem]"
            />
            <Reveal delai={200}>
              <p className="mt-8 text-xs font-light uppercase tracking-[0.24em] text-amber">
                {T.soin3.citationAuteur}
              </p>
            </Reveal>
          </div>
        </div>
      </section>
      )}

      {/* ---- les ouvrages de reference --------------------------------- */}
      {OUVRAGES.length > 0 && (
      <section className="relative overflow-hidden bg-black px-5 py-24 sm:px-6 md:px-12 md:py-28 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Puce>Mes appuis</Puce>
          </Reveal>
          <BlurText
            as="h2"
            text={T.soin3.ouvragesTitre}
            decalage={65}
            className="max-w-3xl text-4xl leading-[1] text-white sm:text-5xl"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {OUVRAGES.map((titre, i) => (
              <Reveal key={titre} delai={i * 110}>
                <div className="liquid-glass relative h-full overflow-hidden rounded-[1.5rem] p-8">
                  <span className="pointer-events-none absolute -right-6 -top-6 opacity-25">
                    <Rayons taille={120} couleur="#e0a25c" anime={false} />
                  </span>
                  <p className="text-xs font-light tracking-wide text-white/60">
                    <span className="text-amber">//</span> Ouvrage
                  </p>
                  <p className="mt-4 font-display text-3xl leading-tight text-white sm:text-4xl">
                    «&nbsp;{titre}&nbsp;»
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      <AppelFinal
        fond="epi"
        titre={T.soin3.ctaTitre}
        texte={`${T.soin3.ctaTexte} ${SITE.telephone}.`}
      />
    </>
  );
}
