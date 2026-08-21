import { useEffect, useState, type ReactNode } from 'react';
import { Check, LogOut, Plus, Save, Trash2, TriangleAlert } from 'lucide-react';
import {
  accepterInvitation,
  connexion,
  deconnexion,
  ecrireFichier,
  ErreurEdition,
  lireFichier,
  sessionEnregistree,
  type Fichier,
  type Session,
} from '../lib/edition';

/* --- forme des fichiers de contenu --------------------------------------- */

type Ligne = { label: string; prix: string; soin: string };
type Groupe = { titre: string; lignes: Ligne[] };
type Tarifs = { paiement: string; bonsCadeaux: string; groupes: Groupe[] };
type Soin = {
  route: string;
  titre: string;
  accroche: string;
  resume: string;
  etiquettes: string[];
};
type Soins = { soins: Soin[] };
type Coordonnees = Record<string, string>;
type Bloc = { titre: string; texte: string };
type Textes = Record<string, Record<string, string | string[] | Bloc[]>>;

/**
 * Description des textes editables, page par page. C'est cette liste qui
 * dessine le formulaire — ajouter un texte au site revient a ajouter une
 * ligne ici et une cle dans `content/textes.json`.
 */
type TypeChamp = 'ligne' | 'bloc' | 'liste' | 'listeTitrée';
const PAGES_TEXTES: {
  cle: string;
  libelle: string;
  champs: { cle: string; libelle: string; type: TypeChamp; aide?: string }[];
}[] = [
  {
    cle: 'accueil',
    libelle: 'Accueil',
    champs: [
      { cle: 'heroTitre', libelle: 'Grand titre', type: 'bloc' },
      { cle: 'heroSous', libelle: 'Texte sous le titre', type: 'bloc' },
      { cle: 'heroBadge', libelle: 'Mention à côté de la ville', type: 'ligne' },
      { cle: 'bienvenueTitre', libelle: 'Titre « Bienvenue »', type: 'bloc' },
      { cle: 'propositions', libelle: 'Liste « Je vous propose »', type: 'liste' },
      { cle: 'photoCitation', libelle: 'Phrase sur la photo', type: 'bloc' },
      { cle: 'photoSignature', libelle: 'Signature sous la photo', type: 'ligne' },
      { cle: 'soinsTitre', libelle: 'Titre de la section des soins', type: 'ligne' },
      { cle: 'citation', libelle: 'Citation', type: 'bloc' },
      { cle: 'citationAuteur', libelle: 'Auteur de la citation', type: 'ligne' },
      { cle: 'citationNote', libelle: 'Note sous la citation', type: 'bloc' },
      { cle: 'tarifsTitre', libelle: 'Titre de la section tarifs', type: 'ligne' },
      { cle: 'ctaTitre', libelle: 'Titre final', type: 'ligne' },
      { cle: 'ctaTexte', libelle: 'Texte final', type: 'bloc', aide: 'Le numéro est ajouté automatiquement à la fin.' },
    ],
  },
  {
    cle: 'reflexologie',
    libelle: 'Réflexologie',
    champs: [
      { cle: 'heroTitre', libelle: 'Grand titre', type: 'ligne' },
      { cle: 'heroSous', libelle: 'Texte sous le titre', type: 'bloc' },
      { cle: 'heroBadge', libelle: 'Mention à côté du prix', type: 'ligne' },
      { cle: 'titre', libelle: 'Titre de la section', type: 'bloc' },
      { cle: 'paragraphes', libelle: 'Paragraphes', type: 'liste' },
      { cle: 'legendePhoto', libelle: 'Légende de la photo', type: 'ligne' },
      { cle: 'ctaTitre', libelle: 'Titre final', type: 'ligne' },
      { cle: 'ctaTexte', libelle: 'Texte final', type: 'bloc', aide: 'Le numéro est ajouté automatiquement à la fin.' },
    ],
  },
  {
    cle: 'bach',
    libelle: 'Psychogénéalogie',
    champs: [
      { cle: 'heroTitre', libelle: 'Grand titre', type: 'ligne' },
      { cle: 'heroSous', libelle: 'Texte sous le titre', type: 'bloc' },
      { cle: 'heroBadge', libelle: 'Mention à côté du prix', type: 'ligne' },
      { cle: 'titre', libelle: 'Titre de la section', type: 'bloc' },
      { cle: 'paragraphes', libelle: 'Paragraphes', type: 'liste' },
      { cle: 'objectif', libelle: 'Phrase mise en avant', type: 'bloc' },
      { cle: 'noteTarif', libelle: 'Note sous le tarif', type: 'bloc' },
      { cle: 'legendePhoto', libelle: 'Légende de la photo', type: 'ligne' },
      { cle: 'processusTitre', libelle: 'Titre « Le processus »', type: 'bloc' },
      { cle: 'etapes', libelle: 'Les trois étapes', type: 'listeTitrée' },
      { cle: 'seanceTitre', libelle: 'Titre « Déroulement »', type: 'bloc' },
      { cle: 'seance', libelle: 'Déroulement de la séance', type: 'listeTitrée' },
      { cle: 'note', libelle: 'Note de fin', type: 'bloc' },
      { cle: 'ctaTitre', libelle: 'Titre final', type: 'ligne' },
      { cle: 'ctaTexte', libelle: 'Texte final', type: 'bloc' },
    ],
  },
  {
    cle: 'avancee',
    libelle: 'Soin énergétique',
    champs: [
      { cle: 'heroTitre', libelle: 'Grand titre', type: 'ligne' },
      { cle: 'heroSous', libelle: 'Texte sous le titre', type: 'bloc' },
      { cle: 'heroBadge', libelle: 'Mention à côté du prix', type: 'ligne' },
      { cle: 'titre', libelle: 'Titre de la section', type: 'bloc' },
      { cle: 'paragraphes', libelle: 'Paragraphes', type: 'liste' },
      { cle: 'legendePhoto', libelle: 'Légende de la photo', type: 'ligne' },
      { cle: 'citation', libelle: 'Citation', type: 'bloc' },
      { cle: 'citationAuteur', libelle: 'Auteur de la citation', type: 'ligne' },
      { cle: 'ouvragesTitre', libelle: 'Titre « Mes appuis »', type: 'bloc' },
      { cle: 'ouvrages', libelle: 'Les ouvrages', type: 'liste' },
      { cle: 'ctaTitre', libelle: 'Titre final', type: 'ligne' },
      { cle: 'ctaTexte', libelle: 'Texte final', type: 'bloc' },
    ],
  },
  {
    cle: 'contact',
    libelle: 'Contact',
    champs: [
      { cle: 'heroTitre', libelle: 'Grand titre', type: 'ligne' },
      { cle: 'heroBadge', libelle: 'Mention à côté de la ville', type: 'ligne' },
      { cle: 'appelTitre', libelle: 'Titre de l’encadré', type: 'ligne' },
      { cle: 'appelTexte', libelle: 'Texte de l’encadré', type: 'bloc' },
      { cle: 'bonsCadeaux', libelle: 'Mention bons cadeaux', type: 'bloc' },
      { cle: 'confidentialite', libelle: 'Mention sur vos données', type: 'bloc' },
      { cle: 'formulaireTitre', libelle: 'Titre du formulaire', type: 'ligne' },
    ],
  },
  {
    cle: 'tarifs',
    libelle: 'Page tarifs',
    champs: [
      { cle: 'heroTitre', libelle: 'Grand titre', type: 'ligne' },
      { cle: 'ctaTitre', libelle: 'Titre final', type: 'ligne' },
      { cle: 'ctaTexte', libelle: 'Texte final', type: 'bloc' },
    ],
  },
  {
    cle: 'commun',
    libelle: 'Sur toutes les pages',
    champs: [
      {
        cle: 'avertissement',
        libelle: 'Avertissement médical',
        type: 'bloc',
        aide: 'Affiché sur chaque page de soin et en pied de page. Mention importante — à modifier avec précaution.',
      },
    ],
  },
];

const SOINS_POSSIBLES = [
  { valeur: '', libelle: '— aucune —' },
  { valeur: 'reflexologie', libelle: 'Réflexologie plantaire' },
  { valeur: 'bach', libelle: 'Psychogénéalogie' },
  { valeur: 'avancee', libelle: 'Soin énergétique' },
];

const CHAMPS_COORDONNEES: { cle: string; libelle: string; aide?: string }[] = [
  { cle: 'telephone', libelle: 'Téléphone affiché', aide: 'Exemple : 06.14.34.20.34' },
  {
    cle: 'telephoneLien',
    libelle: 'Téléphone cliquable',
    aide: 'Format international, exemple : tel:+33614342034',
  },
  { cle: 'rue', libelle: 'Rue' },
  { cle: 'codePostal', libelle: 'Code postal' },
  { cle: 'ville', libelle: 'Ville' },
  { cle: 'region', libelle: 'Région' },
  { cle: 'facebook', libelle: 'Lien Facebook' },
  { cle: 'marque', libelle: "Nom de l'institut" },
  { cle: 'praticien', libelle: 'Votre nom' },
  { cle: 'siret', libelle: 'SIRET' },
  { cle: 'ape', libelle: 'Code APE' },
  { cle: 'hebergeur', libelle: 'Hébergeur (mentions légales)' },
];

/* --- briques d'interface -------------------------------------------------- */

const cadre = 'liquid-glass rounded-[1.5rem] p-6 sm:p-8';
const saisie =
  'w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-[15px] font-light text-white outline-none transition-colors focus:border-amber/70 disabled:opacity-50';

function Champ({
  libelle,
  aide,
  valeur,
  onChange,
  large = false,
  className = '',
}: {
  libelle: string;
  aide?: string;
  valeur: string;
  onChange: (v: string) => void;
  large?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
        {libelle}
      </span>
      {large ? (
        <textarea
          rows={3}
          className={`${saisie} resize-y leading-relaxed`}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className={saisie} value={valeur} onChange={(e) => onChange(e.target.value)} />
      )}
      {aide && <span className="mt-1.5 block text-xs font-light text-white/40">{aide}</span>}
    </label>
  );
}

function Alerte({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-ember/45 bg-ember/10 px-4 py-3 text-sm font-light leading-relaxed text-white/85"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-soft" />
      <span>{children}</span>
    </p>
  );
}

function BoutonSecondaire({
  onClick,
  children,
  danger = false,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        danger
          ? 'border-ember/40 text-white/60 hover:border-ember hover:text-white'
          : 'border-white/15 text-white/70 hover:border-amber/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/* --- ecran de connexion --------------------------------------------------- */

function Connexion({
  invitation,
  recuperation,
  onSession,
}: {
  invitation: string | null;
  recuperation: boolean;
  onSession: (s: Session) => void;
}) {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [mdp2, setMdp2] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (invitation && mdp !== mdp2) {
      setErreur('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    if (invitation && mdp.length < 8) {
      setErreur('Choisissez un mot de passe d’au moins 8 caractères.');
      return;
    }
    setEnvoi(true);
    try {
      const s = invitation
        ? await accepterInvitation(invitation, mdp, recuperation ? 'recuperation' : 'invitation')
        : await connexion(email, mdp);
      history.replaceState(null, '', location.pathname);
      onSession(s);
    } catch (err) {
      setErreur(err instanceof ErreurEdition ? err.message : 'Une erreur est survenue.');
      setEnvoi(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-5 py-16">
      <form onSubmit={valider} className={`${cadre} w-full max-w-sm`}>
        <h1 className="mt-6 text-center font-display text-3xl leading-tight text-white">
          {invitation
            ? recuperation
              ? 'Nouveau mot de passe'
              : 'Choisissez votre mot de passe'
            : 'Votre espace'}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-center text-sm font-light leading-relaxed text-white/60">
          {invitation
            ? recuperation
              ? 'Choisissez un nouveau mot de passe pour retrouver votre espace.'
              : 'C’est la première fois : choisissez un mot de passe, il vous servira à revenir modifier votre site.'
            : 'Modifiez vos tarifs et vos textes. Le site se met à jour tout seul.'}
        </p>

        <div className="mt-8 space-y-4">
          {!invitation && (
            <Champ libelle="Adresse e-mail" valeur={email} onChange={setEmail} />
          )}
          <label className="block">
            <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
              {invitation ? 'Nouveau mot de passe' : 'Mot de passe'}
            </span>
            <input
              type="password"
              className={saisie}
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              autoComplete={invitation ? 'new-password' : 'current-password'}
            />
          </label>
          {invitation && (
            <label className="block">
              <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
                Confirmez le mot de passe
              </span>
              <input
                type="password"
                className={saisie}
                value={mdp2}
                onChange={(e) => setMdp2(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          )}
          {erreur && <Alerte>{erreur}</Alerte>}
          <button
            type="submit"
            disabled={envoi}
            className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60"
          >
            {envoi ? 'Un instant…' : invitation ? 'Valider' : 'Se connecter'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* --- page ----------------------------------------------------------------- */

type Onglet = 'tarifs' | 'soins' | 'textes' | 'coordonnees';

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [invitation, setInvitation] = useState<string | null>(null);
  const [recuperation, setRecuperation] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>('tarifs');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enregistre, setEnregistre] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const [tarifs, setTarifs] = useState<Fichier<Tarifs> | null>(null);
  const [soins, setSoins] = useState<Fichier<Soins> | null>(null);
  const [coord, setCoord] = useState<Fichier<Coordonnees> | null>(null);
  const [txt, setTxt] = useState<Fichier<Textes> | null>(null);
  const [pageTexte, setPageTexte] = useState('accueil');
  const [initial, setInitial] = useState('');

  /* jeton d'invitation transmis dans l'ancre par le courriel de Netlify */
  useEffect(() => {
    const m = /(invite|recovery)_token=([^&]+)/.exec(location.hash);
    if (m) {
      setInvitation(m[2]);
      setRecuperation(m[1] === 'recovery');
    } else setSession(sessionEnregistree());
  }, []);

  /* chargement des trois fichiers */
  useEffect(() => {
    if (!session) return;
    setChargement(true);
    setErreur('');
    Promise.all([
      lireFichier<Tarifs>('content/tarifs.json', session),
      lireFichier<Soins>('content/soins.json', session),
      lireFichier<Coordonnees>('content/coordonnees.json', session),
      lireFichier<Textes>('content/textes.json', session),
    ])
      .then(([t, s, c, x]) => {
        setTarifs(t);
        setSoins(s);
        setCoord(c);
        setTxt(x);
        setInitial(JSON.stringify([t.donnees, s.donnees, c.donnees, x.donnees]));
      })
      .catch((e) => {
        if (e instanceof ErreurEdition && e.message === 'SESSION_EXPIREE') {
          deconnexion();
          setSession(null);
          return;
        }
        setErreur(e instanceof Error ? e.message : 'Chargement impossible.');
      })
      .finally(() => setChargement(false));
  }, [session]);

  const modifie =
    tarifs && soins && coord && txt
      ? JSON.stringify([tarifs.donnees, soins.donnees, coord.donnees, txt.donnees]) !== initial
      : false;

  const enregistrer = async () => {
    if (!session || !tarifs || !soins || !coord || !txt) return;
    setEnvoi(true);
    setErreur('');
    try {
      const avant = JSON.parse(initial) as [Tarifs, Soins, Coordonnees, Textes];
      const aEcrire: [string, unknown, Fichier<unknown>, string][] = [];
      if (JSON.stringify(avant[0]) !== JSON.stringify(tarifs.donnees))
        aEcrire.push(['content/tarifs.json', tarifs.donnees, tarifs, 'Mise à jour des tarifs']);
      if (JSON.stringify(avant[1]) !== JSON.stringify(soins.donnees))
        aEcrire.push(['content/soins.json', soins.donnees, soins, 'Mise à jour des soins']);
      if (JSON.stringify(avant[2]) !== JSON.stringify(coord.donnees))
        aEcrire.push([
          'content/coordonnees.json',
          coord.donnees,
          coord,
          'Mise à jour des coordonnées',
        ]);
      if (JSON.stringify(avant[3]) !== JSON.stringify(txt.donnees))
        aEcrire.push(['content/textes.json', txt.donnees, txt, 'Mise à jour des textes']);

      for (const [chemin, donnees, fichier, message] of aEcrire) {
        const sha = await ecrireFichier(chemin, donnees, fichier.sha, message, session);
        fichier.sha = sha;
      }
      setInitial(JSON.stringify([tarifs.donnees, soins.donnees, coord.donnees, txt.donnees]));
      setEnregistre(true);
      window.setTimeout(() => setEnregistre(false), 12000);
    } catch (e) {
      if (e instanceof ErreurEdition && e.message === 'SESSION_EXPIREE') {
        setErreur('Votre session a expiré. Reconnectez-vous — vos modifications sont conservées.');
      } else {
        setErreur(e instanceof Error ? e.message : "L'enregistrement a échoué.");
      }
    } finally {
      setEnvoi(false);
    }
  };

  if (!session)
    return (
      <Connexion invitation={invitation} recuperation={recuperation} onSession={setSession} />
    );

  return (
    <div className="min-h-svh pb-40">
      {/* ---- entete --------------------------------------------------- */}
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-display text-2xl leading-none text-white">Votre espace</p>
              <p className="mt-1 text-xs font-light text-white/45">{session.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden text-sm font-light text-white/60 transition-colors hover:text-white sm:block"
            >
              Voir le site
            </a>
            <button
              type="button"
              onClick={() => {
                deconnexion();
                setSession(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-light text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Quitter
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        {/* ---- onglets ------------------------------------------------ */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['tarifs', 'Mes tarifs'],
              ['soins', 'Mes soins'],
              ['textes', 'Mes textes'],
              ['coordonnees', 'Mes coordonnées'],
            ] as [Onglet, string][]
          ).map(([cle, libelle]) => (
            <button
              key={cle}
              type="button"
              onClick={() => setOnglet(cle)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                onglet === cle
                  ? 'bg-white text-black'
                  : 'border border-white/15 text-white/70 hover:text-white'
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        {chargement && (
          <p className="mt-10 text-sm font-light text-white/50">Chargement de vos contenus…</p>
        )}
        {erreur && (
          <div className="mt-8">
            <Alerte>{erreur}</Alerte>
          </div>
        )}

        {/* ---- tarifs -------------------------------------------------- */}
        {onglet === 'tarifs' && tarifs && (
          <div className="mt-8 space-y-5">
            {tarifs.donnees.groupes.map((g, gi) => (
              <section key={gi} className={cadre}>
                <div className="flex items-start justify-between gap-4">
                  <input
                    className="w-full bg-transparent font-display text-3xl text-white outline-none"
                    value={g.titre}
                    onChange={(e) => {
                      const d = structuredClone(tarifs.donnees);
                      d.groupes[gi].titre = e.target.value;
                      setTarifs({ ...tarifs, donnees: d });
                    }}
                  />
                  <BoutonSecondaire
                    danger
                    onClick={() => {
                      const d = structuredClone(tarifs.donnees);
                      d.groupes.splice(gi, 1);
                      setTarifs({ ...tarifs, donnees: d });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </BoutonSecondaire>
                </div>

                <div className="mt-6 space-y-3">
                  {g.lignes.map((l, li) => (
                    <div
                      key={li}
                      className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-[1fr_7rem_11rem_auto] sm:items-end"
                    >
                      <Champ
                        libelle="Prestation"
                        valeur={l.label}
                        onChange={(v) => {
                          const d = structuredClone(tarifs.donnees);
                          d.groupes[gi].lignes[li].label = v;
                          setTarifs({ ...tarifs, donnees: d });
                        }}
                      />
                      <Champ
                        libelle="Prix"
                        valeur={l.prix}
                        onChange={(v) => {
                          const d = structuredClone(tarifs.donnees);
                          d.groupes[gi].lignes[li].prix = v;
                          setTarifs({ ...tarifs, donnees: d });
                        }}
                      />
                      <label className="block">
                        <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
                          Page du soin
                        </span>
                        <select
                          className={saisie}
                          value={l.soin}
                          onChange={(e) => {
                            const d = structuredClone(tarifs.donnees);
                            d.groupes[gi].lignes[li].soin = e.target.value;
                            setTarifs({ ...tarifs, donnees: d });
                          }}
                        >
                          {SOINS_POSSIBLES.map((o) => (
                            <option key={o.valeur} value={o.valeur} className="bg-black">
                              {o.libelle}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="pb-3">
                        <BoutonSecondaire
                          danger
                          onClick={() => {
                            const d = structuredClone(tarifs.donnees);
                            d.groupes[gi].lignes.splice(li, 1);
                            setTarifs({ ...tarifs, donnees: d });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </BoutonSecondaire>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <BoutonSecondaire
                    onClick={() => {
                      const d = structuredClone(tarifs.donnees);
                      d.groupes[gi].lignes.push({ label: '', prix: '', soin: '' });
                      setTarifs({ ...tarifs, donnees: d });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une ligne
                  </BoutonSecondaire>
                </div>
              </section>
            ))}

            <BoutonSecondaire
              onClick={() => {
                const d = structuredClone(tarifs.donnees);
                d.groupes.push({ titre: 'Nouveau groupe', lignes: [] });
                setTarifs({ ...tarifs, donnees: d });
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un groupe
            </BoutonSecondaire>

            <section className={`${cadre} space-y-5`}>
              <Champ
                libelle="Moyens de paiement"
                valeur={tarifs.donnees.paiement}
                onChange={(v) => setTarifs({ ...tarifs, donnees: { ...tarifs.donnees, paiement: v } })}
              />
              <Champ
                libelle="Bons cadeaux"
                large
                valeur={tarifs.donnees.bonsCadeaux}
                onChange={(v) =>
                  setTarifs({ ...tarifs, donnees: { ...tarifs.donnees, bonsCadeaux: v } })
                }
              />
            </section>
          </div>
        )}

        {/* ---- soins --------------------------------------------------- */}
        {onglet === 'soins' && soins && (
          <div className="mt-8 space-y-5">
            {soins.donnees.soins.map((s, i) => (
              <section key={s.route} className={`${cadre} space-y-5`}>
                <p className="text-xs font-light tracking-wide text-white/50">
                  <span className="text-amber">//</span> {s.titre}
                </p>
                <Champ
                  libelle="Titre"
                  valeur={s.titre}
                  onChange={(v) => {
                    const d = structuredClone(soins.donnees);
                    d.soins[i].titre = v;
                    setSoins({ ...soins, donnees: d });
                  }}
                />
                <Champ
                  libelle="Phrase d’accroche"
                  valeur={s.accroche}
                  onChange={(v) => {
                    const d = structuredClone(soins.donnees);
                    d.soins[i].accroche = v;
                    setSoins({ ...soins, donnees: d });
                  }}
                />
                <Champ
                  libelle="Résumé sur la page d’accueil"
                  large
                  valeur={s.resume}
                  onChange={(v) => {
                    const d = structuredClone(soins.donnees);
                    d.soins[i].resume = v;
                    setSoins({ ...soins, donnees: d });
                  }}
                />
                <Champ
                  libelle="Mots-clés"
                  aide="Séparés par des virgules. Affichés en haut de la carte, sur ordinateur."
                  valeur={s.etiquettes.join(', ')}
                  onChange={(v) => {
                    const d = structuredClone(soins.donnees);
                    d.soins[i].etiquettes = v
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean);
                    setSoins({ ...soins, donnees: d });
                  }}
                />
              </section>
            ))}
          </div>
        )}

        {/* ---- textes des pages ---------------------------------------- */}
        {onglet === 'textes' && txt && (
          <div className="mt-8">
            <div className="flex flex-wrap gap-2">
              {PAGES_TEXTES.map((p) => (
                <button
                  key={p.cle}
                  type="button"
                  onClick={() => setPageTexte(p.cle)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    pageTexte === p.cle
                      ? 'border border-amber/60 text-amber'
                      : 'border border-white/10 text-white/55 hover:text-white'
                  }`}
                >
                  {p.libelle}
                </button>
              ))}
            </div>

            {PAGES_TEXTES.filter((p) => p.cle === pageTexte).map((p) => (
              <section key={p.cle} className={`${cadre} mt-6 space-y-6`}>
                {p.champs.map((ch) => {
                  const valeur = txt.donnees[p.cle]?.[ch.cle];
                  const majPage = (v: string | string[] | Bloc[]) => {
                    const d = structuredClone(txt.donnees);
                    d[p.cle][ch.cle] = v;
                    setTxt({ ...txt, donnees: d });
                  };

                  if (ch.type === 'liste') {
                    const items = (valeur as string[]) ?? [];
                    return (
                      <div key={ch.cle}>
                        <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
                          {ch.libelle}
                        </span>
                        <div className="space-y-2">
                          {items.map((it, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <textarea
                                rows={2}
                                className={`${saisie} resize-y leading-relaxed`}
                                value={it}
                                onChange={(e) => {
                                  const l = [...items];
                                  l[i] = e.target.value;
                                  majPage(l);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => majPage(items.filter((_, j) => j !== i))}
                                className="mt-2 shrink-0 rounded-full border border-ember/40 p-2 text-white/50 transition-colors hover:text-white"
                                aria-label="Supprimer cette ligne"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <BoutonSecondaire onClick={() => majPage([...items, ''])}>
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter
                          </BoutonSecondaire>
                        </div>
                        {ch.aide && (
                          <span className="mt-2 block text-xs font-light text-white/40">
                            {ch.aide}
                          </span>
                        )}
                      </div>
                    );
                  }

                  if (ch.type === 'listeTitrée') {
                    const items = (valeur as Bloc[]) ?? [];
                    return (
                      <div key={ch.cle}>
                        <span className="mb-3 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
                          {ch.libelle}
                        </span>
                        <div className="space-y-4">
                          {items.map((it, i) => (
                            <div key={i} className="rounded-2xl border border-white/10 p-4">
                              <Champ
                                libelle="Titre"
                                valeur={it.titre}
                                onChange={(v) => {
                                  const l = structuredClone(items);
                                  l[i].titre = v;
                                  majPage(l);
                                }}
                              />
                              <Champ
                                className="mt-3"
                                libelle="Texte"
                                large
                                valeur={it.texte}
                                onChange={(v) => {
                                  const l = structuredClone(items);
                                  l[i].texte = v;
                                  majPage(l);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Champ
                      key={ch.cle}
                      libelle={ch.libelle}
                      aide={ch.aide}
                      large={ch.type === 'bloc'}
                      valeur={(valeur as string) ?? ''}
                      onChange={majPage}
                    />
                  );
                })}
              </section>
            ))}
          </div>
        )}

        {/* ---- coordonnees --------------------------------------------- */}
        {onglet === 'coordonnees' && coord && (
          <section className={`${cadre} mt-8 grid gap-5 sm:grid-cols-2`}>
            {CHAMPS_COORDONNEES.map((c) => (
              <Champ
                key={c.cle}
                libelle={c.libelle}
                aide={c.aide}
                valeur={coord.donnees[c.cle] ?? ''}
                onChange={(v) =>
                  setCoord({ ...coord, donnees: { ...coord.donnees, [c.cle]: v } })
                }
                className={c.cle === 'hebergeur' ? 'sm:col-span-2' : ''}
                large={c.cle === 'hebergeur'}
              />
            ))}
          </section>
        )}
      </div>

      {/* ---- barre d'enregistrement ------------------------------------ */}
      {(modifie || enregistre) && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-5 py-4 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            {enregistre ? (
              <p className="flex items-center gap-2.5 text-sm font-light text-white/80">
                <Check className="h-5 w-5 shrink-0 text-amber" />
                Enregistré. Votre site se met à jour tout seul, comptez une minute.
              </p>
            ) : (
              <>
                <p className="text-sm font-light text-white/70">
                  Vous avez des modifications non enregistrées.
                </p>
                <button
                  type="button"
                  onClick={enregistrer}
                  disabled={envoi}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.03] disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {envoi ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
