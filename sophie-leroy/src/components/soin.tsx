import type { ReactNode } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import FadingVideo from './FadingVideo';
import BlurText from './BlurText';
import Rayons from './Rayons';
import { BoutonPlein, BoutonVerre, Puce, Reveal } from './ui';
import { SITE, URLS, VIDEOS } from '../lib/site';

/** Corps de texte d'une page de soin : mesure de lecture ~62 caracteres. */
export function Prose({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`max-w-[62ch] space-y-5 text-[15px] font-light leading-[1.75] text-white/75 sm:text-base ${className}`}
    >
      {children}
    </div>
  );
}

/** Bandeau de tarif, en texte reel — jamais dans une image. */
export function CarteTarif({
  lignes,
  note,
}: {
  lignes: { label: string; prix: string }[];
  note?: string;
}) {
  return (
    <div className="liquid-glass rounded-[1.5rem] p-6 sm:p-7">
      <p className="text-xs font-light tracking-wide text-white/60">
        <span className="text-amber">//</span> Tarif
      </p>
      <ul className="mt-5">
        {lignes.map((l) => (
          <li
            key={l.label}
            className="flex items-baseline gap-3 border-b border-white/10 py-3 last:border-0"
          >
            <span className="text-sm font-light text-white/85">{l.label}</span>
            <span
              className="h-px min-w-4 flex-1"
              style={{
                background:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,.26) 0 2px, transparent 2px 6px)',
              }}
            />
            <span className="whitespace-nowrap font-display text-2xl text-amber">{l.prix}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-5 text-xs font-light leading-relaxed text-white/50">{note}</p>}
      <BoutonPlein href={SITE.telephoneLien} className="mt-6 w-full">
        <Phone className="h-4 w-4" />
        {SITE.telephone}
      </BoutonPlein>
    </div>
  );
}

/**
 * Une photo, avec le voile qui la raccroche au fond.
 *
 * `ratio` parce que ses photos ne sont pas toutes au meme format : le cabinet
 * et le diplome sont en paysage, les prises de vue de seance en portrait. Un
 * `aspect-4/3` impose a tout le monde recadrait les portraits n'importe ou.
 */
export function PhotoSoin({
  src,
  alt,
  cadrage = '50% 50%',
  legende,
  ratio = 'aspect-4/3',
  className = '',
}: {
  src: string;
  alt: string;
  cadrage?: string;
  legende?: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <figure className={`relative overflow-hidden rounded-[1.5rem] ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${ratio} w-full object-cover`}
        style={{ objectPosition: cadrage }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.88) 100%)' }}
      />
      {legende && (
        <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm font-light text-white/75">
          {legende}
        </figcaption>
      )}
    </figure>
  );
}

/** Etapes numerotees, en cartes de verre. */
export function Etapes({ items }: { items: { titre: string; texte: string }[] }) {
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {items.map((e, i) => (
        <Reveal as="li" key={e.titre} delai={i * 110}>
          <div className="liquid-glass relative h-full rounded-[1.5rem] p-6 sm:p-7">
            <span className="pointer-events-none absolute right-5 top-5 opacity-30">
              <Rayons taille={40} couleur="#e0a25c" anime={false} />
            </span>
            <span className="font-display text-4xl text-amber">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-3 font-display text-3xl leading-none tracking-[-1px] text-white">
              {e.titre}
            </h3>
            <p className="mt-4 text-sm font-light leading-snug text-white/75">{e.texte}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/** Liste a puces marquee par le soleil. */
export function ListeOnde({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((t, i) => (
        <Reveal as="li" key={t} delai={i * 70} className="flex items-start gap-3.5">
          <Rayons taille={16} className="mt-1 shrink-0 text-amber" anime={false} />
          <span className="text-[15px] font-light leading-relaxed text-white/80">{t}</span>
        </Reveal>
      ))}
    </ul>
  );
}

/**
 * Appel final, en bas de chaque page de soin.
 *
 * `fond` parce que la page Fleurs de Bach a son propre visuel : sans ce
 * parametre, ses fleurs en haut et les bougies en bas se contredisaient.
 */
export function AppelFinal({
  titre,
  texte,
  fond = 'epi',
}: {
  titre: string;
  texte: string;
  fond?: keyof typeof VIDEOS;
}) {
  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-black">
      <FadingVideo
        src={VIDEOS[fond].src}
        poster={VIDEOS[fond].poster}
        className="fondu-bords fond-video-court absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/78" />

      <div className="relative z-10 flex min-h-[70vh] items-center justify-center px-5 py-24 text-center sm:px-6">
        <div className="max-w-2xl">
          <Reveal>
            <Puce>Prendre rendez-vous</Puce>
          </Reveal>
          <BlurText
            as="h2"
            text={titre}
            decalage={80}
            className="text-4xl leading-[0.98] text-white sm:text-5xl md:text-6xl"
          />
          <Reveal delai={160}>
            <p className="mx-auto mt-6 max-w-md text-[15px] font-light leading-relaxed text-white/80">
              {texte}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <BoutonPlein href={SITE.telephoneLien}>
                <Phone className="h-4 w-4" />
                {SITE.telephone}
              </BoutonPlein>
              <BoutonVerre href={URLS.tarifs}>
                Voir les tarifs
                <ArrowUpRight className="h-4 w-4" />
              </BoutonVerre>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
