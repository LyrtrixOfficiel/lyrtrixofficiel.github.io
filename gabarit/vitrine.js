/**
 * LE MOTEUR DES VITRINES.
 *
 * Repris de site-kazura/js/kazura.js, reduit a ce qu'une page de demonstration
 * peut porter : un seul fichier, aucune dependance, aucun reseau. Les pieces
 * gardees sont celles qui font qu'une page « coute cher » a l'oeil, et chacune
 * a paye son ticket d'entree ailleurs.
 *
 * CE QUI EST GARDE, ET POURQUOI
 *   - le defilement amorti : c'est LE signal. Une page qui glisse ne ressemble
 *     a aucun site de menuisier.
 *   - le titre geant cale a la colonne, par l'axe de chasse de la fonte. Le nom
 *     du commerce remplit sa ligne au pixel, quel que soit sa longueur.
 *   - la decoupe en lettres et la montee en cascade.
 *   - l'epinglage par transformation, avec avancement de 0 a 1.
 *   - les aimants et le curseur.
 *   - l'inclinaison des cartes.
 *
 * CE QUI EST JETE : la 3D, le fluide, le son, les transitions de page. Une
 * maquette de demonstration s'ouvre une fois, sur un telephone, pendant un
 * appel. Trois cents kilo-octets de moteur graphique la tueraient.
 *
 * REGLE DE SURVIE : sans ce script, la page reste lisible et complete. Tout ce
 * qui est ici est un ajout, jamais une condition.
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

/* ══ 1. Le defilement amorti ═══════════════════════════════════════════
   Le contenu vit dans #defile, qu'on translate. Le corps ne sert plus qu'a
   donner la hauteur de barre. Sur telephone et en mode sobre, on ne detourne
   rien : le defilement natif y est meilleur que tout ce qu'on peut ecrire. */
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

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const cible = $(a.getAttribute('href'));
    if (!cible) return;
    e.preventDefault();
    scrollTo({ top: cible.getBoundingClientRect().top + glisse.y, behavior: 'auto' });
  }));
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
    /* L'amortissement depend du TEMPS, pas du nombre d'images : sans ca le
       rattrapage va deux fois plus vite a 120 Hz qu'a 60, et une image sautee
       se voit comme une marche. */
    const k = 1 - Math.pow(1 - 0.14, dt * 60);
    glisse.y += (glisse.cible - glisse.y) * k;
    if (Math.abs(glisse.cible - glisse.y) < 0.06) glisse.y = glisse.cible;
    /* Arrondi au demi-pixel : une translation fractionnaire fait rechantillonner
       le texte a chaque image, et ca tremble sur un ecran non retina. */
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

/* ══ 2. Le titre geant ═════════════════════════════════════════════════

   IL N'EST PLUS CALE ICI. Le calcul est passe DANS LE GENERATEUR, et ce n'est
   pas un renoncement : c'est ce que trois mesures ont impose.

   Kazura cale ses geants sur l'axe de chasse de la fonte, `font-stretch` de 62
   a 125 %. Mesure faite : sur ce moteur, `font-stretch` est rejete, en
   pourcentage comme en mot-clef, et la largeur du texte ne bouge pas d'un
   pixel. `font-variation-settings` fait pire : des qu'on le pose, la fonte
   variable est abandonnee pour le repli systeme.

   Rabattu sur le corps, le calage marchait au premier passage puis rendait des
   valeurs incoherentes : `element.style.fontSize` a 256 px et un calcule a 134,
   sur la meme ligne, dans un Chrome sans tete comme dans le panneau.

   Trois procedes essayes, trois impasses de moteur. La bonne reponse n'etait
   pas d'en essayer un quatrieme : c'etait d'arreter de mesurer. Le nombre de
   signes d'un nom se connait a la construction, et la largeur d'une capitale de
   grotesque est stable a quelques pour cent. Une division suffit, elle tombe
   dans le HTML, et plus rien ne peut la contredire au chargement.

   CE QU'ON PERD : le pixel exact. CE QU'ON GAGNE : le meme rendu partout, sans
   saut au chargement des fontes, sans une ligne de script. */

/* ══ 3. Decoupe en lettres et apparitions ══════════════════════════════ */
function decouper(el) {
  if (el.dataset.decoupe === 'oui') return;
  /* Un geant cale sur deux lignes porte ses lignes dans des spans, chacune avec
     sa propre taille. On decoupe DANS chaque ligne, sinon on ecraserait la
     structure et les deux tailles avec elle. */
  const lignes = Array.from(el.children).filter((c) => c.classList.contains('ligne'));
  if (lignes.length) {
    el.dataset.decoupe = 'oui';
    let total = 0;
    for (const l of lignes) { decouper(l); total += Number(l.style.getPropertyValue('--n')) || 0; }
    el.style.setProperty('--n', total);
    return;
  }
  const texte = el.textContent;
  el.textContent = '';
  el.dataset.decoupe = 'oui';
  let n = 0;
  texte.trim().split(/(\s+)/).forEach((bout) => {
    /* On remet l'espacement EXACT, pas une espace normalisee. Un titre cale sur
       deux lignes porte un vrai saut de ligne dans son texte ; le remplacer par
       une espace collait les deux moities : « RJ MOTOSSPORT » au lieu de
       « RJ Motos / Sport ». Vu sur capture, invisible dans les chiffres. */
    if (/^\s+$/.test(bout)) { el.appendChild(document.createTextNode(bout)); return; }
    const mot = document.createElement('span');
    mot.className = 'mot';
    [...bout].forEach((c) => {
      const l = document.createElement('span');
      l.className = 'lettre';
      l.textContent = c;
      l.style.setProperty('--i', n++);
      mot.appendChild(l);
    });
    el.appendChild(mot);
  });
  el.style.setProperty('--n', n);
}

/* Le calcul se fait dans la boucle, pas dans un IntersectionObserver.
   L'observateur ne repond pas dans un document non compose (onglet masque,
   navigateur pilote), ce qui laisserait toute la page a opacite zero. */
function monterLesApparitions() {
  $$('[data-vient]').forEach((el) => { if (el.dataset.vient === 'lettres') decouper(el); });
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

/* ══ 4. Epinglage ══════════════════════════════════════════════════════
   `position: sticky` est inutilisable dans un conteneur translate. On epingle
   par transformation, et SEULEMENT en defilement amorti : en natif, sticky
   travaille sur le compositeur et notre calcul, fait dans un rAF qui arrive
   apres la peinture, se verrait comme un tremblement. */
function monterLEpinglage() {
  $$('[data-epingle]').forEach((zone) => {
    const dedans = $('[data-epingle-contenu]', zone);
    if (!dedans) return;
    if (!glisse.actif) dedans.dataset.colle = 'oui';
    const fenetres = $$('[data-fenetre]', zone).map((el) => {
      const [a, b] = el.dataset.fenetre.split(',').map(Number);
      return { el, a, b };
    });
    auDefilement(() => {
      const r = zone.getBoundingClientRect();
      const course = r.height - innerHeight;
      const avance = borne(-r.top / Math.max(course, 1), 0, 1);
      zone.style.setProperty('--avance', avance.toFixed(4));
      if (glisse.actif) {
        const cale = r.top <= 0 ? (r.bottom >= innerHeight ? -r.top : course) : 0;
        dedans.style.transform = `translate3d(0,${cale.toFixed(1)}px,0)`;
      }
      for (const f of fenetres) f.el.dataset.actif = (avance >= f.a && avance < f.b) ? 'oui' : 'non';
      zone.dispatchEvent(new CustomEvent('avance', { detail: avance }));
    });
  });
}

/* ══ 5. Parallaxe ══════════════════════════════════════════════════════ */
function monterLaParallaxe() {
  const couches = $$('[data-parallaxe]');
  if (!couches.length || sobre) return;
  auDefilement(() => {
    const h = innerHeight;
    couches.forEach((c) => {
      const r = c.parentElement.getBoundingClientRect();
      if (r.bottom < -300 || r.top > h + 300) return;
      const force = parseFloat(c.dataset.parallaxe) || 0.15;
      const centre = r.top + r.height / 2 - h / 2;
      c.style.transform = `translate3d(0,${(-centre * force).toFixed(2)}px,0)`;
    });
  });
}

/* ══ 6. Le bandeau qui reagit a la vitesse ═════════════════════════════
   Il defile tout seul, et le defilement de la page l'accelere ou l'inverse.
   C'est le detail qui fait qu'on croit la page vivante plutot qu'animee. */
function monterLesBandeaux() {
  $$('[data-bandeau]').forEach((b) => {
    const piste = $('.piste', b);
    if (!piste) return;
    let x = 0;
    const base = parseFloat(b.dataset.bandeau) || 0.35;
    auDefilement((y, p, v) => {
      const largeur = piste.scrollWidth / 2 || 1;
      x = (x - base - v * 0.35) % largeur;
      piste.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    });
  });
}

/* ══ 7. Aimants, curseur, inclinaison ══════════════════════════════════ */
function monterLesAimants() {
  if (tactile) return;
  $$('[data-aimant]').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.28;
      const y = (e.clientY - r.top - r.height / 2) * 0.32;
      b.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

function monterLeCurseur() {
  if (tactile || sobre) return;
  const c = document.createElement('div');
  c.className = 'curseur';
  document.body.appendChild(c);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  $$('a, button, [data-aimant]').forEach((el) => {
    el.addEventListener('pointerenter', () => c.dataset.pris = 'oui');
    el.addEventListener('pointerleave', () => c.dataset.pris = 'non');
  });
  const tour = () => {
    cx += (x - cx) * 0.19; cy += (y - cy) * 0.19;
    c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    requestAnimationFrame(tour);
  };
  tour();
}

function monterLesCartes() {
  if (tactile || sobre) return;
  $$('[data-incline]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ══ 8. Le quartier ════════════════════════════════════════════════════ */
async function monterLeQuartierSiPresent() {
  const toile = $('#quartier');
  if (!toile) return;
  const src = toile.dataset.releve;
  const rep = await fetch(src).catch(() => null);
  if (!rep?.ok) { toile.closest('[data-quartier]')?.setAttribute('data-absent', 'oui'); return; }
  const q = await rep.json().catch(() => null);
  if (!q) return;

  const s = getComputedStyle(document.body);
  const vue = monterLeQuartier(toile, q, {
    accent: s.getPropertyValue('--vif').trim(),
    trait: s.getPropertyValue('--trait-plan').trim(),
    mur: s.getPropertyValue('--mur').trim(),
    murSien: s.getPropertyValue('--mur-sien').trim(),
    toit: s.getPropertyValue('--toit').trim(),
    eau: s.getPropertyValue('--eau').trim(),
  });
  if (!vue) return;

  const zone = toile.closest('[data-epingle]');
  if (zone) zone.addEventListener('avance', (e) => vue.avance(e.detail * 1.35));
  else auDefilement(() => {
    const r = toile.getBoundingClientRect();
    vue.avance(1 - (r.top / innerHeight));
  });
}

/* ══ 9. L'heure vraie ══════════════════════════════════════════════════
   Le gabarit calcule deja l'etat d'ouverture. Ici on va plus loin : la page
   prend la lumiere de l'heure qu'il est chez le visiteur. A sept heures elle
   est froide et basse, a midi elle est franche, a vingt-deux heures elle est
   nocturne. Ca ne se remarque pas en trente secondes, et c'est exactement pour
   ca que ca marche : la page a l'air d'etre AU BON MOMENT. */
function monterLHeure() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  /* Une gaussienne autour de midi : 0 la nuit, 1 en plein jour. */
  const jour = Math.exp(-Math.pow((h - 13) / 5.4, 2));
  document.documentElement.style.setProperty('--jour', jour.toFixed(3));
  document.documentElement.dataset.moment = h < 7 ? 'nuit' : h < 11 ? 'matin' : h < 18 ? 'plein' : h < 21 ? 'soir' : 'nuit';
}

/* ══ Demarrage ═════════════════════════════════════════════════════════ */
function demarrer() {
  monterLHeure();
  monterLeDefilement();
  monterLesApparitions();
  monterLEpinglage();
  monterLaParallaxe();
  monterLesBandeaux();
  monterLesAimants();
  monterLeCurseur();
  monterLesCartes();
  monterLeQuartierSiPresent();

  const battre = () => { pas(); requestAnimationFrame(battre); };
  battre();

  document.documentElement.dataset.pret = 'oui';
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', demarrer);
else demarrer();

/* Une porte pour les controles automatiques : un navigateur pilote qui ne
   compose pas rend innerHeight a zero et refuse de defiler. Sans elle, tout
   audit s'arrete a « jamais monte » sur une piece qui marche. */
window.vitrine = { pas, glisse };
