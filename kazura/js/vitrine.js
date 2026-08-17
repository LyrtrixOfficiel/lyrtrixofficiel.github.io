/* ══════════════════════════════════════════════════════════════════════════
   L'ARMATURE COMMUNE DES VITRINES
   --------------------------------------------------------------------------
   Ce que toutes les vitrines partagent, et rien de plus : le voile de
   chargement, l'enchainement des actes le long du defilement, le curseur, et
   le bandeau Kazura.

   CE QU'ELLES NE PARTAGENT PAS, volontairement : la typographie, les couleurs,
   le rythme, le monde en trois dimensions. Une vitrine dont on reconnaitrait
   le gabarit ne demontrerait rien du tout, elle prouverait le contraire de ce
   qu'on avance.
   ══════════════════════════════════════════════════════════════════════════ */

const serre = (v, a, b) => Math.max(a, Math.min(b, v));

/* ══ LES ACTES ═══════════════════════════════════════════════════════════
   Chaque acte porte deux bornes de defilement. Entre les deux il est plein,
   sur les bords il se fond. Le PLATEAU est essentiel : sans lui, la position
   de repos la plus frequente est une position intermediaire, donc un texte a
   demi efface. C'est la meme lecon que la vitrine de Destef.

   IL N'Y A AUCUNE TRANSITION CSS ICI. L'opacite est une fonction pure du
   defilement, recalculee a chaque image. Une transition declenchee par un
   seuil de position fait le yoyo des qu'on remonte d'un cran. */
export function monterLesActes(racine = document) {
  const actes = [...racine.querySelectorAll('[data-acte]')].map(el => ({
    el,
    de:  parseFloat(el.dataset.de)  || 0,
    a:   parseFloat(el.dataset.a)   || 1,
    fondu: parseFloat(el.dataset.fondu) || 0.05
  }));
  if (!actes.length) return null;

  let avance = 0;

  function poser(p) {
    avance = p;
    for (const acte of actes) {
      const { de, a, fondu } = acte;
      /* LES DEUX BOUTS SONT PLEINS. Un acte qui commence a zero se fond
         depuis rien, donc en haut de page le premier ecran est vide : le
         visiteur arrive sur un texte a moitie efface, et c'est ce qu'il a
         juge en une seconde. Meme chose en bas pour le dernier. */
      const entree = de <= 0    ? 1 : serre((p - de) / fondu, 0, 1);
      const sortie = a  >= 1    ? 1 : serre((a - p) / fondu, 0, 1);
      const o = Math.min(entree, sortie);
      /* En dessous du centieme, on sort l'element du calque : un element a
         opacite nulle occupe quand meme un plan de composition, et six d'entre
         eux empiles coutent une passe de peinture par image pour rien. */
      acte.el.style.opacity = o.toFixed(3);
      acte.el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      acte.el.style.setProperty('--dedans', o.toFixed(3));
    }
  }

  return { poser, avance: () => avance };
}

/* ══ LE VOILE ════════════════════════════════════════════════════════════
   Un site de ce genre ne doit jamais s'ouvrir a moitie monte. Le voile tient
   jusqu'a ce que les polices soient la ET que la scene ait rendu sa premiere
   image, avec un delai de secours : rien de decoratif ne doit pouvoir
   enfermer un visiteur dehors. */
export function monterLeVoile(voile, promesse) {
  if (!voile) return () => {};
  let leve = false;
  const lever = () => {
    if (leve) return;
    leve = true;
    voile.dataset.etat = 'leve';
    setTimeout(() => { voile.hidden = true; }, 1400);
    document.documentElement.dataset.pret = 'oui';
  };
  /* Le delai de secours n'est JAMAIS annule. Il l'etait dans la premiere
     version, et le relais etait alors une chaine de requestAnimationFrame :
     dans un onglet d'arriere-plan le navigateur gele ces images, donc la
     chaine ne repartait pas et le voile restait pose pour toujours. Un onglet
     ouvert en second plan, ce que fait tout clic du milieu, suffisait.
     Regle deja posee sur le seuil de l'accueil, oubliee ici : rien de
     decoratif ne doit pouvoir enfermer un visiteur dehors. */
  setTimeout(lever, 9000);
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    promesse || Promise.resolve()
  ]).then(() => {
    /* Deux images de battement : la premiere sert a monter la scene, la
       seconde a la peindre. Lever au premier rendu montre un ecran vide.
       Et une minuterie en parallele, qui elle tourne meme sans images. */
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(lever, 260)));
    setTimeout(lever, 900);
  }).catch(lever);
  return lever;
}

/* ══ LE CURSEUR ══════════════════════════════════════════════════════════
   Un anneau qui suit la main avec un temps de retard, et qui s'ouvre sur ce
   qui se clique. Ce n'est pas un gadget : c'est le seul element d'interface
   qui dit au visiteur, en permanence, que la page repond. */
export function monterLeCurseur() {
  if (matchMedia('(pointer: coarse)').matches) return null;
  const el = document.createElement('div');
  el.className = 'curseur';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i></i><b></b>';
  document.body.appendChild(el);

  const vise = { x: innerWidth / 2, y: innerHeight / 2 };
  const vu   = { x: vise.x, y: vise.y };
  let dernier = performance.now(), actif = true;

  addEventListener('pointermove', e => {
    vise.x = e.clientX; vise.y = e.clientY;
    el.dataset.vu = 'oui';
    const cible = e.target instanceof Element ? e.target.closest('a, button, [data-attrape]') : null;
    el.dataset.pris = cible ? 'oui' : 'non';
  }, { passive: true });
  addEventListener('pointerdown', () => { el.dataset.appuye = 'oui'; }, { passive: true });
  addEventListener('pointerup',   () => { el.dataset.appuye = 'non'; }, { passive: true });

  (function battre(t) {
    if (!actif) return;
    requestAnimationFrame(battre);
    const dt = Math.min(0.05, (t - dernier) / 1000); dernier = t;
    const k = 1 - Math.pow(1 - 0.30, dt * 60);
    vu.x += (vise.x - vu.x) * k;
    vu.y += (vise.y - vu.y) * k;
    el.style.transform = 'translate3d(' + vu.x.toFixed(1) + 'px,' + vu.y.toFixed(1) + 'px,0)';
  })(dernier);

  return { detruire() { actif = false; el.remove(); } };
}

/* ══ LE DEFILEMENT LU ════════════════════════════════════════════════════ */
export function monterLaLecture(surAvance) {
  let avance = 0;
  const lire = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    avance = total > 0 ? serre(scrollY / total, 0, 1) : 0;
  };
  addEventListener('scroll', lire, { passive: true });
  addEventListener('resize', lire, { passive: true });
  lire();

  (function battre() {
    requestAnimationFrame(battre);
    surAvance(avance);
  })();

  return () => avance;
}
