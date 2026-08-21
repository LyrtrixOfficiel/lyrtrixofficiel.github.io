/**
 * Acces a l'espace d'edition.
 *
 * Deux services de Netlify, appeles directement, sans bibliotheque :
 *
 * - **Identity** (`/.netlify/identity`) authentifie Brigitte et renvoie un
 *   jeton JWT. Inscription impossible : le site est en « invitation
 *   uniquement », seul un lien recu par e-mail cree un compte.
 * - **`/api/contenu`** (voir `netlify/functions/contenu.mjs`) lit et ecrit
 *   `content/*.json`. La fonction verifie le jeton Identity, puis parle a
 *   GitHub avec une cle qui reste sur le serveur : le navigateur n'en voit
 *   jamais la couleur.
 *
 * Chaque enregistrement est un commit, donc une reconstruction du site et une
 * ligne d'historique : tout est annulable.
 */

const IDENTITY = '/.netlify/identity';
const CONTENU = '/api/contenu';
/* Le suffixe invalide les sessions creees avant la correction de
   `accepterInvitation` : elles gardaient le jeton d'invitation, qui laisse lire
   mais pas ecrire. Un changement de cle force une reconnexion propre. */
const CLE_SESSION = 'eb-session-2';

export type Session = { jeton: string; email: string; expire: number };

/* --- base64 en UTF-8 ----------------------------------------------------
   `btoa` ne gere que le latin-1 : sans ces deux fonctions, le moindre accent
   casse l'encodage. */

const versBase64 = (texte: string): string => {
  const octets = new TextEncoder().encode(texte);
  let binaire = '';
  for (const o of octets) binaire += String.fromCharCode(o);
  return btoa(binaire);
};

const depuisBase64 = (b64: string): string => {
  const binaire = atob(b64.replace(/\s/g, ''));
  const octets = Uint8Array.from(binaire, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(octets);
};

/* --- session ------------------------------------------------------------- */

export const sessionEnregistree = (): Session | null => {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    if (!brut) return null;
    const s = JSON.parse(brut) as Session;
    return s.expire > Date.now() ? s : null;
  } catch {
    return null;
  }
};

const enregistrerSession = (s: Session) => {
  localStorage.setItem(CLE_SESSION, JSON.stringify(s));
  return s;
};

export const deconnexion = () => localStorage.removeItem(CLE_SESSION);

const depuisReponseJeton = (r: {
  access_token: string;
  expires_in: number;
  email?: string;
}): Session =>
  enregistrerSession({
    jeton: r.access_token,
    email: r.email ?? '',
    /* on retire 60 s de marge pour ne pas expirer en plein enregistrement */
    expire: Date.now() + (r.expires_in - 60) * 1000,
  });

export class ErreurEdition extends Error {}

export async function connexion(email: string, motDePasse: string): Promise<Session> {
  const r = await fetch(`${IDENTITY}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: email,
      password: motDePasse,
    }).toString(),
  });
  if (!r.ok) {
    throw new ErreurEdition(
      r.status === 400 ? 'Adresse ou mot de passe incorrect.' : 'La connexion a échoué.',
    );
  }
  const donnees = await r.json();
  const s = depuisReponseJeton({ ...donnees, email });
  await completerEmail(s);
  return s;
}

/**
 * Premiere venue : le lien recu par e-mail porte un jeton a usage unique.
 *
 * Ce jeton n'est **pas** un jeton de session. Il doit etre echange contre un
 * vrai jeton d'acces via `/verify`. Le conserver tel quel donnait un espace
 * d'edition trompeur : la lecture passait, mais Git Gateway refusait l'ecriture.
 *
 * - invitation : `/verify` pose le mot de passe **et** renvoie le jeton d'acces.
 * - mot de passe oublie : `/verify` ne fait qu'ouvrir la session ; le mot de
 *   passe se pose ensuite par `PUT /user`.
 */
export async function accepterInvitation(
  jetonLien: string,
  motDePasse: string,
  type: 'invitation' | 'recuperation' = 'invitation',
): Promise<Session> {
  const recuperation = type === 'recuperation';
  const r = await fetch(`${IDENTITY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      recuperation
        ? { type: 'recovery', token: jetonLien }
        : { type: 'signup', token: jetonLien, password: motDePasse },
    ),
  });
  if (!r.ok) {
    throw new ErreurEdition(
      "Ce lien n'est plus valable — ils n'ont qu'une seule utilisation. Demandez-en un nouveau.",
    );
  }
  const s = depuisReponseJeton(await r.json());

  if (recuperation) {
    const p = await fetch(`${IDENTITY}/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.jeton}` },
      body: JSON.stringify({ password: motDePasse }),
    });
    if (!p.ok) throw new ErreurEdition("Le nouveau mot de passe n'a pas pu être enregistré.");
  }

  await completerEmail(s);
  return s;
}

async function completerEmail(s: Session) {
  try {
    const r = await fetch(`${IDENTITY}/user`, {
      headers: { Authorization: `Bearer ${s.jeton}` },
    });
    if (r.ok) {
      const u = await r.json();
      if (u.email) enregistrerSession({ ...s, email: u.email });
    }
  } catch {
    /* sans importance : l'e-mail n'est qu'un affichage */
  }
}

/* --- fichiers ------------------------------------------------------------ */

export type Fichier<T> = { donnees: T; sha: string };

/** Message d'erreur renvoye par la fonction, ou un repli lisible. */
async function motif(r: Response, repli: string): Promise<string> {
  try {
    const { msg } = await r.json();
    return typeof msg === 'string' && msg ? msg : repli;
  } catch {
    return repli;
  }
}

export async function lireFichier<T>(chemin: string, s: Session): Promise<Fichier<T>> {
  const r = await fetch(`${CONTENU}?chemin=${encodeURIComponent(chemin)}`, {
    headers: { Authorization: `Bearer ${s.jeton}` },
  });
  if (r.status === 401) throw new ErreurEdition('SESSION_EXPIREE');
  if (!r.ok) throw new ErreurEdition(await motif(r, `Lecture impossible : ${chemin}`));
  const meta = await r.json();
  return { donnees: JSON.parse(depuisBase64(meta.contenu)) as T, sha: meta.sha };
}

/** Renvoie le nouveau sha, a conserver pour l'enregistrement suivant. */
export async function ecrireFichier(
  chemin: string,
  donnees: unknown,
  sha: string,
  message: string,
  s: Session,
): Promise<string> {
  const texte = JSON.stringify(donnees, null, 2) + '\n';
  const r = await fetch(`${CONTENU}?chemin=${encodeURIComponent(chemin)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${s.jeton}`,
    },
    body: JSON.stringify({ message, contenu: versBase64(texte), sha }),
  });
  if (r.status === 401) throw new ErreurEdition('SESSION_EXPIREE');
  if (r.status === 409) {
    throw new ErreurEdition(
      'Le fichier a été modifié ailleurs entre-temps. Rechargez la page avant de réessayer.',
    );
  }
  if (!r.ok) throw new ErreurEdition(await motif(r, "L'enregistrement a échoué."));
  const resultat = await r.json();
  return (resultat?.sha as string) ?? sha;
}
