import { SplitText } from './SplitText';
import { Comparateur } from './Comparateur';
import { FondVideo } from './FondVideo';
import { LIEN_EXTERNE, lienReservation } from '../lib/booking';
import { AVIS, COMPARATEUR, MARQUE, ZONE_PROSE } from '../data/site';

/**
 * Premier ecran : une composition pleine hauteur, pas une section empilee.
 * Haut = marque · centre = enonce + comparateur · bas = CTA et preuve.
 *
 * Le fond est une video generee, abstraite, tres voilee. Elle ne montre aucune
 * prestation : les seuls resultats affiches sur ce site sont ses photos a elle.
 */
export function Hero() {
  return (
    <section
      className="pad-x relative isolate flex min-h-[100svh] flex-col justify-between pt-6 pb-24 lg:pb-8"
      aria-labelledby="titre-principal"
    >
      <FondVideo
        posterMobile="/media/fond-mobile.jpg"
        posterDesktop="/media/fond-desktop.jpg"
        videoMobile="/media/fond-mobile.mp4"
        videoDesktop="/media/fond-desktop.mp4"
      />

      {/* Haut */}
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-lg tracking-tight">{MARQUE}</p>
        <p className="text-right text-[length:var(--micro)] tracking-[0.28em] text-muted uppercase">
          Extensions
          <br />
          &amp; rehaussement
        </p>
      </div>

      {/* Centre */}
      <div className="grid items-center gap-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:py-8">
        <div>
          <SplitText
            id="titre-principal"
            text="Le regard, d’abord."
            className="font-display leading-[0.92]"
            style={{ fontSize: 'var(--h1)' }}
          />
          <p className="mesure mt-5 text-muted">
            Extensions de cils et rehaussement à {ZONE_PROSE}. Chaque pose part de la morphologie
            de votre œil et de l’état de vos cils naturels — c’est ce qui fait qu’une pose
            tient, et qu’elle vous ressemble.
          </p>
        </div>

        {/* Sous lg, le comparateur est borne : plein cadre en 4/5 sur une
            tablette, il pousserait le CTA sous la ligne de flottaison. */}
        <div className="mx-auto w-full max-w-[22rem] lg:max-w-none">
          <Comparateur gauche={COMPARATEUR.gauche} droite={COMPARATEUR.droite} priorite />
          <p className="mt-3 text-[length:var(--micro)] text-muted">
            Faites glisser pour comparer les deux familles de prestations.
          </p>
        </div>
      </div>

      {/* Bas */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <a
          href={lienReservation('hero')}
          {...LIEN_EXTERNE}
          className="cta-lueur inline-flex items-center justify-center rounded-full bg-accent font-medium text-bg transition-opacity hover:opacity-90"
          style={{ paddingInline: 'var(--btn-px)', paddingBlock: 'var(--btn-py)' }}
        >
          Réserver
        </a>
        <p className="text-[length:var(--micro)] tracking-[0.18em] text-muted uppercase">
          <span className="text-text">{AVIS.note} / 5</span> · {AVIS.nombre} avis {AVIS.source}
        </p>
      </div>
    </section>
  );
}
