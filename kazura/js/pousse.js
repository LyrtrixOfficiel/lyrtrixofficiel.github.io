/* ══════════════════════════════════════════════════════════════════════════
   LA POUSSE
   --------------------------------------------------------------------------
   L'IDEE QUI TIENT TOUT LE SITE, et la seule chose de cette maison que je
   n'aie vue nulle part ailleurs.

   Kazura veut dire kudzu : la liane qui recouvre ce qu'elle touche. Un site
   qui porte ce nom ne doit pas se contenter d'en dessiner. Il doit POUSSER
   pendant qu'on le visite. Alors des lianes montent le long des marges, et
   elles ne recommencent pas a zero quand on change de page : elles reprennent
   ou elles en etaient. On arrive sur un site presque nu ; au bout de quelques
   pages, il est envahi.

   POURQUOI CA VAUT MIEUX QU'UN EFFET DE PLUS. Un effet se regarde une fois.
   Ceci se REMARQUE, plus tard, et cette seconde-la vaut tous les effets : le
   visiteur comprend d'un coup que quelqu'un a pense a lui pendant plus de dix
   secondes. C'est aussi la demonstration exacte de ce qu'on vend, et elle ne
   coute presque rien a calculer.

   LA MEMOIRE EST CELLE DE LA SESSION, jamais du disque. Rien ne suit personne
   d'un jour sur l'autre, rien n'est envoye nulle part, et l'onglet ferme
   emporte tout. Un site qui se souvient de vous doit d'abord etre un site qui
   vous oublie.
   ══════════════════════════════════════════════════════════════════════════ */

const CLE = 'kazura-pousse';
const abonnes = [];
let pousse = 0;

/* ── La memoire ────────────────────────────────────────────────────────── */
function lire() {
  try {
    const v = parseFloat(sessionStorage.getItem(CLE));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  } catch (e) { return 0; }          /* navigation privee, ou stockage refuse */
}
function ecrire(v) {
  try { sessionStorage.setItem(CLE, v.toFixed(4)); } catch (e) {}
}

/* ══ CE QUI FAIT POUSSER ═════════════════════════════════════════════════
   Trois sources, et le dosage compte plus que la formule.

   L'ARRIVEE SUR UNE PAGE donne le plus gros pas, parce que c'est le geste qui
   dit l'interet : quelqu'un qui ouvre quatre pages en veut vraiment.

   LE DEFILEMENT vient ensuite, compte en hauteurs d'ecran parcourues, jamais
   en pixels : une page longue ne doit pas peser plus qu'une page dense.

   LE TEMPS ferme la marche, tres lentement. Il n'est la que pour qu'une page
   qu'on lit sans bouger avance quand meme, et il est plafonne : un onglet
   oublie pendant une heure ne doit pas revenir couvert de feuilles, sinon le
   signal ne veut plus rien dire. */
const PAS_PAGE   = 0.115;
const PAS_ECRAN  = 0.020;
const PAS_SECONDE = 0.0016;
const TEMPS_MAX  = 150;              /* deux minutes et demie par page */

export function monterLaPousse() {
  pousse = lire();

  /* Le pas d'arrivee, une seule fois par page. */
  pousse = Math.min(1, pousse + PAS_PAGE);
  ecrire(pousse);
  poser();

  let hauteurLue = 0, secondes = 0, dernier = performance.now();

  const avancer = (delta) => {
    if (delta <= 0 || pousse >= 1) return;
    pousse = Math.min(1, pousse + delta);
    ecrire(pousse);
    poser();
  };

  addEventListener('scroll', () => {
    const y = scrollY || document.documentElement.scrollTop;
    const gagne = Math.max(0, y - hauteurLue);
    if (gagne < innerHeight * 0.25) return;
    hauteurLue = y;
    avancer((gagne / innerHeight) * PAS_ECRAN);
  }, { passive: true });

  /* Le temps se compte a la seconde, pas a l'image : une minuterie suffit,
     et elle continue de tourner dans un onglet masque, ce qui est justement
     ce qu'on ne veut pas. On verifie donc que la page est bien regardee. */
  setInterval(() => {
    if (document.visibilityState !== 'visible') { dernier = performance.now(); return; }
    const dt = (performance.now() - dernier) / 1000;
    dernier = performance.now();
    if (secondes >= TEMPS_MAX) return;
    secondes += dt;
    avancer(dt * PAS_SECONDE);
  }, 1000);

  return { valeur: () => pousse, surPousse: fn => { abonnes.push(fn); fn(pousse); } };
}

function poser() {
  document.documentElement.style.setProperty('--pousse', pousse.toFixed(4));
  /* Un palier lisible pour le CSS, parce qu'on veut parfois declencher une
     chose franchement plutot que de la faire varier en continu. */
  document.documentElement.dataset.pousse =
    pousse < 0.2 ? 'graine' : pousse < 0.5 ? 'jeune' : pousse < 0.85 ? 'fournie' : 'envahie';
  for (const fn of abonnes) fn(pousse);
}

/* ══════════════════════════════════════════════════════════════════════════
   LES LIANES DE MARGE
   --------------------------------------------------------------------------
   Elles montent le long des deux bords de l'ecran, et se dessinent a mesure
   que la pousse avance.

   ELLES SONT TRACEES ICI, PAS DESSINEES A L'AVANCE. Deux raisons. La premiere
   est le poids : trois lianes feuillues en image pesent des centaines de
   kilo-octets, en chemins calcules elles ne pesent rien. La seconde vaut
   mieux : la forme est tiree d'un GRAIN pris sur le nom de la page, donc
   chaque page a ses propres lianes, toujours les memes quand on y revient,
   et jamais celles de la voisine. Un decor identique partout se lit comme un
   papier peint ; un decor different a chaque page se lit comme un lieu.

   LE TRACE SE REVELE PAR SON PROPRE POINTILLE. On donne au chemin un tiret
   aussi long que lui, et on decale ce tiret : a decalage plein, rien ne se
   voit ; a decalage nul, tout est la. C'est le plus vieux tour du SVG et il
   reste le seul qui ne coute rien, parce que le navigateur le confie a la
   carte graphique au lieu de redessiner la courbe. */

/* Un generateur de nombres reproductible, sans lequel les lianes changeraient
   de forme a chaque visite de la meme page. */
function grainDe(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export function monterLesLianesDeMarge(nom) {
  if (document.querySelector('.lianes-marge')) return null;

  const SVG = 'http://www.w3.org/2000/svg';
  const hote = document.createElement('div');
  hote.className = 'lianes-marge';
  hote.setAttribute('aria-hidden', 'true');
  document.body.appendChild(hote);

  let tiges = [], derniere = 0, valeur = 0;

  /* ══ ON TRACE EN PIXELS, PAS EN UNITES DE VIEWBOX ══════════════════════
     Premiere version : un seul SVG plein ecran, viewBox de 100 sur 100, et
     preserveAspectRatio a none. Les proportions etaient donc ecrasees de
     travers, dix fois en largeur contre six en hauteur : les feuilles
     sortaient en ballons etires et les tiges partaient au milieu du texte.

     Ici chaque bande a sa vraie largeur en pixels et le trace est refait
     quand la fenetre change. Rien n'est deforme, les feuilles sont des
     feuilles, et surtout la bande est BORNEE : le decor ne peut plus, par
     construction, mordre sur la colonne de lecture. Une regle a garder : un
     decor qui gene la lecture n'est pas un decor, c'est une faute. */
  function tracer() {
    hote.textContent = '';
    tiges = [];
    const H = innerHeight;
    const bande = Math.max(58, Math.min(126, innerWidth * 0.062));

    for (const bord of ['gauche', 'droite']) {
      const alea = grainDe((nom || location.pathname) + bord);
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'lianes-marge__bande');
      svg.dataset.bord = bord;
      svg.setAttribute('width', bande);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + bande + ' ' + H);
      hote.appendChild(svg);

      for (let i = 0; i < 3; i++) {
        /* Le pied est colle au bord de l'ecran, la derive va vers l'interieur
           mais reste enfermee dans la bande. */
        const dedans = bord === 'gauche' ? 1 : -1;
        const pied = bord === 'gauche' ? 2 + alea() * 10 : bande - 2 - alea() * 10;
        let x = pied, y = H + 20;
        let d = 'M ' + x.toFixed(1) + ' ' + y.toFixed(1);
        const pas = H * (0.09 + alea() * 0.05);

        while (y > -30) {
          const y1 = y - pas, y2 = y1 - pas, y3 = y2 - pas;
          const amp = bande * (0.16 + alea() * 0.30);
          const x1 = x + dedans * amp;
          const x2 = x + dedans * amp * (0.3 + alea() * 0.5);
          let x3 = x + dedans * bande * (0.02 + alea() * 0.16);
          x3 = Math.max(3, Math.min(bande - 3, x3));
          d += ' C ' + x1.toFixed(1) + ' ' + y1.toFixed(1)
             + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1)
             + ' ' + x3.toFixed(1) + ' ' + y3.toFixed(1);
          x = x3; y = y3;
        }

        const tige = document.createElementNS(SVG, 'path');
        tige.setAttribute('d', d);
        tige.setAttribute('class', 'lianes-marge__tige');
        svg.appendChild(tige);

        const L = tige.getTotalLength();
        tige.style.strokeDasharray = L;
        tige.style.strokeDashoffset = L;

        /* Les feuilles, posees le long du trace et orientees par sa tangente.
           Chacune a son seuil d'ouverture, donc elles s'ouvrent du pied vers
           la pointe et jamais toutes ensemble. */
        const feuilles = [];
        const nb = 6 + Math.round(alea() * 5);
        for (let k = 0; k < nb; k++) {
          const t = 0.06 + (k / nb) * 0.90 + alea() * 0.04;
          const pt = tige.getPointAtLength(L * t);
          const av = tige.getPointAtLength(Math.max(0, L * t - 12));
          const angle = Math.atan2(pt.y - av.y, pt.x - av.x) * 180 / Math.PI;
          const cote = alea() > 0.5 ? 1 : -1;
          const taille = 5.5 + alea() * 5.5;

          const f = document.createElementNS(SVG, 'ellipse');
          f.setAttribute('rx', taille.toFixed(1));
          f.setAttribute('ry', (taille * 0.46).toFixed(1));
          f.setAttribute('class', 'lianes-marge__feuille');
          f.setAttribute('transform',
            'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') '
            + 'rotate(' + (angle + cote * 52).toFixed(0) + ') '
            + 'translate(' + (taille * 0.92).toFixed(1) + ' 0)');
          svg.appendChild(f);
          feuilles.push({ el: f, seuil: t * 0.92 });
        }

        tiges.push({ tige, L, feuilles, retard: alea() * 0.18, portee: 0.58 + alea() * 0.34 });
      }
    }
    rendre(valeur);
  }

  function rendre(p) {
    valeur = p;
    for (const t of tiges) {
      const avance = Math.max(0, Math.min(1, (p - t.retard) / t.portee));
      const e = avance * avance * (3 - 2 * avance);
      t.tige.style.strokeDashoffset = (t.L * (1 - e)).toFixed(1);
      for (const f of t.feuilles) f.el.style.opacity = e > f.seuil ? '' : '0';
    }
  }

  tracer();
  /* Le retrace coute une centaine de calculs de longueur : on attend que la
     main ait fini de tirer le bord de la fenetre. */
  let minuterie = 0;
  addEventListener('resize', () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(tracer, 260);
  });

  return { rendre, detruire() { hote.remove(); } };
}
