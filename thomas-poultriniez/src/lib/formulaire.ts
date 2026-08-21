/**
 * Envoi du formulaire de contact.
 *
 * ⚠ Ce fichier venait du site de Brigitte, ou le mode `duda` rejouait le
 * formulaire de son Duda vers SON domaine. Laisse tel quel, les messages des
 * visiteurs de Matthieu seraient partis chez elle. Le mode est donc `netlify`
 * et les jetons Duda ont ete retires.
 *
 * Il reste UNE chose a faire avant la mise en ligne reelle : renseigner son
 * adresse dans Netlify → Forms → Notifications, sinon les messages arrivent
 * bien mais personne n'est prevenu.
 *
 * Ancien commentaire, conserve pour memoire :
 * Le site d'origine etait un Duda. Son formulaire n'avait pas d'attribut `action` :
 * c'est le script Duda qui poste vers la valeur du champ cache `action`,
 * c'est-a-dire `/_dm/s/rt/widgets/dmform.submit.jsp`, sur son propre domaine.
 * L'adresse de destination est **chiffree** dans `dmformsendto` : elle n'est
 * pas lisible, mais elle n'a pas besoin de l'etre — il suffit de la renvoyer
 * telle quelle.
 *
 * Trois modes, un seul a choisir dans `MODE` :
 *
 * - `duda`    — on rejoue exactement le formulaire d'origine, vers l'endpoint
 *   d'origine. **Rien a configurer, les messages arrivent la ou ils arrivent
 *   aujourd'hui.** Une soumission de formulaire HTML n'est pas soumise au CORS
 *   (seule la *lecture* de la reponse l'est), donc on poste dans une iframe
 *   cachee et on considere l'envoi fait au chargement de celle-ci.
 *   ⚠ Ne fonctionne que tant que le site Duda reste en ligne. Le jour ou il
 *   est remplace sur le meme domaine, l'endpoint disparait : passer en
 *   `netlify`.
 *
 * - `netlify` — Netlify detecte le formulaire statique de `public/__forms.html`
 *   au deploiement et collecte les messages. Brigitte renseigne son adresse
 *   une fois dans Netlify (Notifications → Form submission notifications).
 *
 * - `endpoint` — tout autre hebergeur : Formspree, Basin, Web3Forms.
 */

export const MODE: 'duda' | 'netlify' | 'endpoint' = 'netlify';

/** Utilise uniquement si MODE === 'endpoint'. */
export const ENDPOINT = '';

/** Doit rester identique au `name` du formulaire de `public/__forms.html`. */
export const NOM_FORMULAIRE = 'contact';

/**
 * Les champs releves sur le formulaire de brigitte-baradel.fr le 3 aout 2026.
 * Les jetons sont opaques : ils encodent le destinataire et la configuration
 * du formulaire cote Duda. On les renvoie tels quels, sans chercher a les lire.
 */
export const DUDA = {
  endpoint: '',
  caches: {} as Record<string, string>,
  champs: { nom: 'nom', email: 'email', telephone: 'telephone', message: 'message' },
} as const;

export type Message = {
  nom: string;
  email: string;
  telephone: string;
  message: string;
  /** piege a robots : rempli = on jette */
  piege: string;
};

export type Resultat = { ok: true } | { ok: false; raison: 'config' | 'reseau' | 'refus' };

/** Utilise par les modes `netlify` et `endpoint`. Le mode `duda` poste
 *  nativement depuis le composant, sans passer par `fetch`. */
export async function envoyer(m: Message): Promise<Resultat> {
  /* Un robot a rempli le champ cache : on fait comme si tout allait bien,
     mais rien n'est envoye. */
  if (m.piege.trim() !== '') return { ok: true };

  if (MODE === 'endpoint' && !ENDPOINT) return { ok: false, raison: 'config' };

  try {
    if (MODE === 'netlify') {
      const corps = new URLSearchParams({
        'form-name': NOM_FORMULAIRE,
        nom: m.nom,
        email: m.email,
        telephone: m.telephone,
        message: m.message,
        'bot-field': '',
      });
      const r = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: corps.toString(),
      });
      return r.ok ? { ok: true } : { ok: false, raison: 'refus' };
    }

    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        nom: m.nom,
        email: m.email,
        telephone: m.telephone,
        message: m.message,
      }),
    });
    return r.ok ? { ok: true } : { ok: false, raison: 'refus' };
  } catch {
    return { ok: false, raison: 'reseau' };
  }
}
