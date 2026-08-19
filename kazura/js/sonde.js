/* ══════════════════════════════════════════════════════════════════════════
   LA SONDE
   --------------------------------------------------------------------------
   Elle relit ce qu'une piece a REELLEMENT peint, et en tire quatre nombres :
   la part de toile occupee, la couleur moyenne, la luminosite, et le contraste.

   POURQUOI ELLE EXISTE. Une capture d'ecran n'est pas toujours possible : le
   panneau du navigateur ne compose pas toujours ses images, l'extension tombe,
   et un onglet qui n'est pas au premier plan gele tout. Sans sonde, je ne peux
   pas distinguer trois etats qui se ressemblent beaucoup depuis la console :

     - la piece n'est pas montee,
     - la piece est montee et ne dessine rien,
     - la piece est montee, dessine, mais tout est noir.

   Or c'est exactement la difference entre un site qui marche et l'ecran vide
   que Matheo a eu sur son telephone pendant des jours. Une piece qui se monte
   sans erreur n'est pas une piece qui se voit.

   CE N'EST PAS UN REMPLACEMENT DE L'OEIL. Elle dit si quelque chose est la et
   dans quelle gamme de lumiere. Elle ne dira jamais si c'est beau, ni si le
   texte passe par-dessus le sujet, ce qui est la faute que je commets le plus
   souvent. Elle borne le doute, elle ne le supprime pas.
   ══════════════════════════════════════════════════════════════════════════ */

/* On echantillonne un point sur trente-sept. Un nombre premier, pour ne pas
   tomber en phase avec une trame reguliere de l'image : avec un pas de 32 sur
   un damier de 32, on ne lirait qu'une case sur deux et la mesure serait
   fausse dans un sens qu'on ne verrait pas. */
const PAS = 37;

export function sonderToile(renderer, toile, peindre, images = 40) {
  for (let i = 0; i < images; i++) peindre(1 / 60);

  const gl = renderer.getContext ? renderer.getContext() : renderer;
  const L = toile.width, H = toile.height;
  if (!L || !H) return { erreur: 'toile sans dimension' };

  const px = new Uint8Array(L * H * 4);
  gl.readPixels(0, 0, L, H, gl.RGBA, gl.UNSIGNED_BYTE, px);

  let vus = 0, n = 0, r = 0, v = 0, b = 0;
  let lumSomme = 0, lumMin = 255, lumMax = 0;

  for (let i = 0; i < px.length; i += 4 * PAS) {
    n++;
    if (px[i + 3] <= 8) continue;      /* transparent : ce n'est pas peint */
    vus++;
    r += px[i]; v += px[i + 1]; b += px[i + 2];
    const lum = px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722;
    lumSomme += lum;
    if (lum < lumMin) lumMin = lum;
    if (lum > lumMax) lumMax = lum;
  }

  if (!vus) {
    return { toile: [L, H], occupe: 0, verdict: 'RIEN DE PEINT' };
  }

  const moyenne = lumSomme / vus;
  const part = vus / n;

  /* Le verdict, en francais, parce qu'un nombre seul ne dit pas s'il est bon.
     Les seuils viennent des mesures faites cette semaine sur les pieces qui
     marchaient et celles qui ne marchaient pas. */
  const contraste = lumMax - lumMin;
  let verdict = 'correct';

  /* LA LUMINOSITE SEULE NE DIT RIEN, et mon premier seuil s'est trompe des la
     premiere mesure. Il a declare « trop sombre » la scene de lianes, dont la
     moyenne est de 10 sur 255 mais dont l'ecart va de 0 a 239 : c'est une
     scene de nuit avec des eclats vifs, exactement ce qu'on cherche, et la
     regle de la maison veut que presque tout soit noir.

     Une piece n'est reellement noire que si elle est sombre ET plate. Un
     ecart de plus de soixante points dit qu'il y a quelque chose a regarder,
     quelle que soit la moyenne. */
  if (part < 0.01) verdict = 'PRESQUE VIDE';
  else if (moyenne < 18 && contraste < 60) verdict = 'NOIR, rien a regarder';
  else if (moyenne > 225) verdict = 'BRULE, les details sont perdus';
  else if (contraste < 22) verdict = 'PLAT, aucun contraste';
  else if (moyenne < 18) verdict = 'sombre, mais avec des eclats';

  return {
    toile: [L, H],
    occupe: +(part * 100).toFixed(1),
    couleur: 'rgb(' + Math.round(r / vus) + ',' + Math.round(v / vus) + ',' + Math.round(b / vus) + ')',
    luminosite: +moyenne.toFixed(1),
    contraste: +contraste.toFixed(1),
    verdict
  };
}
