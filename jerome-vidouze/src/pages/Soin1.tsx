import { ArrowUpRight, Phone } from 'lucide-react';
import Hero from '../components/Hero';
import BlurText from '../components/BlurText';
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

export default function Soin1() {
  return (
    <>
      <Hero
        route="soin1"
        video={VIDEOS.onde.src}
        poster={VIDEOS.onde.poster}
        cadrage="60% center"
        badge={
          <>
            <Pastille>{prixDuSoin('soin1')}</Pastille>
            <span className="text-xs font-light text-white/80">{T.soin1.heroBadge}</span>
          </>
        }
        titre={T.soin1.heroTitre}
        sous={T.soin1.heroSous}
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
                <Puce>{titreDuSoin('soin1')}</Puce>
              </Reveal>
              <BlurText
                as="h2"
                text={T.soin1.titre}
                decalage={45}
                className="max-w-3xl text-3xl leading-[1.06] text-white sm:text-4xl md:text-5xl"
              />
              <Reveal delai={120}>
                <Prose className="mt-8">
                  {T.soin1.paragraphes.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </Prose>
              </Reveal>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delai={100}>
              <CarteTarif lignes={tarifsDuSoin('soin1')} note={NOTE_TARIF} />
            </Reveal>
          </div>
        </div>
      </section>

      <AppelFinal
        fond="epi"
        titre={T.soin1.ctaTitre}
        texte={`${T.soin1.ctaTexte} ${SITE.telephone}.`}
      />
    </>
  );
}
