/**
 * Le moteur des pages de brasserie.
 *
 * TROIS CHOSES QUI ETAIENT SUR LE MEME INTERRUPTEUR, ET QUI N'AURAIENT JAMAIS
 * DU L'ETRE. Mesure faite sur le lot precedent, dans un navigateur ou la
 * preference « moins d'animations » est active : `curseur: false`, defilement
 * amorti coupe, apparitions coupees, piece maitresse tombee de trois ecrans a
 * un demi. La page devenait un document, et c'est tres probablement ce que
 * Matheo a vu quand il a dit qu'il n'y avait rien.
 *
 *   le MOUVEMENT   se coupe : c'est ce que la preference demande ;
 *   le CURSEUR     reste : il ne bouge que parce que la main bouge ;
 *   le CONTENU     ne se coupe jamais.
 *
 * Et comme sur le site de Stephane, on le DIT : une banniere propose de rendre
 * les animations pour cette page. Le visiteur decide.
 */
import { monterLeQuartier } from './quartier.js';

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const borne = (v, a, b) => Math.min(b, Math.max(a, v));

const tactile = matchMedia('(hover: none)').matches;
const demande = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* `anime` peut redevenir vrai si le visiteur clique « les activer ». */
let anime = !demande;

const abonnes = [];
const auDefilement = (fn) => { abonnes.push(fn); fn(0, 0); return fn; };

/* ══ 1. La banniere ════════════════════════════════════════════════════ */
function monterLAvis() {
  const a = $('.avis');
  if (!a) return;
  if (!demande) { a.remove(); return; }
  a.hidden = false;
  $('[data-activer]', a)?.addEventListener('click', () => {
    anime = true;
    document.documentElement.dataset.anime = 'oui';
    a.remove();
    /* Le fond etait fige sur son image : on lui rend sa video. */
    $('.encre video')?.play?.().catch(() => {});
    monterLeCompteur(true);
  });
  $('[data-refuser]', a)?.addEventListener('click', () => a.remove());
}

/* ══ 2. La barre ═══════════════════════════════════════════════════════
   Elle se retire quand on descend et revient quand on remonte : c'est la
   convention, et elle rend l'ecran aux pages qui ont quelque chose a montrer. */
function monterLaBarre() {
  const b = $('.barre');
  if (!b) return;
  let dernier = 0;
  auDefilement((y) => {
    b.dataset.cachee = (y > 260 && y > dernier) ? 'oui' : 'non';
    dernier = y;
  });
}

/* ══ 3. Apparitions ════════════════════════════════════════════════════
   Calculees dans la boucle, pas dans un IntersectionObserver : l'observateur
   ne repond pas dans un document non compose, et la page resterait vide dans
   un navigateur pilote. */
function monterLesApparitions() {
  let restants = $$('[data-vient]');
  if (!anime) { for (const el of restants) el.dataset.vu = 'oui'; return; }
  auDefilement(() => {
    if (!restants.length) return;
    const h = innerHeight;
    restants = restants.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > h * 0.9 || r.bottom < 0) return true;
      el.dataset.vu = 'oui';
      return false;
    });
  });
}

/* ══ 4. Le curseur ═════════════════════════════════════════════════════ */
function monterLeCurseur() {
  if (tactile) return;
  const c = document.createElement('div');
  c.className = 'curseur';
  document.body.appendChild(c);
  document.documentElement.dataset.curseur = 'oui';
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  for (const el of $$('a, button')) {
    el.addEventListener('pointerenter', () => { c.dataset.pris = 'oui'; });
    el.addEventListener('pointerleave', () => { c.dataset.pris = 'non'; });
  }
  const tour = () => {
    const k = anime ? 0.2 : 1;
    cx += (x - cx) * k; cy += (y - cy) * k;
    c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    requestAnimationFrame(tour);
  };
  tour();
}

/* ══ 5. Le compteur ════════════════════════════════════════════════════ */
let compteurLance = false;
function monterLeCompteur(force) {
  const el = $('[data-compte]');
  if (!el) return;
  const cible = Number(el.dataset.compte);
  if (!Number.isFinite(cible)) return;
  const ecrire = (v) => { el.textContent = Math.round(v).toLocaleString('fr-FR'); };
  if (!anime && !force) { ecrire(cible); return; }
  if (compteurLance) return;

  const partir = () => {
    if (compteurLance) return;
    compteurLance = true;
    const debut = performance.now();
    const tour = () => {
      const t = borne((performance.now() - debut) / 1500, 0, 1);
      ecrire(cible * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tour);
    };
    tour();
  };

  if (force) { partir(); return; }
  ecrire(0);
  auDefilement(() => {
    if (compteurLance) return;
    if (el.getBoundingClientRect().top < innerHeight * 0.85) partir();
  });
}

/* ══ 6. La parallaxe de l'encre ════════════════════════════════════════
   Le fond derive un peu plus lentement que la page. C'est ce decalage, et
   rien d'autre, qui fait sentir que le contenu FLOTTE sur l'encre. */
function monterLaDerive() {
  const e = $('.encre');
  if (!e || !anime) return;
  auDefilement((y) => { e.style.transform = `translate3d(0,${(y * 0.14).toFixed(1)}px,0) scale(1.12)`; });
}

/* ══ 7. Le quartier ════════════════════════════════════════════════════ */
async function monterLeQuartierSiPresent() {
  const toile = $('#quartier');
  if (!toile) return;
  const rep = await fetch(toile.dataset.releve).catch(() => null);
  if (!rep?.ok) { toile.closest('section')?.remove(); return; }
  const q = await rep.json().catch(() => null);
  if (!q) return;
  const s = getComputedStyle(document.body);
  const lire = (n) => s.getPropertyValue(n).trim();
  const vue = monterLeQuartier(toile, q, {
    accent: lire('--vif'), trait: lire('--trait-plan'), mur: lire('--mur'),
    murSien: lire('--mur-sien'), toit: lire('--toit'), eau: lire('--eau'),
  });
  if (!vue) return;
  if (!anime) { vue.avance(1); return; }
  auDefilement(() => {
    const r = toile.getBoundingClientRect();
    vue.avance(borne(1.25 - r.top / innerHeight, 0, 1));
  });
}

/* ══ La boucle ═════════════════════════════════════════════════════════ */
function pas() {
  const y = scrollY || document.documentElement.scrollTop;
  for (const fn of abonnes) fn(y, 0);
}

function demarrer() {
  monterLAvis();
  monterLaBarre();
  monterLesApparitions();
  monterLeCurseur();
  monterLeCompteur();
  monterLaDerive();
  monterLeQuartierSiPresent();
  const battre = () => { pas(); requestAnimationFrame(battre); };
  battre();
  document.documentElement.dataset.pret = 'oui';
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', demarrer);
else demarrer();

window.brasserie = { pas, get anime() { return anime; }, tactile, demande };
