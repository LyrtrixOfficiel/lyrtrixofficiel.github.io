import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import Hero from '../components/Hero';
import BlurText from '../components/BlurText';
import Formulaire from '../components/Formulaire';
import Rayons from '../components/Rayons';
import {
  BoutonPlein,
  BoutonVerre,
  Filet,
  IconeFacebook,
  Pastille,
  Puce,
  Reveal,
} from '../components/ui';
import { SITE, URLS, VIDEOS } from '../lib/site';

export default function Contact() {
  return (
    <>
      <Hero
        route="contact"
        video={VIDEOS.fleurBlanche.src}
        poster={VIDEOS.fleurBlanche.poster}
        cadrage="30% center"
        badge={
          <>
            <Pastille>{SITE.adresse.ville}</Pastille>
            <span className="text-xs font-light text-white/80">Sur rendez-vous</span>
          </>
        }
        titre="Me contacter"
        sous={`Pour prendre rendez-vous ou réserver un bon cadeau, contactez-moi au ${SITE.telephone} ou via le formulaire.`}
        actions={
          <>
            <BoutonPlein href={SITE.telephoneLien}>
              <Phone className="h-4 w-4" />
              {SITE.telephone}
            </BoutonPlein>
            <BoutonVerre href="#formulaire">
              Écrire un message
              <ArrowUpRight className="h-4 w-4" />
            </BoutonVerre>
          </>
        }
      />

      <section
        id="contenu"
        className="relative overflow-hidden bg-black px-5 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.95fr_1fr] lg:gap-20">
          {/* ---- coordonnees ------------------------------------------ */}
          <div>
            <Reveal>
              <Puce>Coordonnées</Puce>
            </Reveal>
            <BlurText
              as="h2"
              text={SITE.marque}
              decalage={90}
              className="text-4xl leading-[1] text-white sm:text-5xl md:text-6xl"
            />
            <Reveal delai={140}>
              <p className="mt-3 font-display text-2xl text-white/50">{SITE.praticien}</p>

              <div className="mt-10 space-y-1">
                <a
                  href={SITE.telephoneLien}
                  className="group flex items-center gap-4 border-b border-white/10 py-5"
                >
                  <Phone className="h-5 w-5 shrink-0 text-amber" />
                  <span>
                    <span className="block text-[10px] font-light uppercase tracking-[0.22em] text-white/40">
                      Téléphone
                    </span>
                    <span className="font-display text-3xl text-white transition-colors group-hover:text-amber">
                      {SITE.telephone}
                    </span>
                  </span>
                </a>

                <div className="flex items-center gap-4 border-b border-white/10 py-5">
                  <MapPin className="h-5 w-5 shrink-0 text-amber" />
                  <span>
                    <span className="block text-[10px] font-light uppercase tracking-[0.22em] text-white/40">
                      Adresse
                    </span>
                    <span className="text-[15px] font-light leading-relaxed text-white/85">
                      {SITE.adresse.rue}, {SITE.adresse.codePostal} {SITE.adresse.ville}
                    </span>
                  </span>
                </div>

                <a
                  href={SITE.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center gap-4 py-5"
                >
                  <IconeFacebook className="h-5 w-5 shrink-0 text-amber" />
                  <span>
                    <span className="block text-[10px] font-light uppercase tracking-[0.22em] text-white/40">
                      Facebook
                    </span>
                    <span className="text-[15px] font-light text-white/85 transition-colors group-hover:text-amber">
                      {SITE.praticien}
                    </span>
                  </span>
                </a>
              </div>

              <Filet className="my-8" />

              <p className="flex items-start gap-3.5 text-sm font-light leading-relaxed text-white/60">
                <Rayons taille={16} className="mt-1 shrink-0 text-amber" anime={false} />
                Vos coordonnées personnelles ne sont pas collectées et ne seront en aucun cas
                divulguées à des tiers.
              </p>
              <figure className="mt-10 overflow-hidden rounded-[1.5rem]">
                <img
                  src="/photos/cabinet.webp"
                  alt="Le cabinet de Matthieu Chrétien, 8 place de l’église au Faou"
                  width={1024}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  className="aspect-4/3 w-full object-cover"
                />
                <figcaption className="mt-3 text-xs font-light text-white/50">
                  Le cabinet, place de l’église au Faou.
                </figcaption>
              </figure>

            </Reveal>
          </div>

          {/* ---- appel direct, puis formulaire ------------------------ */}
          <Reveal delai={120}>
            <div className="liquid-glass rounded-[1.5rem] p-7 text-center sm:p-9">
              <p className="text-xs font-light tracking-wide text-white/60">
                <span className="text-amber">//</span> Le plus rapide
              </p>
              <p className="mt-5 font-display text-3xl leading-[1.05] text-white sm:text-4xl">
                Un appel suffit.
              </p>
              <p className="mx-auto mt-4 max-w-xs text-sm font-light leading-relaxed text-white/65">
                Je réponds moi-même. Dites-moi ce qui vous amène, et nous trouvons ensemble le
                créneau qui vous convient.
              </p>

              <a
                href={SITE.telephoneLien}
                className="mt-8 block font-display text-4xl tracking-tight text-amber transition-opacity hover:opacity-80 sm:text-5xl"
              >
                {SITE.telephone}
              </a>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <BoutonPlein href={SITE.telephoneLien}>
                  <Phone className="h-4 w-4" />
                  Appeler maintenant
                </BoutonPlein>
                <BoutonVerre href={URLS.tarifs}>
                  Les tarifs
                  <ArrowUpRight className="h-4 w-4" />
                </BoutonVerre>
              </div>

              <p className="mt-7 border-t border-white/10 pt-6 text-xs font-light leading-relaxed text-white/50">
                Les bons cadeaux se commandent aussi par courrier, mail ou téléphone.
              </p>
            </div>

            <div id="formulaire" className="mt-6 scroll-mt-28">
              <Formulaire />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
