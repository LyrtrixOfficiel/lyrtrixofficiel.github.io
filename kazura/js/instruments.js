/* ══════════════════════════════════════════════════════════════════════════
   LA COUCHE D'INSTRUMENTS
   --------------------------------------------------------------------------
   De minuscules etiquettes en chasse fixe, reliees par un trait fin a un point
   precis d'un objet en trois dimensions, qui suivent cet objet quand il bouge.

   POURQUOI C'EST LE MEILLEUR RAPPORT DE TOUT LE SITE. C'est le procede releve
   sur igloo.inc, et c'est lui, pas la 3D, qui donne la sensation d'instrument
   et de moteur de jeu. Chez eux : « PORTFOLIO_CO_01 », « TEMP 33.97 ». Le
   spectateur comprend en une seconde qu'il regarde une machine et non une
   image, et il se met a chercher ce que les chiffres veulent dire.

   Le prix a payer tient en trois lignes : un point du monde projete a l'ecran,
   un trait, deux lignes de texte. Rien de plus.

   CE QU'ON Y ECRIT EST VRAI, ET C'EST LA NOTRE DIFFERENCE. Chez igloo, la
   temperature est un decor. Ici, les nombres sont mesures : le poids reel du
   fichier, le nombre reel de triangles, le temps reel d'une image. Un studio
   qui vend de la technique n'a pas le droit d'inventer ses chiffres, et il se
   trouve que les vrais sont plus impressionnants que les faux.
   ══════════════════════════════════════════════════════════════════════════ */

/* Un point du monde, son etiquette, et le trait entre les deux. */
export function monterLesInstruments(toile, camera, options = {}) {
  const sobre = document.documentElement.dataset.mouvement !== 'anime';

  const hote = document.createElement('div');
  hote.className = 'instruments';
  hote.setAttribute('aria-hidden', 'true');
  (options.dans || toile.parentElement || document.body).appendChild(hote);

  const SVG = 'http://www.w3.org/2000/svg';
  const traits = document.createElementNS(SVG, 'svg');
  traits.setAttribute('class', 'instruments__traits');
  hote.appendChild(traits);

  const releves = [];

  /* ══ POSER UN RELEVE ═══════════════════════════════════════════════════
     `point` est une position dans le monde en trois dimensions. `cote` dit de
     quel bord part l'etiquette, ce qui evite qu'elles se marchent dessus.
     `valeur` est une fonction : elle est rappelee a chaque image, donc un
     releve peut afficher une mesure qui change. */
  function poser({ point, titre, valeur, cote = 'droite', longueur = 0.14 }) {
    const boite = document.createElement('div');
    boite.className = 'instrument';
    boite.dataset.cote = cote;

    const t = document.createElement('b');
    t.textContent = titre;
    boite.appendChild(t);

    const v = document.createElement('span');
    boite.appendChild(v);

    /* La croix qui marque le point vise. Sans elle, le trait s'arrete dans le
       vide et on ne sait pas ce qu'il designe. */
    const croix = document.createElementNS(SVG, 'path');
    croix.setAttribute('class', 'instrument__croix');
    croix.setAttribute('d', 'M -4 0 H 4 M 0 -4 V 4');

    const trait = document.createElementNS(SVG, 'path');
    trait.setAttribute('class', 'instrument__trait');

    traits.appendChild(trait);
    traits.appendChild(croix);
    hote.appendChild(boite);

    releves.push({ point: point.clone ? point.clone() : { ...point }, boite, valeur: v, lireValeur: valeur, croix, trait, cote, longueur });
    return releves[releves.length - 1];
  }

  /* ══ PLACER, A CHAQUE IMAGE ════════════════════════════════════════════ */
  function placer() {
    const r = toile.getBoundingClientRect();
    if (!r.width || !r.height) return;
    traits.setAttribute('viewBox', '0 0 ' + r.width.toFixed(0) + ' ' + r.height.toFixed(0));

    for (const p of releves) {
      /* On projette le point du monde sur l'ecran. C'est la seule ligne de
         mathematique de tout le module, et c'est elle qui fait que l'etiquette
         reste accrochee a l'objet quand la camera tourne. */
      const proj = projeter(p.point, camera);

      /* Derriere la camera, ou hors du cadre : on efface plutot que de coller
         une etiquette a l'envers sur un bord. */
      if (!proj || proj.z > 1) { p.boite.style.opacity = '0'; p.trait.style.opacity = '0'; p.croix.style.opacity = '0'; continue; }

      const x = (proj.x * 0.5 + 0.5) * r.width;
      const y = (0.5 - proj.y * 0.5) * r.height;
      const dedans = x > -40 && x < r.width + 40 && y > -40 && y < r.height + 40;
      const op = dedans ? '1' : '0';
      p.boite.style.opacity = op; p.trait.style.opacity = op; p.croix.style.opacity = op;
      if (!dedans) continue;

      /* Le trait part du point, monte en biais, puis file a l'horizontale.
         Deux segments, jamais une courbe : une courbe fait organique, or on
         veut un instrument. */
      const sens = p.cote === 'gauche' ? -1 : 1;
      const dx = r.width * p.longueur * sens;
      const dy = -r.height * 0.055;
      const cx = x + dx * 0.42, cy = y + dy;
      const fx = x + dx;

      p.trait.setAttribute('d', 'M ' + x.toFixed(1) + ' ' + y.toFixed(1)
        + ' L ' + cx.toFixed(1) + ' ' + cy.toFixed(1)
        + ' L ' + fx.toFixed(1) + ' ' + cy.toFixed(1));
      p.croix.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');

      p.boite.style.transform = 'translate3d(' + fx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (p.lireValeur) {
        const val = p.lireValeur();
        if (val !== p.dernier) { p.valeur.textContent = val; p.dernier = val; }
      }
    }
  }

  /* La projection, ecrite a la main pour ne pas dependre de three ici : ce
     module doit pouvoir servir a n'importe quelle scene. */
  function projeter(p, cam) {
    if (!cam || !cam.matrixWorldInverse || !cam.projectionMatrix) return null;
    const e1 = cam.matrixWorldInverse.elements, e2 = cam.projectionMatrix.elements;
    const x = p.x, y = p.y, z = p.z;
    const vx = e1[0] * x + e1[4] * y + e1[8] * z + e1[12];
    const vy = e1[1] * x + e1[5] * y + e1[9] * z + e1[13];
    const vz = e1[2] * x + e1[6] * y + e1[10] * z + e1[14];
    const cx = e2[0] * vx + e2[4] * vy + e2[8] * vz + e2[12];
    const cy = e2[1] * vx + e2[5] * vy + e2[9] * vz + e2[13];
    const cz = e2[2] * vx + e2[6] * vy + e2[10] * vz + e2[14];
    const cw = e2[3] * vx + e2[7] * vy + e2[11] * vz + e2[15];
    if (Math.abs(cw) < 1e-6) return null;
    return { x: cx / cw, y: cy / cw, z: cz / cw };
  }

  let actif = true;
  if (!sobre) {
    (function battre() { if (!actif) return; requestAnimationFrame(battre); placer(); })();
  } else {
    placer();
  }

  return {
    poser, placer,
    detruire() { actif = false; hote.remove(); },
    bilan: () => ({ releves: releves.length, visibles: releves.filter(p => p.boite.style.opacity === '1').length })
  };
}

/* ══ LES MESURES VRAIES ══════════════════════════════════════════════════
   Un petit compteur de cadence, pour que les etiquettes puissent afficher le
   vrai temps par image plutot qu'un nombre invente. */
export function monterLeCompteur() {
  let dernier = performance.now(), cumul = 0, images = 0, ms = 0, ips = 0;
  (function battre(t) {
    requestAnimationFrame(battre);
    cumul += t - dernier; images++; dernier = t;
    if (cumul >= 500) { ms = cumul / images; ips = 1000 / ms; cumul = 0; images = 0; }
  })(dernier);
  return { ms: () => ms, ips: () => ips };
}
