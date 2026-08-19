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
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  camera.position.set(0, 0, 4.6);

  /* ══ LA LUMIERE, UNE SEULE CONDITION ═══════════════════════════════════
     Une cle chaude devant, un contre-jour jade derriere, un rebond violet
     tres bas. C'est tout. La lecon d'igloo est qu'une seule condition
     d'eclairage, tenue jusqu'au bout, bat trois eclairages qui se disputent :
     ce qui donne le realisme est la COHERENCE, pas la quantite de lampes. */
  /* ══ LA CLE ETAIT CHAUDE, ET LA FEUILLE SORTAIT TILLEUL ════════════════
     Une lampe a 0xFFF6E8, c'est-a-dire creme, sur un albedo deja jaune-vert :
     le modele ressortait vert tilleul au milieu d'un site jade et violet. Il
     avait l'air pose la, venu d'ailleurs, ce qui est exactement l'impression
     qu'on cherche a eviter quand on montre son propre savoir-faire.

     On ne touche PAS a la texture pour cela. C'est la matiere du modele, elle
     est juste, et la retoucher serait mentir sur ce qu'on sait produire. On
     change la LAMPE, ce qui est le geste d'un eclairagiste et non d'un
     retoucheur, et la feuille rentre dans la palette en gardant ses veines. */
  const cle = new THREE.DirectionalLight(0xDCF2FF, 2.5);
  cle.position.set(-2.8, 2.6, 2.6);
  scene.add(cle);

  /* Le contre-jour porte tout le sujet : ce qui fait qu'on RECONNAIT une
     feuille, c'est la lumiere qui la traverse, pas celle qui rebondit dessus. */
  const contre = new THREE.DirectionalLight(0x6EE7B7, 5.4);
  contre.position.set(2.6, 1.2, -3.0);
  scene.add(contre);

  const rebond = new THREE.HemisphereLight(0x7C3AED, 0x0A140F, 1.35);
  scene.add(rebond);

  /* ── Le modele ────────────────────────────────────────────────────────── */
  const groupe = new THREE.Group();
  scene.add(groupe);

  let objet = null, triangles = 0, definitionTexture = '', poidsKo = 0;
  const fichier = options.fichier || 'modeles/feuille-kudzu.glb';
  try {
    const gltf = await new GLTFLoader().loadAsync(fichier);
    objet = gltf.scene;
  } catch (e) {
    renderer.dispose();
    return null;
  }

  /* ══ LE POIDS SE MESURE, IL NE S'ECRIT PAS ═════════════════════════════
     Il etait en dur dans l'appel : 2431 Ko. Le modele a change deux fois
     depuis, et le chiffre affiche a l'ecran est donc reste faux les deux
     fois. Une etiquette qui promet des mesures vraies n'a pas le droit de
     porter une constante que personne ne pense a remettre a jour.

     Le navigateur tient le compte exact des octets recus pour chaque
     ressource. On le lui demande : rien a telecharger en plus, et le nombre
     redevient juste tout seul au prochain modele. */
  try {
    const e = performance.getEntriesByType('resource')
      .filter(r => r.name.endsWith(fichier))
      .pop();
    if (e && e.encodedBodySize) poidsKo = Math.round(e.encodedBodySize / 1024);
  } catch (e) { /* pas de chronometrie : on retombe sur la valeur donnee */ }
  if (!poidsKo) poidsKo = options.poidsKo || 0;

  /* On ne fait jamais confiance a l'echelle ni au centre d'un fichier recu. */
  const boite = new THREE.Box3().setFromObject(objet);
  const centre = boite.getCenter(new THREE.Vector3());
  const taille = boite.getSize(new THREE.Vector3());
  objet.position.sub(centre);
  /* L'ECHELLE SE CALCULE SUR LE CADRE, elle n'est pas ecrite en dur. Fixee a
     la main, elle donnait une feuille de 4,9 unites dans un cadre de 2,47 sur
     un ecran large et bas, donc une feuille debordante sur un ecran et un
     confetti sur l'autre. On ajuste desormais a chaque mesure pour que
     l'objet occupe toujours la meme part de l'ecran, quelle que soit la
     forme de la fenetre. C'est la meme lecon que le mot de l'accueil, qui
     etait plafonne a 1440 pixels sur un ecran de 3440. */
  const rayon = Math.max(taille.x, taille.y, taille.z) * 0.5;
  let echelle = 1;
  objet.scale.setScalar(1);
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

    /* ══ FAIRE PASSER LA LUMIERE A TRAVERS LE LIMBE ════════════════════════
       three ne sait pas simuler la diffusion sous la surface, et la
       transmission de MeshPhysicalMaterial est faite pour le verre : elle
       refracte au lieu de diffuser, et une feuille refractante ressemble a
       une feuille en plastique mouille.

       Une emission tres basse qui reprend la texture de base fait le meme
       office pour ce qu'on en voit : le limbe s'eclaire par l'interieur avec
       SES nervures et SES accidents, puisque c'est la meme image qui la
       pilote. Cela coute un echantillonnage de plus et rien d'autre, et cela
       accorde le grand modele avec le feuillage du decor, qui est eclaire
       exactement sur ce principe. */
    if ('emissive' in m) {
      m.emissive = new THREE.Color(0x0C5540);
      m.emissiveMap = m.map || null;
      m.emissiveIntensity = 0.62;
    }
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
  let instruments = null, majAncres = null;
  try {
    const { monterLesInstruments, monterLeCompteur } = await import('./instruments.js' + (options.version || ''));
    const compteur = monterLeCompteur();
    /* LES POINTS VISES SONT DANS LE REPERE DU MONDE, pas dans celui du
       modele. Comme l'echelle de l'objet se recalcule a chaque mesure, on ne
       peut pas figer un point en unites de modele : on le donne en unites
       d'objet et on le RECALCULE avant chaque projection. */
    instruments = monterLesInstruments(toile, camera, { dans: toile.parentElement });
    const h = taille.y * 0.5, l = taille.x * 0.5;
    /* Les trois ancres, en unites de modele. Elles seront multipliees par
       l'echelle courante juste avant chaque projection. */
    const ancres = [
      new THREE.Vector3(l * 0.55, h * 0.60, 0),
      new THREE.Vector3(-l * 0.62, -h * 0.10, 0),
      new THREE.Vector3(l * 0.30, -h * 0.72, 0)
    ];
    majAncres = () => {
      ancres.forEach((a, i) => {
        const p = instruments.releve(i);
        if (p) p.point.copy(a).multiplyScalar(echelle).applyEuler(groupe.rotation).add(groupe.position);
      });
    };
    instruments.poser({
      point: new THREE.Vector3(l * 0.55, h * 0.60, 0),
      titre: options.nom || 'PUERARIA_MONTANA',
      valeur: () => triangles.toLocaleString('fr') + ' triangles',
      cote: 'droite'
    });
    instruments.poser({
      point: new THREE.Vector3(-l * 0.62, -h * 0.10, 0),
      titre: 'MATIERE',
      valeur: () => (definitionTexture ? definitionTexture + '  ·  ' : '') + (poidsKo ? poidsKo.toLocaleString('fr') + ' Ko' : 'poids inconnu'),
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
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    /* Le cadre visible a la distance de l'objet, dans les deux sens. On prend
       le plus petit des deux : c'est lui qui decide si l'objet tient. */
    const hauteurCadre = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360);
    const largeurCadre = hauteurCadre * camera.aspect;
    const cadre = Math.min(hauteurCadre, largeurCadre);
    /* La feuille tourne : on cale sur son RAYON et non sur sa hauteur, sinon
       elle deborde des qu'elle se met de profil. La part visee est genereuse,
       l'objet est le sujet de la section. */
    echelle = (cadre * (options.part || 0.86)) / (rayon * 2);
    objet.scale.setScalar(echelle);
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

    if (majAncres) majAncres();
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
    /* La sonde, partagee avec toutes les pieces. Voir js/sonde.js. */
    async sonder(n = 40) {
      const { sonderToile } = await import('./sonde.js');
      visible = true;
      return sonderToile(renderer, toile, peindre, n);
    },
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
      /* Les dimensions du modele recu et l'echelle qu'on lui applique : sans
         elles, un objet trop petit a l'ecran ne se distingue pas d'un objet
         mal cadre, et on regle a l'aveugle. */
      taille: [+taille.x.toFixed(3), +taille.y.toFixed(3), +taille.z.toFixed(3)],
      rayon: +rayon.toFixed(3),
      echelle: +echelle.toFixed(3),
      apresEchelle: [+(taille.x*echelle).toFixed(2), +(taille.y*echelle).toFixed(2), +(taille.z*echelle).toFixed(2)],
      echelleCalculee: +echelle.toFixed(3),
      cadreVisible: +(2 * camera.position.z * Math.tan(camera.fov*Math.PI/360)).toFixed(2),
      avance: +avance.toFixed(3),
      definition: +renderer.getPixelRatio().toFixed(2),
      allege,
      toile: [toile.width, toile.height],
      instruments: instruments?.bilan?.()
    })
  };
}
