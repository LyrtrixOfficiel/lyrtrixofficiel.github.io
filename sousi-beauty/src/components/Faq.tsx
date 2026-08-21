import { Reveal } from './Reveal';
import { FAQ } from '../data/site';
import { TitreSection } from './TitreSection';

/** FAQ — six questions tirees de ses propres descriptions, jamais inventees. */
export function Faq() {
  return (
    <Reveal className="section pad-x" id="faq">
      <TitreSection eyebrow="Questions" id="titre-faq">
        Ce qu’on nous
        <br />
        demande le plus
      </TitreSection>

      <div className="mt-14 max-w-3xl">
        {FAQ.map((item) => (
          <details key={item.q} className="group border-t border-white/12">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 text-white marker:content-none">
              <span className="font-display text-xl sm:text-2xl">{item.q}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-or transition-transform duration-500 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mesure pb-7 text-white/65">{item.r}</p>
          </details>
        ))}
      </div>
    </Reveal>
  );
}
