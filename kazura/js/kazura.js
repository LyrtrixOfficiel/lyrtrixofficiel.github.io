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
/* ══ LE MODE TELEPHONE FORCE ═══════════════════════════════════════════
   `?telephone=1` fait croire au moteur qu'il tourne sur un vrai telephone :
   pas de survol, pointeur grossier, peu de memoire.

   POURQUOI CET INTERRUPTEUR EXISTE. Matheo a regarde le site sur son
   telephone et n'a RIEN vu, alors que tous mes essais passaient. La raison
   est simple : une fenetre etroite sur un ordinateur n'est pas un telephone.
   Elle a le survol, elle a de la memoire, elle n'a pas le mouvement reduit.
   Je testais donc une chose et j'en livrais une autre.

   Cet interrupteur ne change RIEN pour un visiteur : il faut l'ecrire dans
   l'adresse. Il sert a ce qu'on ne puisse plus jamais livrer un telephone
   casse sans le savoir. */
const _telephoneForce = new URLSearchParams(location.search).get('telephone') === '1';
const tactile = _telephoneForce || matchMedia('(hover: none)').matches;
const memoireMachine = _telephoneForce ? 2 : (navigator.deviceMemory || 4);
const coeursMachine  = _telephoneForce ? 4 : (navigator.hardwareConcurrency || 4);

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

/* `pas(force)` accepte une position IMPOSEE, en pixels.

   Elle n'existe que pour les controles automatiques. Un panneau de navigateur
   qui ne compose pas rend innerHeight a zero et refuse de defiler : impossible
   alors d'amener une piece a l'ecran, donc impossible de verifier une piece
   qui se charge paresseusement. Sans cette porte, tout mon audit s'arretait a
   « jamais montee » sur une piece qui marche parfaitement.

   Un visiteur ne peut pas l'atteindre : il faudrait appeler la fonction a la
   main depuis la console. */
function pas(force) {
  const brut = force !== undefined ? force : (window.scrollY || document.documentElement.scrollTop);

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

/* ══ 9 quater. La pousse ════════════════════════════════════════════════ */
/* L'idee qui tient le site : la maison POUSSE pendant qu'on la visite, et
   elle ne recommence pas a zero d'une page a l'autre. Le detail du calcul est
   dans pousse.js ; ici on ne fait que la brancher sur ce qui doit en dependre.

   ELLE SE CHARGE MEME EN MODE SOBRE. Une preference de mouvement demande de
   ne pas AGITER, elle ne demande pas de retirer le contenu : les lianes
   arrivent alors sans transition, posees d'un coup a leur hauteur. Couper la
   chose entiere reviendrait a punir celui qui a demande du calme. */
async function monterLaPousseDuSite() {
  try {
    const { monterLaPousse, monterLesLianesDeMarge, monterLesVrilles } = await import('./pousse.js' + VERSION);
    const p = monterLaPousse();
    (window.kazura ||= {}).pousse = p;

    const nom = location.pathname.split('/').pop() || 'index';
    const lianes = monterLesLianesDeMarge(nom);
    /* Les vrilles attendent la mise en page : posees avant, elles se
       placeraient au bout d'un titre qui n'a pas encore sa largeur finale. */
    const vrilles = monterLesVrilles();

    /* La marque dans la barre. Posee par le code et non dans les huit pages :
       une chose qui doit exister partout n'a pas a etre recopiee partout. */
    const nav = $('.nav');
    let marque = null;
    if (nav) {
      marque = document.createElement('span');
      marque.className = 'nav__pousse';
      marque.setAttribute('aria-hidden', 'true');
      marque.innerHTML = '<i></i>';
      nav.insertBefore(marque, $('.nav__son', nav) || null);
    }

    /* ══ LE DECOR SE RETIRE DEVANT UNE PIECE ═════════════════════════════
       Sur l'accueil, trois systemes de lianes tournaient EN MEME TEMPS : la
       scene en trois dimensions derriere les chapitres, les lianes de marge,
       et la trace du curseur. Chacune est defendable seule ; ensemble elles
       font le « deluge vert » que Matheo decrit, et surtout elles se volent
       l'attention au lieu de se la passer.

       Les lianes de marge s'effacent donc tant que la zone de la scene occupe
       l'ecran, et reviennent apres. C'est une decision de direction, pas un
       reglage : quand une piece forte tient l'ecran, tout le reste se tait. */
    const zone = $('[data-scene-zone]');
    if (zone) {
      const decor = $('.lianes-marge');
      if (decor) auDefilement(() => {
        const r = zone.getBoundingClientRect();
        const dessus = r.top < innerHeight * 0.55 && r.bottom > innerHeight * 0.45;
        decor.dataset.efface = dessus ? 'oui' : 'non';
      });
    }

    const mots = { graine: 'À peine semé', jeune: 'Ça pousse', fournie: 'Ça prend', envahie: 'Envahi' };
    p.surPousse(v => {
      lianes?.rendre(v);
      vrilles?.rendre(v);
      if (marque) marque.dataset.dire = mots[document.documentElement.dataset.pousse] || '';
      /* La scene 3D en tient compte : plus on a visite, plus il y a de lianes
         qui poussent derriere le texte. */
      window.kazura?.scene?.densite?.(v);
    });
  } catch (e) {
    console.warn('pousse indisponible', e);
  }
}

/* ══ 9 ter. La transition entre pages ═══════════════════════════════════ */
/* La transition elle-meme est declaree dans la feuille de style, en une regle,
   et c'est le navigateur qui fait tout le travail : aucun routeur, aucune
   bibliotheque, huit fichiers HTML qui restent huit fichiers HTML.

   Il ne reste qu'une chose a faire ici, l'annuler quand la maison a decide le
   mode sobre. Une regle at-rule ne se conditionne pas a un attribut, mais
   l'evenement d'ouverture donne la main sur la transition en cours. */
addEventListener('pagereveal', e => {
  if (document.documentElement.dataset.mouvement !== 'anime') e.viewTransition?.skipTransition();
});

/* ══ 9 bis. L'ELAN, RETIRE ═════════════════════════════════════════════
   J'avais accroche la CHASSE des grandes phrases a la vitesse de defilement :
   les lettres se resserraient quand on descendait vite. Sur le papier c'etait
   joli. A l'ecran c'etait un defaut, et Matheo l'a decrit exactement :
   « les animations de texte se reinitialisent en boucle ».

   Deux raisons, et les deux sont de moi. Un, la valeur etait reecrite a chaque
   image, donc chaque titre etait remis en page soixante fois par seconde,
   lettre par lettre puisqu'ils sont decoupes en spans. Deux, l'elan monte et
   redescend a chaque coup de molette, donc le texte respirait sans arret sans
   qu'on comprenne pourquoi.

   Une typographie qui bouge doit servir la lecture. Celle-la la genait. */

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
  /* ══ L'ANNEAU AUTOUR DE LA SOURIS EST RETIRE ═══════════════════════════
     Verdict de Matheo, sans appel : « un petit rond autour de ma souris,
     c'est assez nul ». Il a raison et la raison est simple : un curseur
     personnalise ne se justifie que s'il DIT quelque chose que le curseur du
     systeme ne dit pas. Le notre grossissait sur les liens, ce que le
     curseur du systeme fait deja en devenant une main. Il ne restait donc
     qu'un anneau qui suit la main avec du retard, c'est-a-dire un curseur
     moins precis que celui qu'on avait avant.

     Ce qui reste ici : les boutons magnetiques, eux, ajoutent bien quelque
     chose. */
  if (tactile || sobre) return;
  const AVEC_ANNEAU = false;
  if (!AVEC_ANNEAU) { monterLesAimants(); return; }
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

  monterLesAimants();
}

/* Les boutons qui viennent a la main. Sortis du curseur pour survivre a son
   retrait : ils n'ont jamais eu de rapport avec lui. */
function monterLesAimants() {
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

/* ══ 11 bis. LA TRACE ═══════════════════════════════════════════════════
   La souris laisse pousser une liane derriere elle, qui se fane en une
   seconde et demie.

   POURQUOI CA VAUT LE COUP. Une trainee de curseur, on en a vu ; une trainee
   qui est une TIGE, avec des feuilles qui s'ouvrent tous les cinquante
   pixels et qui fanent en partant, on n'en voit pas. Et surtout, c'est le
   sujet meme de la maison : le visiteur fait pousser du kudzu rien qu'en
   bougeant la main, sur toutes les pages, en permanence.

   ELLE EST DESSINEE EN DEUX DIMENSIONS, pas en WebGL. Un trait qui vit une
   seconde et demie ne justifie pas un contexte graphique de plus, et une
   toile 2D se contente de ce qu'on lui demande. Le cout tient en une
   centaine de segments par image.

   ELLE S'EFFACE PENDANT LE DEFILEMENT. Une trainee accrochee a l'ecran alors
   que le contenu glisse dessous se lit comme une salissure : elle n'appartient
   plus a rien. On la coupe donc des que la page bouge, et on la laisse
   revenir des que la main reprend la main. */
function monterLaTrace() {
  if (tactile || sobre) return;

  const toile = document.createElement('canvas');
  toile.className = 'trace';
  toile.setAttribute('aria-hidden', 'true');
  document.body.appendChild(toile);
  const g = toile.getContext('2d');
  if (!g) return;

  let L = 0, H = 0, def = 1;
  const mesurer = () => {
    def = Math.min(devicePixelRatio || 1, 2);
    L = innerWidth; H = innerHeight;
    toile.width = Math.round(L * def);
    toile.height = Math.round(H * def);
    g.setTransform(def, 0, 0, def, 0, 0);
  };
  mesurer();
  addEventListener('resize', mesurer);

  const VIE = 0.95;                 /* secondes avant disparition complete */
  const PAS_FEUILLE = 78;           /* pixels entre deux feuilles */
  const points = [];
  const feuilles = [];
  let depuis = 0, dernierX = 0, dernierY = 0, aDejaBouge = false;
  let gele = 0;                     /* horodatage du dernier defilement */
  let vide = true;                  /* la toile est-elle deja nettoyee */

  addEventListener('pointermove', e => {
    const t = performance.now() / 1000;
    const x = e.clientX, y = e.clientY;
    if (aDejaBouge) {
      const d = Math.hypot(x - dernierX, y - dernierY);
      /* Un point tous les trois pixels au minimum : sans ce filtre, une
         souris rapide en depose deux cents par image et le trait devient
         une bouillie de segments superposes. */
      if (d < 3) return;
      depuis += d;
      if (depuis >= PAS_FEUILLE) {
        depuis = 0;
        feuilles.push({
          x, y, t,
          a: Math.atan2(y - dernierY, x - dernierX) + (Math.random() > 0.5 ? 1 : -1) * 0.95,
          r: 4.5 + Math.random() * 3.5
        });
      }
    }
    dernierX = x; dernierY = y; aDejaBouge = true;
    points.push({ x, y, t });
  }, { passive: true });

  auDefilement((y, p, v) => { if (Math.abs(v) > 0.6) gele = performance.now() / 1000; });

  function peindre() {
    const t = performance.now() / 1000;

    while (points.length && t - points[0].t > VIE) points.shift();
    while (feuilles.length && t - feuilles[0].t > VIE) feuilles.shift();

    /* ON NE NETTOIE PAS UNE TOILE DEJA VIDE. Sans ce garde-fou, la boucle
       effacait quatre millions de pixels soixante fois par seconde meme
       quand la souris n'avait pas bouge depuis une minute. Une animation au
       repos doit couter zero, sinon elle fait chauffer la machine de
       quelqu'un qui est simplement en train de lire. */
    if (vide && !points.length) return;
    g.clearRect(0, 0, L, H);
    vide = !points.length;
    /* Un dixieme de seconde apres le dernier cran de molette, la trace
       revient. Assez pour qu'elle ne clignote pas, assez peu pour qu'elle ne
       manque pas a la main qui reprend. */
    if (t - gele < 0.12 || points.length < 3) return;

    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const age = (t - b.t) / VIE;            /* 0 tout frais, 1 fane */
      const vif = 1 - age;
      /* La tige s'affine vers la queue, et vire du jade au violet en fanant :
         c'est le meme degrade que partout ailleurs sur le site. */
      /* UNE TEINTE SOURDE, ET DISCRETE. La premiere version tracait en jade
         vif a moitie opaque : sur quatre pages de visite, avec les lianes de
         marge et les vrilles, l'ecran devenait vert. Un decor doit se voir
         quand on le cherche, pas quand on lit. */
      g.strokeStyle = 'rgba(' + Math.round(120 + 40 * age) + ','
                    + Math.round(186 - 40 * age) + ','
                    + Math.round(160 + 30 * age) + ',' + (vif * 0.30).toFixed(3) + ')';
      g.lineWidth = 0.4 + vif * 1.5;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }

    for (const f of feuilles) {
      const age = (t - f.t) / VIE, vif = 1 - age;
      /* Elle s'ouvre en un quart de sa vie puis se ferme : une feuille qui
         apparait a sa taille finale a l'air collee, pas poussee. */
      const ouvre = Math.min(1, (t - f.t) / (VIE * 0.22));
      const r = f.r * ouvre * (0.35 + 0.65 * vif);
      g.save();
      g.translate(f.x, f.y);
      g.rotate(f.a);
      /* La meme anatomie que partout ailleurs : deux courbes qui se
         rejoignent en pointe, et une nervure. Une ellipse ne fait pas une
         feuille, elle fait une pastille. */
      const l = r * 2.1;
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(l * 0.21, -r * 0.62, l * 0.64, -r * 0.84, l, -r * 0.08);
      g.bezierCurveTo(l * 0.64, r * 0.72, l * 0.21, r * 0.60, 0, 0);
      g.closePath();
      g.fillStyle = 'rgba(34,74,60,' + (vif * 0.30).toFixed(3) + ')';
      g.fill();
      g.strokeStyle = 'rgba(126,190,162,' + (vif * 0.34).toFixed(3) + ')';
      g.lineWidth = 0.7;
      g.stroke();
      g.beginPath();
      g.moveTo(l * 0.05, 0);
      g.bezierCurveTo(l * 0.36, -r * 0.16, l * 0.68, -r * 0.16, l * 0.94, -r * 0.09);
      g.strokeStyle = 'rgba(150,205,180,' + (vif * 0.22).toFixed(3) + ')';
      g.lineWidth = 0.5;
      g.stroke();
      g.restore();
    }
  }

  (function battre() { requestAnimationFrame(battre); peindre(); })();

  /* La poignee de reglage passe par le CHEMIN NORMAL de peinture : ce qu'elle
     montre est ce que la page dessine. Elle sert quand l'onglet n'est pas au
     premier plan, cas ou le navigateur gele les images et ou une toile vide ne
     prouve rien du tout. */
  (window.kazura ||= {}).trace = {
    peindreUneFois: peindre,
    bilan: () => ({ points: points.length, feuilles: feuilles.length, toile: [toile.width, toile.height] })
  };
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
  /* ══ ON ALLEGE, ON NE REMPLACE PAS ═════════════════════════════════════
     Une machine modeste recevait une PHOTOGRAPHIE a la place du monde. Le
     site devenait alors une autre chose, beaucoup plus pauvre, et c'est
     exactement ce que Matheo a vu sur son telephone.

     Un monde a trois lianes vaut infiniment mieux qu'une image fixe : il
     bouge, il repond, il prouve. On ne garde le repli que pour ce qui ne peut
     vraiment pas, c'est-a-dire l'absence de WebGL. */
  const faible = memoireMachine <= 2 || coeursMachine <= 2;
  if (!document.createElement('canvas').getContext('webgl2')
      && !document.createElement('canvas').getContext('webgl')) {
    toile.dataset.repli = 'oui';
    return;
  }

  try {
    const { monterLaScene } = await import('./scene.js' + VERSION);
    const scene = monterLaScene(toile, { faible });
    /* Exposee pour pouvoir la regarder depuis la console : sans poignee, une
       piece qui ne s'affiche pas ne se distingue pas d'une piece absente. */
    (window.kazura ||= {}).scene = scene;
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

/* ══ 14 ter. La nuee ════════════════════════════════════════════════════ */
/* Le nom du studio n'est plus ecrit : il est tenu par 262 144 particules
   simulees sur la carte graphique, qui se dispersent quand on descend.

   ELLE PASSE AVANT LE MOT DESSINE, et le remplace quand elle tient. Le mot en
   WebGL reste, cache, comme repli : la nuee demande de savoir peindre dans des
   textures a virgule flottante, ce que toutes les machines ne savent pas
   faire, et personne ne doit jamais voir un rectangle vide a la place du nom
   de la maison. */
async function monterLaNueeSiPresente() {
  const toile = $('#toile-nuee');
  if (!toile) { monterLeMotSiPresent(); return; }

  const sobre = document.documentElement.dataset.mouvement !== 'anime';
  /* ══ LA NUEE EXISTE SUR TELEPHONE, ET MEME EN MODE SOBRE ═══════════════
     Elle etait coupee dans les deux cas, et c'est la cause principale du
     « je n'ai rien vu » de Matheo. Deux erreurs de jugement de ma part.

     UNE PREFERENCE DE MOUVEMENT DEMANDE DE NE PAS AGITER, elle ne demande pas
     de vider la page. Un mot tenu par des particules IMMOBILES n'est pas une
     animation, c'est une image, et c'est une bien plus belle image qu'un
     texte en degrade. On la monte donc, et on la fige.

     ET LA MEMOIRE N'EST PAS LE BON CRITERE. iOS ne publie pas deviceMemory du
     tout, donc on lisait la valeur par defaut et on decidait sur du vent. Ce
     qui compte est la CAPACITE REELLE : savoir peindre dans une texture a
     virgule flottante. Si la machine sait, elle peut ; sinon le mot dessine
     reprend sa place. On demande a la machine plutot que de la deviner. */
  const essai = document.createElement('canvas').getContext('webgl2');
  const sait = !!(essai && essai.getExtension('EXT_color_buffer_float'));
  if (!sait) { toile.hidden = true; monterLeMotSiPresent(); return; }

  try {
    const { monterLaNuee } = await import('./nuee.js' + VERSION);
    const nuee = await monterLaNuee(toile);
    if (!nuee) { toile.hidden = true; monterLeMotSiPresent(); return; }
    (window.kazura ||= {}).nuee = nuee;

    toile.closest('.mot3d')?.setAttribute('data-prete', 'oui');
    toile.dataset.vive = 'oui';

    /* En mode sobre, la nuee tient le mot et n'en bouge plus. Pas
       d'abonnement au defilement, donc pas de dispersion. */
    if (sobre) { nuee.tenir(1); return; }

    const hero = toile.closest('.hero') || toile.parentElement;
    auDefilement(() => {
      const r = hero.getBoundingClientRect();
      /* Le mot est tenu tant que le heros occupe l'ecran, et se defait a
         mesure qu'il sort. Remonter le rassemble. Le plateau en haut compte :
         sans lui, la position de repos la plus frequente serait un mot a
         moitie forme, donc illisible pile a l'arrivee. */
      const dedans = borne((r.bottom - innerHeight * 0.18) / (innerHeight * 0.62), 0, 1);
      nuee.tenir(borne(dedans * 1.18, 0, 1));
      nuee.montrer(r.bottom > -60);
    });
  } catch (e) {
    console.warn('nuee indisponible', e);
    toile.hidden = true;
    monterLeMotSiPresent();
  }
}

/* ══ 14 ter bis. La feuille ═════════════════════════════════════════════ */
/* Une vraie feuille de kudzu, qui tourne au defilement pendant que trois
   phrases se relaient autour d'elle. Elle a remplace trois sections qui
   prenaient un ecran plein chacune pour une phrase.

   ELLE SE CHARGE APRES LE RESTE. 2,4 Mo, dont 1,8 de matiere : le visiteur
   doit avoir lu le nom du studio bien avant que la feuille n'arrive. */
async function monterLaFeuilleSiPresente() {
  const toile = $('#toile-feuille');
  if (!toile) return;
  const section = toile.closest('.feuille');

  try {
    const { monterLaFeuille } = await import('./feuille.js' + VERSION);
    const f = await monterLaFeuille(toile, { version: VERSION, nom: 'PUERARIA_MONTANA', poidsKo: 2431 });
    if (!f) { toile.hidden = true; return; }
    (window.kazura ||= {}).feuille = f;
    toile.dataset.prete = 'oui';

    const phrases = $$('.feuille__mots .grand', section);

    auDefilement(() => {
      const r = section.getBoundingClientRect();
      const course = Math.max(1, r.height - window.innerHeight);
      const p = borne(-r.top / course, 0, 1);
      f.avancer(p);
      f.montrer(r.bottom > 0 && r.top < window.innerHeight);

      /* Trois phrases sur la course, avec un PLATEAU au milieu de chacune.
         Sans plateau, la position de repos la plus frequente est un texte a
         demi efface : la lecon de la vitrine de Destef, payee une fois. */
      const n = phrases.length;
      phrases.forEach((el, i) => {
        const centre = (i + 0.5) / n;
        const dist = Math.abs(p - centre);
        el.dataset.lue = dist < (0.5 / n) * 0.86 ? 'oui' : 'non';
      });
    });
  } catch (e) {
    console.warn('feuille indisponible', e);
    toile.hidden = true;
  }
}

/* ══ 14 quater. Le mot en WebGL, desormais le repli de la nuee ══════════ */
async function monterLeMotSiPresent() {
  const toile = $('#toile-mot');
  if (!toile) return;
  toile.hidden = false;
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
    /* UNE HAUTEUR DE FENETRE NULLE NE DOIT JAMAIS CACHER DU CONTENU. Certains
       contextes rendent innerHeight a zero : un panneau de navigateur qui ne
       compose pas, une impression, un cadre sans dimension. La porte du
       chargement paresseux se refermait alors pour toujours et la piece
       n'arrivait jamais. Une valeur de repli vaut mieux qu'une porte bloquee,
       et le pire qu'elle puisse faire est de charger un peu trop tot. */
    const hauteur = window.innerHeight || document.documentElement.clientHeight || 800;
    if (r.top > hauteur * 2.2) return;   // encore loin, on attend
    lance = true;
    abonnes.splice(abonnes.indexOf(approche), 1);   // ce guetteur a fini son travail
    charger();
  });

  /* Le chargement paresseux, ouvrable a la demande. Il sert au controle
     automatique : dans un panneau sans fenetre, on ne peut pas approcher la
     piece, donc on ne peut pas la verifier. Un visiteur ne peut pas
     l'atteindre, il faudrait appeler la fonction a la main. */
  (window.kazura ||= {}).forcerPortail = () => { if (!lance) { lance = true; charger(); } };

  async function charger() {
    try {
      const { monterLePortail } = await import('./portail.js' + VERSION);
      const p = await monterLePortail(toile, {
        version: VERSION,
        nom: 'PORTAIL_DE_LUNE',
        poidsKo: 809,
        gainPct: 92
      });
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
/* RETIRE DU HEROS le 17 aout, a la demande de Matheo. Le jugement etait juste
   et vaut d'etre garde : un bel objet pose au fond d'une page d'accueil, sans
   raison d'etre la, ne demontre rien. Le visiteur ne se demande pas comment
   c'est fait, il se demande ce que ca vient faire.

   Le modele et le module restent, ils serviront dans une vitrine ou l'objet
   aura un role. La fonction n'est plus appelee. */
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
  /* LA TRACE, LES LIANES DE MARGE ET LES VRILLES SONT RETIREES. Trois systemes
     que j'avais construits en une nuit et dont j'etais fier. Verdict de Matheo :
     « et surtout, ce n'etait pas particulierement beau ».

     La regle tiree d'igloo.inc, qui n'a AUCUNE decoration : chaque pixel y est
     soit le monde, soit une information sur le monde. Un element qui n'est ni
     l'un ni l'autre s'en va. Les trois etaient de la decoration pure : elles ne
     disaient rien, ne prouvaient rien, ne vendaient rien.

     Le code reste sur le disque, il ne se monte plus. */
  monterLesCartes();
  monterLesImages();
  monterLesCompteurs();
  monterLesGeants();
  monterLaScene3D();
  monterLAtelierSiPresent();
  /* L'encre ne se monte plus sur l'accueil, la piece a ete retiree. */
  monterLEncreSiPresente();
  monterLeMiroirSiPresent();
  monterLeSceauSiPresent();
  monterLePortailSiPresent();
  monterLeFormulaire();
  monterLeSon();
  monterLeChoixDuMouvement();
  monterLaNueeSiPresente();
  monterLaFeuilleSiPresente();

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
