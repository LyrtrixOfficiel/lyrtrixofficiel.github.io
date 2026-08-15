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
const _forceMouvement = new URLSearchParams(location.search).get('mouvement');
const sobre = _forceMouvement === '1' ? false
            : _forceMouvement === '0' ? true
            : matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;
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
      const cale = r.top <= 0
        ? (r.bottom >= h ? -r.top : course)
        : 0;
      dedans.style.transform = 'translate3d(0,' + cale.toFixed(1) + 'px,0)';
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

  // Le telephone n'a pas le budget : on lui laisse l'image de fond du CSS.
  if (tactile && window.innerWidth < 700) { toile.dataset.repli = 'oui'; return; }

  try {
    const { monterLaScene } = await import('./scene.js');
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
    const { monterLAtelier } = await import('./atelier.js');
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
      const { monterLEncre } = await import('./fluide.js');
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
    const { monterLAtelier } = await import('./atelier.js');
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
    const { monterLeJardin } = await import('./jardin.js');
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
    const { monterLeMiroir } = await import('./miroir.js');
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
    const { monterLeMot } = await import('./mot-webgl.js');
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
    if (cible >= 0.995) franchir();
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
  });
  if (invite) invite.addEventListener('click', () => { cible = 1; });

  /* L'ouverture est amortie, et le retour a zero aussi : si on lache avant la
     fin, le portail se referme doucement au lieu de rester entrouvert. */
  let dernier = performance.now();
  (function animer() {
    const n = performance.now();
    const dt = Math.min((n - dernier) / 1000, 1 / 20);
    dernier = n;
    if (!fini && ouvrable && !px && cible < 1) cible = Math.max(0, cible - dt * 0.35);
    const k = 1 - Math.pow(1 - 0.16, dt * 60);
    ouvre += (cible - ouvre) * k;
    ecran.style.setProperty('--ouvre', ouvre.toFixed(4));
    if (ouvre > 0.985 && cible >= 1) franchir();
    if (!fini) requestAnimationFrame(animer);
  })();
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
