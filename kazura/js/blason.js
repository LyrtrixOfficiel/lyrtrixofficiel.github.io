/* ══════════════════════════════════════════════════════════════════════════
   LE BLASON
   --------------------------------------------------------------------------
   Trois folioles de kudzu dans un cercle, et un point au centre. C'est la
   marque de la maison, gravee sur les cartes de visite, et c'est ce meme
   trace qui devient un objet de verre a l'ecran.

   POURQUOI IL A SON PROPRE FICHIER. Il est lu par deux pieces : le sceau de
   la page d'accueil et le voyage, qui le rencontre au bout de son parcours.
   Recopier ce trace dans les deux serait la garantie qu'un jour on corrige
   l'un et pas l'autre, et qu'on se retrouve avec deux logos legerement
   differents sur le meme site.

   L'importer depuis `sceau.js` aurait suffi a la correction, mais pas au
   poids : ce module-la tire avec lui tout un post-traitement, un halo et une
   passe de dispersion. Une chaine de caracteres ne doit pas couter cent
   kilo-octets de code a qui n'en veut que le dessin.
   ══════════════════════════════════════════════════════════════════════════ */

export const BLASON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g fill="#000" fill-rule="evenodd">
    <path d="M50 2a48 48 0 1 0 0 96 48 48 0 1 0 0-96zm0 6a42 42 0 1 1 0 84 42 42 0 1 1 0-84z"/>
    <path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z"/>
    <path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(120 50 50)"/>
    <path d="M50 46C39.5 37 34.5 23.5 50 7c15.5 16.5 10.5 30 0 39zm0-7.4c6.2-6 8.6-14.4 0-23.6-8.6 9.2-6.2 17.6 0 23.6z" transform="rotate(240 50 50)"/>
    <circle cx="50" cy="50" r="4.6"/>
  </g>
</svg>`;
