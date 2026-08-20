/**
 * L'OBJET : leur bouteille, en trois dimensions, qu'on attrape et qu'on tourne.
 *
 * D'OU IL VIENT
 *
 * De LEUR photo. La page Facebook d'une brasserie sert publiquement une image
 * d'apercu ; quand cette image montre un produit entier, Meshy la reconstruit
 * en volume avec sa texture. La bouteille de La Saint Aubinaise sort d'un gros
 * plan de leur etiquette pose sur de l'orge, et on y lit encore « Avec l'orge
 * de ma ferme ». Les sept bouteilles du Choucas sortent d'une photo de leur
 * gamme, chacune avec son etiquette et sa capsule.
 *
 * CE QUI NE MARCHE PAS, ET IL FAUT LE DIRE
 *
 * Le procede demande un OBJET COMPLET sur un fond lisible. La photo de
 * PicoNino montrait des cones de houblon sur pied : le modele rendu est un
 * saladier de verdure avec un scarabee. Sur vingt-deux brasseries, la plupart
 * ont un logo plat en photo de profil, et un logo plat ne se met pas en volume.
 * On ne pose donc l'objet que la ou il est bon, et nulle part ailleurs.
 *
 * LE POIDS
 *
 * Le modele sort a onze megaoctets, ce qui tuerait la page. `alleger-glb.mjs`
 * redimensionne chaque texture selon SON role et le ramene sous le megaoctet,
 * soit quatre-vingt-douze pour cent de moins pour une difference invisible a
 * l'ecran a cette taille d'affichage.
 */
/* LES SPECIFICATEURS SONT NUS, ET LA CARTE EST DANS LA PAGE.
   Piege paye : j'importais three par un chemin relatif, ce qui marchait pour
   moi. Mais GLTFLoader, lui, importe « three » tout court, et le navigateur
   repond « Failed to resolve module specifier "three" ». Le module tombait, la
   section etait retiree, et la page ne montrait plus l'objet sans qu'aucune
   erreur ne remonte : le `catch` avalait tout.
   Une carte d'imports dans la page resout les deux, le mien et le sien. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function monterLObjet(hote, source, couleurs, options = {}) {
  const sobre = options.sobre ?? false;
  const toile = document.createElement('canvas');
  hote.appendChild(toile);

  const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true });
  rendu.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  /* Le ton mappe : sans lui, un verre brun eclaire de deux sources ressort
     brule sur les hautes lumieres et bouche dans les ombres. */
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.01, 100);

  /* La lumiere prend LEUR teinte sur le cote : l'objet appartient a la page,
     pas a un studio neutre. */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1b1512, 2.1));
  const cle = new THREE.DirectionalLight(0xffffff, 2.6); cle.position.set(2.6, 4.2, 3.4); scene.add(cle);
  const bord = new THREE.DirectionalLight(new THREE.Color(couleurs.accent || '#ffffff'), 1.5);
  bord.position.set(-3.4, 1.6, -2.6); scene.add(bord);

  let objet = null, prise = false, vitesse = 0.0035, cible = 0, courant = 0;

  function mesurer() {
    const r = hote.getBoundingClientRect();
    if (r.width < 10) return;
    rendu.setSize(r.width, r.height, false);
    cam.aspect = r.width / Math.max(1, r.height);
    cam.updateProjectionMatrix();
  }

  new GLTFLoader().load(source, (g) => {
    objet = g.scene;
    /* On centre et on normalise : les modeles ne sortent ni a la meme echelle
       ni au meme endroit, et une page ne peut pas dependre de ca. */
    const b = new THREE.Box3().setFromObject(objet);
    const t = b.getSize(new THREE.Vector3());
    const c = b.getCenter(new THREE.Vector3());
    /* 1,35 debordait : une bouteille est bien plus haute que large, et la
       normalisation sur la plus grande dimension la faisait sortir du cadre en
       haut et en bas. On cale sur la HAUTEUR de la scene, pas sur la plus
       grande dimension de l objet. */
    const k = 1.0 / Math.max(t.y, t.x * 1.6, t.z * 1.6);
    objet.scale.setScalar(k);
    objet.position.sub(c.multiplyScalar(k));
    scene.add(objet);
    cam.position.set(0, 0.05, 2.35);
    cam.lookAt(0, 0, 0);
    mesurer();
    hote.dataset.pret = 'oui';
  }, undefined, () => { hote.dataset.rate = 'oui'; });

  mesurer();
  new ResizeObserver(mesurer).observe(hote);

  /* La prise. On tourne l'objet a la main, comme chez Stephane : c'est le geste
     qui fait qu'on ne regarde pas une image, on manipule une chose. */
  const prendre = (e) => { prise = true; cible = e.clientX; hote.setPointerCapture?.(e.pointerId); };
  const bouger = (e) => {
    if (!prise || !objet) return;
    courant = e.clientX;
    objet.rotation.y += (courant - cible) * 0.011;
    cible = courant;
  };
  const lacher = () => { prise = false; };
  hote.addEventListener('pointerdown', prendre);
  hote.addEventListener('pointermove', bouger);
  addEventListener('pointerup', lacher);

  const tour = () => {
    if (objet && !prise && !sobre) objet.rotation.y += vitesse;
    if (objet) rendu.render(scene, cam);
    requestAnimationFrame(tour);
  };
  tour();

  return {
    /* Branche sur le defilement : l'objet se redresse et s'approche pendant
       qu'on traverse sa section. */
    avance(v) {
      if (!objet || prise) return;
      const p = Math.max(0, Math.min(1, v));
      cam.position.z = 2.35 - p * 0.35;
      objet.position.y = (0.5 - p) * 0.16;
      cam.lookAt(0, 0, 0);
    },
  };
}
