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
  let posX = null, posY = null, larg = null, haut = null;

  /* ══ POSER UN RELEVE ═══════════════════════════════════════════════════
     `point` est une position dans le monde en trois dimensions. `cote` dit de
     quel bord part l'etiquette, ce qui evite qu'elles se marchent dessus.
     `valeur` est une fonction : elle est rappelee a chaque image, donc un
     releve peut afficher une mesure qui change. */
  /* `longueur` : une fraction de la largeur de la toile si elle vaut moins de
     un, un nombre de pixels au-dela. La fraction suffit quand la toile fait la
     taille de la fenetre ; elle ne suffit plus quand la toile DEBORDE, comme
     celle de la nuee qui fait deux mille deux cents pixels pour une fenetre de
     mille cinq cents. Quatorze pour cent d'une toile qui deborde, ce sont trois
     cents pixels de trait, et l'etiquette part se poser hors de l'ecran.

     `vers` dit de quel cote le coude part. Une etiquette se pose toujours au
     bout du coude : pour la mettre SOUS un objet, il faut que le coude descende,
     sinon elle revient se coller sur l'objet qu'elle designe. */
  /* `montre` : une fonction qui rend une valeur entre zero et un, rappelee a
     chaque image. Elle sert aux releves qui annotent une chose PASSAGERE : le
     nom en particules, qui se dissout, ou le flux du portail, qui n'existe
     qu'a son approche. Sans elle, il faudrait creer et detruire les etiquettes
     au fil du recit, donc gerer un cycle de vie pour un fondu. */
  function poser({ point, titre, valeur, cote = 'droite', longueur = 0.14, vers = 'haut', portee = 0, montre = null }) {
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

    releves.push({ point: point.clone ? point.clone() : { ...point }, boite, valeur: v, lireValeur: valeur, croix, trait, cote, longueur, vers, portee, montre });
    return releves[releves.length - 1];
  }

  /* ══ PLACER, A CHAQUE IMAGE ════════════════════════════════════════════ */
  function placer() {
    const r = toile.getBoundingClientRect();
    if (!r.width || !r.height) return;

    /* LA COUCHE SE CALE SUR LA TOILE, PAS SUR LE PARENT, et cette difference
       a deja decale toutes les etiquettes d'une pleine largeur d'ecran. La
       toile du sceau fait cent quinze pour cent de sa section et deborde a
       droite : un hote pose en inset:0 sur le parent n'a alors ni la meme
       origine ni la meme taille que le repere dans lequel on projette, et
       chaque etiquette se retrouve a cote de ce qu'elle designe.

       On recopie donc la boite de la toile a chaque image. Deux mesures par
       image, c'est le prix d'un module qui marche dans n'importe quelle mise
       en page au lieu d'exiger que la toile remplisse exactement son parent. */
    const hr = hote.offsetParent ? hote.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
    const gx = (r.left - hr.left), gy = (r.top - hr.top);
    if (gx !== posX || gy !== posY || r.width !== larg || r.height !== haut) {
      posX = gx; posY = gy; larg = r.width; haut = r.height;
      hote.style.left = gx.toFixed(1) + 'px';
      hote.style.top = gy.toFixed(1) + 'px';
      hote.style.width = r.width.toFixed(1) + 'px';
      hote.style.height = r.height.toFixed(1) + 'px';
      hote.style.right = 'auto';
      hote.style.bottom = 'auto';
    }

    /* LA MATRICE DE LA CAMERA EST RAFRAICHIE ICI, et ce n'est pas un detail.
       three ne la recalcule qu'au moment de peindre : si le placement passe
       avant le premier rendu, ou si la scene ne peint pas du tout, on projette
       avec une matrice restee a l'identite et TOUTES les etiquettes se croient
       hors cadre. On demande donc a la camera de se mettre a jour elle-meme,
       sans importer three ici : ce sont ses propres methodes. */
    if (camera.updateMatrixWorld) {
      camera.updateMatrixWorld();
      if (camera.matrixWorldInverse?.copy) camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    }
    traits.setAttribute('viewBox', '0 0 ' + r.width.toFixed(0) + ' ' + r.height.toFixed(0));

    for (const p of releves) {
      /* Un releve qui annote une chose passagere s'efface avec elle. On sort
         avant la projection : ce qui ne se voit pas ne se calcule pas. */
      const vu = p.montre ? Math.max(0, Math.min(1, p.montre())) : 1;
      if (vu < 0.02) {
        p.boite.style.opacity = '0'; p.trait.style.opacity = '0'; p.croix.style.opacity = '0';
        continue;
      }

      /* On projette le point du monde sur l'ecran. C'est la seule ligne de
         mathematique de tout le module, et c'est elle qui fait que l'etiquette
         reste accrochee a l'objet quand la camera tourne. */
      /* ══ UNE ETIQUETTE A UNE PORTEE ════════════════════════════════════
         Dans une page en sections, l'objet est toujours a la meme distance et
         la question ne se pose pas. Dans un voyage, on DEPASSE les objets :
         a la fin du parcours, l'etiquette de la feuille designait encore un
         point situe soixante-dix unites derriere la camera, ou il n'y avait
         plus rien a voir qu'un peu de brouillard.

         Au-dela de sa portee, un releve s'efface. Ce qui est trop loin pour
         etre reconnu est trop loin pour etre annote. */
      if (p.portee && camera.position) {
        const dx = p.point.x - camera.position.x;
        const dy = p.point.y - camera.position.y;
        const dz = p.point.z - camera.position.z;
        if (dx * dx + dy * dy + dz * dz > p.portee * p.portee) {
          p.boite.style.opacity = '0'; p.trait.style.opacity = '0'; p.croix.style.opacity = '0';
          continue;
        }
      }

      const proj = projeter(p.point, camera);

      /* Derriere la camera, ou hors du cadre : on efface plutot que de coller
         une etiquette a l'envers sur un bord. */
      if (!proj || proj.z > 1) { p.boite.style.opacity = '0'; p.trait.style.opacity = '0'; p.croix.style.opacity = '0'; continue; }

      const x = (proj.x * 0.5 + 0.5) * r.width;
      const y = (0.5 - proj.y * 0.5) * r.height;
      /* ══ LA LIMITE EST LA FENETRE, PAS LA TOILE ════════════════════════
         Une toile peut deborder tres largement l'ecran : celle du sceau fait
         treize cent vingt pixels et commence a six cent quatre-vingt-dix,
         donc sa moitie droite est DEHORS. Tant que le module raisonnait sur
         la toile, il trouvait de la place la ou il n'y en avait pas, et
         l'etiquette du sceau s'affichait « 41 316 SOMMETS · 5 FOR », coupee
         net par le bord de la fenetre.

         On travaille donc sur l'INTERSECTION de la toile et de la fenetre,
         exprimee dans le repere de la toile. Quand la toile tient dans
         l'ecran, c'est la toile entiere et rien ne change. */
      const largeurEcran = window.innerWidth || document.documentElement.clientWidth || r.width;
      const gMin = Math.max(0, -r.left);
      const gMax = Math.min(r.width, largeurEcran - r.left);
      const dedans = x > gMin - 40 && x < gMax + 40 && y > -40 && y < r.height + 40;
      const op = dedans ? vu.toFixed(3) : '0';
      p.boite.style.opacity = op; p.trait.style.opacity = op; p.croix.style.opacity = op;
      if (!dedans) continue;

      /* Le trait part du point, monte en biais, puis file a l'horizontale.
         Deux segments, jamais une courbe : une courbe fait organique, or on
         veut un instrument. */
      /* ══ LE COUDE BASCULE PLUTOT QUE DE SORTIR ═════════════════════════
         Le cote est un choix de composition, pas une contrainte : il sert a
         ce que deux etiquettes ne se marchent pas dessus. Mais sur une toile
         etroite, un cote impose envoie l'etiquette contre le bord, ou dehors.
         Sur telephone, deux d'entre elles se collaient a zero pixel du bord
         gauche, ou elles se lisent mal et ou elles ont l'air tombees.

         On mesure donc la place disponible et on part de l'autre cote quand
         il n'y en a pas. Une etiquette qui change de cote reste lisible ; une
         etiquette hors cadre ne dit plus rien du tout. */
      const longueurTrait = p.longueur > 1 ? p.longueur : r.width * p.longueur;
      const largeurBoite = p.boite.offsetWidth || 90;
      let sens = p.cote === 'gauche' ? -1 : 1;
      if (sens > 0 && x + longueurTrait + largeurBoite > gMax - 6
                   && x - longueurTrait - largeurBoite > gMin + 6) sens = -1;
      else if (sens < 0 && x - longueurTrait - largeurBoite < gMin + 6
                        && x + longueurTrait + largeurBoite < gMax - 6) sens = 1;

      const dx = longueurTrait * sens;
      const dy = (p.vers === 'bas' ? 1 : -1) * r.height * 0.055;
      const cx = x + dx * 0.42, cy = y + dy;
      const fx = x + dx;
      /* L'ancrage de la boite suit le cote REELLEMENT pris, pas celui demande :
         sinon l'etiquette bascule et son texte reste aligne a l'envers. */
      const coteVrai = sens < 0 ? 'gauche' : 'droite';
      if (p.boite.dataset.cote !== coteVrai) p.boite.dataset.cote = coteVrai;

      p.trait.setAttribute('d', 'M ' + x.toFixed(1) + ' ' + y.toFixed(1)
        + ' L ' + cx.toFixed(1) + ' ' + cy.toFixed(1)
        + ' L ' + fx.toFixed(1) + ' ' + cy.toFixed(1));
      p.croix.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');

      if (p.vers === 'bas' && !p.basPose) { p.boite.dataset.vers = 'bas'; p.basPose = true; }
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
    /* Acces a un releve pour deplacer son point vise. Utile quand l'objet
       change d'echelle ou d'orientation : l'etiquette doit alors suivre. */
    releve: i => releves[i],
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
    const dt = t - dernier;
    dernier = t;
    /* ══ UN ONGLET GELE NE DONNE PAS DE CADENCE ═══════════════════════════
       Le navigateur suspend les images des qu'un onglet passe en arriere-plan.
       Au retour, la premiere image porte tout le temps ecoule : deux mille
       millisecondes, parfois trente mille. Comptees dans la moyenne, elles
       affichaient « 2111,5 ms par image » sur une page qui tourne en seize.

       Ces intervalles ne sont pas des images lentes, ce sont des images qui
       n'ont pas eu lieu. On les jette. Deux cents millisecondes est un seuil
       large : aucune machine ne descend sous cinq images par seconde sans que
       la page soit de toute facon inutilisable.

       J'ai moi-meme conclu deux fois cette semaine a un probleme de cadence a
       partir de mesures prises dans un onglet gele. Le compteur du site n'a
       pas le droit de refaire la meme erreur devant un visiteur. */
    if (dt > 200) return;
    cumul += dt; images++;
    if (cumul >= 500) { ms = cumul / images; ips = 1000 / ms; cumul = 0; images = 0; }
  })(dernier);
  return { ms: () => ms, ips: () => ips };
}
