import { Reveal } from './Reveal';
import { TitreSection } from './TitreSection';
import { FAQ } from '../data/site';

/**
 * FAQ — six questions tirees de ses prestations et de ses legendes, pas
 * inventees. `<details>` natif : accessible au clavier sans une ligne de JS.
 */
export function Faq() {
  return (
    <Reveal className="section pad-x" id="faq">
      <TitreSection numero="05" id="titre-faq">
        Questions fréquentes
      </TitreSection>

      <div className="mt-8 max-w-3xl">
        {FAQ.map((item) => (
          <details key={item.q} className="group border-b border-white/8">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium marker:content-none">
              {item.q}
              <span
                aria-hidden="true"
                className="shrink-0 text-accent transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mesure pb-5 text-muted">{item.r}</p>
          </details>
        ))}
      </div>
    </Reveal>
  );
}
