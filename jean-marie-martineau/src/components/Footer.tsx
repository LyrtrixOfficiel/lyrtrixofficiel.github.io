import { MapPin, Phone } from 'lucide-react';
import Rayons from './Rayons';
import { Filet, IconeFacebook } from './ui';
import Marque from './Marque';
import { ADRESSE, BASELINE, SITE, SOINS, URLS } from '../lib/site';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-black px-5 pt-20 pb-28 sm:px-6 md:px-12 lg:px-16 lg:pb-20">
      {/* le soleil, une derniere fois, en filigrane */}
      <div className="pointer-events-none absolute -right-24 -top-24 opacity-[0.06]">
        <Rayons taille={340} couleur="#e0a25c" anime={false} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Marque />
            <p className="mt-5 max-w-sm font-display text-3xl leading-[1.05] text-white/90">
              {BASELINE}
            </p>
            <p className="mt-5 text-sm font-light text-white/50">
              {SITE.marque} — {SITE.praticien}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-light tracking-wide text-white/60">
              <span className="text-amber">//</span> Le cabinet
            </h2>
            <address className="mt-5 space-y-2 text-sm font-light not-italic text-white/75">
              <a
                href={SITE.telephoneLien}
                className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-amber"
              >
                <Phone className="h-4 w-4 text-amber" />
                {SITE.telephone}
              </a>
              <span className="flex items-start gap-2.5 py-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <span>{ADRESSE}</span>
              </span>
              {SITE.facebook && (
                <a
                  href={SITE.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-amber"
                >
                  <IconeFacebook className="h-4 w-4 text-amber" />
                  {SITE.praticien}
                </a>
              )}
            </address>
          </div>

          <div>
            <h2 className="text-xs font-light tracking-wide text-white/60">
              <span className="text-amber">//</span> Les soins
            </h2>
            <ul className="mt-5 text-sm font-light text-white/75">
              {SOINS.map((soin) => (
                <li key={soin.route}>
                  <a
                    href={URLS[soin.route]}
                    className="block py-1.5 transition-colors hover:text-amber"
                  >
                    {soin.titre}
                  </a>
                </li>
              ))}
              <li>
                <a href={URLS.tarifs} className="block py-1.5 transition-colors hover:text-amber">
                  Mes tarifs
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Filet className="mt-14" />

        <div className="mt-6 flex flex-col gap-3 text-xs font-light text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.marque} — {SITE.praticien}
          </p>
          <div className="flex items-center gap-5">
            <a href={URLS.mentions} className="block py-2.5 transition-colors hover:text-amber">
              Mentions légales
            </a>
            <a href={URLS.contact} className="block py-2.5 transition-colors hover:text-amber">
              Me contacter
            </a>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-xs font-light leading-relaxed text-white/30">
          Les soins proposés sont conçus pour compléter une routine de bien-être. Ils ne sauraient
          en aucun cas remplacer un suivi médical.
        </p>
      </div>
    </footer>
  );
}
