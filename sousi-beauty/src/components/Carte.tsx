import { ADRESSE, ADRESSE_COURTE } from '../data/site';

/** Releve sur Nominatim pour « 12 place des Halles, 67000 Strasbourg ». */
const LAT = 48.5876766;
const LON = 7.7422968;

const CADRE = [LON - 0.0042, LAT - 0.0021, LON + 0.0042, LAT + 0.0021]
  .map((n) => n.toFixed(5))
  .join(',');

const OSM = `https://www.openstreetmap.org/export/embed.html?bbox=${CADRE}&layer=mapnik&marker=${LAT},${LON}`;

export const ITINERAIRE = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADRESSE)}`;

/**
 * La carte du lieu.
 *
 * Sur Planity la carte est ce qui repond a la seule question qui reste quand on
 * a choisi sa prestation : « c'est ou, et comment j'y vais ». Le site n'avait
 * qu'une adresse en texte.
 *
 * OpenStreetMap plutot que Google Maps : pas de cle d'API a gerer, pas de
 * cookie tiers a declarer, et l'iframe est en `lazy` donc elle ne coute rien
 * tant qu'on n'a pas descendu jusqu'ici. Le bouton d'itineraire, lui, part sur
 * Google Maps — c'est ce que les gens ont dans leur telephone.
 *
 * La tuile OSM est claire et le site est noir : le filtre l'inverse en carte
 * sombre. `hue-rotate` remet les couleurs a l'endroit apres l'inversion, sans
 * quoi les parcs sortent en rose.
 */
export function Carte({ className = '' }: { className?: string }) {
  return (
    <div className={`liquid-glass relative overflow-hidden rounded-[1.4rem] ${className}`}>
      <iframe
        src={OSM}
        title={`Carte : Sousi Beauty, ${ADRESSE}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="block h-full min-h-[19rem] w-full border-0"
        style={{ filter: 'invert(0.92) hue-rotate(180deg) saturate(0.55) contrast(0.92)' }}
      />

      {/* voile d'or tres leger : raccorde la carte au reste de la palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 100%, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 55%), linear-gradient(0deg, rgba(198,158,90,.10), rgba(198,158,90,.10))',
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
        <div>
          <p className="micro text-or-doux">{ADRESSE_COURTE}</p>
          <p className="mt-1 text-sm text-white">{ADRESSE}</p>
        </div>
        <a
          href={ITINERAIRE}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
        >
          Itinéraire
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
