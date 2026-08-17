/* ==========================================================================
   KAZURA 葛 - le moteur
   --------------------------------------------------------------------------
   Aucune dependance hors three.js, charge a part et seulement quand une page
   en a besoin. Tout est coupe proprement si l'utilisateur demande moins de
   mouvement, si la machine est un telephone, ou si le script ne tourne pas.
   ========================================================================== */

/* `?mouvement=1` force le mode anime, `?mouvement=0` force le mode sobre.
   Sans cette bascule, impossible de mesurer ni de regarder les animations
   depuis un navigateur regle sur « moins de mouvement », ce qui est le cas de
   tous les environnements de test. Le reglage du systeme reste la valeur par
   defaut : la bascule ne sert qu'a nous. */
/* TROIS SOURCES, DANS CET ORDRE : l'adresse, le choix garde, le systeme.

   Le choix garde n'est pas un confort, c'est une reparation. Sous Windows,
   `prefers-reduced-motion` est pilote par « Effets d'animation », que
   beaucoup de gens coupent pour gagner des images par seconde dans les jeux,
   sans aucun rapport avec une gene au mouvement. Matheo l'a coupe : il n'a
   donc JAMAIS vu le defilement amorti de ce site, et il le decrivait comme
   brusque, ce qui etait exact et n'etait pas un defaut du code.

   On continue d'obeir au systeme par defaut, parce que la preference est
   vraie pour ceux qui en ont besoin. Mais on le DIT, et on propose de
   passer outre. Une preference respectee en silence, quand elle vient d'un
   reglage pris pour autre chose, prive l'utilisateur sans qu'il sache de
   quoi. */
const _forceMouvement = new URLSearchParams(location.search).get('mouvement');
let _choix = null;
try { _choix = localStorage.getItem('kazura-mouvement'); } catch (e) { /* mode prive */ }

const sobre = _forceMouvement === '1' ? false
            : _forceMouvement === '0' ? true
            : _choix === '1' ? false
            : _choix === '0' ? true
            : matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Les modules charges ensuite lisent cette decision plutot que de la refaire
   chacun de leur cote a partir de la seule adresse : sans quoi le choix garde
   ne les atteindrait pas. Pose AVANT le moindre import dynamique. */
document.documentElement.dataset.mouvement = sobre ? 'sobre' : 'anime';
const tactile = matchMedia('(hover: none)').matches;

/* VERSION. GitHub Pages garde chaque fichier dix minutes dans le cache du
   navigateur, HTML compris, mais chacun expire pour son compte. Un visiteur qui
   revient juste apres une mise en ligne recoit donc le HTML NEUF avec l'ANCIEN
   script : le nouveau balisage est la, le code qui le cherche ne l'est pas, et
   la piece ne se monte jamais sans la moindre erreur en console. C'est
   exactement ce qui est arrive au sceau de verre, et ca ne se voit pas en local
   ou le serveur repond `no-store`.

   Le script publie est appele avec `?v=<empreinte>`. On relit cette empreinte
   sur notre propre adresse et on la repasse a chaque import : le HTML entraine
   alors TOUTE la chaine de modules avec lui, et les deux ne peuvent plus se
   desynchroniser. Sans empreinte, en developpement, la chaine reste nue. */
const VERSION = new URL(import.meta.url).search;
const $  = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const borne = (v, a, b) => Math.min(b, Math.max(a, v));

/* ══ 1. Defilement amorti ═══════════════════════════════════════════════
   Le contenu vit dans un conteneur fixe qu'on translate, pendant que le
   corps de page garde la hauteur reelle pour que la barre de defilement soit
   juste. C'est ce qui donne l'inertie des sites primes.

   Deux consequences a connaitre avant de toucher au CSS :
   - `position: sticky` ne fonctionne plus a l'interieur du conteneur. On
     epingle donc a la main, avec `position: fixed` pilote au defilement.
   - tout ce qui doit rester fixe a l'ecran (barre, toiles de fond, menu) est
     place EN DEHORS du conteneur.

   Sur ecran tactile et en mode sobre, on ne detourne rien : le defilement
   natif est meilleur que tout ce qu'on pourrait imiter. */
const glisse = {
  y: 0, cible: 0, max: 0, vitesse: 0, actif: false, boite: null
};

function monterLeDefilement() {
  const boite = $('#defile');
  if (!boite) return;
  glisse.boite = boite;
  glisse.actif = !tactile && !sobre;

  if (!glisse.actif) {
    boite.dataset.natif = 'oui';
    return;
  }

  const mesurer = () => {
    const h = boite.getBoundingClientRect().height;
    document.body.style.height = h + 'px';
    glisse.max = Math.max(0, h - window.innerHeight);
  };
  mesurer();
  new ResizeObserver(mesurer).observe(boite);
  window.addEventListener('resize', mesurer);

  // Un lien d'ancre doit continuer a fonctionner malgre le detournement.
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const cible = $(a.getAttribute('href'));
      if (!cible) return;
      e.preventDefault();
      const haut = cible.getBoundingClientRect().top + glisse.y;
      window.scrollTo({ top: haut, behavior: 'auto' });
    });
  });
}

/* ══ 2. Les abonnes au defilement ═══════════════════════════════════════
   Un seul rAF pour toute la page, une seule lecture de position, et une
   liste d'abonnes. Multiplier les ecouteurs de `scroll` est le moyen le plus
   sur de rendre une page saccadee. */
const abonnes = [];
const auDefilement = (fn) => { abonnes.push(fn); return fn; };

let dernierY = 0;

/* Un pas de la boucle, isole du rAF qui l'appelle. Deux raisons : le rAF ne
   tourne pas dans un onglet masque, et un pas appelable a la main rend la
   page verifiable et deboguable depuis la console (`kazura.pas()`). */
let _dernierTemps = 0;

function pas() {
  const brut = window.scrollY || document.documentElement.scrollTop;

  /* Amortissement INDEPENDANT DU NOMBRE D'IMAGES. Un `y += (cible - y) * k`
     avance d'autant plus vite qu'il y a d'images par seconde : a 120 images il
     rattrape deux fois plus vite qu'a 60, et si une image saute, le rattrapage
     se voit comme une marche. C'est exactement ce qu'on ressentait a la
     molette, qui envoie de gros sauts, alors que la barre de defilement, qui
     envoie de petits pas continus, paraissait douce.

     La forme correcte est `1 - (1 - k)^(dt * 60)` : la fraction rattrapee
     depend du TEMPS ecoule, pas du nombre d'appels. Le mouvement devient
     identique a 30, 60 ou 144 images par seconde. */
  const maintenant = performance.now();
  let dt = _dernierTemps ? (maintenant - _dernierTemps) / 1000 : 1 / 60;
  _dernierTemps = maintenant;
  // Un onglet revenu au premier plan renvoie un dt enorme : on le borne.
  dt = Math.min(dt, 1 / 20);

  if (glisse.actif) {
    glisse.cible = brut;
    const k = 1 - Math.pow(1 - 0.14, dt * 60);
    glisse.y += (glisse.cible - glisse.y) * k;
    if (Math.abs(glisse.cible - glisse.y) < 0.06) glisse.y = glisse.cible;
    /* Arrondi au demi-pixel : sans cela le contenu tremble sur les ecrans
       non retina, parce qu'une translation fractionnaire fait rechantillonner
       le texte a chaque image. */
    const y = Math.round(glisse.y * 2) / 2;
    glisse.boite.style.transform = `translate3d(0,${-y}px,0)`;
  } else {
    glisse.y = brut;
    glisse.max = Math.max(0, document.body.scrollHeight - window.innerHeight);
  }

  glisse.vitesse = glisse.y - dernierY;
  dernierY = glisse.y;

  const p = glisse.max > 0 ? borne(glisse.y / glisse.max, 0, 1) : 0;
  for (const fn of abonnes) fn(glisse.y, p, glisse.vitesse);
}

function battre() {
  pas();
  requestAnimationFrame(battre);
}

/* Position d'un element dans le repere du document, valable dans les deux
   modes. En mode amorti, le conteneur est translate : on rajoute le decalage. */
function boiteReelle(el) {
  const r = el.getBoundingClientRect();
  const dy = glisse.actif ? glisse.y : 0;
  return { haut: r.top + dy, bas: r.bottom + dy, hauteur: r.height, ecran: r };
}

/* ══ 3. Decoupe du texte ════════════════════════════════════════════════ */
/* Chaque mot devient un bloc, chaque lettre un bloc dans le mot. Le mot sert
   de fenetre : la lettre monte depuis dessous, donc rien ne deborde. */
function decouper(el) {
  if (el.dataset.decoupe === 'oui') return;
  const texte = el.textContent;
  el.textContent = '';
  el.dataset.decoupe = 'oui';
  let n = 0;
  texte.trim().split(/(\s+)/).forEach(bout => {
    if (/^\s+$/.test(bout)) { el.appendChild(document.createTextNode(' ')); return; }
    const mot = document.createElement('span');
    mot.className = 'mot';
    [...bout].forEach(c => {
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

/* ══ 4. Brouillage de lettres ═══════════════════════════════════════════ */
/* Le principe d'Igloo Inc, transpose au DOM : on ne remplace pas le texte,
   on fait defiler des glyphes a la place de chaque lettre pas encore fixee.
   Les lettres se figent de gauche a droite. */
const GLYPHES = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ葛蔓蔦茎芽0123456789';

function brouiller(el, duree = 1100) {
  const vrai = el.dataset.vrai || (el.dataset.vrai = el.textContent.trim());
  const debut = performance.now();
  const n = vrai.length;

  const tour = () => {
    const t = borne((performance.now() - debut) / duree, 0, 1);
    // Courbe de sortie : la fin se pose doucement.
    const avance = 1 - Math.pow(1 - t, 3);
    const fixees = Math.floor(avance * n);
    let sortie = '';
    for (let i = 0; i < n; i++) {
      if (vrai[i] === ' ') { sortie += ' '; continue; }
      sortie += i < fixees ? vrai[i] : GLYPHES[(Math.random() * GLYPHES.length) | 0];
    }
    el.textContent = sortie;
    if (t < 1) requestAnimationFrame(tour);
    else el.textContent = vrai;
  };
  tour();
}

/* ══ 5. Apparitions ═════════════════════════════════════════════════════ */
/* Calcul au defilement plutot qu'IntersectionObserver. L'observateur ne
   repond pas dans un document non compose (onglet en arriere-plan, fenetre
   masquee, navigateur pilote), ce qui laisserait toute la page a opacite
   zero. Ici la meme boucle qui anime tout decide aussi de ce qui apparait. */
function monterLesApparitions() {
  const cibles = $$('[data-vient]');
  cibles.forEach(el => {
    if (el.dataset.vient === 'lettres' || el.dataset.vient === 'titre') decouper(el);
  });

  let restants = cibles.slice();

  auDefilement(() => {
    if (!restants.length) return;
    const h = window.innerHeight;
    restants = restants.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top > h * 0.92 || r.bottom < 0) return true;
      el.dataset.vu = 'oui';
      if (el.dataset.vient === 'brouille') brouiller(el);
      return false;
    });
  });
}

/* ══ 6. Parallaxe ═══════════════════════════════════════════════════════ */
function monterLaParallaxe() {
  const couches = $$('[data-parallaxe]');
  if (!couches.length || sobre) return;
  auDefilement(() => {
    const h = window.innerHeight;
    couches.forEach(c => {
      const r = c.parentElement.getBoundingClientRect();
      if (r.bottom < -300 || r.top > h + 300) return;
      const force = parseFloat(c.dataset.parallaxe) || 0.15;
      const centre = r.top + r.height / 2 - h / 2;
      c.style.transform = `translate3d(0,${(-centre * force).toFixed(2)}px,0)`;
    });
  });
}

/* ══ 7. Epinglage ═══════════════════════════════════════════════════════ */
/* `position: sticky` est inutilisable dans un conteneur translate. On epingle
   donc a la main : l'element passe en `position: fixed` tant que sa section
   traverse l'ecran, et redevient normal aux deux bouts. */
function monterLEpinglage() {
  const zones = $$('[data-epingle]');
  zones.forEach(zone => {
    const dedans = $('[data-epingle-contenu]', zone);
    if (!dedans) return;

    /* Le mode est fige au montage : le CSS ne peut pas deviner lequel des deux
       epinglages s'applique, c'est le script qui le lui dit. */
    if (!glisse.actif) dedans.dataset.colle = 'oui';

    /* Les messages qui se relaient pendant la traversee. Chacun declare la
       tranche d'avancement ou il doit etre visible. */
    const fenetres = $$('[data-fenetre]', zone).map(el => {
      const [a, b] = el.dataset.fenetre.split(',').map(Number);
      return { el, a, b };
    });

    auDefilement(() => {
      const r = zone.getBoundingClientRect();
      const h = window.innerHeight;
      const course = r.height - h;
      const avance = borne(-r.top / Math.max(course, 1), 0, 1);
      zone.style.setProperty('--avance', avance.toFixed(4));
      zone.dataset.avance = avance.toFixed(3);

      /* On epingle par TRANSFORMATION, jamais par `position: fixed`.
         `#defile` porte `will-change: transform`, ce qui suffit a en faire le
         bloc conteneur de ses descendants fixes : un enfant en `fixed` avec
         `top: 0` se collait alors en haut du DOCUMENT, soit des milliers de
         pixels au-dessus de l'ecran. La section faisait 3 600 px de vide
         absolu, et c'est ce que voyait Matheo apres les lianes.

         Deplacer le contenu du meme nombre de pixels que la section a
         defile le maintient immobile a l'ecran, sans dependre d'aucun bloc
         conteneur, et fonctionne aussi bien en defilement natif qu'amorti. */
      /* EN DEFILEMENT NATIF, on ne touche a rien. `position: sticky` fait le
         travail sur le compositeur, sans une image de retard. Notre epinglage
         a la main, lui, est calcule dans un rAF qui arrive APRES que le
         navigateur a deja peint la page a sa nouvelle position : le contenu
         epingle rattrape son retard a chaque image, ce qui se voit exactement
         comme un tremblement. C'est ce que Matheo decrivait sur telephone.
         On ne garde notre calcul que dans le conteneur translate, ou sticky
         est inutilisable et ou tout bouge dans la meme image. */
      if (glisse.actif) {
        const cale = r.top <= 0
          ? (r.bottom >= h ? -r.top : course)
          : 0;
        dedans.style.transform = 'translate3d(0,' + cale.toFixed(1) + 'px,0)';
      }
      for (const f of fenetres) {
        f.el.dataset.actif = (avance >= f.a && avance < f.b) ? 'oui' : 'non';
      }

      zone.dispatchEvent(new CustomEvent('avance', { detail: avance }));
    });
  });
}

/* ══ 8. Video pilotee au defilement ═════════════════════════════════════ */
/* La video a ete reencodee avec une image-cle sur chaque image : sans ca, le
   decodeur remonte a la cle precedente a chaque saut et le scrub saccade.
   On n'ecrit `currentTime` que si l'ecart depasse une demi-image, sinon on
   noie le decodeur sous des demandes inutiles. */
function monterLeScrub() {
  $$('[data-scrub]').forEach(video => {
    const zone = video.closest('[data-epingle]');
    if (!zone) return;

    video.pause();
    video.muted = true;
    video.playsInline = true;

    let duree = 0, vise = 0, courant = 0, pret = false;
    const prendreDuree = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        duree = video.duration; pret = true;
      }
    };
    video.addEventListener('loadedmetadata', prendreDuree);
    video.addEventListener('durationchange', prendreDuree);
    prendreDuree();

    zone.addEventListener('avance', e => { vise = e.detail * (duree || 0); });

    auDefilement(() => {
      if (!pret || !duree) return;
      /* Ne jamais empiler les demandes : tant que le decodeur cherche encore
         l'image precedente, une nouvelle ecriture l'oblige a tout reprendre.
         C'est la difference entre un scrub fluide et un scrub qui bafouille. */
      if (video.seeking) return;
      courant += (vise - courant) * 0.16;
      if (Math.abs(video.currentTime - courant) > 1 / 48) {
        try { video.currentTime = courant; } catch (e) { /* ignore */ }
      }
    });
  });
}

/* ══ 9. Bandeau sensible a la vitesse ═══════════════════════════════════ */
function monterLesBandeaux() {
  $$('[data-bandeau]').forEach(piste => {
    const sens = parseFloat(piste.dataset.bandeau) || 1;
    let x = 0;
    auDefilement((y, p, v) => {
      // Deroule tout seul, et le defilement le pousse ou le freine.
      x -= (0.55 + Math.abs(v) * 0.14) * sens;
      const l = piste.scrollWidth / 2;
      if (l > 0) { if (x < -l) x += l; if (x > 0) x -= l; }
      piste.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    });
  });
}

/* ══ 10. Barre et menu ══════════════════════════════════════════════════ */
function monterLaBarre() {
  const nav = $('.nav');
  if (nav) {
    let precedent = 0;
    auDefilement(y => {
      nav.dataset.dense = y > 60 ? 'oui' : 'non';
      nav.dataset.cache = (y > precedent + 1 && y > 420) ? 'oui' : 'non';
      precedent = y;
    });
  }

  const bouton = $('.nav__menu'), panneau = $('.panneau');
  if (!bouton || !panneau) return;

  const basculer = (ouvrir) => {
    bouton.setAttribute('aria-expanded', String(ouvrir));
    bouton.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.dataset.fige = ouvrir ? 'oui' : 'non';
    if (ouvrir) {
      panneau.hidden = false;
      void panneau.offsetHeight;      // force le calcul, sinon pas de transition
      panneau.dataset.ouvert = 'oui';
      /* Le panneau couvre tout l'ecran et reste cliquable a opacite zero :
         s'il s'ouvrait sans devenir visible, il condamnerait la page. */
      setTimeout(() => {
        if (panneau.dataset.ouvert === 'oui' &&
            parseFloat(getComputedStyle(panneau).opacity) < 0.9) {
          panneau.style.opacity = '1';
        }
      }, 500);
    } else {
      panneau.style.opacity = '';
      panneau.dataset.ouvert = 'non';
      setTimeout(() => {
        if (panneau.dataset.ouvert !== 'oui') panneau.hidden = true;
      }, 520);
    }
  };

  bouton.addEventListener('click', () =>
    basculer(bouton.getAttribute('aria-expanded') !== 'true'));
  $$('a', panneau).forEach(a => a.addEventListener('click', () => basculer(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') basculer(false);
  });
}

/* ══ 11. Curseur et aimants ═════════════════════════════════════════════ */
function monterLeCurseur() {
  if (tactile || sobre) return;
  const c = document.createElement('div');
  c.className = 'curseur';
  c.innerHTML = '<span></span>';
  document.body.appendChild(c);

  let cx = innerWidth / 2, cy = innerHeight / 2, vx = cx, vy = cy;
  addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY; c.dataset.actif = 'oui';
  }, { passive: true });
  addEventListener('pointerleave', () => { c.dataset.actif = 'non'; });

  (function suivre() {
    vx += (cx - vx) * 0.19; vy += (cy - vy) * 0.19;
    c.style.transform = `translate3d(${vx.toFixed(1)}px,${vy.toFixed(1)}px,0)`;
    requestAnimationFrame(suivre);
  })();

  const marquer = (v) => () => { c.dataset.gros = v; };
  $$('a, button, [data-aimant], .carte, .metier, .travail').forEach(el => {
    el.addEventListener('pointerenter', marquer('oui'));
    el.addEventListener('pointerleave', marquer('non'));
  });

  $$('[data-aimant]').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.34;
      b.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ══ 12. Cartes : halo et inclinaison ═══════════════════════════════════ */
function monterLesCartes() {
  if (tactile || sobre) return;
  $$('.carte, .travail').forEach(carte => {
    carte.addEventListener('pointermove', e => {
      const r = carte.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      carte.style.setProperty('--x', x + 'px');
      carte.style.setProperty('--y', y + 'px');
      const ix = (x / r.width - 0.5) * 2, iy = (y / r.height - 0.5) * 2;
      carte.style.transform =
        `perspective(1000px) rotateY(${(ix * 5).toFixed(2)}deg) rotateX(${(-iy * 5).toFixed(2)}deg) translateZ(8px)`;
    });
    carte.addEventListener('pointerleave', () => { carte.style.transform = ''; });
  });
}

/* ══ 13. Images differees, avec filet ═══════════════════════════════════ */
function monterLesImages() {
  const differees = $$('img[loading="lazy"]');
  if (!differees.length) return;
  let restantes = differees.slice();
  auDefilement(() => {
    if (!restantes.length) return;
    const h = window.innerHeight;
    restantes = restantes.filter(img => {
      if (img.complete && img.naturalWidth) return false;
      const r = img.getBoundingClientRect();
      if (r.top > h + 600 || r.bottom < -600) return true;
      img.loading = 'eager';
      img.src = img.getAttribute('src');
      return false;
    });
  });
}

/* ══ 14. Scene 3D ═══════════════════════════════════════════════════════ */
async function monterLaScene3D() {
  const toile = $('#toile3d');
  if (!toile) return;

  /* La 3D etait coupee des que l'ecran passait sous 700 px. C'etait une erreur
     de critere : la largeur de l'ecran ne dit rien de la carte graphique, et un
     telephone de 2024 rend ces lianes sans effort. Le resultat, c'est que les
     visiteurs sur mobile tombaient sur trois ecrans vides la ou se trouve la
     plus belle piece du site. `scene.js` a deja un chemin allege complet,
     9 lianes au lieu de 18, pas de halo, definition plafonnee : il n'attendait
     que d'etre autorise a tourner.
     On garde un plancher, mais mesure sur l'appareil et non sur sa vitre. Les
     navigateurs qui ne repondent pas passent, parce qu'ils sont sur des
     machines rapides, et la qualite adaptative de la scene rattrape le reste. */
  const memoire = navigator.deviceMemory || 4;
  const coeurs  = navigator.hardwareConcurrency || 4;
  if (memoire <= 2 || coeurs <= 2) { toile.dataset.repli = 'oui'; return; }

  try {
    const { monterLaScene } = await import('./scene.js' + VERSION);
    const scene = monterLaScene(toile);
    const zone = $('[data-scene-zone]') || document.body;

    auDefilement(() => {
      const r = zone.getBoundingClientRect();
      const course = Math.max(1, r.height - window.innerHeight);
      const avance = borne(-r.top / course, 0, 1);
      scene.avancer(avance);
      // La toile s'efface quand sa zone est passee, et cesse alors de peindre.
      const sortie = borne((r.bottom - window.innerHeight * 0.6) / (window.innerHeight * 0.8), 0, 1);
      toile.style.opacity = sortie.toFixed(3);
      /* Et surtout on lui dit d'arreter. Sans cela elle peignait la scene
         complete, bloom compris, pendant tout le reste de la page. */
      scene.montrer(sortie > 0.01);
    });
    toile.dataset.prete = 'oui';
  } catch (e) {
    console.warn('scene 3D indisponible', e);
    toile.dataset.repli = 'oui';
  }
}

/* ══ 14 bis. Atelier ════════════════════════════════════════════════════ */
async function monterLAtelierSiPresent() {
  const toile = $('#toile-atelier');
  if (!toile) return;
  try {
    const { monterLAtelier } = await import('./atelier.js' + VERSION);
    monterLAtelier(toile);
  } catch (e) {
    console.warn('atelier indisponible', e);
  }
}

/* ══ 14 ter. L'encre, simulation de fluide ══════════════════════════════ */
/* On sonde le support sur une toile jetable AVANT de choisir le module : une
   fois qu'un contexte webgl2 est attache a une toile, on ne peut plus y
   demander un contexte webgl1, et le repli serait perdu. */
function supporteLeFluide() {
  try {
    const t = document.createElement('canvas');
    t.width = t.height = 2;
    const g = t.getContext('webgl2');
    if (!g) return false;
    const ok = !!g.getExtension('EXT_color_buffer_float');
    g.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch (e) { return false; }
}

async function monterLEncreSiPresente() {
  const toile = $('#toile-encre');
  if (!toile) return;

  if (supporteLeFluide()) {
    try {
      const { monterLEncre } = await import('./fluide.js' + VERSION);
      const encre = monterLEncre(toile, { texte: toile.dataset.texte || null });
      if (encre) {
        toile.dataset.mode = 'fluide';
        (window.kazura ||= {}).encre = encre;
        return;
      }
    } catch (e) { console.warn('encre indisponible', e); }
  }

  // Repli : le champ de bruit, moins spectaculaire mais toujours vivant.
  try {
    const { monterLAtelier } = await import('./atelier.js' + VERSION);
    monterLAtelier(toile);
    toile.dataset.mode = 'bruit';
  } catch (e) {
    toile.dataset.mode = 'aucun';
  }
}

/* ══ 14 ter bis. Le jardin sec ══════════════════════════════════════════ */
async function monterLeJardinSiPresent() {
  const toile = $('#toile-jardin');
  if (!toile) return;
  if (!supporteLeFluide()) { toile.dataset.mode = 'aucun'; return; }
  try {
    const { monterLeJardin } = await import('./jardin.js' + VERSION);
    const j = monterLeJardin(toile);
    if (j) { toile.dataset.mode = 'jardin'; (window.kazura ||= {}).jardin = j; }
  } catch (e) {
    console.warn('jardin indisponible', e);
    toile.dataset.mode = 'aucun';
  }
}

/* ══ 14 ter ter. Le miroir de palette ═══════════════════════════════════ */
async function monterLeMiroirSiPresent() {
  const zone = $('.miroir');
  if (!zone) return;
  try {
    const { monterLeMiroir } = await import('./miroir.js' + VERSION);
    (window.kazura ||= {}).miroir = monterLeMiroir(zone);
  } catch (e) {
    console.warn('miroir indisponible', e);
  }
}

/* ══ 14 quater. Le mot en WebGL ═════════════════════════════════════════ */
async function monterLeMotSiPresent() {
  const toile = $('#toile-mot');
  if (!toile) return;
  try {
    const { monterLeMot } = await import('./mot-webgl.js' + VERSION);
    const mot = await monterLeMot(toile, toile.dataset.mot || 'KAZURA');
    if (!mot) return;
    (window.kazura ||= {}).mot = mot;

    // Le titre en DOM cede la place, mais reste dans le document.
    toile.closest('.mot3d')?.setAttribute('data-prete', 'oui');

    if (mot.statique) return;
    const hero = toile.closest('.hero') || toile.parentElement;
    auDefilement(() => {
      const r = hero.getBoundingClientRect();
      /* Net tant que le hero occupe l'ecran, pulverise a mesure qu'il sort.
         Le mot se recondense si on remonte. */
      const sortie = borne((r.bottom - window.innerHeight * 0.28) / (window.innerHeight * 0.72), 0, 1);
      mot.viser(sortie);
    });
  } catch (e) {
    console.warn('mot WebGL indisponible', e);
  }
}

/* ══ 14 quinquies. Ecran de chargement ══════════════════════════════════ */
/* Il ne sert pas a masquer une lenteur, il sert a poser le ton avant que la
   premiere image n'arrive : la liane se dessine, le compteur monte, et la
   page apparait quand les polices sont pretes. Duree plafonnee : un ecran de
   chargement qui s'eternise est pire que pas d'ecran du tout. */
function monterLeSeuil() {
  const ecran = $('#seuil');
  if (!ecran) return;

  /* On ne fait franchir le seuil qu'une fois par session. Redemander le geste
     a chaque page serait une porte qui claque, pas un rituel. */
  let dejaVu = false;
  try { dejaVu = sessionStorage.getItem('kazura-seuil') === 'franchi'; } catch (e) {}
  if (dejaVu || sobre) { ecran.remove(); return; }

  const trait = $('path', ecran);
  const pct = $('[data-pct]', ecran);
  const invite = $('.seuil__invite', ecran);
  const longueur = trait ? trait.getTotalLength() : 0;
  if (trait) { trait.style.strokeDasharray = longueur; trait.style.strokeDashoffset = longueur; }

  document.body.dataset.fige = 'oui';

  /* ── Phase 1 : le chargement ─────────────────────────────────────── */
  const debut = performance.now();
  const DUREE_MIN = 700, DUREE_MAX = 3200;
  let pretes = false, ouvrable = false;

  Promise.all([
    document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
    new Promise(r => {
      if (document.readyState === 'complete') r();
      else addEventListener('load', r, { once: true });
    })
  ]).then(() => { pretes = true; });

  const autoriser = () => {
    if (ouvrable) return;
    ouvrable = true;
    ecran.dataset.pret = 'oui';
    if (pct) pct.textContent = '100';
  };

  (function charger() {
    const t = performance.now() - debut;
    const feint = Math.min(0.9, t / DUREE_MIN * 0.9);
    const p = pretes ? Math.min(1, feint + 0.1) : feint;
    if (pct) pct.textContent = String(Math.round(p * 100)).padStart(2, '0');
    if (trait) trait.style.strokeDashoffset = String(longueur * (1 - p));
    if ((pretes && t > DUREE_MIN) || t > DUREE_MAX) { autoriser(); return; }
    requestAnimationFrame(charger);
  })();
  // Filet : rAF ne tourne pas dans un onglet masque.
  setTimeout(autoriser, DUREE_MAX + 300);

  /* ── Phase 2 : on pousse ──────────────────────────────────────────── */
  let ouvre = 0, cible = 0, fini = false;
  /* La traversee est le moment ou l'on PASSE le portail, apres l'avoir ouvert.
     Avant, le seuil disparaissait des que le trou etait perce : on voyait une
     porte s'escamoter, on n'entrait nulle part. Ici le jardin se rapproche, le
     portail s'ecarte autour de nous et le voile se dissout, sur une duree
     fixe. On ne regarde plus la porte, on la franchit. */
  let passe = 0, traversee = false;
  const DUREE_TRAVERSEE = 2.5;
  const traverser = () => {
    if (traversee || fini) return;
    traversee = true;
    ecran.dataset.traverse = 'oui';
    /* Le son, s'il est allume, se branche la-dessus. Un evenement plutot qu'un
       appel direct : le seuil n'a pas a savoir qu'un module audio existe. */
    document.dispatchEvent(new CustomEvent('kazura:traversee'));
  };

  const franchir = () => {
    if (fini) return;
    fini = true;
    try { sessionStorage.setItem('kazura-seuil', 'franchi'); } catch (e) {}
    ecran.dataset.parti = 'oui';
    document.body.dataset.fige = 'non';
    setTimeout(() => ecran.remove(), 800);
  };

  const pousser = (quantite) => {
    if (!ouvrable || fini) return;
    cible = Math.min(1, Math.max(0, cible + quantite));
    if (cible >= 0.995) traverser();
  };

  // La molette et le geste vertical poussent. Un clic ouvre d'un coup.
  ecran.addEventListener('wheel', e => { e.preventDefault(); pousser(Math.abs(e.deltaY) / 900); },
                         { passive: false });
  let px = null;
  ecran.addEventListener('pointerdown', e => { px = { x: e.clientX, y: e.clientY, bouge: 0 }; });
  ecran.addEventListener('pointermove', e => {
    if (!px) return;
    const d = Math.hypot(e.clientX - px.x, e.clientY - px.y);
    px.bouge += d;
    pousser(d / 420);
    px.x = e.clientX; px.y = e.clientY;
  });
  ecran.addEventListener('pointerup', () => {
    // Un simple clic, sans deplacement, ouvre en entier : le geste ne doit
    // jamais etre une condition d'acces.
    if (px && px.bouge < 6) { cible = 1; }
    px = null;
  });
  ecran.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cible = 1; }
    /* Echap ouvre sans amortissement. Un ecran d'entree doit toujours avoir une
       sortie immediate : c'est le reflexe de quiconque se sent bloque. */
    if (e.key === 'Escape') { e.preventDefault(); franchir(); }
  });
  if (invite) invite.addEventListener('click', () => { cible = 1; });

  /* L'ouverture est amortie, et le retour a zero aussi : si on lache avant la
     fin, le portail se referme doucement au lieu de rester entrouvert. */
  let dernier = performance.now();
  let programme = false;

  function animer() {
    programme = false;
    const n = performance.now();
    const dt = Math.min((n - dernier) / 1000, 1 / 20);
    dernier = n;
    if (!fini && ouvrable && !px && cible < 1) cible = Math.max(0, cible - dt * 0.35);
    const k = 1 - Math.pow(1 - 0.16, dt * 60);
    ouvre += (cible - ouvre) * k;
    ecran.style.setProperty('--ouvre', ouvre.toFixed(4));
    if (traversee) {
      /* Courbe d'entree : lente au depart, puis on plonge. Une vitesse
         constante donnerait un fondu de logiciel, pas un mouvement. */
      passe = Math.min(1, passe + dt / DUREE_TRAVERSEE);
      const e = passe * passe * (3.0 - 2.0 * passe);
      ecran.style.setProperty('--passe', e.toFixed(4));
      if (passe >= 1) franchir();
    } else if (ouvre > 0.985 && cible >= 1) {
      traverser();
    }
    relancer();
  }
  function relancer() {
    if (fini || programme) return;
    programme = true;
    dernier = performance.now();     // sinon le retour d'onglet donne un dt enorme
    requestAnimationFrame(animer);
  }
  relancer();

  /* CE FILET EST LE PLUS IMPORTANT DU MODULE. Cet ecran fige le corps de la
     page : tant qu'il est la, on ne peut ni defiler ni rien atteindre. Si sa
     boucle s'arrete pour une raison quelconque, le visiteur est enferme DEHORS,
     sans message et sans issue.

     `requestAnimationFrame` ne tourne pas dans un onglet masque. Quelqu'un qui
     change d'onglet au milieu du geste revient donc sur un portail fige a mi
     course. Vu en vrai, a 0,9566 d'ouverture, corps toujours bloque. On relance
     donc la boucle au retour, systematiquement.

     Regle a garder : rien de decoratif ne doit pouvoir verrouiller un site. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) relancer();
  });

  /* Deuxieme filet, pour ce que le premier ne couvre pas. Si la boucle ne
     repart pas du tout, ce delai rend la page au bout de vingt secondes. On
     perd le rituel, on ne perd pas le visiteur. */
  setTimeout(() => { if (!fini) franchir(); }, 20000);
}

/* ══ 14 sexies. Transitions entre pages ═════════════════════════════════ */
/* Un rideau se ferme, la navigation part, et le rideau se leve de l'autre
   cote. Sans ca, chaque clic donne un flash blanc qui casse net l'ambiance. */
function monterLesTransitions() {
  const rideau = $('#rideau');
  if (!rideau) return;

  // A l'arrivee : le rideau est baisse, on le leve.
  requestAnimationFrame(() => { rideau.dataset.etat = 'leve'; });
  setTimeout(() => { rideau.dataset.etat = 'leve'; }, 60);   // filet sans rAF

  if (sobre) return;

  $$('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return;
    if (a.target === '_blank') return;

    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      rideau.dataset.etat = 'baisse';
      setTimeout(() => { location.href = href; }, 520);
    });
  });
}

/* ══ 15. Compteurs ══════════════════════════════════════════════════════ */
function monterLesCompteurs() {
  const cs = $$('[data-compte]');
  if (!cs.length) return;
  let restants = cs.slice();
  auDefilement(() => {
    if (!restants.length) return;
    const h = window.innerHeight;
    restants = restants.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top > h * 0.9) return true;
      const fin = parseFloat(el.dataset.compte);
      const debut = performance.now();
      const duree = 1400;
      const tour = () => {
        const t = borne((performance.now() - debut) / duree, 0, 1);
        const e = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(fin * e).toLocaleString('fr-FR');
        if (t < 1) requestAnimationFrame(tour);
      };
      tour();
      return false;
    });
  });
}

/* ══ Le son ═════════════════════════════════════════════════════════════ */
/* Coupe par defaut, et le module n'est meme pas telecharge tant que personne
   ne l'allume. Un son qui demarre tout seul est la pire chose qu'un site
   puisse faire ; un module audio charge pour rien est la deuxieme. */
let _son = null;

async function chargerLeSon() {
  if (_son) return _son;
  try { _son = await import('./son.js' + VERSION); } catch (e) { return null; }
  return _son;
}

function monterLeSon() {
  const bouton = $('[data-son]');
  if (!bouton) return;

  const peindre = (on) => {
    bouton.dataset.actif = on ? 'oui' : 'non';
    bouton.setAttribute('aria-pressed', on ? 'true' : 'false');
    bouton.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
  };
  peindre(false);

  /* Les declencheurs ne sont poses qu'une fois le son allume : inutile
     d'ecouter la moitie de la page pour un module qui ne repondra pas. */
  let branches = false;
  const brancher = (s) => {
    if (branches) return;
    branches = true;

    /* La hauteur suit la position horizontale de l'element. La barre se lit
       donc de gauche a droite comme un clavier, ce qui rend le survol
       coherent au lieu d'aleatoire. */
    $$('.nav__lien, .bouton, .nav__marque').forEach(el => {
      el.addEventListener('pointerenter', () => {
        const r = el.getBoundingClientRect();
        s.note(borne(r.left / Math.max(1, window.innerWidth), 0, 1), 0.55);
      });
    });

    /* Le franchissement du seuil est le seul moment qui merite un accord. */
    document.addEventListener('kazura:traversee', () => { s.souffler(2.4); s.accord(0.9); });
  };

  bouton.addEventListener('click', async () => {
    const s = await chargerLeSon();
    if (!s) return;
    const on = s.basculer();
    peindre(on);
    if (on) brancher(s);
  });

  /* Si le visiteur avait deja allume lors d'une visite precedente, on recharge
     son choix, mais le contexte audio, lui, attendra son premier geste : les
     navigateurs l'exigent, et ils ont raison. */
  let voulu = false;
  try { voulu = localStorage.getItem('kazura-son') === '1'; } catch (e) {}
  if (voulu) {
    chargerLeSon().then(s => {
      if (!s) return;
      s.reprendreLeChoix();
      peindre(true);
      brancher(s);
    });
  }
}

/* ══ Le choix du mouvement ══════════════════════════════════════════════ */
/* Un bandeau discret, propose UNE SEULE FOIS, et seulement a qui remplit les
   trois conditions : le systeme demande moins d'animations, le visiteur n'a
   jamais tranche, et l'adresse ne force rien.

   POURQUOI IL EXISTE. Sous Windows, `prefers-reduced-motion` suit le reglage
   « Effets d'animation », que beaucoup coupent pour gagner des images par
   seconde. Ces gens n'ont demande a personne de retirer le mouvement d'un site,
   ils ont demande a Windows de ne pas animer ses fenetres. Obeir en silence
   leur retire l'essentiel du travail sans qu'ils sachent qu'il existe.

   ON N'IGNORE PAS LA PREFERENCE POUR AUTANT : elle reste la valeur par defaut,
   et le bandeau ne fait que rendre le choix visible. C'est la difference entre
   passer outre et proposer. */
function monterLeChoixDuMouvement() {
  if (!sobre) return;                       // deja anime, rien a proposer
  if (_forceMouvement !== null) return;     // l'adresse tranche, on se tait
  if (_choix !== null) return;              // le visiteur a deja repondu
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const garder = (v) => {
    try { localStorage.setItem('kazura-mouvement', v); } catch (e) { /* mode prive */ }
  };

  const barre = document.createElement('aside');
  barre.className = 'mouvement';
  barre.setAttribute('role', 'region');
  barre.setAttribute('aria-label', 'Réglage des animations');
  barre.innerHTML =
    '<p class="mouvement__texte">Votre système demande <b>moins d’animations</b>, ' +
    'et nous l’avons suivi. Ce site en contient beaucoup, et le défilement y est ' +
    'normalement amorti.</p>' +
    '<div class="mouvement__actions">' +
      '<button type="button" data-oui>Les activer</button>' +
      '<button type="button" data-non class="mouvement__non">Garder ainsi</button>' +
    '</div>';

  $('[data-oui]', barre).addEventListener('click', () => {
    garder('1');
    /* On recharge : `sobre` est decide au chargement et parcourt tous les
       modules. Le basculer a chaud demanderait a chacun de savoir se remonter,
       pour un cas qui se produit une fois par visiteur. */
    location.reload();
  });
  $('[data-non]', barre).addEventListener('click', () => {
    garder('0');
    barre.dataset.parti = 'oui';
    setTimeout(() => barre.remove(), 500);
  });

  document.body.appendChild(barre);
  /* Une image d'attente, sinon la transition d'entree ne se declenche pas :
     l'element est insere et rendu visible dans la meme image. */
  requestAnimationFrame(() => { barre.dataset.la = 'oui'; });
}

/* ══ Le portail de pierre ═══════════════════════════════════════════════ */
/* Le seul module qui va chercher un fichier lourd. On ne le charge donc que
   lorsque sa section approche vraiment de l'ecran : le declencher au montage
   ferait payer 809 Ko a quelqu'un qui n'ira peut-etre jamais jusque la. */
async function monterLePortailSiPresent() {
  const toile = $('#toile-portail');
  if (!toile) return;
  const memoire = navigator.deviceMemory || 4;
  if (memoire <= 2) { toile.dataset.repli = 'oui'; return; }

  const figure = toile.closest('figure') || toile;
  let lance = false;

  const approche = auDefilement(() => {
    if (lance) return;
    const r = figure.getBoundingClientRect();
    if (r.top > window.innerHeight * 2.2) return;   // encore loin, on attend
    lance = true;
    abonnes.splice(abonnes.indexOf(approche), 1);   // ce guetteur a fini son travail
    charger();
  });

  async function charger() {
    try {
      const { monterLePortail } = await import('./portail.js' + VERSION);
      const p = await monterLePortail(toile);
      if (!p) { toile.dataset.repli = 'oui'; return; }
      (window.kazura ||= {}).portail = p;
      auDefilement(() => {
        const r = figure.getBoundingClientRect();
        p.montrer(r.bottom > -200 && r.top < window.innerHeight + 200);
      });
      toile.dataset.prete = 'oui';
    } catch (e) {
      console.warn('portail indisponible', e);
      toile.dataset.repli = 'oui';
    }
  }
}

/* ══ Le bonsai de jade ══════════════════════════════════════════════════ */
/* Le heros de la page d'accueil. Meme module que le portail : charger un
   fichier, le recentrer, le poser dans le ciel de la maison, le faire suivre le
   curseur. Seul le cadrage change, et il est passe en options.

   IL SE CHARGE APRES LE RESTE, et n'apparait qu'une fois pret. Un objet de
   1,2 Mo en tete de page ne doit jamais retarder l'affichage du titre : le
   visiteur lit KAZURA tout de suite, l'arbre arrive ensuite.

   DECALE A DROITE, volontairement. Un objet dense pose au centre mange un titre
   pose au centre, et c'est le titre qui doit gagner. */
async function monterLeBonsaiSiPresent() {
  const toile = $('#toile-bonsai');
  if (!toile) return;
  const memoire = navigator.deviceMemory || 4;
  if (memoire <= 2) { toile.dataset.repli = 'oui'; return; }

  try {
    const { monterLePortail } = await import('./portail.js' + VERSION);
    const b = await monterLePortail(toile, {
      fichier: 'modeles/bonsai.glb',
      /* Cadrage. Il etait centre et mangeait le mot KAZURA : un objet dense
         au centre et un titre au centre ne peuvent pas cohabiter. Pousse loin
         a droite, plus bas, et reduit. */
      echelle: 2.45,
      distance: 5.4,
      decalageX: 1.75,
      decalageY: -0.55,
      /* Le ciel de la maison porte deux barres blanches, faites pour allumer
         les aretes du verre. Sur une pierre mate elles delavent tout et le jade
         ressort gris. On baisse, et on ramene la couleur vers le jade. */
      envIntensite: 0.75,
      teinte: '#1FA97A',
      forceTeinte: 0.38
    });
    if (!b) { toile.dataset.repli = 'oui'; return; }
    (window.kazura ||= {}).bonsai = b;
    b.montrer(true);

    /* Il ne peint que tant que le hero est a l'ecran. Sans cet interrupteur il
       calcule sa scene entiere pendant tout le reste de la page. */
    const hero = $('.hero');
    auDefilement(() => {
      const r = hero.getBoundingClientRect();
      b.montrer(r.bottom > 0);
    });
    toile.dataset.prete = 'oui';
  } catch (e) {
    console.warn('bonsai indisponible', e);
    toile.dataset.repli = 'oui';
  }
}

/* ══ Le formulaire ══════════════════════════════════════════════════════ */
/* Il n'y a pas de serveur derriere ce site, et il n'y en aura pas pour un
   formulaire par semaine. L'envoi ouvre donc le courrielleur du visiteur avec
   le message deja ecrit : rien a heberger, rien a maintenir, aucune donnee
   qui transite par un tiers.

   LIMITE A CONNAITRE. Sur un poste sans courrielleur configure, le clic ne
   fait rien de visible. On affiche donc TOUJOURS l'adresse en clair apres
   l'envoi, pour que la personne puisse copier son message a la main. Un
   formulaire qui avale une demande en silence est pire que pas de formulaire. */
const COURRIEL = 'bonjour@kazura.fr';

function monterLeFormulaire() {
  const form = $('[data-formulaire]');
  if (!form) return;
  const note = $('[data-note]', form);

  form.addEventListener('submit', e => {
    e.preventDefault();
    form.dataset.teste = 'oui';

    /* `novalidate` coupe les bulles du navigateur, qui sont laides et
       illisibles sur fond sombre. On garde la validation, pas son affichage. */
    const fautif = form.querySelector(':invalid');
    if (fautif) {
      note.dataset.ton = 'faute';
      note.textContent = fautif.type === 'checkbox'
        ? 'Il manque la dernière case.'
        : 'Il manque une réponse un peu plus haut.';
      fautif.focus({ preventScroll: true });
      fautif.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const v = n => (form.elements[n]?.value || '').trim();
    const lignes = [
      ['Nom', v('nom')], ['Métier', v('metier')], ['Ville', v('ville')],
      ['Où me joindre', v('contact')], ['Site actuel', v('site')],
      ['Budget', v('budget')], ['', ''], ['Le site dont je rêve', ''],
      ['', v('reve')]
    ];
    const corps = lignes
      .map(([cle, val]) => (cle && val) ? `${cle} : ${val}` : (val || ''))
      .join('\n');

    const url = 'mailto:' + COURRIEL
      + '?subject=' + encodeURIComponent('Demande de maquette · ' + v('nom'))
      + '&body=' + encodeURIComponent(corps);

    delete note.dataset.ton;
    note.textContent = 'Votre messagerie s’ouvre. Si rien ne se passe, écrivez à ' + COURRIEL + '.';
    location.href = url;
  });

  /* La faute s'efface des qu'on repond, sans attendre un second envoi. */
  form.addEventListener('input', () => {
    if (note.dataset.ton === 'faute' && !form.querySelector(':invalid')) {
      delete note.dataset.ton;
      note.textContent = '';
    }
  });
}

/* ══ Le sceau de verre ══════════════════════════════════════════════════ */
/* Le blason extrude et rendu en verre, image par image. Le module remplace la
   photo qui tenait cette place : c'est le meme signe, mais calcule.
   Le telephone en est dispense. La refraction demande un second rendu complet
   de la scene a chaque image, et sur un petit appareil elle mangerait le
   defilement de toute la page pour un objet de la taille d'une vignette. */
async function monterLeSceauSiPresent() {
  const toile = $('#toile-sceau');
  if (!toile) return;
  if (tactile && window.innerWidth < 700) { toile.dataset.repli = 'oui'; return; }

  try {
    const { monterLeSceau } = await import('./sceau.js' + VERSION);
    const s = monterLeSceau(toile);
    if (!s) { toile.dataset.repli = 'oui'; return; }
    (window.kazura ||= {}).sceau = s;

    /* Meme piege que pour la scene principale : sans interrupteur explicite le
       verre continue de calculer sa refraction en bas de page. */
    const figure = toile.closest('figure') || toile;
    s.montrer(false);
    auDefilement(() => {
      const r = figure.getBoundingClientRect();
      s.montrer(r.bottom > -200 && r.top < window.innerHeight + 200);
    });
    toile.dataset.prete = 'oui';
  } catch (e) {
    console.warn('sceau indisponible', e);
    toile.dataset.repli = 'oui';
  }
}

/* ══ Le mot cale a la largeur ═══════════════════════════════════════════ */
/* Archivo porte un axe de chasse continu, de 62 a 125 pour cent. Plutot que
   deviner un corps en vw qui laisse deux marges vides sur grand ecran et
   deborde sur petit, on mesure et on ouvre les lettres jusqu'a ce que le mot
   touche ses deux bords. Le corps reste celui du CSS : le mot garde la meme
   presence verticale d'un ecran a l'autre, c'est sa largeur qui absorbe la
   difference. C'est la raison d'etre du choix d'Archivo, pas un ornement.

   La mesure passe par un Range et non par scrollWidth : l'element est une
   grille centree, la largeur de sa boite ne dit rien de celle de son texte. */
function largeurDuTexte(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect().width;
}

function calerUnGeant(el) {
  const dispo = el.clientWidth;
  if (dispo < 40) return;                      // pas encore mis en page
  const cible = dispo * 0.995;

  el.style.fontSize = '';                      // on repart toujours du corps CSS
  const corpsCss = parseFloat(getComputedStyle(el).fontSize);

  let bas = 62, haut = 125;
  for (let i = 0; i < 9; i++) {
    const milieu = (bas + haut) / 2;
    el.style.fontStretch = milieu + '%';
    if (largeurDuTexte(el) > cible) haut = milieu; else bas = milieu;
  }
  el.style.fontStretch = bas.toFixed(2) + '%';

  /* Quand l'axe sature il reste un ecart. A chasse fixe la largeur est
     proportionnelle au corps : un seul produit le referme exactement. On borne
     pour que le mot ne devienne ni minuscule ni plus haut que sa boite. */
  const reste = largeurDuTexte(el);
  if (Math.abs(reste - cible) > 1 && reste > 1) {
    const hMax = el.clientHeight || Infinity;
    const voulu = corpsCss * borne(cible / reste, 0.7, 1.45);
    el.style.fontSize = Math.min(voulu, hMax).toFixed(2) + 'px';
  }
}

function monterLesGeants() {
  const els = $$('.geant');
  if (!els.length) return;

  let derniere = -1, prevu = false;
  const caler = () => {
    prevu = false;
    derniere = innerWidth;
    els.forEach(calerUnGeant);
  };
  /* Neuf mesures par element forcent autant de recalculs de style. Au
     redimensionnement on ne les paie qu'une fois par image, et seulement si la
     largeur a vraiment bouge : sur mobile la barre d'adresse qui se retracte
     declenche un resize a chaque pixel de defilement. */
  const prevoir = () => {
    if (prevu || innerWidth === derniere) return;
    prevu = true;
    requestAnimationFrame(caler);
  };

  caler();
  /* Caler avant l'arrivee de la fonte reviendrait a mesurer le repli systeme,
     et a garder ce calage faux pour toute la session. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(caler);
  window.addEventListener('resize', prevoir);
}

/* ══ Demarrage ══════════════════════════════════════════════════════════ */
function demarrer() {
  monterLeSeuil();
  monterLesTransitions();
  monterLeDefilement();
  monterLesApparitions();
  monterLaParallaxe();
  monterLEpinglage();
  monterLeScrub();
  monterLesBandeaux();
  monterLaBarre();
  monterLeCurseur();
  monterLesCartes();
  monterLesImages();
  monterLesCompteurs();
  monterLesGeants();
  monterLaScene3D();
  monterLAtelierSiPresent();
  monterLEncreSiPresente();
  monterLeJardinSiPresent();
  monterLeMiroirSiPresent();
  monterLeSceauSiPresent();
  monterLePortailSiPresent();
  monterLeFormulaire();
  monterLeBonsaiSiPresent();
  monterLeSon();
  monterLeChoixDuMouvement();
  monterLeMotSiPresent();

  const annee = $('[data-annee]');
  if (annee) annee.textContent = new Date().getFullYear();

  requestAnimationFrame(battre);

  /* rAF ne tourne pas dans un onglet masque : au retour, on rattrape. */
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pas(); });

  // Poignee de service : un pas manuel, pour verifier ou deboguer.
  window.kazura = Object.assign(window.kazura || {}, { pas, glisse, abonnes });

  document.documentElement.dataset.pret = 'oui';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}
