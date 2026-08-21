# Madame Cils — maquette de prospection

Extensions et rehaussement de cils, Illkirch-Graffenstaden, au sud de
Strasbourg. Page unique, construite à partir de sa fiche Planity publique et de
son Instagram `@madamecils67`.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind v4 · GSAP
Build `npm run build`, publication `dist/`.

## Données

Les 17 prestations, leurs prix, leurs durées et leurs descriptions viennent de
`planity.com/madame-cils-67400-illkirch-graffenstaden`.
**Rien n'est inventé** — la règle du projet, vérifiable ligne à ligne dans
`src/data/site.ts`.

Deux points relevés directement chez elle et corrigés en cours de route : la
famille s'appelle **Mixte** et non « Hybride », et le mardi ferme à **19 h 30**
et non 20 h.

## Ce que le site ne publie pas

**L'adresse exacte.** Laura exerce dans une résidence, et se localise elle-même
par une zone dans sa bio Instagram (« Strasbourg sud / Illkirch »). Le site dit
la commune, jamais la voie — ni dans le texte, ni dans le `schema.org`, ni dans
les mentions légales. L'adresse complète est communiquée par Planity après
confirmation du rendez-vous.

## Images

- `public/images/` — ses **12 photos**, reprises de son compte public, en WebP.
- `public/media/` — fond vidéo et lueur, **générés et strictement abstraits** :
  filaments et lumière. Aucun ne représente une prestation. Le comparateur du
  hero oppose « Rehaussement » et « Extensions », **pas un avant/après** : ce
  sont deux publications différentes, et l'étiqueter autrement serait un
  argument de vente faux.

## Avant la mise en ligne

1. Retirer le `noindex` : `index.html`, `public/robots.txt`, `netlify.toml`
2. Remplacer les photos par ses fichiers d'origine (celles-ci sont passées par
   la compression d'Instagram)
3. Brancher un nom de domaine
4. Vérifier avec elle la forme juridique exacte dans les mentions légales
