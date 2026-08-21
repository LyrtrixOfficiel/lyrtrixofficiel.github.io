import { useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, Check, Phone, Send } from 'lucide-react';
import { DUDA, envoyer, MODE, NOM_FORMULAIRE } from '../lib/formulaire';
import { SITE } from '../lib/site';

type Etat = 'repos' | 'envoi' | 'ok' | 'erreur';

const CHAMPS = [
  { cle: 'nom', label: 'Nom', type: 'text', auto: 'name', requis: true },
  { cle: 'email', label: 'Adresse e-mail', type: 'email', auto: 'email', requis: true },
  { cle: 'telephone', label: 'Numéro de téléphone', type: 'tel', auto: 'tel', requis: false },
] as const;

/**
 * Les quatre champs du formulaire d'origine, dans le meme ordre et sous les
 * memes intitules : Nom, Adresse e-mail, Numéro de téléphone, Message.
 *
 * En mode `duda`, le navigateur poste nativement vers l'endpoint du site
 * actuel, dans une iframe cachee : le message part exactement la ou il part
 * aujourd'hui, sans aucune configuration. On ne peut pas lire la reponse
 * (autre domaine), donc le chargement de l'iframe vaut accuse de reception.
 *
 * Dans les autres modes, envoi par `fetch` avec gestion d'erreur explicite.
 * Dans tous les cas, si ca echoue, les champs restent remplis et le telephone
 * est propose : un message n'est jamais perdu en silence.
 */
export default function Formulaire() {
  const [etat, setEtat] = useState<Etat>('repos');
  const [raison, setRaison] = useState('');
  const attente = useRef(false);

  /* --- mode duda : soumission native ---------------------------------- */
  const surChargementCadre = () => {
    if (!attente.current) return; // le premier load est celui de about:blank
    attente.current = false;
    setEtat('ok');
  };

  const surSoumissionNative = () => {
    attente.current = true;
    setEtat('envoi');
    /* filet : si l'iframe ne charge jamais, on ne laisse pas l'utilisateur
       bloque sur « Envoi en cours » */
    window.setTimeout(() => {
      if (attente.current) {
        attente.current = false;
        setEtat('erreur');
        setRaison("L'envoi n'a pas abouti.");
      }
    }, 12000);
  };

  /* --- autres modes : fetch -------------------------------------------- */
  const soumettreParFetch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEtat('envoi');
    const r = await envoyer({
      nom: String(f.get('nom') ?? ''),
      email: String(f.get('email') ?? ''),
      telephone: String(f.get('telephone') ?? ''),
      message: String(f.get('message') ?? ''),
      piege: String(f.get('bot-field') ?? ''),
    });
    if (r.ok) {
      setEtat('ok');
      return;
    }
    setEtat('erreur');
    setRaison(
      r.raison === 'config'
        ? "Le formulaire n'est pas encore relié à une boîte mail."
        : r.raison === 'reseau'
          ? 'La connexion a échoué.'
          : "L'envoi a été refusé.",
    );
  };

  if (etat === 'ok') {
    return (
      <div className="liquid-glass rounded-[1.5rem] p-8 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/15">
          <Check className="h-7 w-7 text-amber" />
        </span>
        <p className="mt-6 font-display text-3xl text-white sm:text-4xl">Message envoyé.</p>
        <p className="mx-auto mt-4 max-w-xs text-sm font-light leading-relaxed text-white/70">
          Merci. Je vous réponds dès que possible. Pour une demande urgente, le téléphone reste le
          plus rapide.
        </p>
        <a
          href={SITE.telephoneLien}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04]"
        >
          <Phone className="h-4 w-4" />
          {SITE.telephone}
        </a>
      </div>
    );
  }

  const duda = MODE === 'duda';
  const nomChamp = (cle: 'nom' | 'email' | 'telephone' | 'message') =>
    duda ? DUDA.champs[cle] : cle;

  return (
    <div className="liquid-glass rounded-[1.5rem] p-6 sm:p-8">
      <p className="text-xs font-light tracking-wide text-white/60">
        <span className="text-amber">//</span> Formulaire de contact
      </p>
      <p className="mt-4 font-display text-3xl leading-[1.05] text-white sm:text-4xl">
        Dites-moi ce qui vous amène.
      </p>

      {duda && (
        <iframe
          name="cadre-envoi"
          title="Envoi du formulaire"
          onLoad={surChargementCadre}
          className="hidden"
          aria-hidden="true"
        />
      )}

      <form
        name={NOM_FORMULAIRE}
        method="post"
        action={duda ? DUDA.endpoint : undefined}
        target={duda ? 'cadre-envoi' : undefined}
        onSubmit={duda ? surSoumissionNative : soumettreParFetch}
        className="mt-7 space-y-5"
      >
        {/* les jetons du formulaire d'origine, renvoyes tels quels */}
        {duda &&
          Object.entries(DUDA.caches).map(([n, v]) => (
            <input key={n} type="hidden" name={n} value={v} readOnly />
          ))}

        {/* piege a robots — jamais visible, jamais atteint au clavier */}
        <p className="hidden" aria-hidden="true">
          <label>
            Ne pas remplir
            <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </p>

        {CHAMPS.map((c) => (
          <label key={c.cle} className="block">
            <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
              {c.label}
              {c.requis && <span className="text-amber"> *</span>}
            </span>
            <input
              type={c.type}
              name={nomChamp(c.cle)}
              required={c.requis}
              autoComplete={c.auto}
              disabled={etat === 'envoi'}
              className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-[15px] font-light text-white outline-none transition-colors placeholder:text-white/25 focus:border-amber/70 disabled:opacity-60"
            />
          </label>
        ))}

        <label className="block">
          <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/50">
            Message<span className="text-amber"> *</span>
          </span>
          <textarea
            name={nomChamp('message')}
            required
            rows={5}
            disabled={etat === 'envoi'}
            className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-[15px] font-light leading-relaxed text-white outline-none transition-colors placeholder:text-white/25 focus:border-amber/70 disabled:opacity-60"
          />
        </label>

        {etat === 'erreur' && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-ember/45 bg-ember/10 px-4 py-3 text-sm font-light leading-relaxed text-white/85"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-soft" />
            <span>
              {raison} Votre message est toujours là, vous pouvez réessayer — ou m'appeler
              directement au{' '}
              <a href={SITE.telephoneLien} className="text-amber underline">
                {SITE.telephone}
              </a>
              .
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={etat === 'envoi'}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.02] disabled:scale-100 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {etat === 'envoi' ? 'Envoi en cours…' : 'Envoyer le message'}
        </button>

        <p className="text-xs font-light leading-relaxed text-white/45">
          Les champs marqués d'un astérisque sont nécessaires pour vous répondre. Vos coordonnées
          personnelles ne sont pas collectées et ne seront en aucun cas divulguées à des tiers. Pour
          une réponse immédiate, le téléphone reste le plus simple :{' '}
          <a href={SITE.telephoneLien} className="text-amber hover:underline">
            {SITE.telephone}
          </a>
          .
        </p>
      </form>
    </div>
  );
}
