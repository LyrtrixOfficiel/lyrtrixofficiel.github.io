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
  chargerPiece, faireOmbre, suivrePointeur, boucler, observerTaille, attraper,
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

    pieces.push({
      support, ombre, corps: null, matieres: [], depart, balance, inclinaison,
      tour: 0,              /* la rotation automatique accumulée */
      main: { y: 0, x: 0 }, /* ce que le visiteur a tourné lui-même */
    });

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
  const prise = attraper(toile);
  toile.dataset.prenable = 'oui';
  let avance = 0;      /* position sur le rail, en index de pièce */
  let avanceLisse = 0;

  /* Pendant qu'une main tient la pièce, le rail ne suit plus le défilement.
     Au doigt, un geste horizontal emporte toujours un peu de vertical, et la
     page glisse dessous : sans ce gel, la pièce partait vers le volet de texte
     au moment même où on essayait de la tourner. Le décalage accumulé est
     rattrapé en douceur au relâchement, par l'amortissement qui existe déjà. */
  function mesurer() {
    if (prise.tenu) return;
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
  let hausse = 0;
  function cadrer() {
    const l = toile.clientWidth || innerWidth;
    const h = toile.clientHeight || innerHeight;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    const large = l >= 900;
    decalage = large ? Math.min(1.6, (l / h) * 0.55) : 0;
    /* Sur écran étroit, le volet de texte prend toute la largeur en bas :
       la pièce monte pour lui laisser la place. On relève le rail plutôt que
       de viser plus bas avec la caméra, ce qui déformerait la perspective. */
    hausse = large ? 0 : 1.15;
    camera.position.z = large ? 6.2 : 8.4;
    camera.updateProjectionMatrix();
    mesurer();
  }
  observerTaille(toile, cadrer);

  const arreter = boucler(section, (dt, t) => {
    /* Mesuré à chaque image plutôt qu'à chaque événement de défilement : au
       relâchement de la pièce, il n'y a pas forcément de nouvel événement, et
       le rail resterait figé là où le gel l'avait laissé. */
    mesurer();

    avanceLisse += (avance - avanceLisse) * Math.min(1, dt * 7.5);
    rail.position.y = avanceLisse * ECART + hausse;
    rail.position.x = decalage * Math.cos(avanceLisse * Math.PI);

    /* Le geste ne va qu'à la pièce que le visiteur a devant lui. Le distribuer
       à toutes ferait qu'en descendant d'un cran on trouverait la suivante
       déjà tournée par une main qui ne la visait pas. */
    const geste = prise.prendre(dt);
    const vise = pieces[Math.max(0, Math.min(pieces.length - 1, Math.round(avanceLisse)))];
    if (vise) {
      vise.main.y += geste.x;
      vise.main.x = Math.max(-0.8, Math.min(0.8, vise.main.x + geste.y));
    }

    for (const [i, p] of pieces.entries()) {
      /* Un PLATEAU, puis un fondu. La première version faisait décroître
         l'opacité dès qu'on s'écartait du centre exact du volet : il suffisait
         de s'arrêter au tiers du volet, ce qui est le cas courant sur
         téléphone où le défilement finit rarement pile, pour que la pièce
         reste à moitié transparente et paraisse en panne. Elle est maintenant
         pleine sur presque tout son volet, et ne se fond que sur la fin. */
      const d = Math.abs(avanceLisse - i);
      const presence = Math.min(1, Math.max(0, 1 - (d - 0.45) / 0.5));
      const doux = presence * presence * (3 - 2 * presence);

      p.support.scale.setScalar(0.72 + doux * 0.28);
      p.ombre.material.opacity = doux * 0.85;
      for (const m of p.matieres) m.opacity = doux;
      p.support.visible = doux > 0.005;
      p.support.rotation.x = p.inclinaison + p.main.x;

      if (p.corps) {
        /* Une pièce qui n'a qu'une face montrable se balance ; les autres,
           symétriques autour de leur axe de tour, font le tour complet.
           La rotation libre est tenue à part de celle de la main, pour que les
           deux s'additionnent au lieu de se remplacer. */
        if (p.balance) p.tour = Math.sin(t * 0.22) * 0.8 * (1 - prise.emprise * 0.7);
        else p.tour += dt * (CALME.matches ? 0.05 : 0.22) * (0.4 + doux) * (1 - prise.emprise);
        p.corps.rotation.y = p.depart + p.tour + p.main.y;
        p.corps.rotation.z = Math.sin(t * 0.5 + i) * 0.03;
        /* La pièce qui sort part en arrière : la profondeur fait la
           différence entre un carrousel et un simple glissement. */
        p.support.position.z = (1 - doux) * -1.6;
      }
    }

    pointeur.amortir(0.05);
    const suivi = 1 - prise.emprise;
    rail.rotation.y = pointeur.x * 0.2 * suivi;
    camera.position.y = pointeur.y * -0.18 * suivi;
    /* On vise un point FIXE, pas le rail. Viser le rail annule exactement le
       décalage qu'on vient de lui donner, et la pièce reste plantée au centre
       quoi qu'on écrive. */
    camera.lookAt(0, 0, 0);

    rendu.render(scene, camera);
  });

  return arreter;
}

export const VITRINE_ACTIVE = NIVEAU !== 'bas';
