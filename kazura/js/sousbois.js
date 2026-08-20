/* ══════════════════════════════════════════════════════════════════════════
   LE SOUS-BOIS
   --------------------------------------------------------------------------
   De l'herbe, des pierres, des feuilles tombees. Ce qui fait qu'un terrain
   devient un SOL.

   POURQUOI IL EXISTE. Le voyage avait deja un vrai relief, texture, avec sa
   mousse photographiee. Matheo a quand meme dit, deux fois : « il n'y a pas
   vraiment de sol, il n'y a pas assez d'elements ». Il avait raison, et la
   raison est instructive : ON NE VOIT PAS UNE SURFACE, ON VOIT CE QUI EST
   POSE DESSUS.

   Un sol nu, meme parfaitement texture, se lit comme un fond. Ce qui le fait
   passer de fond a sol, ce sont les milliers de petits objets qui s'y
   dressent : ils donnent l'echelle, ils se recouvrent quand on avance, ils
   accrochent la lumiere rasante, et ils bougent. Aucune texture ne fait ces
   quatre choses.

   TROIS COUCHES, DU PLUS PETIT AU PLUS GRAND
     - l'herbe, en milliers de brins, courbes et animes par le vent ;
     - les pierres, en dizaines, avec la mousse du sol dessus ;
     - les feuilles tombees, a plat, tirees de la meme empreinte que le
       feuillage des lianes.

   TOUT EST EN INSTANCES : une seule geometrie envoyee une fois a la carte
   graphique, et des milliers de copies placees par une matrice. C'est ce qui
   permet huit mille brins d'herbe pour le prix d'un seul appel de dessin.

   RIEN N'EST TIRE AU HASARD SANS GRAINE. Le sous-bois est le meme a chaque
   visite : un decor qui se rejoue differemment n'est pas un lieu.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* Un generateur a graine : Math.random ne se remet pas a zero, et on veut
   exactement le meme sous-bois d'une visite a l'autre. */
function graine(n) {
  let e = n >>> 0;
  return () => {
    e = (e * 1664525 + 1013904223) >>> 0;
    return e / 4294967296;
  };
}

export function monterLeSousBois(scene, options = {}) {
  const petit = !!options.petit;
  const hauteurSol = options.hauteurSol;
  const niveauEau = options.niveauEau ?? -5.4;
  const JADE = new THREE.Color('#10B981');
  const BRUME = new THREE.Color(options.brume || '#08161C');

  const groupe = new THREE.Group();
  scene.add(groupe);
  const aJeter = [];
  const alea = graine(20260819);
  const entre = (a, b) => a + alea() * (b - a);

  /* ══ OU L'ON SEME ═══════════════════════════════════════════════════════
     Le long du couloir, en s'ecartant de l'axe, et jamais sous l'eau. On
     refuse aussi le plein milieu du chemin : de l'herbe qui traverse la
     camera a chaque image fait un essuie-glace. */
  function unePlace(rayonMin, rayonMax, zMin, zMax) {
    for (let essai = 0; essai < 12; essai++) {
      const x = entre(-1, 1) * entre(rayonMin, rayonMax) * (alea() < 0.5 ? -1 : 1);
      const z = entre(zMin, zMax);
      const y = hauteurSol(x, z);
      if (y < niveauEau + 0.35) continue;          // dans le lac
      /* ══ LE COULOIR D'EXCLUSION DOIT COUVRIR TOUT LE TRAJET ═══════════
         Il commencait a moins six, alors que la camera demarre a moins neuf :
         un brin sème dans cet intervalle se retrouvait COLLE A L'OBJECTIF sur
         la premiere image et barrait le cadre d'un trait vert. Un decor qui
         touche la lentille n'est pas de la profondeur, c'est un accident.
         On borne large, des deux cotes. */
      if (Math.abs(x) < 2.2 && z > -18 && z < 100) continue;
      return { x, y, z };
    }
    return null;
  }

  /* ══ L'HERBE ════════════════════════════════════════════════════════════
     Un brin est une lame effilee de six triangles, courbee. Pas une image sur
     un rectangle : a hauteur d'oeil on verrait la decoupe, et surtout une
     image ne se PLIE pas. Six triangles par brin, huit mille brins, un seul
     appel de dessin : c'est le meilleur rapport de tout le decor.

     La courbure est mise dans la geometrie, pas dans le nuanceur : elle ne
     change jamais, et ce qui ne change pas n'a rien a faire dans un calcul
     refait soixante fois par seconde. */
  function faireUnBrin() {
    const N = 6;
    const pos = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const larg = 0.030 * (1 - u) * (1 - u * 0.55);
      /* La courbe : elle s'ouvre vers la pointe, comme une lame qui retombe
         de son propre poids. */
      const pli = u * u * 0.42;
      pos[i * 6]     = -larg; pos[i * 6 + 1] = u;  pos[i * 6 + 2] = pli;
      pos[i * 6 + 3] =  larg; pos[i * 6 + 4] = u;  pos[i * 6 + 5] = pli;
      uvs[i * 4] = 0; uvs[i * 4 + 1] = u;
      uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = u;
    }
    const idx = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    g.setIndex(idx);
    return g;
  }

  const NB_HERBE = petit ? 2600 : 9000;
  const geoBrin = faireUnBrin();
  const matHerbe = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: false,
    uniforms: {
      uTemps: { value: 0 }, uJade: { value: JADE },
      uBrume: { value: BRUME }, uDensite: { value: options.densiteBrume ?? 0.0058 },
      uFront: { value: -40 }
    },
    vertexShader: /* glsl */`
      attribute vec3 aPlace;
      attribute float aHaut;
      attribute float aTour;
      attribute float aGraine;
      uniform float uTemps, uFront;
      varying float vU, vGraine, vProfondeur;
      void main() {
        vU = uv.y; vGraine = aGraine;

        /* Elle pousse comme les lianes, au passage du front. */
        float ouvert = clamp((uFront - aPlace.z) * 0.055 - aGraine * 0.5, 0.0, 1.0);
        if (ouvert < 0.02) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float e = ouvert * ouvert * (3.0 - 2.0 * ouvert);

        vec3 p = position;
        p.y *= aHaut * e;
        p.z *= aHaut * e;
        p.x *= 0.7 + aHaut * 0.5;

        /* ══ LE VENT PLIE LE BRIN, IL NE LE DEPLACE PAS ═══════════════════
           Deplacer un brin entier le fait glisser sur le sol, ce qui se
           remarque tout de suite. Un brin PLIE : sa base ne bouge pas, sa
           pointe bouge beaucoup, et le pli suit le carre de la hauteur. */
        float houle = sin(uTemps * 0.9 - aPlace.z * 0.10 + aPlace.x * 0.04);
        float souffle = 0.5 + 0.5 * sin(uTemps * 0.23 - aPlace.z * 0.02);
        float pli = (houle * 0.5 + 0.5) * souffle * 0.34
                  + sin(uTemps * 2.1 + aGraine * 30.0) * 0.035;
        p.z += pli * vU * vU * aHaut;
        p.x += pli * 0.22 * vU * vU * aHaut;

        float c = cos(aTour), s = sin(aTour);
        vec3 tourne = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);

        vec4 m = modelMatrix * vec4(tourne + aPlace, 1.0);
        vec4 vue = viewMatrix * m;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uJade, uBrume;
      uniform float uDensite;
      varying float vU, vGraine, vProfondeur;
      void main() {
        /* Presque noir a la base, jade a la pointe : c'est ce degrade qui fait
           qu'une touffe se lit comme un volume et non comme une tache. */
        /* ══ UNE PELOUSE N'EST PAS UN SOUS-BOIS ═══════════════════════════
           A une pointe jade a 0,42, les neuf mille brins formaient une bande
           verte CLAIRE et REGULIERE en bas du cadre : une pelouse tondue, pas
           un sous-bois. Deux choses distinguent les deux, et aucune n'est la
           forme du brin.

           La VALEUR : de nuit, le sol est presque noir et seules quelques
           pointes accrochent la lumiere. La VARIETE : dans une friche, deux
           brins voisins n'ont jamais le meme vert, parce qu'ils n'ont ni le
           meme age ni la meme orientation. On triple donc l'ecart entre le
           brin le plus sombre et le plus clair. */
        vec3 col = mix(vec3(0.005, 0.012, 0.010), uJade * 0.20, pow(vU, 2.1));
        col *= 0.20 + vGraine * vGraine * 1.75;
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrume, clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const herbe = new THREE.InstancedMesh(geoBrin, matHerbe, NB_HERBE);
  {
    const place = new Float32Array(NB_HERBE * 3);
    const haut = new Float32Array(NB_HERBE);
    const tour = new Float32Array(NB_HERBE);
    const grn = new Float32Array(NB_HERBE);
    const m = new THREE.Matrix4();
    let n = 0;
    for (let i = 0; i < NB_HERBE; i++) {
      /* Deux tiers pres du chemin, un tiers plus loin : la densite doit
         tomber avec la distance, sinon on peuple une plaine entiere pour
         quelques pixels. */
      const pres = alea() < 0.68;
      const p = unePlace(pres ? 1.6 : 12, pres ? 14 : 46, -14, pres ? 100 : 140);
      if (!p) continue;
      place[n * 3] = p.x; place[n * 3 + 1] = p.y; place[n * 3 + 2] = p.z;
      haut[n] = entre(0.40, 2.30);
      tour[n] = entre(0, Math.PI * 2);
      grn[n] = alea();
      herbe.setMatrixAt(n, m);   /* identite : tout est dans les attributs */
      n++;
    }
    herbe.count = n;
    geoBrin.setAttribute('aPlace', new THREE.InstancedBufferAttribute(place, 3));
    geoBrin.setAttribute('aHaut', new THREE.InstancedBufferAttribute(haut, 1));
    geoBrin.setAttribute('aTour', new THREE.InstancedBufferAttribute(tour, 1));
    geoBrin.setAttribute('aGraine', new THREE.InstancedBufferAttribute(grn, 1));
  }
  herbe.frustumCulled = false;
  groupe.add(herbe);
  aJeter.push(geoBrin, matHerbe);

  /* ══ LES PIERRES ════════════════════════════════════════════════════════
     Une sphere a faces plates, deformee par un bruit, aplatie. Elles donnent
     l'echelle et surtout elles OCCULTENT : une pierre devant un brin d'herbe
     dit la distance entre les deux, ce qu'aucun degrade ne dit. */
  const geoPierre = new THREE.IcosahedronGeometry(1, 1);
  {
    const p = geoPierre.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const d = 0.72 + 0.5 * Math.abs(Math.sin(v.x * 3.1 + v.y * 2.3 + v.z * 1.7));
      v.multiplyScalar(d);
      v.y *= 0.94;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geoPierre.computeVertexNormals();
  }
  const matPierre = new THREE.ShaderMaterial({
    uniforms: {
      uMousse: { value: options.mousse || null },
      uJade: { value: JADE }, uBrume: { value: BRUME },
      uDensite: { value: options.densiteBrume ?? 0.0058 }
    },
    vertexShader: /* glsl */`
      varying vec3 vN, vMonde;
      varying float vProfondeur;
      void main() {
        vec4 m = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vMonde = m.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vec4 vue = viewMatrix * m;
        vProfondeur = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform sampler2D uMousse;
      uniform vec3 uJade, uBrume;
      uniform float uDensite;
      varying vec3 vN, vMonde;
      varying float vProfondeur;
      vec3 tri(vec3 p, vec3 n, float e) {
        vec3 m = pow(abs(n), vec3(4.0)); m /= (m.x + m.y + m.z);
        return texture2D(uMousse, p.yz * e).rgb * m.x
             + texture2D(uMousse, p.xz * e).rgb * m.y
             + texture2D(uMousse, p.xy * e).rgb * m.z;
      }
      void main() {
        vec3 N = normalize(vN);
        vec3 mat = tri(vMonde, N, 0.42);
        float v = dot(mat, vec3(0.30, 0.59, 0.11));
        /* La pierre est grise, la mousse verte, et la mousse ne tient que sur
           le dessus. La meme regle que sur le portail, pour la meme raison :
           c'est elle qu'on lit, pas la texture. */
        float dessus = smoothstep(0.15, 0.75, N.y);
        /* ══ UNE PIERRE SOMBRE, PAS UNE PIERRE NEUTRE ═════════════════════
           A une valeur neutre et mi-sombre, elles sortaient MAUVES : l'etalonnage
           du voyage teinte les ombres vers le violet, et une surface qui tombe
           pile dans cette plage prend la teinte entiere. Une pierre de nuit est
           beaucoup plus sombre que ce que l'on croit, et legerement verte de la
           mousse qui la couvre. */
        vec3 pierre = vec3(0.022, 0.026, 0.026) * (0.45 + v * 1.15);
        vec3 mousse = uJade * 0.17 * (0.40 + v);
        vec3 col = mix(pierre, mousse, dessus * 0.66);
        float ciel = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        col *= 0.40 + ciel * 0.90;
        float b = 1.0 - exp(-uDensite * uDensite * vProfondeur * vProfondeur);
        col = mix(col, uBrume, clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const NB_PIERRES = petit ? 40 : 110;
  const pierres = new THREE.InstancedMesh(geoPierre, matPierre, NB_PIERRES);
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
    let n = 0;
    for (let i = 0; i < NB_PIERRES; i++) {
      const p = unePlace(2.2, 34, -12, 120);
      if (!p) continue;
      const t = entre(0.30, 1.35);
      e.set(entre(-0.3, 0.3), entre(0, 6.283), entre(-0.3, 0.3));
      q.setFromEuler(e);
      s.set(t * entre(0.85, 1.25), t * entre(0.72, 1.05), t * entre(0.85, 1.25));
      /* Enfoncee d'un tiers : une pierre POSEE sur un terrain se voit tout de
         suite, parce qu'elle laisse un jour dessous. */
      m.compose(new THREE.Vector3(p.x, p.y + s.y * 0.42, p.z), q, s);
      pierres.setMatrixAt(n, m);
      n++;
    }
    pierres.count = n;
    pierres.instanceMatrix.needsUpdate = true;
  }
  pierres.frustumCulled = false;
  groupe.add(pierres);
  aJeter.push(geoPierre, matPierre);

  return {
    avancer(t, front) {
      matHerbe.uniforms.uTemps.value = t;
      matHerbe.uniforms.uFront.value = front;
    },
    bilan: () => ({ brins: herbe.count, pierres: pierres.count }),
    detruire() {
      scene.remove(groupe);
      aJeter.forEach(o => o.dispose?.());
    }
  };
}
