/**
 * La boutique : la grille des pièces, ses filtres, et la fiche qui s'ouvre
 * par-dessus.
 *
 * Il n'y a pas de prix, et c'est voulu. Chaque pièce est unique, faite d'un
 * bois trouvé qui ne se retrouvera pas ; annoncer un tarif reviendrait à
 * promettre un catalogue qui n'existe pas. La fiche mène donc à une demande.
 */

const PHOTOS = 'assets/photos';

export function monter(racine, { CREATIONS, FAMILLES }) {
  const grille = racine.querySelector('[data-grille]');
  const barre = racine.querySelector('[data-filtres]');
  const compte = racine.querySelector('[data-compte]');
  if (!grille) return;

  /* --- La grille --------------------------------------------------------- */

  const cartes = CREATIONS.map((piece, index) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'piece';
    b.dataset.index = index;
    b.style.setProperty('--ratio', piece.ratio.toFixed(4));
    b.setAttribute('aria-label', `${piece.titre}, voir la fiche`);
    /* Les premières vignettes ne sont pas différées : sur téléphone, deux
       colonnes, ce sont les six premières qui remplissent le premier écran, et
       les différer fait apparaître la page vide avant de se remplir. */
    const pressee = index < 6;
    b.innerHTML = `
      <img src="${PHOTOS}/${piece.code}.webp" alt="${echapper(piece.titre)}"
           ${pressee ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
           width="700" height="${Math.round(700 / piece.ratio)}">
      <span class="piece__voile">
        <span class="piece__titre">${echapper(piece.titre)}</span>
        <span class="piece__loupe" aria-hidden="true">↗</span>
      </span>`;
    b.addEventListener('click', () => ouvrir(index));
    grille.append(b);
    return b;
  });

  /* --- Les filtres ------------------------------------------------------- */

  let famille = 'tout';

  if (barre) {
    for (const f of FAMILLES) {
      const n = f.cle === 'tout'
        ? CREATIONS.length
        : CREATIONS.filter((p) => p.familles.includes(f.cle)).length;
      if (!n) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'filtre';
      b.dataset.cle = f.cle;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `${f.nom}<small>${n}</small>`;
      b.addEventListener('click', () => {
        famille = f.cle;
        for (const autre of barre.children) autre.setAttribute('aria-pressed', String(autre === b));
        appliquer();
      });
      barre.append(b);
    }
  }

  function appliquer() {
    let vus = 0;
    CREATIONS.forEach((p, i) => {
      const garde = famille === 'tout' || p.familles.includes(famille);
      cartes[i].hidden = !garde;
      if (garde) vus++;
    });
    if (compte) compte.textContent = `${vus} pièce${vus > 1 ? 's' : ''}`;
    /* L'adresse retient le rayon, pour qu'un lien partagé arrive au bon
       endroit et qu'un retour en arrière ne remette pas tout à zéro. */
    const url = new URL(location);
    if (famille === 'tout') url.searchParams.delete('rayon');
    else url.searchParams.set('rayon', famille);
    history.replaceState(null, '', url);
  }

  const rayonDemande = new URL(location).searchParams.get('rayon');
  if (rayonDemande && FAMILLES.some((f) => f.cle === rayonDemande)) famille = rayonDemande;
  if (barre) for (const b of barre.children) b.setAttribute('aria-pressed', String(b.dataset.cle === famille));
  appliquer();

  /* --- La fiche ---------------------------------------------------------- */

  const fiche = racine.querySelector('[data-fiche]');
  if (!fiche) return;

  const el = {
    image: fiche.querySelector('[data-fiche-image]'),
    titre: fiche.querySelector('[data-fiche-titre]'),
    texte: fiche.querySelector('[data-fiche-texte]'),
    matieres: fiche.querySelector('[data-fiche-matieres]'),
    demande: fiche.querySelector('[data-fiche-demande]'),
    source: fiche.querySelector('[data-fiche-source]'),
  };
  let courant = 0;

  function ouvrir(i) {
    courant = (i + CREATIONS.length) % CREATIONS.length;
    const p = CREATIONS[courant];

    el.image.src = `${PHOTOS}/grand/${p.code}.webp`;
    el.image.alt = p.titre;
    el.titre.textContent = p.titre;
    el.texte.textContent = p.texte;
    el.matieres.innerHTML = p.matieres.map((m) => `<li>${echapper(m)}</li>`).join('');
    el.demande.href = `contact.html?piece=${encodeURIComponent(p.titre)}`;
    el.source.href = `https://www.instagram.com/p/${p.code}/`;

    if (!fiche.open) fiche.showModal();
  }

  function glisser(pas) {
    /* On saute les pièces masquées par le filtre courant : sinon la flèche
       fait apparaître une pièce que le visiteur venait justement d'écarter. */
    let i = courant;
    for (let n = 0; n < CREATIONS.length; n++) {
      i = (i + pas + CREATIONS.length) % CREATIONS.length;
      if (!cartes[i].hidden) break;
    }
    ouvrir(i);
  }

  fiche.querySelector('[data-fiche-prec]')?.addEventListener('click', () => glisser(-1));
  fiche.querySelector('[data-fiche-suiv]')?.addEventListener('click', () => glisser(1));
  fiche.querySelector('[data-fiche-fermer]')?.addEventListener('click', () => fiche.close());

  fiche.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); glisser(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); glisser(1); }
  });

  /* Cliquer sur le fond ferme. Le dialogue occupe toute la fenêtre, donc on
     compare la position du clic au cadre, pas la cible de l'événement. */
  fiche.addEventListener('click', (e) => {
    const cadre = fiche.querySelector('.fiche__cadre').getBoundingClientRect();
    const dehors = e.clientX < cadre.left || e.clientX > cadre.right
                || e.clientY < cadre.top || e.clientY > cadre.bottom;
    if (dehors && e.target === fiche) fiche.close();
  });

  fiche.addEventListener('close', () => { el.image.src = ''; });
}

function echapper(t) {
  return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
