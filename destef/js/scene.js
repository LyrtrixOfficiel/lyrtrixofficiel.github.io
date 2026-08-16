/**
 * Le socle commun aux deux pièces en trois dimensions du site.
 *
 * Trois choses vivent ici parce qu'elles sont vraies pour les deux scènes :
 * le niveau de finesse que la machine peut tenir, la lumière d'atelier, et
 * la façon de charger un modèle sans qu'il arrive de travers.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* --- Ce que la machine peut tenir ---------------------------------------- */
/* On ne décide PAS d'après la largeur de l'écran. Un autre site de la maison
   avait coupé sa pièce maîtresse sous 700 px de large, ce qui laissait trois
   écrans vides sur téléphone alors que l'appareil en était largement capable.
   On regarde la mémoire et les cœurs, qui disent quelque chose de la machine. */
export const NIVEAU = (() => {
  const coeurs = navigator.hardwareConcurrency || 4;
  const memoire = navigator.deviceMemory || 4;
  const grossier = matchMedia('(hover: none)').matches;
  if (coeurs <= 4 && memoire <= 4) return 'bas';
  /* Un téléphone récent a huit cœurs et tiendrait le niveau haut une minute,
     puis chaufferait et se mettrait à ramer. On garde donc la 3D sur téléphone,
     ce qui est le plus important, mais un cran en dessous. */
  if (grossier) return 'moyen';
  return 'haut';
})();

export const CALME = matchMedia('(prefers-reduced-motion: reduce)');

/* --- Le rendu ------------------------------------------------------------ */

export function faireRendu(toile) {
  const rendu = new THREE.WebGLRenderer({
    canvas: toile,
    antialias: NIVEAU !== 'bas',
    alpha: true,
    powerPreference: 'high-performance',
  });
  rendu.setPixelRatio(Math.min(devicePixelRatio, NIVEAU === 'haut' ? 2 : 1.5));
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 1.05;
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  return rendu;
}

/* --- La lumière d'atelier ------------------------------------------------ */
/* Le ciel est du sable, le sol est du bois, la clé est chaude et vient de la
   gauche, et une braise orange lèche l'objet par derrière. C'est ce contre-jour
   qui détache la pièce du fond ; sans lui, le bois se noie dans le beige. */

export function poserLumiere(scene) {
  scene.add(new THREE.HemisphereLight(0xfff2dd, 0x6a4a30, 1.15));

  const cle = new THREE.DirectionalLight(0xffe3b8, 2.5);
  cle.position.set(-3.2, 4.4, 3.6);
  scene.add(cle);

  const braise = new THREE.DirectionalLight(0xff7d26, 1.9);
  braise.position.set(3.4, 1.2, -3.2);
  scene.add(braise);

  const appoint = new THREE.DirectionalLight(0xffd9a8, 0.55);
  appoint.position.set(2.2, -1.8, 2.4);
  scene.add(appoint);

  return { cle, braise };
}

/**
 * Un environnement fabriqué à la main plutôt qu'un fichier HDR téléchargé.
 * Un dégradé sable vers braise suffit à donner au bois verni ses reflets, et
 * il ne coûte pas les deux mégaoctets d'une carte d'environnement.
 */
export function poserEnvironnement(rendu, scene) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const d = c.getContext('2d');

  const g = d.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.00, '#fffaf0');
  g.addColorStop(0.34, '#f7e9d0');
  g.addColorStop(0.55, '#e8b877');
  g.addColorStop(0.78, '#a8541f');
  g.addColorStop(1.00, '#2a1c11');
  d.fillStyle = g;
  d.fillRect(0, 0, 64, 256);

  const texture = new THREE.CanvasTexture(c);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(rendu);
  const cible = pmrem.fromEquirectangular(texture);
  scene.environment = cible.texture;
  scene.environmentIntensity = 0.85;

  texture.dispose();
  pmrem.dispose();
}

/* --- Les modèles --------------------------------------------------------- */

const chargeur = new GLTFLoader();

/**
 * Charge un `.glb`, le recentre sur son propre volume et le ramène à une
 * hauteur d'une unité. Les quatre pièces sortent d'un générateur qui ne
 * s'accorde ni sur l'échelle ni sur l'origine ; sans cette remise à plat,
 * l'une remplit l'écran pendant que l'autre est un point.
 */
export function chargerPiece(url, { hauteur = 1 } = {}) {
  return new Promise((resoudre, rejeter) => {
    chargeur.load(url, (gltf) => {
      const objet = gltf.scene;

      const boite = new THREE.Box3().setFromObject(objet);
      const taille = boite.getSize(new THREE.Vector3());
      const centre = boite.getCenter(new THREE.Vector3());
      const echelle = hauteur / Math.max(taille.x, taille.y, taille.z);

      objet.position.sub(centre);

      const socle = new THREE.Group();
      socle.add(objet);
      socle.scale.setScalar(echelle);

      objet.traverse((n) => {
        if (!n.isMesh) return;
        n.castShadow = n.receiveShadow = false;
        const m = n.material;
        if (m) {
          m.envMapIntensity = 1.1;
          /* Meshy sort des matériaux presque mats. Un objet en bois ciré
             renvoie un peu de lumière : sans ce coup de vernis, la pièce est
             une silhouette plate quelle que soit la lumière posée dessus. */
          if (m.roughness !== undefined) m.roughness = Math.min(m.roughness, 0.72);
          if (m.metalness !== undefined) m.metalness = Math.min(m.metalness, 0.12);
        }
      });

      resoudre(socle);
    }, undefined, rejeter);
  });
}

/* --- L'ombre portée ------------------------------------------------------ */
/* Une vraie ombre demande une carte d'ombres et un plan de sol, donc une passe
   de rendu de plus pour une tache floue. On peint la tache directement. */

export function faireOmbre(rayon = 1.4) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const d = c.getContext('2d');
  const g = d.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0.0, 'rgba(60,36,16,.52)');
  g.addColorStop(0.45, 'rgba(60,36,16,.22)');
  g.addColorStop(1.0, 'rgba(60,36,16,0)');
  d.fillStyle = g;
  d.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;

  const plan = new THREE.Mesh(
    new THREE.PlaneGeometry(rayon * 2, rayon * 2),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  plan.rotation.x = -Math.PI / 2;
  return plan;
}

/* --- Le pointeur --------------------------------------------------------- */
/* Suivi depuis la FENÊTRE, jamais depuis la seule toile. Une pièce qui ne
   répond que si la souris est posée dessus donne l'impression de bouger au
   hasard, parce qu'on la regarde sans jamais la survoler. */

export function suivrePointeur() {
  const p = { x: 0, y: 0, cibleX: 0, cibleY: 0 };
  addEventListener('pointermove', (e) => {
    p.cibleX = (e.clientX / innerWidth) * 2 - 1;
    p.cibleY = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener('pointerleave', () => { p.cibleX = 0; p.cibleY = 0; }, { passive: true });
  p.amortir = (k = 0.055) => {
    p.x += (p.cibleX - p.x) * k;
    p.y += (p.cibleY - p.y) * k;
  };
  return p;
}

/* --- La prise en main ---------------------------------------------------- */
/* Attraper la pièce et la tourner soi-même. Le survol donne déjà un léger
   parallaxe, mais c'est un mouvement subi ; ici on rend la main.
 *
 * Deux précautions valent d'être dites :
 *
 * `touch-action: pan-y` sur la toile, posé en CSS. Sans lui, le navigateur ne
 * sait pas si un doigt qui glisse veut tourner la pièce ou faire défiler la
 * page : il attend, et le défilement devient poisseux sur toute la section.
 * Avec lui, le vertical reste au navigateur et l'horizontal nous revient.
 *
 * On rend des ÉCARTS à consommer, pas une position. L'appelant décide à quoi
 * il les applique, et peut n'en donner qu'à la pièce que le visiteur regarde. */

export function attraper(toile, { sensibilite = 0.0062 } = {}) {
  /* Au doigt, on n'engage la rotation qu'une fois l'intention connue, et on
     ne retient alors que l'horizontale. Le premier jet tournait la pièce au
     moindre mouvement : quiconque essayait simplement de faire défiler la page
     la faisait tourner en même temps, et l'inverse aussi. */
  const grossier = matchMedia('(pointer: coarse)').matches;
  const SEUIL = 9;    /* pixels parcourus avant de trancher */
  const PENTE = 1.4;  /* l'horizontale doit l'emporter d'autant pour engager */

  let suivi = false;  /* un doigt est posé, l'intention reste à connaître */
  let actif = false;  /* tranché : c'est bien une rotation */
  let ox = 0, oy = 0;
  let dernierX = 0, dernierY = 0;
  let dx = 0, dy = 0;   /* écart en attente */
  let vx = 0, vy = 0;   /* élan, pour que le geste se prolonge */
  let emprise = 0;      /* 0 au repos, 1 pendant la prise */

  const saisir = (e) => {
    try { toile.setPointerCapture(e.pointerId); } catch { /* sans capture, ça marche encore */ }
    toile.dataset.tenue = 'oui';
  };

  const debut = (e) => {
    if (e.button > 0) return;
    suivi = true;
    /* À la souris, il n'y a pas d'ambiguïté : le défilement passe par la
       molette, on prend donc la main tout de suite et sur les deux axes. */
    actif = !grossier;
    vx = vy = 0;
    ox = dernierX = e.clientX;
    oy = dernierY = e.clientY;
    if (actif) saisir(e);
  };

  const bouge = (e) => {
    if (!suivi) return;

    if (!actif) {
      const tx = e.clientX - ox;
      const ty = e.clientY - oy;
      if (Math.hypot(tx, ty) < SEUIL) return;
      if (Math.abs(tx) <= Math.abs(ty) * PENTE) { suivi = false; return; }
      actif = true;
      /* On repart d'ici, sinon les neuf pixels d'observation se déversent
         d'un coup dans la rotation et la pièce sursaute. */
      dernierX = e.clientX;
      dernierY = e.clientY;
      saisir(e);
    }

    const ax = (e.clientX - dernierX) * sensibilite;
    const ay = grossier ? 0 : (e.clientY - dernierY) * sensibilite;
    dernierX = e.clientX;
    dernierY = e.clientY;
    dx += ax; dy += ay;
    vx = ax; vy = ay;
  };

  const fin = (e) => {
    if (!suivi && !actif) return;
    suivi = false;
    if (actif) {
      try { toile.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
      delete toile.dataset.tenue;
    }
    actif = false;
  };

  toile.addEventListener('pointerdown', debut);
  addEventListener('pointermove', bouge, { passive: true });
  addEventListener('pointerup', fin);
  /* `pointercancel` arrive quand le navigateur décide que le geste était un
     défilement. Sans lui, la pièce resterait « tenue » pour toujours. */
  addEventListener('pointercancel', fin);

  return {
    get tenu() { return actif; },
    get emprise() { return emprise; },
    prendre(dt) {
      emprise += ((actif ? 1 : 0) - emprise) * Math.min(1, dt * 7);
      if (!actif) {
        dx += vx; dy += vy;
        const frein = Math.pow(0.92, dt * 60);
        vx *= frein; vy *= frein;
        if (Math.abs(vx) < 1e-4) vx = 0;
        if (Math.abs(vy) < 1e-4) vy = 0;
      }
      const ecart = { x: dx, y: dy };
      dx = dy = 0;
      return ecart;
    },
  };
}

/* --- Le cadrage ---------------------------------------------------------- */
/* On surveille la TOILE, pas la fenêtre. La fenêtre ne bouge pas quand un
   panneau latéral s'ouvre, quand une barre d'outils apparaît, ou quand la
   page finit de se mettre en page après le chargement des polices. Une scène
   cadrée une seule fois au démarrage garde alors les dimensions qu'elle avait
   à cet instant, qui peuvent n'avoir aucun rapport avec ce qu'on voit. */

export function observerTaille(toile, cadrer) {
  cadrer();
  const oeil = new ResizeObserver(() => cadrer());
  oeil.observe(toile);
  addEventListener('resize', cadrer, { passive: true });
  /* Les polices changent la hauteur du texte, donc la hauteur des sections. */
  document.fonts?.ready.then(cadrer);
  return () => oeil.disconnect();
}

/* --- La boucle ----------------------------------------------------------- */
/* Elle s'arrête dès que la scène quitte l'écran. Une toile en trois dimensions
   qui continue de tourner trois sections plus bas est du chauffage. */

export function boucler(element, pas) {
  let visible = true;
  let vivant = true;
  const horloge = new THREE.Clock();

  const oeil = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '120px' });
  oeil.observe(element);

  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  (function tour() {
    if (!vivant) return;
    requestAnimationFrame(tour);
    if (!visible) { horloge.getDelta(); return; }
    pas(Math.min(horloge.getDelta(), 0.05), horloge.elapsedTime);
  })();

  return () => { vivant = false; oeil.disconnect(); };
}

export { THREE };
