/* ══════════════════════════════════════════════════════════════════════════
   LE PAYSAGE
   --------------------------------------------------------------------------
   Un ciel, un horizon, des monts, un sol, un lac. Autrement dit : un LIEU.

   POURQUOI IL EXISTE. Le voyage se jouait dans du noir. Des lianes, un
   portail et un sceau flottaient dans le vide, sans sol sous eux et sans rien
   derriere. Matheo l'a dit exactement : « il n'y a pas de fond, il n'y a pas
   de sol, il ne se passe rien ». Il avait raison, et c'est le defaut le plus
   grave qu'on puisse avoir : on ne croit pas a un espace dont on ne voit
   jamais les limites.

   Le noir n'est pas une profondeur, c'est une absence. Un objet devant du
   noir n'a AUCUNE distance : rien ne dit s'il est a deux metres ou a deux
   kilometres. Ce qui fabrique la profondeur, c'est une suite de plans qui
   palissent en s'eloignant, et il en faut au moins quatre : le sol sous les
   pieds, l'eau au milieu, les monts au loin, le ciel derriere tout.

   LA REFERENCE EST HOKUSAI, PAS UN JEU VIDEO. Une nuit japonaise : presque
   tout est noir, l'horizon garde une lueur jade, une montagne se decoupe au
   fond, un lac la repete a l'envers. C'est la meme famille que le nom de la
   maison et que son blason.

   RIEN N'EST TIRE AU SORT ICI. Le relief vient d'un bruit a graine fixe : le
   paysage est le MEME a chaque visite. Une montagne qui change de forme quand
   on recharge la page n'est pas une montagne, c'est un economiseur d'ecran.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ── Un bruit lisse, deterministe ─────────────────────────────────────────
   Hachage sur la PARTIE FRACTIONNAIRE. Jamais fract(sin(x) * 43758.5) : cette
   formule-la s'effondre en taches des qu'on s'eloigne de l'origine, et un
   paysage s'etend justement sur des centaines d'unites. Deja paye. */
function hacher(x, y) {
  let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  h = h - Math.floor(h);
  const g = (x * 0.7548776662 + y * 0.5698402909) % 1;
  return ((h + Math.abs(g)) % 1 + 1) % 1;
}
const adoucir = t => t * t * (3 - 2 * t);

function ondul(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = adoucir(x - xi), yf = adoucir(y - yi);
  const a = hacher(xi, yi), b = hacher(xi + 1, yi);
  const c = hacher(xi, yi + 1), d = hacher(xi + 1, yi + 1);
  return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
}
/* Plusieurs octaves : les grandes formes d'abord, le detail ensuite. */
function relief(x, y) {
  return ondul(x, y) * 0.55 + ondul(x * 2.1 + 3.7, y * 2.1 - 1.3) * 0.27
       + ondul(x * 4.3 - 7.1, y * 4.3 + 5.9) * 0.13 + ondul(x * 8.7, y * 8.7) * 0.05;
}

/* ══ LES COTES DU MONDE ═══════════════════════════════════════════════════
   Tout le reste en decoule, et ces nombres sont des decisions de mise en
   scene. Le couloir des lianes va de zero a quatre-vingt-dix ; le lac
   commence la ou il finit ; les monts sont assez loin pour qu'on ne les
   atteigne jamais, ce qui est la definition d'un horizon. */
export const NIVEAU_EAU = -5.4;
const LAC_Z = 205, LAC_RAYON = 108;

export function hauteurSol(x, z) {
  /* La cuvette du lac : une gaussienne large, creusee sous le niveau de
     l'eau. Une berge qui descend en pente douce vaut mieux qu'un bord net :
     c'est la ou l'eau devient transparente que le lac a l'air d'un lac. */
  /* ══ UNE RIVE NE SUIT PAS UN CERCLE ══════════════════════════════════
     La cuvette etait une gaussienne parfaite : sa ligne de rive tombait donc
     sur un cercle exact, qui se lisait en perspective comme un TRAIT DROIT
     traversant tout le cadre sur cinq cents unites. Rien dans un paysage
     n'est aussi regulier, et l'oeil le repere avant de savoir ce que c'est.

     On deforme le rayon par un bruit lent, en fonction de l'angle : des
     avancees, des criques, une rive qu'on ne peut pas resumer d'un mot. */
  const angle = Math.atan2(z - LAC_Z, x);
  const froisse = 1 + (relief(Math.cos(angle) * 1.7 + 5.3, Math.sin(angle) * 1.7 - 2.1) - 0.5) * 0.52
                    + (relief(Math.cos(angle) * 5.1 - 1.7, Math.sin(angle) * 5.1 + 6.4) - 0.5) * 0.20;
  const d = Math.hypot(x * 0.62, (z - LAC_Z) * 0.92) / Math.max(0.35, froisse);
  const cuvette = -11.5 * Math.exp(-(d * d) / (2 * LAC_RAYON * LAC_RAYON * 0.34));

  const h = relief(x * 0.0062 + 11.3, z * 0.0062 - 4.7) * 26
          + relief(x * 0.021 - 2.9, z * 0.021 + 8.1) * 5.2;

  /* On aplanit le couloir que la camera traverse. Un relief sous les pieds
     est une bonne chose, une bosse qui masque le portail n'en est pas une. */
  const couloir = Math.exp(-(x * x) / (2 * 30 * 30))
                * Math.exp(-((z - 45) * (z - 45)) / (2 * 85 * 85));
  return (h - 13 + cuvette) * (1 - couloir * 0.80) - 3.4 * couloir;
}

export function monterLePaysage(scene, options = {}) {
  const petit = !!options.petit;
  const NUIT     = new THREE.Color(options.nuit    || '#04060A');
  const HORIZON  = new THREE.Color(options.horizon || '#0F4038');
  const VIOLET   = new THREE.Color('#3B2A63');

  const groupe = new THREE.Group();
  scene.add(groupe);
  const aJeter = [];

  /* ══ LE CIEL ════════════════════════════════════════════════════════════
     Une sphere vue de l'interieur. Le degrade ne se lit pas sur la hauteur de
     l'ecran mais sur la DIRECTION du regard : c'est ce qui fait que le ciel
     reste juste quand la camera se tourne, ce qu'un degrade de fond en CSS ne
     sait pas faire.

     Les etoiles sont dans le meme nuanceur. Les poser en points couterait un
     objet de plus, et surtout elles bougeraient avec la camera comme un
     essaim de mouches : la, elles sont a l'infini, ou est leur place. */
  const ciel = new THREE.Mesh(
    new THREE.SphereGeometry(900, 40, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uNuit: { value: NUIT }, uHorizon: { value: HORIZON }, uViolet: { value: VIOLET },
        uTemps: { value: 0 }
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uNuit, uHorizon, uViolet;
        uniform float uTemps;
        varying vec3 vDir;

        float hach(vec2 p) {
          vec3 q = fract(vec3(p.xyx) * 0.1031);
          q += dot(q, q.yzx + 33.33);
          return fract((q.x + q.y) * q.z);
        }

        void main() {
          float h = vDir.y;

          /* Trois bandes. Le zenith presque noir, une zone violette a
             mi-hauteur, une lueur jade posee sur l'horizon. La lueur ne monte
             pas haut : une aube qui remplit le ciel eteint tout le reste. */
          vec3 col = mix(uNuit * 0.55, uNuit, smoothstep(-0.1, 0.55, h));
          col += uViolet * exp(-abs(h - 0.20) * 7.5) * 0.16;
          col += uHorizon * exp(-abs(h - 0.006) * 30.0) * 0.95;

          /* Sous l'horizon, le ciel s'eteint : c'est la que le sol et l'eau
             prennent le relais, et un ciel qui continue en dessous se voit a
             travers le moindre trou du terrain. */
          col *= smoothstep(-0.34, -0.02, h);

          /* Les etoiles. Un point sur une grille fine, garde seulement si son
             hachage passe le seuil, avec une taille et un eclat propres. Elles
             s'effacent pres de l'horizon, ou la brume les mange. */
          vec2 g = vDir.xz / max(0.14, abs(vDir.y) + 0.10) * 34.0;
          vec2 cellule = floor(g);
          float a = hach(cellule);
          if (a > 0.965) {
            vec2 dans = fract(g) - 0.5 - (vec2(hach(cellule + 7.3), hach(cellule + 3.1)) - 0.5) * 0.6;
            float r = dot(dans, dans);
            float sc = hach(cellule + 19.7);
            /* Un tres leger scintillement, decorrele d'une etoile a l'autre. */
            float vif = 0.55 + 0.45 * sin(uTemps * (0.6 + sc) + sc * 40.0);
            col += vec3(0.80, 0.92, 1.0) * exp(-r * 240.0) * (0.5 + sc) * vif
                 * smoothstep(0.02, 0.30, h);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  ciel.frustumCulled = false;
  ciel.renderOrder = -10;
  groupe.add(ciel);
  aJeter.push(ciel.geometry, ciel.material);

  /* ══ LES MONTS ══════════════════════════════════════════════════════════
     Trois rangs de silhouettes, de plus en plus loin et de plus en plus
     pales. C'est le procede le plus ancien du paysage peint, et il n'a pas
     ete surpasse : ce qui donne la distance n'est pas la taille, c'est la
     PERTE DE CONTRASTE.

     Le rang du fond porte le mont. Il est symetrique, isole, plus haut que
     tout, avec une neige qui prend la lueur de l'horizon. On ne le nomme pas
     sur le site : un lieu qu'on nomme devient une carte postale. */
  function faireUnRang(z, largeur, hauteurMax, teinte, opacite, mont) {
    const N = petit ? 130 : 260;
    const pos = new Float32Array((N + 1) * 2 * 3);
    const bas = -60;

    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = (u - 0.5) * largeur;

      /* La crete : deux octaves de bruit, redressees en aretes. Un bruit brut
         donne des collines molles ; sa valeur absolue repliee donne des
         aretes, ce qui est la forme d'une montagne. */
      /* ══ UNE CHAINE N'A PAS DE PAS REGULIER ═════════════════════════════
         Deux octaves de meme allure donnaient une DENT DE SCIE : dix pics
         quasiment identiques, egalement espaces, qui se lisaient comme un
         motif et non comme un relief. Ce qui trahit une montagne calculee,
         c'est la regularite de ses sommets.

         Trois choses le reglent. Des frequences sans rapport simple, pour que
         la somme ne se repete jamais. Une ENVELOPPE tres lente, qui fait des
         massifs hauts et des cols bas. Et un exposant qui creuse les vallees
         plus qu'il n'abaisse les cretes. */
      let h = (1 - Math.abs(relief(x * 0.0031 + z * 0.01, 3.7) * 2 - 1)) * 0.58
            + (1 - Math.abs(relief(x * 0.0087 - 9.1, z * 0.01 + 2.2) * 2 - 1)) * 0.29
            + (1 - Math.abs(relief(x * 0.0233 + 4.4, z * 0.01 - 6.5) * 2 - 1)) * 0.13;
      const massif = 0.34 + 0.66 * relief(x * 0.00092 - 3.3, z * 0.004 + 1.9);
      h = Math.pow(Math.max(0, h), 1.9) * hauteurMax * massif;

      if (mont) {
        /* Le cone. Des flancs legerement CONCAVES, ce qui est la signature
           d'un volcan : un cone a flancs droits fait terril. */
        const dx = Math.abs(x - mont.x) / mont.large;
        if (dx < 1) {
          const flanc = Math.pow(1 - dx, 1.32);
          h = Math.max(h, flanc * mont.haut);
        }
      }

      pos[i * 6]     = x; pos[i * 6 + 1] = bas;     pos[i * 6 + 2] = 0;
      pos[i * 6 + 3] = x; pos[i * 6 + 4] = h;       pos[i * 6 + 5] = 0;
    }

    const idx = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
      uniforms: {
        uTeinte: { value: new THREE.Color(teinte) },
        uHorizon: { value: HORIZON },
        uOpacite: { value: opacite },
        uNeige: { value: mont ? 1 : 0 },
        uCime: { value: mont ? mont.haut : 1 }
      },
      vertexShader: /* glsl */`
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uTeinte, uHorizon;
        uniform float uOpacite, uNeige, uCime;
        varying float vY;
        void main() {
          /* Le pied du mont est plus clair que sa crete : la brume s'accumule
             en bas. Sans ce degrade la silhouette est un aplat de carton. */
          /* ══ UNE CRETE DOIT SE DETACHER DU CIEL ═══════════════════════
             Le bas des monts se noyait dans la brume, ce qui est juste, mais
             leur haut prenait la teinte sombre du rang, exactement celle du
             ciel derriere. On ne voyait plus qu'un LISERE : une montagne
             dessinee au trait, sans masse.

             En altitude, une crete recoit le ciel entier au-dessus d'elle et
             non la seule bande de l'horizon : elle est donc plus claire que le
             ciel qu'elle cache, pas plus sombre. C'est aussi ce qui fait
             qu'on voit les montagnes de nuit. */
          float bas = 1.0 - smoothstep(-8.0, uCime * 0.65, vY);
          float haut = smoothstep(uCime * 0.10, uCime * 0.92, vY);
          /* La brume du pied doit rester une SUGGESTION. A 0,75 d'un horizon
             a pleine valeur, le bas de chaque rang virait au teal clair sur
             plus de mille unites de large : une bande pale en travers de tout
             le cadre, qu'on lisait comme un defaut et non comme de l'air. */
          vec3 col = mix(uTeinte, uHorizon * 0.55, bas * 0.30);
          col += vec3(0.040, 0.062, 0.084) * haut;
          /* La neige ne se pose que tout en haut, et elle prend la couleur de
             l'horizon, pas du blanc : rien n'est blanc dans une nuit. */
          col = mix(col, uHorizon * 2.2 + vec3(0.055, 0.075, 0.085), uNeige * smoothstep(uCime * 0.72, uCime * 0.99, vY));
          gl_FragColor = vec4(col, uOpacite);
        }
      `
    });

    const m = new THREE.Mesh(geo, mat);
    m.position.z = z;
    m.frustumCulled = false;
    m.renderOrder = -5;
    groupe.add(m);
    aJeter.push(geo, mat);
    return m;
  }

  /* Le mont doit DOMINER, sinon ce n'est qu'une bosse de plus. Il est plus
     pres, plus large et beaucoup plus haut que la chaine qui l'entoure : c'est
     ce rapport-la, et non sa forme, qui fait qu'on le regarde. */
  faireUnRang(545, 2300, 88, '#050A12', 0.96, { x: 46, large: 300, haut: 158 });
  faireUnRang(372, 1600, 54,  '#060D14', 0.72, null);
  faireUnRang(276, 1200, 30,  '#07121A', 0.52, null);

  /* ══ LE SOL ═════════════════════════════════════════════════════════════
     Un vrai relief, pas une image : le terrain se deforme sous la camera, les
     bosses se recouvrent, et c'est ce recouvrement qui donne la distance. Un
     sol plat texture ne trompe personne des qu'on avance dessus. */
  const CT = petit ? 120 : 190;
  const geoSol = new THREE.PlaneGeometry(760, 620, CT, CT);
  geoSol.rotateX(-Math.PI / 2);
  {
    const p = geoSol.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i) + 170;
      p.setY(i, hauteurSol(x, z));
      p.setZ(i, z);
    }
    geoSol.computeVertexNormals();
  }
  const matSol = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uSombre: { value: new THREE.Color('#050A0B') },
        uMousse: { value: new THREE.Color('#0B2A22') },
        uHorizon: { value: HORIZON },
        uEau: { value: NIVEAU_EAU }
      }
    ]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vN; varying float vH;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        vH = (modelMatrix * vec4(position, 1.0)).y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      #include <fog_pars_fragment>
      uniform vec3 uSombre, uMousse, uHorizon;
      uniform float uEau;
      varying vec3 vN; varying float vH;
      void main() {
        /* La lumiere vient de l'horizon, tres bas et de face : c'est elle qui
           dessine les cretes et laisse les creux noirs. */
        vec3 L = normalize(vec3(0.18, 0.13, 1.0));
        float k = clamp(dot(normalize(vN), L), 0.0, 1.0);
        vec3 col = mix(uSombre, uMousse, pow(k, 1.9) * 0.70);
        col += uHorizon * pow(k, 5.5) * 0.55;
        /* Une frange plus claire juste au bord de l'eau, comme un sable
           mouille : c'est ce qui fait qu'on lit une RIVE et non une decoupe. */
        col += uHorizon * 0.5 * smoothstep(2.6, 0.0, abs(vH - uEau));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `
  });
  const sol = new THREE.Mesh(geoSol, matSol);
  sol.frustumCulled = false;
  groupe.add(sol);
  aJeter.push(geoSol, matSol);

  /* ══ LE LAC ═════════════════════════════════════════════════════════════
     Pas de vraie reflexion : elle couterait un second rendu de toute la scene
     a chaque image, pour un plan d'eau qu'on voit de loin et de biais.

     On refait donc ce que l'eau FAIT, sans le simuler. Une surface d'eau vue
     de loin, c'est trois choses : elle renvoie le ciel d'autant plus qu'on la
     regarde rasante, elle porte un chemin de lumiere qui va droit vers la
     source, et elle ride. Les trois tiennent en un nuanceur, et l'oeil ne
     demande rien de plus a un lac de nuit. */
  const matLac = new THREE.ShaderMaterial({
    transparent: true, fog: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTemps: { value: 0 },
        uHorizon: { value: HORIZON },
        uProfond: { value: new THREE.Color('#040A10') },
        uViolet: { value: VIOLET }
      }
    ]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vMonde;
      void main() {
        vMonde = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      #include <fog_pars_fragment>
      uniform float uTemps;
      uniform vec3 uHorizon, uProfond, uViolet;
      varying vec3 vMonde;

      float vague(vec2 p) {
        return sin(p.x * 0.13 + uTemps * 0.30)
             + sin(p.y * 0.21 - uTemps * 0.23) * 0.8
             + sin((p.x + p.y) * 0.07 + uTemps * 0.11) * 1.2;
      }

      void main() {
        vec3 versOeil = normalize(cameraPosition - vMonde);
        /* Fresnel : de haut on voit le fond, de biais on voit le ciel. C'est
           la seule chose qui distingue vraiment de l'eau d'un miroir pose. */
        float rasant = pow(1.0 - clamp(versOeil.y, 0.0, 1.0), 3.4);

        float r = vague(vMonde.xz) + vague(vMonde.xz * 2.7 + 13.0) * 0.4;

        /* ══ L'EAU RENVOIE MOINS QU'ON NE CROIT ═════════════════════════
           A 1,15 fois la couleur de l'horizon, le lac vu de biais ressortait
           PLUS CLAIR QUE LE CIEL qu'il est cense refleter, et il tirait une
           barre lumineuse en travers de toutes les images. Une surface qui
           renvoie ne peut pas renvoyer plus qu'elle ne recoit. */
        vec3 col = mix(uProfond, uHorizon * 0.34, rasant);
        col += uViolet * rasant * 0.14;

        /* Le chemin de lumiere. Il va vers la source, il s'elargit avec la
           distance, et il est HACHE par les rides : une trainee continue fait
           projecteur de piscine, une trainee brisee fait de l'eau. */
        float axe = exp(-vMonde.x * vMonde.x / 620.0);
        float eclats = pow(max(0.0, 0.5 + 0.5 * sin(r * 3.1)), 11.0);
        /* Le chemin s'eteint tout pres du bord loin : sinon il file jusqu'a
           l'horizon et redevient une barre. */
        float fond = smoothstep(300.0, 150.0, vMonde.z);
        col += uHorizon * axe * eclats * 0.80 * rasant * fond;
        col += vec3(0.85, 1.0, 0.95) * axe * pow(eclats, 2.4) * 0.16 * rasant * fond;

        gl_FragColor = vec4(col, clamp(0.55 + rasant * 0.40, 0.0, 1.0));
        #include <fog_fragment>
      }
    `
  });
  const lac = new THREE.Mesh(new THREE.PlaneGeometry(700, 560, 1, 1), matLac);
  lac.rotation.x = -Math.PI / 2;
  lac.position.set(0, NIVEAU_EAU, LAC_Z);
  lac.frustumCulled = false;
  groupe.add(lac);
  aJeter.push(lac.geometry, matLac);

  return {
    avancer(t) {
      ciel.material.uniforms.uTemps.value = t;
      matLac.uniforms.uTemps.value = t;
    },
    /* Le ciel suit la camera : une sphere de neuf cents unites finit par etre
       depassee si on la laisse plantee a l'origine, et on voit alors sa
       couture par derriere. */
    suivre(camera) { ciel.position.copy(camera.position); },
    _ciel: ciel, _sol: sol, _lac: lac,
    detruire() {
      scene.remove(groupe);
      aJeter.forEach(o => o.dispose?.());
    }
  };
}
