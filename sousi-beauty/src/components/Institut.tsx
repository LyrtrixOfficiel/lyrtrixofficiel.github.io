import { Reveal } from './Reveal';
import { EQUIPE, INSTAGRAM, INSTAGRAM_HANDLE, PRESENTATION } from '../data/site';
import { LIEN_EXTERNE } from '../lib/booking';
import { TitreSection } from './TitreSection';

/**
 * L'institut — diptyque asymetrique, bloc matiere a droite.
 *
 * Les trois paragraphes sont SA presentation Planity, mot pour mot. Elle est
 * deja ecrite, structuree et juste : la reecrire serait la trahir.
 */
export function Institut() {
  return (
    <Reveal className="section pad-x" id="institut">
      <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
        <div>
          <TitreSection eyebrow="L’institut" id="titre-institut">
            Vous sublimer,
            <br />
            depuis quinze ans
          </TitreSection>

          <div className="mesure mt-10 space-y-5 text-white/65">
            {PRESENTATION.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          <p className="micro mt-10 text-white/65">
            À l’institut : {EQUIPE.join(' et ')}
          </p>

          <a
            href={INSTAGRAM}
            {...LIEN_EXTERNE}
            className="micro mt-6 inline-flex min-h-11 items-center gap-3 text-or transition-colors duration-500 hover:text-white"
          >
            {INSTAGRAM_HANDLE}
            <span aria-hidden="true">&#8594;</span>
          </a>
        </div>

        {/* Sa vraie salle d'attente — plus de texture generee ici. */}
        <div className="relative">
          <img
            src="/photos/photo-03.webp"
            alt="Le coin d’attente de l’institut : fauteuils en velours beige devant la vitrine"
            width={1600}
            height={1067}
            loading="lazy"
            decoding="async"
            className="h-full min-h-[22rem] w-full object-cover"
          />
        </div>
      </div>
    </Reveal>
  );
}
