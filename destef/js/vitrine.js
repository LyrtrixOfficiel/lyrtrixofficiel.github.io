/**
 * La vitrine : quatre pièces qui défilent au rythme du doigt.
 *
 * Une seule toile, collée en haut de l'écran, et quatre volets de texte qui
 * passent devant. Les quatre modèles sont posés les uns au-dessus des autres
 * sur un rail vertical ; c'est le rail qui monte, pas la caméra. La pièce
 * courante arrive donc par le bas et sort par le haut, ce qui va dans le même
 * sens que le geste de la main.
 */
import {
  THREE, NIVEAU, CALME, faireRendu, poserLumiere, poserEnvironnement,
  chargerPiece, faireOmbre, suivrePointeur, boucler, observerTaille,
} from './scene.js';

const ECART = 3.4;

export async function dresser(section, toile, racineModeles, fichiers) {
  const rendu = faireRendu(toile);
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0, 6.2);

  poserLumiere(scene);
  poserEnvironnement(rendu, scene);

  const rail = new THREE.Group();
  scene.add(rail);

  const pieces = [];
  for (const [i, reglage] of fichiers.entries()) {
    const { fichier, inclinaison = 0, depart = 0, balance = false, hauteur = 2.2 } = reglage;

    const support = new THREE.Group();
    support.position.y = -i * ECART;
    support.rotation.x = inclinaison;
    rail.add(support);

    const ombre = faireOmbre(1.6);
    ombre.position.y = -1.15;
    ombre.material.opacity = 0;
    support.add(ombre);

    pieces.push({ support, ombre, corps: null, matieres: [], depart, balance });

    chargerPiece(`${racineModeles}/${fichier}`, { hauteur }).then((corps) => {
      corps.rotation.y = depart;
      support.add(corps);
      const p = pieces[i];
      p.corps = corps;
      corps.traverse((n) => {
        if (n.isMesh && n.material) {
          n.material.transparent = true;
          p.matieres.push(n.material);
        }
      });
    }).catch(() => { /* une pièce manquante laisse simplement son volet nu */ });
  }

  const pointeur = suivrePointeur();
  let avance = 0;      /* position sur le rail, en index de pièce */
  let avanceLisse = 0;

  function mesurer() {
    const r = section.getBoundingClientRect();
    const course = section.offsetHeight - innerHeight;
    if (course <= 0) { avance = 0; return; }
    const brut = (-r.top) / course;
    avance = Math.max(0, Math.min(1, brut)) * (fichiers.length - 1);
  }

  /* Les volets de texte alternent d'un bord à l'autre ; la pièce doit donc
     alterner aussi, sinon elle passe une fois sur deux sous le texte. Le
     cosinus fait le va-et-vient sans à-coup : +1 sur les volets pairs, -1 sur
     les impairs, et un glissement continu entre les deux. */
  let decalage = 0;
  function cadrer() {
    const l = toile.clientWidth || innerWidth;
    const h = toile.clientHeight || innerHeight;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    decalage = l >= 900 ? Math.min(1.6, (l / h) * 0.55) : 0;
    camera.position.z = l >= 900 ? 6.2 : 7.6;
    camera.updateProjectionMatrix();
    mesurer();
  }
  observerTaille(toile, cadrer);
  addEventListener('scroll', mesurer, { passive: true });

  const arreter = boucler(section, (dt, t) => {
    avanceLisse += (avance - avanceLisse) * Math.min(1, dt * 7.5);
    rail.position.y = avanceLisse * ECART;
    rail.position.x = decalage * Math.cos(avanceLisse * Math.PI);

    for (const [i, p] of pieces.entries()) {
      const d = Math.abs(avanceLisse - i);
      const presence = Math.max(0, 1 - d * 1.15);
      const doux = presence * presence * (3 - 2 * presence);

      p.support.scale.setScalar(0.72 + doux * 0.28);
      p.ombre.material.opacity = doux * 0.85;
      for (const m of p.matieres) m.opacity = doux;
      p.support.visible = doux > 0.005;

      if (p.corps) {
        /* Une pièce qui n'a qu'une face montrable se balance ; les autres,
           symétriques autour de leur axe de tour, font le tour complet. */
        if (p.balance) p.corps.rotation.y = p.depart + Math.sin(t * 0.22) * 0.8;
        else p.corps.rotation.y += dt * (CALME.matches ? 0.05 : 0.22) * (0.4 + doux);
        p.corps.rotation.z = Math.sin(t * 0.5 + i) * 0.03;
        /* La pièce qui sort part en arrière : la profondeur fait la
           différence entre un carrousel et un simple glissement. */
        p.support.position.z = (1 - doux) * -1.6;
      }
    }

    pointeur.amortir(0.05);
    rail.rotation.y = pointeur.x * 0.2;
    camera.position.y = pointeur.y * -0.18;
    /* On vise un point FIXE, pas le rail. Viser le rail annule exactement le
       décalage qu'on vient de lui donner, et la pièce reste plantée au centre
       quoi qu'on écrive. */
    camera.lookAt(0, 0, 0);

    rendu.render(scene, camera);
  });

  return arreter;
}

export const VITRINE_ACTIVE = NIVEAU !== 'bas';
