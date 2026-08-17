/* ══════════════════════════════════════════════════════════════════════════
   LE PORTAIL DE PIERRE
   --------------------------------------------------------------------------
   Un modele venu de l'exterieur, pose dans notre lumiere.

   POURQUOI CELUI-LA EST TELECHARGE ALORS QUE LE SCEAU EST CALCULE. Le sceau
   est notre logo : un trace vectoriel, donc on l'extrude et on a la forme
   exacte pour rien. Ce portail est une piece sculptee, erodee, envahie de
   lianes : aucune formule ne la donne, et la modeliser a la main prendrait des
   jours. Chaque chose par le moyen qui lui convient. Ce que la page demontre
   ici n'est pas qu'on sait tout calculer, c'est qu'on sait tout INTEGRER.

   CE QUI A ETE FAIT AU FICHIER AVANT DE L'ACCEPTER. Il arrivait a 9,38 Mo
   pour 9 092 triangles : la geometrie ne pesait rien, trois cartes en 2048
   pesaient 97 pour cent du fichier. Reduites selon ce que chacune porte, la
   couleur en 1024, les normales en 1024, le metal et la rugosite en 512
   puisque ces valeurs varient lentement sur de la pierre. 809 Ko au final,
   91,6 pour cent de moins, sans un triangle en moins.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { monterLeCiel } from './ciel.js';

export async function monterLePortail(toile, options = {}) {
  /* La decision est prise une seule fois, par kazura.js, a partir de l'adresse,
     du choix garde et du reglage systeme. On la lit, on ne la refait pas. */
  const sobre = document.documentElement.dataset.mouvement !== 'anime';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true });
  } catch (e) { return null; }

  const petit = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, petit ? 1.2 : 1.6));
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  camera.position.set(0, 0, options.distance || 4.6);

  const env = monterLeCiel(renderer, scene);

  /* L'environnement fait l'essentiel. Ces deux lampes ne servent qu'a poser un
     eclat franc sur les aretes hautes et un liseré violet sur le contour, que
     le ciel seul ne donne pas assez net. */
  const cle = new THREE.DirectionalLight(0xF2FFF9, 2.2);
  cle.position.set(-2.8, 3.4, 4.2);
  scene.add(cle);
  const contre = new THREE.DirectionalLight(0x8B5CF6, 2.4);
  contre.position.set(3.4, -1.4, -3.2);
  scene.add(contre);

  /* ── Le modele ────────────────────────────────────────────────────────── */
  const groupe = new THREE.Group();
  scene.add(groupe);

  let objet = null;
  try {
    const gltf = await new GLTFLoader().loadAsync(options.fichier || 'modeles/portail.glb');
    objet = gltf.scene;
  } catch (e) {
    renderer.dispose();
    return null;
  }

  /* On ne fait jamais confiance a l'echelle ni au centre d'un fichier recu :
     celui-ci arrivait dans une boite d'une unite, un autre arrivera en
     centimetres et sortira du cadre. On mesure, on recentre, on met a
     l'echelle du cadrage voulu. */
  const boite = new THREE.Box3().setFromObject(objet);
  const centre = boite.getCenter(new THREE.Vector3());
  const taille = boite.getSize(new THREE.Vector3());
  objet.position.sub(centre);
  objet.scale.setScalar((options.echelle || 2.35) / Math.max(taille.x, taille.y, taille.z));
  groupe.add(objet);
  /* Decalage libre : un objet centre mange un titre centre. */
  groupe.position.x = options.decalageX || 0;
  groupe.position.y = options.decalageY || 0;

  /* Meshy sort des materiaux prevus pour un rendu neutre. Ici la pierre doit
     boire la lumiere et le jade la rendre : on remonte l'environnement et on
     empeche le metal, sans quoi la roche ressort en chrome. */
  objet.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    if (!m) return;
    m.envMapIntensity = options.envIntensite ?? 1.35;
    if ('metalness' in m) m.metalness = 0;
    if ('roughness' in m) m.roughness = Math.min(1, (m.roughness ?? 1) * 0.92);
    /* Teinte optionnelle : le materiau sorti de Meshy est souvent gris-vert
       delave. On le ramene vers le jade de la maison sans toucher a la texture. */
    if (options.teinte && m.color) m.color.multiplyScalar(1).lerp(new THREE.Color(options.teinte), options.forceTeinte ?? 0.45);
    m.needsUpdate = true;
  });

  /* ── Le geste ─────────────────────────────────────────────────────────── */
  /* On ecoute la FENETRE, pas la toile. Un objet qui ne repond que lorsque le
     curseur est pose dessus donne exactement l'impression que Matheo decrivait
     sur le sceau : il bouge tout seul, sans rapport avec la main. En suivant
     le pointeur partout, l'objet regarde la souris des qu'on le voit, et le
     lien de cause a effet se lit immediatement. */
  const vise = { x: 0, y: 0 };
  const vu   = { x: 0, y: 0 };
  let dansLaVue = false;

  const suivre = e => {
    if (!dansLaVue) return;
    const r = toile.getBoundingClientRect();
    if (!r.width) return;
    const nx = (e.clientX - (r.left + r.width / 2))  / (r.width / 2);
    const ny = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
    /* Borne large : au dela de deux largeurs de toile, la souris ne fait plus
       tourner davantage, sinon l'objet se retrouve de dos. */
    vise.y = Math.max(-1.6, Math.min(1.6, nx)) * 0.55;
    vise.x = Math.max(-1.6, Math.min(1.6, ny)) * 0.30;
  };
  window.addEventListener('pointermove', suivre, { passive: true });

  /* ── Boucle ───────────────────────────────────────────────────────────── */
  let visible = false, actif = true, dernier = performance.now();
  let entree = sobre ? 1 : 0, cumul = 0, images = 0, degrade = false;

  function jauger(dt) {
    cumul += dt; images++;
    if (images < 45) return;
    const moyenne = cumul / images; cumul = 0; images = 0;
    if (moyenne > 0.024 && !degrade) {
      renderer.setPixelRatio(Math.max(0.8, renderer.getPixelRatio() * 0.75));
      mesurer();
      degrade = true;
    }
  }

  function mesurer() {
    const r = toile.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width));
    const h = Math.max(2, Math.round(r.height));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  mesurer();
  window.addEventListener('resize', mesurer);

  function battre(maintenant) {
    if (!actif) return;
    requestAnimationFrame(battre);
    /* Plancher a zero : `montrer` peut remettre l'horloge apres l'horodatage
       de l'image en cours, et une duree negative faisait reculer l'entree. */
    const dt = Math.min(0.05, Math.max(0, (maintenant - dernier) / 1000));
    dernier = maintenant;
    if (!visible) return;
    jauger(dt);

    const a = 1 - Math.pow(1 - 0.10, dt * 60);
    vu.x += (vise.x - vu.x) * a;
    vu.y += (vise.y - vu.y) * a;

    if (entree < 1) entree = Math.min(1, entree + dt * 0.5);
    const e = 1 - Math.pow(1 - entree, 3);

    const t = maintenant / 1000;
    groupe.rotation.y = (1 - e) * -0.9 + vu.y + (sobre ? 0 : Math.sin(t * 0.16) * 0.07);
    groupe.rotation.x = vu.x + (sobre ? 0 : Math.sin(t * 0.23) * 0.035);
    groupe.position.y = sobre ? 0 : Math.sin(t * 0.4) * 0.045;
    groupe.scale.setScalar(0.9 + 0.1 * e);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(battre);

  return {
    montrer(v) {
      if (v && !visible) dernier = performance.now();
      visible = v; dansLaVue = v;
    },
    detruire() {
      actif = false;
      window.removeEventListener('resize', mesurer);
      window.removeEventListener('pointermove', suivre);
      objet.traverse(o => {
        if (!o.isMesh) return;
        o.geometry?.dispose?.();
        const m = o.material;
        for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) m?.[k]?.dispose?.();
        m?.dispose?.();
      });
      env.dispose();
      renderer.dispose();
    },
    bilan() {
      let tri = 0, mailles = 0;
      objet.traverse(o => {
        if (!o.isMesh) return;
        mailles++;
        const g = o.geometry;
        tri += (g.index ? g.index.count : g.attributes.position.count) / 3;
      });
      return { mailles, triangles: Math.round(tri), definition: renderer.getPixelRatio(),
               entree: +entree.toFixed(2), visee: { x: +vise.x.toFixed(3), y: +vise.y.toFixed(3) } };
    }
  };
}
