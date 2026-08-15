/* ══════════════════════════════════════════════════════════════════════════
   LE CIEL
   --------------------------------------------------------------------------
   L'environnement que reflechissent toutes les surfaces de la maison. Partage
   entre le sceau de verre et le portail de pierre, et c'est le point : deux
   objets eclaires par deux ciels differents n'appartiennent pas au meme monde,
   meme s'ils portent les memes couleurs.

   TROIS REGLES APPRISES A LA DURE, en reglant le sceau :

   1. Le fond n'est PAS le noir de la page. Une surface ne fabrique pas de
      lumiere, elle en renvoie : peindre le ciel au noir du site donnait un
      objet noir, quel que soit le reglage du materiau. L'environnement est la
      piece qu'on allume, pas le decor qu'on voit.

   2. Il faut DEUX barres lumineuses, pas une. Avec une seule, la moitie des
      aretes ne rencontre jamais d'eclat en tournant et reste eteinte quel que
      soit l'angle.

   3. Ces barres sont nettes, jamais floues. Un reflet net est exactement ce
      qui distingue une surface polie d'une surface depolie.

   La disposition suit la regle de la maison : le jade en bas, c'est le sol et
   la matiere ; le violet en haut, c'est le ciel et la lumiere.
   ══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

export function peindreLeCiel() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');

  x.fillStyle = '#121A24';
  x.fillRect(0, 0, 1024, 512);

  const halo = (cx, cy, r, couleur, force) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${couleur},${force})`);
    g.addColorStop(1, `rgba(${couleur},0)`);
    x.fillStyle = g;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  };

  halo(300, 400, 430, '16,185,129', 1);      // jade, en bas : le sol
  halo(760, 120, 420, '124,58,237', 1);      // violet, en haut : le ciel
  halo(120, 130, 260, '167,232,255', 0.55);

  const barre = (x0, y0, l, h, force) => {
    const b = x.createLinearGradient(0, y0, 0, y0 + h);
    b.addColorStop(0,   'rgba(255,255,255,0)');
    b.addColorStop(0.5, `rgba(255,255,255,${force})`);
    b.addColorStop(1,   'rgba(255,255,255,0)');
    x.fillStyle = b;
    x.fillRect(x0, y0, l, h);
  };
  barre(90, 30, 460, 120, 1);
  barre(560, 300, 380, 90, 0.75);

  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Le ciel prefiltre, pret a etre pose sur `scene.environment`. Sans ce
   prefiltrage, une texture brute donne des reflets granuleux des que la
   surface est un peu rugueuse. On rend le generateur ET la texture : les deux
   se liberent separement. */
export function monterLeCiel(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const brut = peindreLeCiel();
  const env = pmrem.fromEquirectangular(brut).texture;
  scene.environment = env;
  brut.dispose();
  pmrem.dispose();
  return env;
}
