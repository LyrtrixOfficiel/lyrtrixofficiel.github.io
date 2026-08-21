import { Lotus, MotSymbole } from './Lotus';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';
import { ADRESSE_COURTE, AVIS, DEPUIS_ANS } from '../data/site';

/**
 * Premier ecran.
 *
 * LE NOM DE LA BOUTIQUE EST LE TITRE. La version precedente mettait
 * « Le maquillage qui reste » en h1 et le nom nulle part en grand : on
 * arrivait sur le site sans savoir chez qui on etait. La promesse est
 * redescendue en sous-titre, ou elle a sa place.
 *
 * Sa photo d'accueil en fond, DEUX voiles, et tout le reste pose dessus en
 * verre. Le second voile est radial et centre sur le texte : c'est lui qui
 * tient le contraste, pas le degrade global — les bords de la photo restent
 * lisibles, et c'est ce qui cadre la composition.
 *
 * Choregraphie d'entree, en CSS :
 *   0,30 s  le badge
 *   0,40 s  le nom, puis 110 ms par mot
 *   0,95 s  la promesse
 *   1,15 s  la phrase
 *   1,35 s  les actions
 *   1,55 s  les trois cartes de verre
 */
export function Hero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden bg-black">
      <img
        src="/photos/photo-01.webp"
        alt="L’accueil de Sousi Beauty : comptoir clair et logo doré sur un mur à lattes noires"
        width={1600}
        height={1067}
        fetchPriority="high"
        decoding="async"
        className="respire absolute inset-0 h-full w-full object-cover"
      />

      {/* voile global : jamais de texte pose sur l'image nue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,.86) 0%, rgba(0,0,0,.55) 30%, rgba(0,0,0,.62) 62%, rgba(0,0,0,.94) 100%)',
        }}
      />
      {/* voile local : c'est lui qui tient le contraste du texte */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(62% 64% at 50% 52%, rgba(0,0,0,.86) 0%, rgba(0,0,0,.72) 42%, rgba(0,0,0,.34) 74%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="pad-x relative z-10 flex min-h-svh flex-col items-center justify-center py-28 text-center">
        <div
          className="fade-in liquid-glass inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-2"
          style={{ animationDelay: '0.30s' }}
        >
          <Lotus taille={20} className="text-or" />
          <span className="micro text-white/90">Institut de beauté · {ADRESSE_COURTE}</span>
        </div>

        {/* Le nom, en grand, dans le script de son enseigne. C'est lui le h1. */}
        <Lotus
          taille={96}
          className="fade-in mt-8 text-or"
          />
        <h1
          id="titre-principal"
          className="fade-rise mt-4 text-white"
          style={{ animationDelay: '0.55s' }}
        >
          <MotSymbole className="text-[3.6rem] leading-[1.15] sm:text-[5.5rem] lg:text-[7.5rem]" />
        </h1>

        <p
          className="fade-rise font-display mt-5 text-2xl text-or-doux sm:text-3xl md:text-4xl"
          style={{ animationDelay: '0.95s' }}
        >
          Le maquillage qui reste
        </p>

        <p
          className="fade-rise mt-6 max-w-xl text-sm leading-relaxed font-light text-white/90 sm:text-base"
          style={{ animationDelay: '1.15s' }}
        >
          Sourcils, lèvres, eye-liner. Depuis {DEPUIS_ANS} ans place des Halles, à
          Strasbourg — et tout l’institut avec : soins de la peau, regard, épilation.
        </p>

        <div
          className="fade-rise mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
          style={{ animationDelay: '1.35s' }}
        >
          <a
            href={lienRdv('hero')}
            {...LIEN_EXTERNE}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
          >
            Prendre rendez-vous
          </a>
          <a
            href="./tarifs.html"
            className="liquid-glass-strong inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.04]"
          >
            Voir les tarifs
          </a>
        </div>

        {/* En mobile, les trois cartes de 210 px ne tiennent pas : la preuve
            passe sur une seule barre de verre, sans rien perdre. */}
        <div
          className="fade-in liquid-glass mt-10 flex items-center gap-3 rounded-full px-5 py-2.5 sm:hidden"
          style={{ animationDelay: '1.55s' }}
        >
          <span className="font-display text-lg text-white">{AVIS.note}/5</span>
          <span className="h-3 w-px bg-white/25" />
          <span className="micro text-white/70">{DEPUIS_ANS} ans</span>
          <span className="h-3 w-px bg-white/25" />
          <span className="micro text-white/70">165 prestations</span>
        </div>

        <div
          className="fade-in mt-12 hidden flex-wrap items-stretch justify-center gap-4 sm:flex"
          style={{ animationDelay: '1.55s' }}
        >
          <CarteVerre valeur={`${AVIS.note} / 5`} legende={`sur ${AVIS.nombre} avis ${AVIS.source}`} />
          <CarteVerre valeur={`${DEPUIS_ANS} ans`} legende="de métier, place des Halles" />
          <CarteVerre valeur="165" legende="prestations à la carte" />
        </div>
      </div>
    </section>
  );
}

/** Carte de statistique en verre. */
function CarteVerre({ valeur, legende }: { valeur: string; legende: string }) {
  return (
    <div className="liquid-glass w-[190px] rounded-[1.25rem] p-5 text-left sm:w-[210px]">
      <Lotus taille={18} className="text-or" anime={false} />
      <p className="font-display mt-4 text-4xl leading-none text-white">{valeur}</p>
      <p className="mt-2 text-xs leading-snug font-light text-white/70">{legende}</p>
    </div>
  );
}
