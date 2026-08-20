/**
 * Le moteur des pages de brasserie.
 *
 * Repris du moteur des vitrines, avec une correction qui compte : LE MOUVEMENT
 * ET LE CURSEUR SONT DEUX CHOSES DIFFERENTES.
 *
 * Mesure faite sur le lot precedent, dans un navigateur ou la preference
 * « moins d'animations » est active : `curseur: false`, defilement amorti
 * coupe, apparitions coupees, piece maitresse tombee de trois ecrans a un
 * demi. Tout etait gouverne par le meme interrupteur, et la page devenait un
 * document. C'est tres probablement ce que Matheo a vu, et il a eu raison de
 * dire qu'il n'y avait rien.
 *
 * On distingue donc :
 *   - le MOUVEMENT (defilement amorti, parallaxe, apparitions, construction du
 *     quartier), qui se coupe : c'est ce que la preference demande ;
 *   - le CURSEUR, qui ne bouge que parce que la main bouge, et qui reste ;
 *   - le CONTENU, qui ne se coupe jamais.
 */
import { monterLeQuartier } from './quartier.js';

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const borne = (v, a, b) => Math.min(b, Math.max(a, v));

const sobre = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;

const glisse = { actif: false, y: 0, cible: 0, max: 0, vitesse: 0, boite: null };
const abonnes = [];
const auDefilement = (fn) => { abonnes.push(fn); fn(0, 0, 0); return fn; };

/* ══ 1. Le seuil ═══════════════════════════════════════════════════════
   Il ne s'affiche que si le mouvement est permis : un rideau qui ne se leve
   pas est un mur. Et il ne retient jamais la page plus d'une seconde et demie,
   meme si une image manque. */
function monterLeSeuil() {
  const s = $('.seuil');
  if (!s) return;
  if (sobre) { s.remove(); return; }
  const partir = () => { s.dataset.parti = 'oui'; setTimeout(() => s.remove(), 800); };
  setTimeout(partir, 1600);
  addEventListener('pointerdown', partir, { once: true });
}

/* ══ 2. Le defilement amorti ═══════════════════════════════════════════ */
function monterLeDefilement() {
  const boite = $('#defile');
  if (!boite) return;
  glisse.boite = boite;
  glisse.actif = !tactile && !sobre;
  if (!glisse.actif) { boite.dataset.natif = 'oui'; return; }

  const mesurer = () => {
    const h = boite.getBoundingClientRect().height;
    document.body.style.height = h + 'px';
    glisse.max = Math.max(0, h - innerHeight);
  };
  mesurer();
  new ResizeObserver(mesurer).observe(boite);
  addEventListener('resize', mesurer);
}

let dernierY = 0, dernierTemps = 0;

function pas(force) {
  const brut = force !== undefined ? force : (scrollY || document.documentElement.scrollTop);
  const maintenant = performance.now();
  let dt = dernierTemps ? (maintenant - dernierTemps) / 1000 : 1 / 60;
  dernierTemps = maintenant;
  dt = Math.min(dt, 1 / 20);

  if (glisse.actif) {
    glisse.cible = brut;
    /* L'amortissement depend du TEMPS, pas du nombre d'images : sinon il
       rattrape deux fois plus vite a 120 Hz qu'a 60, et une image sautee se
       voit comme une marche. */
    const k = 1 - Math.pow(1 - 0.14, dt * 60);
    glisse.y += (glisse.cible - glisse.y) * k;
    if (Math.abs(glisse.cible - glisse.y) < 0.06) glisse.y = glisse.cible;
    glisse.boite.style.transform = `translate3d(0,${-(Math.round(glisse.y * 2) / 2)}px,0)`;
  } else {
    glisse.y = brut;
    glisse.max = Math.max(0, document.body.scrollHeight - innerHeight);
  }

  glisse.vitesse = glisse.y - dernierY;
  dernierY = glisse.y;
  const p = glisse.max > 0 ? borne(glisse.y / glisse.max, 0, 1) : 0;
  for (const fn of abonnes) fn(glisse.y, p, glisse.vitesse);
}

/* ══ 3. Apparitions ════════════════════════════════════════════════════
   Calculees dans la boucle, pas dans un IntersectionObserver : l'observateur
   ne repond pas dans un document non compose, et toute la page resterait a
   opacite zero dans un navigateur pilote. */
function monterLesApparitions() {
  if (sobre) return;
  let restants = $$('[data-vient]');
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

/* ══ 4. Le curseur ═════════════════════════════════════════════════════
   IL RESTE EN MODE SOBRE. Il ne se deplace que parce que la main se deplace :
   il ne produit aucun mouvement que le visiteur n'a pas commande. Ce qu'on
   enleve en sobre, c'est le retard : il colle au pointeur au lieu de le
   suivre en douceur. */
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
    const k = sobre ? 1 : 0.2;
    cx += (x - cx) * k; cy += (y - cy) * k;
    c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    requestAnimationFrame(tour);
  };
  tour();
}

/* ══ 5. Les aimants ════════════════════════════════════════════════════ */
function monterLesAimants() {
  if (tactile || sobre) return;
  for (const b of $$('[data-aimant]')) {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.26).toFixed(1)}px,`
        + `${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  }
}

/* ══ 6. Le compteur ════════════════════════════════════════════════════
   Leur nombre d'abonnes monte de zero jusqu'a sa valeur quand il entre dans
   l'ecran. En sobre il est ecrit d'emblee : un chiffre qui defile est du
   mouvement, et c'est justement ce qu'on nous demande de couper. */
function monterLeCompteur() {
  const el = $('[data-compte]');
  if (!el) return;
  const cible = Number(el.dataset.compte);
  if (!Number.isFinite(cible)) return;
  const ecrire = (v) => { el.textContent = Math.round(v).toLocaleString('fr-FR'); };
  if (sobre) { ecrire(cible); return; }
  ecrire(0);
  let lance = false;
  auDefilement(() => {
    if (lance) return;
    const r = el.getBoundingClientRect();
    if (r.top > innerHeight * 0.85) return;
    lance = true;
    const debut = performance.now();
    const tour = () => {
      const t = borne((performance.now() - debut) / 1400, 0, 1);
      ecrire(cible * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tour);
    };
    tour();
  });
}

/* ══ 7. Le quartier ════════════════════════════════════════════════════ */
async function monterLeQuartierSiPresent() {
  const toile = $('#quartier');
  if (!toile) return;
  const rep = await fetch(toile.dataset.releve).catch(() => null);
  if (!rep?.ok) { toile.closest('.quartier')?.remove(); return; }
  const q = await rep.json().catch(() => null);
  if (!q) return;

  const s = getComputedStyle(document.body);
  const lire = (n) => s.getPropertyValue(n).trim();
  const vue = monterLeQuartier(toile, q, {
    accent: lire('--vif'), trait: lire('--trait-plan'), mur: lire('--mur'),
    murSien: lire('--mur-sien'), toit: lire('--toit'), eau: lire('--eau'),
  });
  if (!vue) return;

  /* Il se construit pendant qu'on le traverse. En sobre il est deja bati : le
     dessin complet est le CONTENU, sa construction n'etait que l'animation. */
  if (sobre) { vue.avance(1); return; }
  auDefilement(() => {
    const r = toile.getBoundingClientRect();
    vue.avance(borne(1.25 - r.top / innerHeight, 0, 1));
  });
}

/* ══ Demarrage ═════════════════════════════════════════════════════════ */
function demarrer() {
  monterLeSeuil();
  monterLeDefilement();
  monterLesApparitions();
  monterLeCurseur();
  monterLesAimants();
  monterLeCompteur();
  monterLeQuartierSiPresent();

  const battre = () => { pas(); requestAnimationFrame(battre); };
  battre();
  document.documentElement.dataset.pret = 'oui';
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', demarrer);
else demarrer();

window.brasserie = { pas, glisse, sobre, tactile };
