/**
 * LE QUARTIER : le vrai pate de maisons du prospect, dessine en axonometrie.
 *
 * POURQUOI CETTE PIECE EXISTE
 *
 * Matheo a pose la seule question qui compte sur les images : « est-ce que ce
 * sont les vraies images des endroits ? » Non. Les photographies sont celles du
 * METIER, honnetes mais interchangeables : deux boulangeries de deux
 * departements recoivent la meme miche.
 *
 * On n'a aucune photo d'eux et on n'en inventera pas. Mais on a leurs
 * coordonnees, et OpenStreetMap a l'empreinte au sol des batiments autour.
 * Ca, c'est vraiment chez eux : la forme de leur rue, le dessin de leur pate
 * de maisons, leur batiment a la place ou il est, au metre pres. Un dessin
 * EXACT de leur quartier vaut mieux qu'une photo de chez quelqu'un d'autre, et
 * personne d'autre ne peut l'avoir.
 *
 * CE QU'ON NE PRETEND PAS
 *
 * Ce n'est pas une photo et ca n'en a pas l'air : c'est un dessin, assume comme
 * tel. Les hauteurs viennent d'OSM quand elles y sont (`sur: 1`) et valent six
 * metres par defaut sinon (`sur: 0`) ; les deux ne se dessinent pas pareil, le
 * suppose est plus pale que le releve. La page le dit en toutes lettres.
 *
 * POURQUOI EN CANVAS 2D ET NON EN TROIS DIMENSIONS
 *
 * Une axonometrie n'a pas de perspective : c'est une projection affine, donc
 * quatre multiplications par point. Y mettre un moteur 3D coute trois cents
 * kilo-octets pour rendre exactement la meme image, en enlevant le trait
 * dessine qui fait justement qu'on lit un DESSIN et pas un rendu rate.
 */

/* Isometrie a trente degres : la seule ou les deux axes du sol sont a la meme
   echelle, donc la seule ou une facade et son pignon se lisent ensemble. */
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);

/* LE RELIEF EST ACCENTUE, et c'est une convention de dessin, pas un mensonge.
   A l'echelle vraie, une maison de village fait six metres pour vingt de long :
   en axonometrie elle rend un aplat, et le pate de maisons se lit comme un plan
   cadastral plutot que comme des volumes. Les cartes en relief font la meme
   chose depuis toujours. Les EMPRISES au sol, elles, restent exactes au metre,
   et c'est ce qui compte : c'est leur rue, pas une vue d'artiste. */
const RELIEF = 2.4;

const dansLePolygone = (px, py, c) => {
  let dedans = false;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const [xi, yi] = c[i], [xj, yj] = c[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
};

const centre = (c) => {
  let x = 0, y = 0;
  for (const p of c) { x += p[0]; y += p[1]; }
  return [x / c.length, y / c.length];
};

/**
 * Monte le quartier dans une toile.
 *
 * @param {HTMLCanvasElement} toile
 * @param {object} q        le releve : { batiments, routes, eaux }
 * @param {object} couleurs { encre, trait, accent, mur, toit, sol }
 */
export function monterLeQuartier(toile, q, couleurs) {
  const ctx = toile.getContext('2d', { alpha: true });
  if (!ctx) return null;

  const sobre = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Quel batiment est le leur ? Celui qui contient le point, sinon le plus
     proche a moins de trente metres. Au-dela on n'affirme rien : mieux vaut
     n'en designer aucun que designer le voisin. */
  let leur = -1, meilleure = 30 * 30;
  q.batiments.forEach((b, i) => {
    if (dansLePolygone(0, 0, b.c)) { leur = i; meilleure = -1; return; }
    if (meilleure < 0) return;
    const [cx, cy] = centre(b.c);
    const d = cx * cx + cy * cy;
    if (d < meilleure) { meilleure = d; leur = i; }
  });

  /* L'ordre du peintre : le plus loin d'abord. En isometrie la profondeur est
     x + y, et elle ne change pas quand le batiment grandit. On la calcule une
     fois pour toutes. */
  const ordre = q.batiments.map((b, i) => {
    const [cx, cy] = centre(b.c);
    return { i, p: cx + cy, d: Math.hypot(cx, cy) };
  }).sort((a, b) => a.p - b.p);

  /* La distance a EUX commande la vague de construction : leur batiment sort
     de terre le premier, le quartier se leve ensuite en cercles autour. */
  const distanceMax = Math.max(1, ...ordre.map((o) => o.d));

  const etat = { echelle: 1, angle: 0, montee: sobre ? 1 : 0, ax: 0, ay: 0 };

  function mesurer() {
    const r = toile.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    toile.width = Math.max(1, Math.round(r.width * dpr));
    toile.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* On cale l'echelle sur le rayon du releve pour que le cadrage soit le meme
       partout, quelle que soit la densite du bourg. */
    /* Le cadrage : on montre un peu moins que le releve pour que le dessin
       remplisse la toile. A 2,35 le village de Souclin tenait dans le tiers
       central et les maisons devenaient des confettis. */
    etat.echelle = Math.min(r.width / (q.rayon * 1.55), r.height / (q.rayon * 1.05));
    etat.ax = r.width / 2;
    etat.ay = r.height * 0.60;
    etat.l = r.width; etat.h = r.height;
  }

  const projeter = (x, y, z) => {
    const c = Math.cos(etat.angle), s = Math.sin(etat.angle);
    const rx = x * c - y * s, ry = x * s + y * c;
    return [
      etat.ax + (rx - ry) * COS * etat.echelle,
      etat.ay + (rx + ry) * SIN * etat.echelle - z * etat.echelle * RELIEF,
    ];
  };

  function dessiner() {
    ctx.clearRect(0, 0, etat.l, etat.h);

    /* L'eau d'abord : elle est au sol, tout se pose dessus. */
    ctx.fillStyle = couleurs.eau;
    for (const e of q.eaux ?? []) {
      ctx.beginPath();
      e.c.forEach(([x, y], i) => { const p = projeter(x, y, 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      if (e.f) { ctx.fill(); } else { ctx.strokeStyle = couleurs.eau; ctx.lineWidth = 3; ctx.stroke(); }
    }

    /* Les rues. Leur epaisseur dit leur rang : une departementale et un chemin
       de service ne se lisent pas au meme trait, c'est ce qui donne au dessin
       sa hierarchie sans une seule etiquette. */
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of q.routes ?? []) {
      ctx.strokeStyle = couleurs.trait;
      ctx.lineWidth = [1, 2.4, 3.6, 5][r.r] * etat.echelle * 1.6;
      ctx.globalAlpha = [.34, .5, .62, .72][r.r];
      ctx.beginPath();
      r.c.forEach(([x, y], i) => { const p = projeter(x, y, 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* Les volumes, du plus loin au plus pres. */
    for (const o of ordre) {
      const b = q.batiments[o.i];
      const sien = o.i === leur;

      /* La vague : chacun se leve quand la montee a depasse sa distance. Le
         leur part a zero, donc il sort de terre en premier et le quartier se
         construit AUTOUR DE LUI. C'est le seul ordre qui raconte quelque chose. */
      const seuil = (o.d / distanceMax) * 0.72;
      const t = Math.max(0, Math.min(1, (etat.montee - seuil) / 0.28));
      if (t <= 0) continue;
      const doux = 1 - Math.pow(1 - t, 3);
      const h = b.h * doux;

      /* Les murs : seuls ceux qui font face a l'oeil sont dessines. Le test est
         le signe du produit vectoriel de l'arete projetee : gratuit, et il
         evite de peindre l'interieur du volume par dessus sa facade. */
      for (let i = 0; i < b.c.length - 1; i++) {
        const [x1, y1] = b.c[i], [x2, y2] = b.c[i + 1];
        const a = projeter(x1, y1, 0), c = projeter(x2, y2, 0);
        if ((c[0] - a[0]) * (c[1] + a[1]) > 0) continue;
        const d = projeter(x2, y2, h), e = projeter(x1, y1, h);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
        ctx.fillStyle = sien ? couleurs.murSien : couleurs.mur;
        ctx.globalAlpha = b.sur ? 1 : .82;
        ctx.fill();
      }

      /* Le toit. */
      ctx.beginPath();
      b.c.forEach(([x, y], i) => { const p = projeter(x, y, h); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.closePath();
      ctx.fillStyle = sien ? couleurs.accent : couleurs.toit;
      ctx.globalAlpha = b.sur ? 1 : .88;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sien ? couleurs.accent : couleurs.trait;
      ctx.lineWidth = sien ? 1.6 : .7;
      ctx.stroke();

      /* Leur toit porte un halo : c'est le seul endroit du dessin ou l'oeil
         doit revenir. */
      if (sien && doux > .6) {
        ctx.save();
        ctx.shadowColor = couleurs.accent;
        ctx.shadowBlur = 26 * doux;
        ctx.fill();
        ctx.restore();
      }
    }

    /* La broche sur leur porte, exactement au point de la fiche. */
    if (etat.montee > .8) {
      const t = Math.min(1, (etat.montee - .8) / .2);
      const bas = projeter(0, 0, 0);
      const haut = projeter(0, 0, (q.batiments[leur]?.h ?? 6) + 9 * t);
      ctx.strokeStyle = couleurs.accent;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = t;
      ctx.beginPath(); ctx.moveTo(bas[0], bas[1]); ctx.lineTo(haut[0], haut[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(haut[0], haut[1], 4.2 * t, 0, 7); ctx.fillStyle = couleurs.accent; ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  mesurer(); dessiner();
  new ResizeObserver(() => { mesurer(); dessiner(); }).observe(toile);

  return {
    /* `avance` va de 0 a 1 : le generateur la branche sur le defilement, ce qui
       fait construire le quartier pendant qu'on descend la page. */
    avance(v) {
      const m = sobre ? 1 : Math.max(0, Math.min(1, v));
      /* Une rotation de douze degres sur toute la course : assez pour qu'on
         sente le volume tourner, trop peu pour qu'on cherche le nord. */
      const a = sobre ? 0 : (m - .5) * 0.21;
      if (Math.abs(m - etat.montee) < .002 && Math.abs(a - etat.angle) < .0008) return;
      etat.montee = m; etat.angle = a;
      dessiner();
    },
    leur,
    batiments: q.batiments.length,
  };
}
