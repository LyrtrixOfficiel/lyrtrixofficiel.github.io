/* ══════════════════════════════════════════════════════════════════════════
   LA FEUILLE
   --------------------------------------------------------------------------
   Une feuille de kudzu, sculptee puis texturee, qui tourne au defilement
   pendant que trois phrases se relaient autour d'elle.

   POURQUOI ELLE REMPLACE TROIS SECTIONS. Il y avait la trois chapitres, un
   ecran plein chacun, pour UNE phrase. La camera n'allait nulle part, le fond
   ne changeait pas, et Matheo a dit ce qu'il fallait en dire : on descend et
   il ne se passe rien. Trois ecrans vides valent moins qu'un ecran plein.

   POURQUOI ELLE EST GRANDE. Ses textures font 2048 sur 2048. Instanciee deux
   cents fois a la taille d'un ongle, cette matiere ne servirait a rien : on ne
   verrait qu'un confetti vert et on aurait paye le prix fort pour ca. Une
   texture de cette definition ne se rentabilise que sur un objet qui occupe
   l'ecran. C'est la lecon d'igloo.inc, ou la montagne est le sujet et non le
   decor : 578 Ko de geometrie pour 12 400 Ko de matiere.

   ET C'EST NOTRE NOM. Kazura veut dire kudzu. Le bonsai qu'on avait pose au
   meme endroit ne racontait rien parce qu'il ne venait de nulle part ; une
   feuille de kudzu sur le site de Kazura n'a pas besoin d'etre expliquee.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function monterLaFeuille(toile, options = {}) {
  const sobre = document.documentElement.dataset.mouvement !== 'anime';
  const petit = innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true });
  } catch (e) { return null; }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, petit ? 1.4 : 1.8));
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  camera.position.set(0, 0, 4.6);

  /* ══ LA LUMIERE, UNE SEULE CONDITION ═══════════════════════════════════
     Une cle chaude devant, un contre-jour jade derriere, un rebond violet
     tres bas. C'est tout. La lecon d'igloo est qu'une seule condition
     d'eclairage, tenue jusqu'au bout, bat trois eclairages qui se disputent :
     ce qui donne le realisme est la COHERENCE, pas la quantite de lampes. */
  const cle = new THREE.DirectionalLight(0xFFF6E8, 2.6);
  cle.position.set(-2.2, 3.0, 3.4);
  scene.add(cle);

  const contre = new THREE.DirectionalLight(0x6EE7B7, 3.4);
  contre.position.set(2.6, 1.2, -3.0);
  scene.add(contre);

  const rebond = new THREE.HemisphereLight(0x7C3AED, 0x04060A, 0.75);
  scene.add(rebond);

  /* ── Le modele ────────────────────────────────────────────────────────── */
  const groupe = new THREE.Group();
  scene.add(groupe);

  let objet = null, triangles = 0, definitionTexture = '';
  try {
    const gltf = await new GLTFLoader().loadAsync(options.fichier || 'modeles/feuille-kudzu.glb');
    objet = gltf.scene;
  } catch (e) {
    renderer.dispose();
    return null;
  }

  /* On ne fait jamais confiance a l'echelle ni au centre d'un fichier recu. */
  const boite = new THREE.Box3().setFromObject(objet);
  const centre = boite.getCenter(new THREE.Vector3());
  const taille = boite.getSize(new THREE.Vector3());
  objet.position.sub(centre);
  const echelle = (options.echelle || 3.1) / Math.max(taille.x, taille.y, taille.z);
  objet.scale.setScalar(echelle);
  groupe.add(objet);

  objet.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry;
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    const m = o.material;
    if (!m) return;
    /* Meshy sort ses materiaux pour un rendu neutre. On empeche le metal,
       sans quoi une feuille ressort en tole, et on remonte l'environnement
       pour que le contre-jour traverse le limbe. */
    if ('metalness' in m) m.metalness = 0;
    if ('roughness' in m) m.roughness = Math.min(1, (m.roughness ?? 1) * 0.86);
    m.envMapIntensity = 1.1;
    m.side = THREE.DoubleSide;   /* une feuille se voit des deux cotes */
    if (m.map?.image) definitionTexture = m.map.image.width + ' × ' + m.map.image.height;
    m.needsUpdate = true;
  });
  triangles = Math.round(triangles);

  /* ── Le geste et le defilement ────────────────────────────────────────── */
  const vise = { x: 0, y: 0 };
  const vu = { x: 0, y: 0 };
  let dansLaVue = false, avance = 0, avanceVisee = 0;

  const suivre = e => {
    if (!dansLaVue) return;
    const r = toile.getBoundingClientRect();
    if (!r.width) return;
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    vise.y = Math.max(-1.4, Math.min(1.4, nx)) * 0.42;
    vise.x = Math.max(-1.4, Math.min(1.4, ny)) * 0.26;
  };
  addEventListener('pointermove', suivre, { passive: true });

  /* ── Les instruments ──────────────────────────────────────────────────── */
  let instruments = null;
  try {
    const { monterLesInstruments, monterLeCompteur } = await import('./instruments.js' + (options.version || ''));
    const compteur = monterLeCompteur();
    instruments = monterLesInstruments(toile, camera, { dans: toile.parentElement });
    const h = taille.y * echelle * 0.5, l = taille.x * echelle * 0.5;
    instruments.poser({
      point: new THREE.Vector3(l * 0.55, h * 0.60, 0),
      titre: options.nom || 'PUERARIA_MONTANA',
      valeur: () => triangles.toLocaleString('fr') + ' triangles',
      cote: 'droite'
    });
    instruments.poser({
      point: new THREE.Vector3(-l * 0.62, -h * 0.10, 0),
      titre: 'MATIERE',
      valeur: () => definitionTexture ? definitionTexture + '  ·  ' + (options.poidsKo || 2431) + ' Ko' : (options.poidsKo || 2431) + ' Ko',
      cote: 'gauche'
    });
    instruments.poser({
      point: new THREE.Vector3(l * 0.30, -h * 0.72, 0),
      titre: 'CADENCE',
      valeur: () => compteur.ms() ? compteur.ms().toFixed(1) + ' ms par image' : 'mesure…',
      cote: 'droite',
      longueur: 0.17
    });
  } catch (e) { console.warn('instruments indisponibles', e); }

  /* ── Mesure ───────────────────────────────────────────────────────────── */
  function mesurer() {
    const r = toile.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width));
    const h = Math.max(2, Math.round(r.height));
    camera.aspect = w / h;
    /* Sur un ecran etroit, on recule pour que la feuille tienne en entier :
       la regle du cadrage vertical, apprise sur la vitrine du domaine. */
    camera.position.z = (options.distance || 4.6) * (w / h < 0.9 ? 1.45 : 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  mesurer();
  const oeil = new ResizeObserver(() => mesurer());
  oeil.observe(toile);

  /* ── Boucle ───────────────────────────────────────────────────────────── */
  let visible = false, actif = true, dernier = performance.now();
  let cumul = 0, images = 0, allege = false;

  function peindre(dt) {
    const k = sobre ? 1 : 1 - Math.pow(1 - 0.09, dt * 60);
    avance += (avanceVisee - avance) * k;
    vu.x += (vise.x - vu.x) * (1 - Math.pow(1 - 0.10, dt * 60));
    vu.y += (vise.y - vu.y) * (1 - Math.pow(1 - 0.10, dt * 60));

    /* Un tour complet sur toute la section : on voit le dessus, la tranche,
       le dessous. La tranche est le moment ou la feuille cesse d'etre une
       image et devient un objet, donc elle vaut le detour. */
    groupe.rotation.y = -0.75 + avance * Math.PI * 1.9 + vu.y;
    groupe.rotation.x = -0.22 + Math.sin(avance * Math.PI) * 0.36 + vu.x;
    groupe.rotation.z = Math.sin(avance * Math.PI * 1.4) * 0.14;
    groupe.position.y = Math.sin(avance * Math.PI) * 0.18;

    renderer.render(scene, camera);
  }

  function battre(maintenant) {
    if (!actif) return;
    requestAnimationFrame(battre);
    const dt = Math.min(0.05, Math.max(0, (maintenant - dernier) / 1000));
    dernier = maintenant;
    if (!visible) return;

    cumul += dt; images++;
    if (images >= 70) {
      const moyenne = cumul / images; cumul = 0; images = 0;
      if (moyenne > 0.026 && !allege) {
        allege = true;
        renderer.setPixelRatio(Math.max(0.85, renderer.getPixelRatio() * 0.78));
        mesurer();
      }
    }
    peindre(dt);
  }
  requestAnimationFrame(battre);

  return {
    /* Entre 0 et 1 le long de la section. */
    avancer(p) { avanceVisee = Math.max(0, Math.min(1, p)); },
    montrer(v) { if (v && !visible) dernier = performance.now(); visible = v; dansLaVue = v; },
    /* La poignee de reglage : elle peint par le chemin normal, pour qu'on
       puisse la regarder quand les images sont gelees. */
    poser(p, n = 30) { avanceVisee = p; for (let i = 0; i < n; i++) peindre(0.05); return this.bilan(); },
    instruments,
    detruire() {
      actif = false;
      oeil.disconnect();
      removeEventListener('pointermove', suivre);
      instruments?.detruire();
      objet.traverse(o => {
        if (!o.isMesh) return;
        o.geometry?.dispose?.();
        const m = o.material;
        for (const c of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) m?.[c]?.dispose?.();
        m?.dispose?.();
      });
      renderer.dispose();
    },
    bilan: () => ({
      triangles, texture: definitionTexture,
      avance: +avance.toFixed(3),
      definition: +renderer.getPixelRatio().toFixed(2),
      allege,
      toile: [toile.width, toile.height],
      instruments: instruments?.bilan?.()
    })
  };
}
