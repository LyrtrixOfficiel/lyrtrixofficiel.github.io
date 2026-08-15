/* ==========================================================================
   KAZURA 葛 - le miroir de palette
   --------------------------------------------------------------------------
   Le visiteur depose une photo de son salon. On en extrait les couleurs
   dominantes, et LA PAGE SE REPEINT dans les siennes, sous ses yeux.

   POURQUOI CETTE PIECE EXISTE

   L'argument de vente central est : « votre palette sort de vos photos,
   jamais d'un gabarit ». Ecrit, c'est une promesse de plus. Fait, sur notre
   propre site, en deux secondes, c'est une preuve. C'est la demonstration la
   plus courte du metier.

   COMMENT LES COULEURS SONT TROUVEES

   Un k-moyennes en espace Lab, pas en RVB. La distance RVB ne correspond a
   rien de ce que l'oeil percoit : deux verts tres differents peuvent y etre
   plus proches qu'un vert et un gris qui se ressemblent. En Lab, la distance
   euclidienne approche la difference percue, donc les groupes formes
   correspondent aux couleurs qu'une personne nommerait.

   Ensuite on trie, et c'est la que se joue la qualite du resultat :
   une palette utile n'est pas faite des couleurs les PLUS PRESENTES (ce sont
   les murs beiges et les gris) mais des plus CARACTERISTIQUES. On note donc
   chaque groupe sur sa saturation autant que sur sa surface.

   TOUT EST LOCAL. L'image ne quitte jamais le navigateur : aucun televersement,
   aucun serveur, rien de conserve. C'est aussi ce qu'on ecrit a l'ecran.
   ========================================================================== */

/* ── Conversions ───────────────────────────────────────────────────────── */
/* sRVB vers Lab, en passant par XYZ. Les constantes sont celles de l'illuminant
   D65, la lumiere du jour, qui est la reference des ecrans. */
function versLab(r, g, b) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const R = f(r), G = f(g), B = f(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const h = (t) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
  const fx = h(X), fy = h(Y), fz = h(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function versHex(r, g, b) {
  const d = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + d(r) + d(g) + d(b);
}

/* Teinte, saturation, luminosite : sert au tri et aux variantes. */
function versTsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let t;
  if (max === r) t = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) t = ((b - r) / d + 2) / 6;
  else t = ((r - g) / d + 4) / 6;
  return [t, s, l];
}

function depuisTsl(t, s, l) {
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const c = (x) => {
    if (x < 0) x += 1; if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [c(t + 1 / 3) * 255, c(t) * 255, c(t - 1 / 3) * 255];
}

/* ── Extraction ────────────────────────────────────────────────────────── */
export function extraire(image, nbGroupes = 6) {
  /* On reduit a 120 pixels de large. Analyser une photo de douze megapixels ne
     donne pas une meilleure palette, seulement une attente de trois secondes :
     les couleurs dominantes survivent tres bien au sous-echantillonnage. */
  const L = 120;
  const H = Math.max(1, Math.round(L * image.height / image.width));
  const c = document.createElement('canvas');
  c.width = L; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, L, H);
  const px = ctx.getImageData(0, 0, L, H).data;

  const points = [];
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;                       // transparent
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const [, , lum] = versTsl(r, g, b);
    /* On jette le blanc pur et le noir pur : ce sont les surexpositions et les
       ombres bouchees, ils ne disent rien de l'univers de la personne. */
    if (lum > 0.97 || lum < 0.03) continue;
    points.push([...versLab(r, g, b), r, g, b]);
  }
  if (points.length < nbGroupes) return null;

  /* k-moyennes, depart par k-means++ : on tire le premier centre au hasard,
     puis chaque suivant loin des precedents. Un depart entierement aleatoire
     donne regulierement deux centres dans la meme couleur et une palette
     pauvre. */
  const centres = [points[(Math.random() * points.length) | 0].slice(0, 3)];
  while (centres.length < nbGroupes) {
    let loinD = -1, loinP = null;
    for (let k = 0; k < 220; k++) {
      const p = points[(Math.random() * points.length) | 0];
      let d = Infinity;
      for (const ce of centres) {
        const dd = (p[0] - ce[0]) ** 2 + (p[1] - ce[1]) ** 2 + (p[2] - ce[2]) ** 2;
        if (dd < d) d = dd;
      }
      if (d > loinD) { loinD = d; loinP = p; }
    }
    centres.push(loinP.slice(0, 3));
  }

  const appart = new Int32Array(points.length);
  for (let tour = 0; tour < 12; tour++) {
    let bouge = false;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let meilleur = 0, d = Infinity;
      for (let k = 0; k < centres.length; k++) {
        const ce = centres[k];
        const dd = (p[0] - ce[0]) ** 2 + (p[1] - ce[1]) ** 2 + (p[2] - ce[2]) ** 2;
        if (dd < d) { d = dd; meilleur = k; }
      }
      if (appart[i] !== meilleur) { appart[i] = meilleur; bouge = true; }
    }
    if (!bouge && tour > 0) break;

    const somme = centres.map(() => [0, 0, 0, 0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const s = somme[appart[i]], p = points[i];
      s[0] += p[0]; s[1] += p[1]; s[2] += p[2];
      s[3] += p[3]; s[4] += p[4]; s[5] += p[5]; s[6]++;
    }
    for (let k = 0; k < centres.length; k++) {
      if (!somme[k][6]) continue;
      centres[k] = [somme[k][0] / somme[k][6], somme[k][1] / somme[k][6], somme[k][2] / somme[k][6]];
      centres[k].rvb = [somme[k][3] / somme[k][6], somme[k][4] / somme[k][6], somme[k][5] / somme[k][6]];
      centres[k].poids = somme[k][6] / points.length;
    }
  }

  /* Le tri, et c'est lui qui fait la difference. Une palette utile n'est pas
     faite des couleurs les plus PRESENTES (murs beiges, gris) mais des plus
     CARACTERISTIQUES : on note donc chaque groupe sur sa saturation autant que
     sur sa surface. */
  const groupes = centres
    .filter(ce => ce.rvb)
    .map(ce => {
      const [r, g, b] = ce.rvb;
      const [t, s, l] = versTsl(r, g, b);
      return {
        hex: versHex(r, g, b), rvb: [r, g, b], tsl: [t, s, l],
        poids: ce.poids,
        note: ce.poids * 0.35 + s * 0.75 + (1 - Math.abs(l - 0.5) * 1.4) * 0.25
      };
    })
    .sort((a, b) => b.note - a.note);

  return groupes;
}

/* ── Application ───────────────────────────────────────────────────────── */
/* On ne remplace pas betement les jetons par les couleurs trouvees : une photo
   de salon donne souvent des tons chauds et clairs, et le site est un jardin
   nocturne. On garde donc la STRUCTURE (un fond tres sombre, une matiere, une
   lumiere) et on n'emprunte a la photo que ses TEINTES. C'est exactement ce
   qu'on fait pour une cliente, et c'est ce que la demonstration doit montrer. */
export function appliquer(groupes, racine = document.documentElement) {
  if (!groupes || groupes.length < 2) return null;

  const matiere = groupes[0];

  // La lumiere est la teinte la plus eloignee de la matiere sur la roue.
  const ecart = (a, b) => { let d = Math.abs(a - b); return d > 0.5 ? 1 - d : d; };
  let lumiere = groupes[1];
  let ecartMax = -1;
  for (const g of groupes.slice(1)) {
    const score = ecart(g.tsl[0], matiere.tsl[0]) * 1.6 + g.tsl[1] * 0.6;
    if (score > ecartMax) { ecartMax = score; lumiere = g; }
  }

  /* REGLE DE METIER. Beaucoup de photos sont monochromes : un salon en bois et
     terracotta ne contient qu'une seule famille de teintes. La couleur la plus
     eloignee y reste voisine de la premiere, et le site perdrait sa structure
     a deux couleurs pour devenir un aplat monotone.
     Dans ce cas on ne prend pas la photo au mot : on DERIVE la lumiere par une
     rotation de teinte d'un peu moins d'un demi-tour. C'est une
     complementaire adoucie, celle qu'un coloriste choisit pour eclairer sans
     jurer. La matiere reste celle de la personne, seule la lumiere est
     inventee. */
  if (ecart(lumiere.tsl[0], matiere.tsl[0]) < 0.12) {
    const t = (matiere.tsl[0] + 0.42) % 1;
    const s = Math.max(0.52, matiere.tsl[1]);
    const [r, g, b] = depuisTsl(t, s, 0.55);
    lumiere = { hex: versHex(r, g, b), rvb: [r, g, b], tsl: [t, s, 0.55],
                poids: 0, note: 0, derivee: true };
  }

  const teinte = (g, s, l) => versHex(...depuisTsl(g.tsl[0], s, l));

  const jetons = {
    '--jade':        teinte(matiere, Math.max(0.42, matiere.tsl[1]), 0.42),
    '--jade-clair':  teinte(matiere, Math.max(0.45, matiere.tsl[1]), 0.68),
    '--jade-fonce':  teinte(matiere, Math.max(0.45, matiere.tsl[1]), 0.26),
    '--jade-nuit':   teinte(matiere, 0.55, 0.11),
    '--violet':      teinte(lumiere, Math.max(0.50, lumiere.tsl[1]), 0.55),
    '--violet-clair':teinte(lumiere, Math.max(0.45, lumiere.tsl[1]), 0.76),
    '--violet-fonce':teinte(lumiere, Math.max(0.55, lumiere.tsl[1]), 0.34),
    // Le fond garde sa teinte de matiere, mais reste une nuit.
    '--noir':        teinte(matiere, 0.30, 0.035),
    '--noir-2':      teinte(matiere, 0.28, 0.055),
    '--noir-3':      teinte(matiere, 0.24, 0.085),
    '--blanc':       teinte(matiere, 0.14, 0.95),
    '--gris':        teinte(matiere, 0.10, 0.66),
    '--gris-fonce':  teinte(matiere, 0.12, 0.36),
  };

  for (const [k, v] of Object.entries(jetons)) racine.style.setProperty(k, v);
  racine.dataset.palette = 'visiteur';
  return { matiere, lumiere, jetons };
}

export function rendreLaPalette(racine = document.documentElement) {
  for (const k of ['--jade','--jade-clair','--jade-fonce','--jade-nuit','--violet',
                   '--violet-clair','--violet-fonce','--noir','--noir-2','--noir-3',
                   '--blanc','--gris','--gris-fonce']) {
    racine.style.removeProperty(k);
  }
  delete racine.dataset.palette;
}

/* ── Le montage ────────────────────────────────────────────────────────── */
export function monterLeMiroir(zone) {
  const entree = zone.querySelector('input[type=file]');
  const nuancier = zone.querySelector('[data-nuancier]');
  const apercu = zone.querySelector('[data-apercu]');
  const etat = zone.querySelector('[data-message]');
  const rendre = zone.querySelector('[data-rendre]');
  if (!entree || !nuancier) return null;

  let derniereUrl = null;

  const dire = (m) => { if (etat) etat.textContent = m; };

  function montrer(groupes) {
    nuancier.innerHTML = '';
    groupes.slice(0, 6).forEach((g, i) => {
      const d = document.createElement('div');
      d.className = 'miroir__ton';
      d.style.background = g.hex;
      d.style.animationDelay = (i * 60) + 'ms';
      /* La couleur du code suit la clarte de la pastille. Un noir fixe
         disparait sur les tons sombres, un blanc fixe sur les tons clairs :
         il faut basculer, pas compromettre. */
      const clair = g.tsl[2] > 0.52;
      d.innerHTML = `<span style="color:${clair ? 'rgba(0,0,0,.78)' : 'rgba(255,255,255,.92)'};`
                  + `text-shadow:0 0 6px ${clair ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.6)'}">`
                  + `${g.hex.toUpperCase()}</span>`;
      nuancier.appendChild(d);
    });
    zone.dataset.pret = 'oui';
  }

  async function traiter(fichier) {
    if (!fichier || !fichier.type.startsWith('image/')) {
      dire('Ce fichier n\'est pas une image.'); return;
    }
    dire('Lecture des couleurs…');
    if (derniereUrl) URL.revokeObjectURL(derniereUrl);
    derniereUrl = URL.createObjectURL(fichier);

    const img = new Image();
    img.decoding = 'async';
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = derniereUrl; })
      .catch(() => { dire('Image illisible.'); });
    if (!img.naturalWidth) return;

    if (apercu) { apercu.src = derniereUrl; apercu.hidden = false; }

    const groupes = extraire(img, 6);
    if (!groupes) { dire('Pas assez de couleurs dans cette image.'); return; }
    montrer(groupes);
    const r = appliquer(groupes);
    dire(`Palette tirée de votre photo. Matière ${r.matiere.hex.toUpperCase()}, lumière ${r.lumiere.hex.toUpperCase()}${r.lumiere.derivee ? " (dérivée)" : ""}.`);
  }

  entree.addEventListener('change', e => traiter(e.target.files[0]));

  // Glisser-deposer sur toute la zone
  ['dragenter', 'dragover'].forEach(n => zone.addEventListener(n, e => {
    e.preventDefault(); zone.dataset.survol = 'oui';
  }));
  ['dragleave', 'drop'].forEach(n => zone.addEventListener(n, e => {
    e.preventDefault(); zone.dataset.survol = 'non';
  }));
  zone.addEventListener('drop', e => traiter(e.dataTransfer?.files?.[0]));

  if (rendre) rendre.addEventListener('click', () => {
    rendreLaPalette();
    zone.dataset.pret = 'non';
    nuancier.innerHTML = '';
    if (apercu) { apercu.hidden = true; apercu.removeAttribute('src'); }
    dire('Palette d\'origine retablie.');
  });

  return { traiter, montrer };
}
