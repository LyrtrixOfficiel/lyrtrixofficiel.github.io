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
import { AppelFinal, CarteTarif, PhotoSoin, Prose } from '../components/soin';
import { NOTE_TARIF, prixDuSoin, SITE, T, tarifsDuSoin, URLS, VIDEOS } from '../lib/site';

export default function Reflexologie() {
  return (
    <>
      <Hero
        route="reflexologie"
        video={VIDEOS.onde.src}
        poster={VIDEOS.onde.poster}
        cadrage="60% center"
        badge={
          <>
            <Pastille>{prixDuSoin('reflexologie')}</Pastille>
            <span className="text-xs font-light text-white/80">{T.reflexologie.heroBadge}</span>
          </>
        }
        titre={T.reflexologie.heroTitre}
        sous={T.reflexologie.heroSous}
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
                <Puce>La réflexologie plantaire</Puce>
              </Reveal>
              <BlurText
                as="h2"
                text={T.reflexologie.titre}
                decalage={45}
                className="max-w-3xl text-3xl leading-[1.06] text-white sm:text-4xl md:text-5xl"
              />
              <Reveal delai={120}>
                <Prose className="mt-8">
                  {T.reflexologie.paragraphes.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </Prose>
              </Reveal>
            </div>

            <Reveal delai={170} className="mt-14">
              <PhotoSoin
                src="/photos/seance.webp"
                alt="Une séance de réflexologie plantaire : pressions sous la voûte du pied"
                ratio="aspect-3/4"
                cadrage="50% 45%"
                legende="La séance dure quarante-cinq minutes, sur table de massage."
              />
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delai={100}>
              <CarteTarif lignes={tarifsDuSoin('reflexologie')} note={NOTE_TARIF} />
            </Reveal>
          </div>
        </div>
      </section>

      <AppelFinal
        fond="epi"
        titre={T.reflexologie.ctaTitre}
        texte={`${T.reflexologie.ctaTexte} ${SITE.telephone}.`}
      />
    </>
  );
}
