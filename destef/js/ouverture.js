/**
 * L'ouverture : la pièce qui tourne au-dessus de la première page.
 *
 * Un morceau de bois flotté monté en lampe, posé dans une lumière d'atelier,
 * et une douzaine de bulles de verre qui montent lentement autour. Les bulles
 * ne sont pas là pour faire joli : ce sont elles qui donnent l'échelle et la
 * profondeur, sans quoi l'objet flotte dans un vide beige sans dimension.
 */
import {
  THREE, NIVEAU, CALME, faireRendu, poserLumiere, poserEnvironnement,
  chargerPiece, faireOmbre, suivrePointeur, boucler, observerTaille,
} from './scene.js';

export async function ouvrir(toile, racineModeles) {
  const rendu = faireRendu(toile);
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 0, 5.4);

  poserLumiere(scene);
  poserEnvironnement(rendu, scene);

  /* Le socle : tout ce qui doit répondre au pointeur pend ici. */
  const socle = new THREE.Group();
  scene.add(socle);

  /* --- Les bulles -------------------------------------------------------- */
  /* Une bulle de savon, pas une bille de verre.
     La transmission de three lit ce qu'il y a DERRIÈRE, dans la scène. Ici il
     n'y a rien derrière : le fond beige est celui de la page, en CSS, sous une
     toile transparente. Une bulle en transmission ne transmet donc que du vide
     et ressort blanche, ce qui donne des pastilles opaques au lieu de verre.
     On prend l'autre chemin : une pellicule mince, irisée, à deux faces, dont
     tout l'intérêt est le liseré. Elle est aussi bien plus légère. */
  const combien = { haut: 22, moyen: 12, bas: 0 }[NIVEAU];

  const verre = new THREE.MeshPhysicalMaterial({
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.07,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [180, 800],
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    color: 0xffffff,
  });

  const boule = new THREE.SphereGeometry(1, 32, 24);
  const bulles = [];
  for (let i = 0; i < combien; i++) {
    const m = new THREE.Mesh(boule, verre);
    const r = 0.045 + Math.random() * 0.095;
    m.scale.setScalar(r);
    m.userData = {
      rayon: r,
      base: new THREE.Vector3(
        (Math.random() - 0.5) * 5.2,
        -1.9 - Math.random() * 2.4,
        (Math.random() - 0.5) * 2.6 - 0.4,
      ),
      vitesse: 0.13 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.1 + Math.random() * 0.22,
    };
    m.position.copy(m.userData.base);
    socle.add(m);
    bulles.push(m);
  }

  /* --- La pièce ---------------------------------------------------------- */
  const piece = new THREE.Group();
  piece.position.set(0.05, -0.15, 0);
  socle.add(piece);

  const ombre = faireOmbre(1.5);
  ombre.position.y = -1.28;
  ombre.material.opacity = 0;
  piece.add(ombre);

  let bois = null;
  try {
    bois = await chargerPiece(`${racineModeles}/reveil.glb`, { hauteur: 2.2 });
    piece.add(bois);
  } catch {
    /* Sans le modèle, la page reste juste : le titre et le texte sont en HTML,
       ils n'ont jamais dépendu de la toile. On ne montre pas d'erreur. */
  }

  /* --- L'entrée ---------------------------------------------------------- */
  /* Calée sur le temps écoulé, pas accumulée image par image. Un onglet en
     arrière-plan ne reçoit qu'une image par seconde, et comme on plafonne
     l'écart à cinquante millisecondes pour éviter les sauts, une entrée
     accumulée y met une demi-minute au lieu de deux secondes. */
  let depart = null;
  const pointeur = suivrePointeur();

  function cadrer() {
    const l = toile.clientWidth || innerWidth;
    const h = toile.clientHeight || innerHeight;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;

    /* Sur un écran large, la pièce va à droite pour laisser le texte respirer.
       Sur un écran étroit, elle repasse au centre et recule. */
    const large = l / h > 1.05;
    piece.position.x = large ? Math.min(1.55, l / h * 0.62) : 0;
    piece.position.y = large ? 0 : 0.9;
    camera.position.z = large ? 5.4 : 6.6;
    camera.updateProjectionMatrix();
  }
  observerTaille(toile, cadrer);

  const arreter = boucler(toile, (dt, t) => {
    if (depart === null) depart = t;
    const entree = Math.min(1, (t - depart) / 1.8);
    const e = 1 - Math.pow(1 - entree, 3);

    if (bois) {
      /* Un balancement, pas un tour complet : le cadran est la seule face
         intéressante de la pièce, et un tour la cache la moitié du temps. */
      bois.rotation.y = Math.sin(t * 0.19) * 0.85 + pointeur.x * 0.35;
      bois.position.y = Math.sin(t * 0.62) * 0.07 + (1 - e) * -1.4;
      bois.rotation.z = Math.sin(t * 0.41) * 0.025;
    }
    ombre.material.opacity = e * 0.9;
    ombre.scale.setScalar(0.86 + Math.sin(t * 0.62) * 0.03);

    for (const b of bulles) {
      const u = b.userData;
      /* La montée est calculée depuis le temps absolu, pas accumulée image par
         image : une bulle qui accumule dérive quand l'onglet ralentit. */
      const monte = ((t * u.vitesse + u.phase) % 1.9);
      b.position.y = u.base.y + monte * 3.2;
      b.position.x = u.base.x + Math.sin(t * 0.7 + u.phase) * u.amplitude;
      b.position.z = u.base.z + Math.cos(t * 0.5 + u.phase) * u.amplitude * 0.6;
      const s = u.rayon * e * (1 - Math.max(0, monte - 1.6) / 0.3);
      b.scale.setScalar(Math.max(0.0001, s));
    }

    pointeur.amortir();
    socle.rotation.y = pointeur.x * 0.17;
    socle.rotation.x = pointeur.y * 0.09;
    camera.position.x = pointeur.x * -0.22;
    camera.position.y = pointeur.y * -0.12;
    camera.lookAt(camera.position.x * 0.5, 0, 0);

    rendu.render(scene, camera);
  });

  return arreter;
}
