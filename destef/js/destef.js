/**
 * Le chef d'orchestre du site.
 *
 * Il ne dessine rien lui-même : il allume les pièces l'une après l'autre, et
 * seulement celles dont la page a besoin. Les trois dimensions ne sont
 * chargées que si la page en contient et que la machine peut suivre.
 */

/* L'empreinte posée par le script de publication. Le HTML porte
   `destef.js?v=xxxx`, on la relit sur notre propre adresse et on la repasse à
   tous les imports. Sans cela, l'hébergement peut servir le balisage neuf avec
   l'ancien code : la page se monte à moitié, sans la moindre erreur visible. */
const V = new URL(import.meta.url).search;

const CALME = matchMedia('(prefers-reduced-motion: reduce)');
const html = document.documentElement;

/* ==========================================================================
   1. Le mouvement, et le droit de le refuser
   ========================================================================== */
/* Beaucoup de gens ont coupé les « effets d'animation » dans Windows sans
   savoir que ça se voit sur le web. Ils reçoivent alors un site figé et
   pensent qu'il est cassé. On respecte la préférence par défaut, mais on la
   dit, et on offre de la lever pour cette visite. */

const CHOIX = 'destef-mouvement';
let anime = !CALME.matches;
if (sessionStorage.getItem(CHOIX) === 'oui') anime = true;
if (sessionStorage.getItem(CHOIX) === 'non') anime = false;
html.classList.toggle('anime', anime);

function rappelDeMouvement() {
  if (!CALME.matches || sessionStorage.getItem(CHOIX)) return;
  const barre = document.querySelector('[data-rappel]');
  if (!barre) return;
  barre.hidden = false;
  barre.querySelector('[data-rappel-oui]')?.addEventListener('click', () => {
    sessionStorage.setItem(CHOIX, 'oui');
    location.reload();
  });
  barre.querySelector('[data-rappel-non]')?.addEventListener('click', () => {
    sessionStorage.setItem(CHOIX, 'non');
    barre.hidden = true;
  });
}

/* ==========================================================================
   2. Le voile de chargement
   ========================================================================== */
/* Filet de sécurité : rien de décoratif ne doit pouvoir enfermer un visiteur
   dehors. Le voile part quand la page est prête, et de toute façon au bout de
   quatre secondes, même si quelque chose s'est mal passé plus haut. */

function leverLeVoile() {
  const voile = document.querySelector('[data-voile]');
  if (!voile) return;
  const partir = () => voile.setAttribute('data-parti', 'oui');
  if (document.readyState === 'complete') setTimeout(partir, 260);
  else addEventListener('load', () => setTimeout(partir, 260), { once: true });
  setTimeout(partir, 4000);
}

/* ==========================================================================
   3. L'en-tête
   ========================================================================== */

function entete() {
  const barre = document.querySelector('[data-entete]');
  if (!barre) return;

  let dernier = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    const descend = y > dernier && y > 260;
    /* On ne cache pas l'en-tête quand le menu du téléphone est ouvert :
       le visiteur perdrait le menu qu'il vient d'ouvrir. */
    const ouvert = barre.querySelector('[data-menu]')?.dataset.ouvert === 'oui';
    barre.dataset.cachee = descend && !ouvert ? 'oui' : 'non';
    dernier = y;
  }, { passive: true });

  const bascule = barre.querySelector('[data-bascule]');
  const menu = barre.querySelector('[data-menu]');
  bascule?.addEventListener('click', () => {
    const ouvert = menu.dataset.ouvert === 'oui';
    menu.dataset.ouvert = ouvert ? 'non' : 'oui';
    bascule.setAttribute('aria-expanded', String(!ouvert));
  });
  menu?.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      menu.dataset.ouvert = 'non';
      bascule?.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ==========================================================================
   4. Les révélations au défilement
   ========================================================================== */
/* Une seule fois, jamais à l'envers. Une animation qui se rejoue quand on
   remonte fait le yoyo dès qu'on repasse la frontière : le visiteur croit
   que le défilement tremble alors que c'est le texte qui bouge. */

function revelations() {
  const cibles = document.querySelectorAll('[data-lever]');
  if (!cibles.length || !anime) {
    for (const c of cibles) c.setAttribute('data-leve', 'oui');
    return;
  }
  const oeil = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      e.target.setAttribute('data-leve', 'oui');
      oeil.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  for (const c of cibles) oeil.observe(c);
}

/* ==========================================================================
   5. Les lettres du titre
   ========================================================================== */

function lettres() {
  for (const bloc of document.querySelectorAll('[data-lettres]')) {
    const morceaux = [...bloc.childNodes];
    let n = 0;
    for (const noeud of morceaux) {
      if (noeud.nodeType !== Node.TEXT_NODE) {
        /* Un élément imbriqué (le mot en orange) : on entre dedans. */
        if (noeud.nodeType === Node.ELEMENT_NODE) n = decouper(noeud, n);
        continue;
      }
      const enveloppe = document.createElement('span');
      enveloppe.className = 'lettres';
      n = remplir(enveloppe, noeud.textContent, n);
      noeud.replaceWith(enveloppe);
    }
  }

  function decouper(element, n) {
    const texte = element.textContent;
    element.textContent = '';
    const enveloppe = document.createElement('span');
    enveloppe.className = 'lettres';
    n = remplir(enveloppe, texte, n);
    element.append(enveloppe);
    return n;
  }

  function remplir(enveloppe, texte, n) {
    for (const c of texte) {
      if (c === ' ') { enveloppe.append(' '); continue; }
      const s = document.createElement('span');
      s.className = 'l';
      s.style.setProperty('--i', n++);
      s.textContent = c;
      enveloppe.append(s);
    }
    return n;
  }
}

/* ==========================================================================
   6. Les bulles
   ========================================================================== */

function bulles() {
  for (const champ of document.querySelectorAll('[data-bulles]')) {
    const combien = Number(champ.dataset.bulles) || 12;
    for (let i = 0; i < combien; i++) {
      const b = document.createElement('span');
      b.className = 'bulle';
      const taille = 10 + Math.random() * 62;
      b.style.width = b.style.height = `${taille}px`;
      b.style.left = `${Math.random() * 100}%`;
      b.style.animationDuration = `${16 + Math.random() * 22}s`;
      b.style.animationDelay = `${-Math.random() * 30}s`;
      b.style.setProperty('--derive', `${(Math.random() - 0.5) * 160}px`);
      champ.append(b);
    }
  }
}

/* ==========================================================================
   7. Les trois dimensions
   ========================================================================== */

async function troisDimensions() {
  const toileOuverture = document.querySelector('[data-ouverture]');
  const sectionVitrine = document.querySelector('[data-vitrine]');
  if (!toileOuverture && !sectionVitrine) return;

  /* WebGL absent, machine trop juste, ou refus du mouvement : on s'abstient
     plutôt que de servir une image fixe qui a l'air en panne. Le contenu de
     la page n'a jamais dépendu de la toile. */
  if (!verifierWebGL()) return;

  const { NIVEAU } = await import(`./scene.js${V}`);
  if (NIVEAU === 'bas') return;

  if (toileOuverture) {
    const { ouvrir } = await import(`./ouverture.js${V}`);
    ouvrir(toileOuverture, 'modeles').catch(() => {});
  }
  if (sectionVitrine) {
    const toile = sectionVitrine.querySelector('canvas');
    const { dresser } = await import(`./vitrine.js${V}`);
    dresser(sectionVitrine, toile, 'modeles', [
      /* `inclinaison` penche la pièce vers la caméra : sans elle, le
         porte-bougie, qui est presque plat, se présente par la tranche et ne
         montre rien de ce qui fait son intérêt. */
      { fichier: 'bois-flotte.glb', hauteur: 2.5 },
      { fichier: 'photophore.glb', hauteur: 2.3, inclinaison: -0.5 },
      { fichier: 'reveil.glb', hauteur: 2.1, balance: true },
      { fichier: 'spheres.glb', hauteur: 2.2, depart: Math.PI },
    ]).catch(() => {});
  }
}

function verifierWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/* ==========================================================================
   8. La boutique
   ========================================================================== */

async function boutique() {
  const racine = document.querySelector('[data-boutique]');
  if (!racine) return;
  const [{ CREATIONS, FAMILLES }, { monter }] = await Promise.all([
    import(`../donnees/creations.js${V}`),
    import(`./catalogue.js${V}`),
  ]);
  monter(racine, { CREATIONS, FAMILLES });
}

/* ==========================================================================
   9. Le formulaire
   ========================================================================== */
/* Il n'est branché sur rien, et il le dit. Un formulaire qui avale les
   messages en affichant « merci » est pire que pas de formulaire du tout :
   la personne croit avoir écrit, et Stéphane ne reçoit rien. */

function formulaire() {
  const f = document.querySelector('[data-demande]');
  if (!f) return;

  /* Une pièce peut arriver depuis sa fiche : on l'écrit dans le message. */
  const piece = new URL(location).searchParams.get('piece');
  const objet = f.querySelector('[name="objet"]');
  const message = f.querySelector('[name="message"]');
  if (piece && objet) {
    objet.value = `À propos de « ${piece} »`;
    if (message && !message.value) {
      message.value = `Bonjour Stéphane,\n\nVotre pièce « ${piece} » m'a beaucoup plu. `;
      message.setSelectionRange(message.value.length, message.value.length);
    }
  }

  const avis = f.querySelector('[data-avis]');
  const copier = f.querySelector('[data-copier]');

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    avis.hidden = false;
    avis.scrollIntoView({ block: 'nearest', behavior: anime ? 'smooth' : 'auto' });
  });

  copier?.addEventListener('click', async () => {
    const d = new FormData(f);
    const texte = [
      `${d.get('objet') || 'Une demande'}`,
      '',
      d.get('message'),
      '',
      `${d.get('nom') || ''}`,
      `${d.get('email') || ''}${d.get('telephone') ? ' · ' + d.get('telephone') : ''}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(texte);
      copier.textContent = 'Message copié';
      setTimeout(() => { copier.textContent = 'Copier mon message'; }, 2600);
    } catch {
      copier.textContent = 'Copie refusée par le navigateur';
    }
  });
}

/* ==========================================================================
   10. L'année du pied de page
   ========================================================================== */

function annee() {
  for (const e of document.querySelectorAll('[data-annee]')) {
    e.textContent = new Date().getFullYear();
  }
}

/* ========================================================================== */

lettres();
entete();
revelations();
if (anime) bulles();
annee();
formulaire();
rappelDeMouvement();
leverLeVoile();
boutique();
troisDimensions();
