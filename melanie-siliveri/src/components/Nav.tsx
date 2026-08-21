import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import Marque from './Marque';
import { SITE, SOINS, URLS, type Route } from '../lib/site';

/** largeur fixe du panneau : elle sert a le centrer sans `transform` */
const LARGEUR_MENU = 250;

type Entree = { label: string; href?: string; sous?: { label: string; href: string }[] };

const ENTREES: Entree[] = [
  { label: 'Bienvenue', href: URLS.accueil },
  {
    label: 'Les soins',
    sous: [
      ...SOINS.map((s) => ({ label: s.titre, href: URLS[s.route] })),
    ],
  },
  { label: 'Tarifs', href: URLS.tarifs },
  { label: 'Contact', href: URLS.contact },
];

const SOUS_ROUTES: Route[] = ['soin1', 'soin2', 'soin3'];

export default function Nav({ route }: { route: Route }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [ancre, setAncre] = useState({ left: 0, top: 0 });
  const [menu, setMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const minuterie = useRef<number>(0);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu]);

  /**
   * Le panneau est rendu **hors de la pilule**, directement dans le <nav>.
   * La pilule porte un `backdrop-filter` : un element filtre devient une
   * racine de fond pour ses descendants, qui n'ont alors plus rien a
   * echantillonner en dehors de ses limites. Le menu, imbrique dedans,
   * laissait donc passer le texte du hero, net.
   *
   * Etant dans un autre sous-arbre, il est positionne a la main a partir de
   * la position de son declencheur — sans `transform`, qui casserait le flou
   * pour la meme raison.
   */
  const ouvrirMenu = (e: Entree, declencheur: HTMLElement) => {
    window.clearTimeout(minuterie.current);
    if (!e.sous) {
      setOuvert(null);
      return;
    }
    const nav = navRef.current;
    if (nav) {
      const rn = nav.getBoundingClientRect();
      const rd = declencheur.getBoundingClientRect();
      setAncre({
        left: Math.round(rd.left - rn.left + rd.width / 2 - LARGEUR_MENU / 2),
        top: Math.round(rd.bottom - rn.top),
      });
    }
    setOuvert(e.label);
  };

  /* petit delai : le temps de traverser l'espace entre le bouton et le menu */
  const fermerBientot = () => {
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => setOuvert(null), 160);
  };

  const garderOuvert = () => window.clearTimeout(minuterie.current);

  const entreeOuverte = ENTREES.find((e) => e.label === ouvert && e.sous);

  const actif = (e: Entree) =>
    e.href === URLS[route] || (e.sous ? SOUS_ROUTES.includes(route) : false);

  return (
    <>
      {/* Aucune animation sur le <nav> lui-meme : `transform` comme `opacity`
          creent une racine de fond, ce qui neutralise le `backdrop-filter` du
          menu deroulant qu'il contient. L'entree est portee par ses enfants. */}
      <nav
        ref={navRef}
        className="absolute inset-x-0 top-4 z-50 flex items-center justify-between px-5 sm:px-6 lg:px-12"
      >
        {/* ---- marque ---------------------------------------------------- */}
        {/* Matthieu n'a pas de logo : la marque est typographique. C'est un
            choix par defaut, a remplacer le jour ou il en fournit un. */}
        <a
          href={URLS.accueil}
          className="fade-in liquid-glass flex items-center justify-center rounded-full p-2 transition-transform duration-300 hover:scale-[1.03] sm:p-2.5"
          aria-label={`Accueil — ${SITE.marque}`}
        >
          <Marque compact />
        </a>

        {/* ---- pilule centrale -------------------------------------------
             Deux surcharges necessaires sur .liquid-glass :
             - `!absolute`        : la classe impose position:relative ;
             - `!overflow-visible`: elle impose overflow:hidden, ce qui
               rognait purement et simplement le menu deroulant a l'interieur
               de la pilule. Le chevron tournait, le panneau etait decoupe. */}
        {/* Centre par `inset-x-0 mx-auto w-fit` et non par `-translate-x-1/2` :
            un ancetre transforme cree une racine de fond, et `backdrop-filter`
            n'a alors plus rien a echantillonner — le verre laissait passer le
            texte du titre. */}
        <div className="fade-in liquid-glass !absolute inset-x-0 mx-auto hidden w-fit items-center gap-0.5 rounded-full p-1.5 lg:flex">
          {ENTREES.map((e) => (
            <div key={e.label} onMouseEnter={(ev) => ouvrirMenu(e, ev.currentTarget)} onMouseLeave={fermerBientot}>
              {e.sous ? (
                /* Un lien, pas un bouton : au survol le menu s'ouvre, mais un
                   clic mene quand meme quelque part — la section « Les soins »
                   de l'accueil. Avant, le clic refermait ce que le survol
                   venait d'ouvrir : il ne se passait rien. */
                <a
                  href={`${URLS.accueil}#soins`}
                  aria-expanded={ouvert === e.label}
                  onFocus={(ev) => ouvrirMenu(e, ev.currentTarget.parentElement!)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    actif(e) ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {e.label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                      ouvert === e.label ? 'rotate-180' : ''
                    }`}
                  />
                </a>
              ) : (
                <a
                  href={e.href}
                  className={`block rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    actif(e) ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {e.label}
                </a>
              )}
            </div>
          ))}

          <a
            href={SITE.telephoneLien}
            className="ml-1.5 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
          >
            <Phone className="h-3.5 w-3.5" />
            {SITE.telephone}
          </a>
        </div>

        {/* ---- menu deroulant, hors de la pilule -------------------------- */}
        {entreeOuverte && (
          /* Aucune animation sur ce conteneur ni sur le panneau : `opacity` et
             `transform` en font une racine de fond, et le `backdrop-filter` du
             verre n'a plus rien a echantillonner — le titre du hero passait au
             travers, net. L'entree est portee par les liens, qui sont *dans* le
             verre et ne lui font donc rien. */
          <div
            className="absolute z-50 hidden pt-2 lg:block"
            style={{ left: ancre.left, top: ancre.top, width: LARGEUR_MENU }}
            onMouseEnter={garderOuvert}
            onMouseLeave={fermerBientot}
          >
            <div className="liquid-glass-strong menu-verre rounded-2xl px-2 py-3">
              {entreeOuverte.sous!.map((s, i) => (
                <a
                  key={s.href}
                  href={s.href}
                  style={{ animationDelay: `${i * 35}ms` }}
                  className={`animate-dropdown block rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                    s.href === URLS[route] ? 'text-amber' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ---- bascule mobile -------------------------------------------- */}
        <button
          type="button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menu}
          className="fade-in liquid-glass flex h-12 w-12 items-center justify-center rounded-full active:scale-90 lg:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 block h-px w-5 bg-white transition-all duration-300 ${
                menu ? 'top-2 rotate-45' : 'top-1'
              }`}
            />
            <span
              className={`absolute left-0 block h-px bg-white transition-all duration-300 ${
                menu ? 'top-2 w-5 -rotate-45' : 'top-3 w-3.5'
              }`}
            />
          </span>
        </button>
      </nav>

      {/* ---- panneau plein écran mobile ---------------------------------- */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl transition-all lg:hidden ${
          menu ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ transitionDuration: '500ms', transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div
          className="flex h-full flex-col justify-center px-8 transition-all delay-100"
          style={{
            transform: menu ? 'translateY(0)' : 'translateY(2rem)',
            opacity: menu ? 1 : 0,
            transitionDuration: '500ms',
            transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {ENTREES.map((e) =>
            e.href ? (
              <a
                key={e.label}
                href={e.href}
                onClick={() => setMenu(false)}
                className={`block py-3 font-display text-4xl ${
                  actif(e) ? 'text-amber' : 'text-white/90'
                }`}
              >
                {e.label}
              </a>
            ) : (
              <div key={e.label} className="py-3">
                <a
                  href={`${URLS.accueil}#soins`}
                  onClick={() => setMenu(false)}
                  className="block py-2 font-display text-4xl text-white/90"
                >
                  {e.label}
                </a>
                <div className="mt-2 space-y-1 border-l border-white/15 pl-5">
                  {e.sous!.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      onClick={() => setMenu(false)}
                      className={`block py-2 text-lg ${
                        s.href === URLS[route] ? 'text-amber' : 'text-white/80'
                      }`}
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            ),
          )}

          <a
            href={SITE.telephoneLien}
            onClick={() => setMenu(false)}
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-black"
          >
            <Phone className="h-4 w-4" />
            {SITE.telephone}
          </a>
          <p className="mt-4 text-center text-xs text-white/45">
            {SITE.adresse.rue} · {SITE.adresse.codePostal} {SITE.adresse.ville}
          </p>
        </div>
      </div>
    </>
  );
}
