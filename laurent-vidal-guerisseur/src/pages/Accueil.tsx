import {
  ArrowUpRight,
  Clock,
  Flame,
  Flower2,
  GitBranch,
  Phone,
  Waves,
} from 'lucide-react';
import Hero, { CarteVerre } from '../components/Hero';
import FadingVideo from '../components/FadingVideo';
import BlurText from '../components/BlurText';
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
import {
  ADRESSE,
  APERCU_TARIFS,
  NOTE_TARIF,
  PHOTOS,
  prixDuSoin,
  SITE,
  SOINS,
  T,
  URLS,
  VIDEOS,
} from '../lib/site';

const ICONES: Record<string, typeof Waves> = {
  soin1: Waves,
  soin2: GitBranch,
  soin3: Flame,
};

export default function Accueil() {
  return (
    <>
      <Hero
        route="accueil"
        plein
        video={VIDEOS.fleurBlanche.src}
        poster={VIDEOS.fleurBlanche.poster}
        miroir
        revelation
        badge={
          <>
            <Pastille>{SITE.adresse.ville}</Pastille>
            <span className="text-xs font-light text-white/80">
              {SITE.adresse.region} · {T.accueil.heroBadge}
            </span>
          </>
        }
        titre={T.accueil.heroTitre}
        sous={T.accueil.heroSous}
        actions={
          <>
            <BoutonPlein href={SITE.telephoneLien}>
              <Phone className="h-4 w-4" />
              {SITE.telephone}
            </BoutonPlein>
            <BoutonVerre href="#soins">
              Découvrir les soins
              <ArrowUpRight className="h-4 w-4" />
            </BoutonVerre>
          </>
        }
        cartes={
          <>
            <CarteVerre
              icone={<Flower2 className="h-5 w-5" />}
              valeur={SITE.adresse.ville}
              legende={ADRESSE}
            />
            <CarteVerre
              icone={<Clock className="h-5 w-5" />}
              valeur="Sur RDV"
              legende={SITE.telephone}
            />
          </>
        }
        bandeau={
          <>
            <div className="liquid-glass rounded-full px-5 py-2 text-[11px] font-light text-white/75">
              {ADRESSE}
            </div>
            <div className="hidden flex-wrap items-center justify-center gap-10 md:flex lg:gap-16">
              {SOINS.map((s) => (
                <a
                  key={s.route}
                  href={URLS[s.route]}
                  className="font-display text-2xl tracking-tight text-white/45 transition-colors hover:text-white lg:text-3xl"
                >
                  {s.titre}
                </a>
              ))}
            </div>
          </>
        }
      />

      {/* =============== son mot ======================================= */}
      <section id="contenu" className="relative overflow-hidden bg-black px-5 py-24 sm:px-6 md:px-12 md:py-32 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-20">
          <div>
            <Reveal>
              <Puce>Bienvenue</Puce>
            </Reveal>
            <BlurText
              as="h2"
              text={T.accueil.bienvenueTitre}
              decalage={55}
              className="max-w-2xl text-3xl leading-[1.06] text-white sm:text-4xl md:text-5xl"
            />
            <Reveal delai={120}>

              <Filet className="mb-9 mt-8 max-w-xl" />

              <p className="text-xs font-light tracking-wide text-white/60">
                <span className="text-amber">//</span> Je vous propose
              </p>
              <ul className="mt-5 max-w-xl space-y-4">
                {T.accueil.propositions.map((t, i) => (
                  <Reveal as="li" key={t} delai={i * 90} className="flex items-start gap-3.5">
                    <Rayons taille={16} className="mt-1 shrink-0 text-amber" anime={false} />
                    <span className="text-[15px] font-light leading-relaxed text-white/80">{t}</span>
                  </Reveal>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delai={160}>
            <figure className="relative overflow-hidden rounded-[1.5rem]">
              {/* Son portrait s'il nous l'a donne ; sinon un fond video, qui
                  ne represente personne. Jamais le visage d'un autre. */}
              {PHOTOS.portrait ? (
                <img
                  src={PHOTOS.portrait}
                  alt={`${SITE.praticien}, ${SITE.metierCourt.toLowerCase()} à ${SITE.adresse.ville}`}
                  width={575}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                  className="aspect-3/4 w-full object-cover"
                  style={{ objectPosition: '50% 30%' }}
                />
              ) : (
                <div className="relative aspect-3/4 w-full overflow-hidden bg-black">
                  <FadingVideo
                    src={VIDEOS.vapeur.src}
                    poster={VIDEOS.vapeur.poster}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 38%, rgba(0,0,0,.92) 100%)',
                }}
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-7">
                <p className="font-display text-[1.7rem] leading-[1.1] text-white sm:text-3xl">
                  {T.accueil.photoCitation}
                </p>
                <p className="mt-4 text-sm font-light text-white/65">
                  {T.accueil.photoSignature}
                  <br />
                  <span className="font-display text-2xl not-italic text-amber">{SITE.praticien}</span>
                </p>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* =============== les soins ===================================== */}
      <section id="soins" className="relative min-h-screen overflow-hidden bg-black">
        <FadingVideo
          src={VIDEOS.onde.src}
          poster={VIDEOS.onde.poster}
          className="fondu-bords fond-video-court absolute inset-0 h-full w-full object-cover"
        />
        {/* Voile quasi plat. En degrade vertical marque, il balayait l'ecran
            au scroll : une bande sombre qui monte et donne l'impression d'un
            filtre qui s'abat. Ne restent que deux fondus courts, en haut et en
            bas, pour raccorder aux sections noires voisines. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.96) 0%, rgba(0,0,0,.80) 14%, rgba(0,0,0,.80) 86%, rgba(0,0,0,.96) 100%)',
          }}
        />

        <div className="relative z-10 flex min-h-screen flex-col justify-center px-5 py-24 sm:px-6 md:px-12 md:py-28 lg:px-16">
          <div className="mx-auto w-full max-w-6xl">
            <Reveal>
              <Puce>Les soins</Puce>
            </Reveal>
            <BlurText
              as="h2"
              text={T.accueil.soinsTitre}
              decalage={110}
              className="max-w-3xl text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-[5rem]"
            />

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {SOINS.map((s, i) => {
                const Icone = ICONES[s.route];
                /* Le prix est ajoute a la fin des etiquettes, et c'est le seul
                   affiche sur telephone. Quand le praticien l'a deja mis dans
                   ses etiquettes — « 1 250 € » chez un centre de formation —
                   la carte montrait deux fois la meme pastille, et React
                   voyait deux enfants de meme cle. On retire le doublon. */
                const prix = prixDuSoin(s.route);
                const etiquettes = s.etiquettes.filter((t) => t !== prix);
                return (
                <Reveal key={s.route} delai={i * 90}>
                  <a
                    href={URLS[s.route]}
                    className="liquid-glass group flex min-h-[340px] flex-col rounded-[1.5rem] p-6 transition-transform duration-500 hover:-translate-y-1 sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="liquid-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.75rem] text-amber">
                        <Icone className="h-5 w-5" />
                      </span>
                      {/* Sur telephone les quatre etiquettes s'empilaient sur
                          trois lignes en colonne ragee : on ne garde que la
                          derniere, le prix. */}
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {[...etiquettes, prix].map((t, j) => (
                          <span
                            key={`${t}-${j}`}
                            className={`liquid-glass whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-light text-white/90 ${
                              j < etiquettes.length ? 'hidden sm:inline-block' : ''
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1" />

                    <h3 className="font-display text-3xl leading-none tracking-[-1px] text-white md:text-4xl">
                      {s.titre}
                    </h3>
                    <p className="mt-3 max-w-[38ch] text-sm font-light leading-snug text-white/80">
                      {s.resume}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber">
                      Découvrir
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </a>
                </Reveal>
                );
              })}
            </div>

            <Reveal delai={120} className="mt-10 max-w-3xl">
              <Avertissement />
            </Reveal>
          </div>
        </div>
      </section>

      {/* =============== citation ====================================== */}
      <section className="relative min-h-[90vh] overflow-hidden bg-black">
        <FadingVideo
          src={VIDEOS.vapeur.src}
          poster={VIDEOS.vapeur.poster}
          className="fondu-bords fond-video-court absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/62" />

        <div className="relative z-10 flex min-h-[90vh] items-center justify-center px-5 py-24 sm:px-6">
          <div className="max-w-4xl text-center">
            <Reveal>
              <Rayons taille={38} className="mx-auto text-amber" />
            </Reveal>
            <BlurText
              as="p"
              decalage={55}
              text={T.accueil.citation}
              className="mt-8 font-display text-[1.7rem] leading-[1.15] text-white sm:text-4xl md:text-5xl"
            />
            <Reveal delai={200}>
              <p className="mt-8 text-xs font-light uppercase tracking-[0.24em] text-amber">
                {T.accueil.citationAuteur}
              </p>
              <p className="mx-auto mt-5 max-w-lg text-sm font-light leading-relaxed text-white/60">
                {T.accueil.citationNote}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =============== tarifs ======================================== */}
      <section className="relative overflow-hidden bg-black px-5 py-24 sm:px-6 md:px-12 md:py-32 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <Puce>Mes tarifs</Puce>
            </Reveal>
            <BlurText
              as="h2"
              text={T.accueil.tarifsTitre}
              decalage={110}
              className="text-4xl leading-[1] text-white sm:text-5xl md:text-6xl"
            />
            <Reveal delai={140}>
              {/* Sans moyen de paiement ni bon cadeau declare, ce paragraphe
                  reservait sa hauteur pour n'afficher qu'une espace. */}
              {NOTE_TARIF && (
                <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-white/65">
                  {NOTE_TARIF}
                </p>
              )}
              <BoutonVerre href={URLS.tarifs} className="mt-8">
                Voir tous les tarifs
                <ArrowUpRight className="h-4 w-4" />
              </BoutonVerre>
            </Reveal>
          </div>

          <Reveal delai={120}>
            <ul className="liquid-glass rounded-[1.5rem] p-6 sm:p-8">
              {APERCU_TARIFS.map((t) => (
                <li
                  key={t.label}
                  className="flex items-baseline gap-4 border-b border-white/10 py-4 last:border-0"
                >
                  <span className="text-[15px] font-light text-white/85">{t.label}</span>
                  <span
                    className="h-px min-w-6 flex-1"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 2px, transparent 2px 6px)',
                    }}
                  />
                  <span className="whitespace-nowrap font-display text-2xl text-amber">
                    {t.prix}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* =============== venez pour vous =============================== */}
      <section className="relative min-h-[80vh] overflow-hidden bg-black">
        <FadingVideo
          src={VIDEOS.epi.src}
          poster={VIDEOS.epi.poster}
          className="fondu-bords fond-video-court absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '70% center' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/68" />

        <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-5 py-24 text-center sm:px-6">
          <div className="max-w-2xl">
            <Reveal>
              <Puce>Me contacter</Puce>
            </Reveal>
            <BlurText
              as="h2"
              text={T.accueil.ctaTitre}
              decalage={110}
              className="text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl"
            />
            <Reveal delai={160}>
              <p className="mx-auto mt-6 max-w-md text-[15px] font-light leading-relaxed text-white/80">
                {T.accueil.ctaTexte} {SITE.telephone}.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <BoutonPlein href={SITE.telephoneLien}>
                  <Phone className="h-4 w-4" />
                  {SITE.telephone}
                </BoutonPlein>
                <BoutonVerre href={URLS.contact}>
                  Me contacter
                  <ArrowUpRight className="h-4 w-4" />
                </BoutonVerre>
              </div>
              <p className="mt-8 text-sm font-light text-white/50">
                {SITE.adresse.rue} · {SITE.adresse.codePostal} {SITE.adresse.ville}
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
