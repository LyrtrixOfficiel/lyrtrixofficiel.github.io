import { BlurText } from '../components/BlurText';
import { Reveal } from '../components/Reveal';
import { TableauPrix } from '../components/TableauPrix';
import { Lotus } from '../components/Lotus';
import { lienRdv, LIEN_EXTERNE } from '../lib/booking';
import { famillesDe, nbPrestations, prixDEntree, type Univers } from '../data/site';

/**
 * Une page par univers. Meme gabarit, contenu different — c'est ce qui donne
 * une URL par intention de recherche (« microblading Strasbourg », « hydrafacial
 * Strasbourg ») sans multiplier les gabarits a maintenir.
 */
export default function PageUnivers({ univers }: { univers: Univers }) {
  const familles = famillesDe(univers);

  return (
    <>
      <section className="relative min-h-[74svh] w-full overflow-hidden bg-black">
        <img
          src={univers.photo}
          alt={univers.alt}
          width={1600}
          height={1067}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.58) 34%, rgba(0,0,0,.72) 68%, rgba(0,0,0,.96) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 62% at 50% 56%, rgba(0,0,0,.84) 0%, rgba(0,0,0,.66) 44%, rgba(0,0,0,.28) 76%, rgba(0,0,0,0) 100%)',
          }}
        />

        <div className="pad-x relative z-10 flex min-h-[74svh] flex-col items-center justify-center py-28 text-center">
          <div
            className="fade-in liquid-glass inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-2"
            style={{ animationDelay: '0.30s' }}
          >
            <Lotus taille={18} className="text-or" />
            <span className="micro text-white/90">{univers.sousTitre}</span>
          </div>

          <BlurText
            text={univers.titre}
            as="h1"
            depart={400}
            decalage={100}
            className="mt-6 text-[2.6rem] leading-[0.96] text-white sm:text-6xl lg:text-7xl"
          />

          <p
            className="fade-rise mesure mt-6 text-sm leading-relaxed font-light text-white/90 sm:text-base"
            style={{ animationDelay: '0.95s' }}
          >
            {univers.intro}
          </p>

          <div
            className="fade-in mt-9 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: '1.2s' }}
          >
            <div className="liquid-glass rounded-[1.25rem] px-6 py-4 text-left">
              <p className="micro text-white/60">{univers.appel.nom}</p>
              <p className="font-display mt-1 text-3xl text-or">dès {prixDEntree(univers)}&nbsp;€</p>
            </div>
            <div className="liquid-glass rounded-[1.25rem] px-6 py-4 text-left">
              <p className="micro text-white/60">Prestations</p>
              <p className="font-display mt-1 text-3xl text-white">{nbPrestations(univers)}</p>
            </div>
            <a
              href={lienRdv(`univers-${univers.id}`)}
              {...LIEN_EXTERNE}
              className="inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
            >
              Prendre rendez-vous
            </a>
          </div>
        </div>
      </section>

      <section className="section pad-x">
        {familles.map((f, i) => (
          <TableauPrix key={f.id} famille={f} delai={i * 80} />
        ))}

        <Reveal className="mt-16">
          <p className="mesure text-white/65">
            Une prestation qui vous intéresse et que vous ne trouvez pas ici se demande
            par téléphone. Les tarifs sont ceux de la prise de rendez-vous en ligne.
          </p>
          <a
            href="./tarifs.html"
            className="liquid-glass-strong mt-6 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.04]"
          >
            Voir tous les tarifs
          </a>
        </Reveal>
      </section>
    </>
  );
}
