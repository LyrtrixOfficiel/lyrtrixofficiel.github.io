/**
 * Lecture et ecriture des contenus de l'espace d'edition.
 *
 * Remplace Git Gateway, qui exige une configuration Netlify fragile (il faut
 * l'activer *apres* avoir relie le depot, sans quoi il repond « Operator
 * microservice headers missing »). Ici, tout le chemin est explicite :
 *
 *   navigateur ──jeton Identity──> cette fonction ──jeton GitHub──> GitHub
 *
 * Le jeton GitHub vit dans une variable d'environnement du site : il ne quitte
 * jamais le serveur. Le navigateur ne presente que son jeton Identity, verifie
 * a chaque appel aupres d'Identity lui-meme.
 *
 * Seuls les quatre fichiers de contenu sont accessibles : meme avec un compte
 * valide, on ne peut pas ecrire ailleurs dans le depot.
 */

export const config = { path: '/api/contenu' };

const DEPOT = 'LyrtrixOfficiel/energie-et-bien-etre';
const BRANCHE = 'main';

const AUTORISES = new Set([
  'content/tarifs.json',
  'content/soins.json',
  'content/coordonnees.json',
  'content/textes.json',
]);

const json = (donnees, statut = 200) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/** Renvoie l'utilisateur Identity, ou null si le jeton ne vaut rien. */
async function utilisateur(requete) {
  const autorisation = requete.headers.get('authorization') || '';
  if (!/^Bearer \S+$/.test(autorisation)) return null;
  try {
    const r = await fetch(`${process.env.URL}/.netlify/identity/user`, {
      headers: { Authorization: autorisation },
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const github = (chemin, options = {}) =>
  fetch(`https://api.github.com/repos/${DEPOT}/contents/${chemin}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.JETON_GITHUB}`,
      'User-Agent': 'energie-et-bien-etre',
      ...(options.headers || {}),
    },
  });

export default async function (requete) {
  /* L'authentification passe avant tout le reste : un inconnu ne doit rien
     apprendre de la configuration du site. */
  const u = await utilisateur(requete);
  if (!u) return json({ msg: 'SESSION_EXPIREE' }, 401);

  if (!process.env.JETON_GITHUB) {
    return json({ msg: "Le jeton GitHub n'est pas configuré sur le site." }, 500);
  }

  const chemin = new URL(requete.url).searchParams.get('chemin') || '';
  if (!AUTORISES.has(chemin)) return json({ msg: 'Fichier non autorisé.' }, 403);

  if (requete.method === 'GET') {
    const r = await github(`${chemin}?ref=${BRANCHE}`);
    if (!r.ok) {
      return json({ msg: `Lecture refusée par GitHub (${r.status}).` }, 502);
    }
    const meta = await r.json();
    return json({ contenu: meta.content, sha: meta.sha });
  }

  if (requete.method === 'PUT') {
    const corps = await requete.json().catch(() => null);
    if (!corps?.contenu || !corps?.sha) return json({ msg: 'Requête incomplète.' }, 400);

    /* Signer le commit au nom de Brigitte rend l'historique lisible : on voit
       qui a change quoi, et depuis quand. */
    const auteur = u.email
      ? { name: u.user_metadata?.full_name || u.email, email: u.email }
      : undefined;

    const r = await github(chemin, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: corps.message || 'Mise à jour du contenu',
        content: corps.contenu,
        sha: corps.sha,
        branch: BRANCHE,
        ...(auteur ? { committer: auteur, author: auteur } : {}),
      }),
    });

    /* 409 : quelqu'un a modifie le fichier entre la lecture et l'ecriture. */
    if (r.status === 409) return json({ msg: 'CONFLIT' }, 409);
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return json(
        { msg: `Écriture refusée par GitHub (${r.status}). ${detail.slice(0, 200)}` },
        502,
      );
    }
    const resultat = await r.json();
    return json({ sha: resultat.content.sha });
  }

  return json({ msg: 'Méthode non gérée.' }, 405);
}
