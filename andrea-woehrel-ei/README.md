# Energie et Bien-être — site

React 19 + Vite 8 + TypeScript + Tailwind v4 + lucide-react.
Site **multipage** : un vrai fichier `.html` par prestation, donc une URL
indexable par soin (SEO local « réflexologie plantaire Houssen »).

```bash
npm install
npm run dev      # http://localhost:5183
npm run build    # -> dist/
npm run preview
```

## Direction artistique

Noir pur, verre liquide, **Instrument Serif en italique** pour tous les titres
et **Inter 300/400/500** pour le texte. Un seul accent chromatique :
`--color-amber` (#e0a25c), la lumière des bougies. C'est le prix, le CTA, la
puce de section — rien d'autre.

Chaque grande section a une **vidéo de fond** ; tout ce qui se pose dessus est
en verre (`.liquid-glass` / `.liquid-glass-strong`).

> ⚠️ `.liquid-glass` impose `position: relative`. Tout élément qui doit être
> positionné en absolu par-dessus a besoin de `!absolute` (modificateur
> important de Tailwind) — sinon il part hors écran. C'est le cas de la pilule
> centrale de la nav et des menus déroulants.

## Les vidéos

`public/video/` — quatre plans générés pour ce site (Veo 3.1, 8 s, 16:9,
muets, ré-encodés h264 crf 31 à 1600 px, `+faststart`).

| Fichier | Plan | Où |
|---|---|---|
| `hero-eau` | Eau sur galets, fleur de frangipanier, reflets de bougie | Accueil, réflexologie, contact |
| `bougies` | Trois bougies, fumée d'encens, galets empilés | Section « Les soins », soin énergétique, appels finaux |
| `onde` | Goutte d'eau, ondes concentriques dorées | Citation, psychogénéalogie, tarifs, mentions |
| `sauna` | Vapeur ambrée, bois, galets chauds | Sauna japonais |

Chacune a un **poster WebP** du même nom, affiché immédiatement : jamais de
trou noir en attendant le chargement.

`src/components/FadingVideo.tsx` gère le reste :

- `loop` natif fait sauter la reprise → le fondu est piloté à la main.
  Entrée 500 ms, sortie 550 ms dès qu'il reste 0,55 s, puis retour à zéro.
  `requestAnimationFrame` uniquement, jamais de transition CSS : deux fondus
  concurrents se marcheraient dessus.
- Le `src` n'est posé qu'à 400 px du viewport (`immediat` pour le hero) : une
  page ne télécharge jamais les vidéos de ses sections basses.
- Onglet caché → `pause()`.
- `prefers-reduced-motion: reduce` → **la vidéo n'est jamais chargée**, le
  poster suffit. Même chose pour toutes les animations d'entrée.

## Les animations

| Composant | Effet |
|---|---|
| `BlurText` | Chaque mot arrive de 50 px plus bas, `blur(10px)` → net, 100 ms d'écart. Déclenché à l'entrée dans le viewport. Titres uniquement. |
| `.fade-rise` | Entrée du hero, décalée : badge 0,35 s → titre 0,45 s → texte 0,9 s → boutons 1,1 s → cartes 1,3 s → bandeau 1,45 s. |
| `Reveal` | Blocs de contenu, à l'entrée dans le viewport. |
| `Rayons` | Le soleil du logo, dont les rayons respirent — la marque de fabrique. |
| `Revelation` | Un disque de 280 px suit le curseur et découvre le même plan éclairci et désaturé : une lampe promenée sur l'eau. |

### La révélation au curseur

`src/components/Revelation.tsx`. Le masque est un `radial-gradient` dont le
centre est piloté par `--rev-x` / `--rev-y`. La version de référence dessinait
le dégradé dans un canvas et l'exportait en `toDataURL()` à chaque image :
c'est exactement ce qui fait fondre un téléphone. Ici c'est le compositeur qui
travaille.

Le disque révèle le **même plan retraité**, pas une autre vidéo : les quatre
plans sont tous chauds, sombres et flous, donc aucun couple ne tranchait — le
disque se lisait comme un simple assombrissement. Le même plan en
`brightness(2.25) saturate(0.6)` tranche nettement, et ne coûte aucun
téléchargement supplémentaire.

Ne se monte que sur `(hover: hover) and (pointer: fine)`, largeur ≥ 1024 px et
hors `prefers-reduced-motion` : sur mobile ce serait une seconde vidéo à
décoder sans curseur à suivre. La position est écrite immédiatement au premier
mouvement, l'adoucissement (lerp 0,1) ne fait que suivre — si la boucle est
bridée, le disque suit quand même.

### Le logo

`public/logo.webp` — le vrai logo de l'institut, détouré de son fond blanc
(`colorkey`, **sans** `despill` qui dénaturait l'or en rose). Il contient déjà
le lettrage « Energie & Bien-être / Brigitte Baradel » : pas de marque
typographique à côté, ce serait un doublon. Nav 56/64 px, pied de page 144 px.

## Le seul fichier à modifier pour les coordonnées

`src/lib/site.ts` — téléphone, adresse, Facebook, SIRET, liste des soins,
tarifs des cartes, chemins des vidéos. Rien n'est écrit en dur ailleurs.

## Comment tient le multipage

Chaque `.html` porte un `data-page` sur `<html>` ; `src/main.tsx` lit cet
attribut et monte le composant de page correspondant. Un seul bundle, un
`<title>`, une `<meta description>` et un JSON-LD propres à chaque page.

```
index.html                 data-page="accueil"
reflexologie-plantaire.html            "reflexologie"
psychogenealogie.html                  "psychogenealogie"
soin-energetique.html                  "energetique"
sauna-japonais.html                    "sauna"
tarifs.html                            "tarifs"
contact.html                           "contact"
mentions-legales.html                  "mentions"      (noindex)
```

Pour ajouter une page : créer le `.html`, ajouter l'entrée dans
`vite.config.ts` → `rollupOptions.input`, la route dans `src/lib/site.ts` et le
composant dans `src/main.tsx`.

## Pas de formulaire

La prise de rendez-vous se fait **au téléphone**, comme dans la réalité de
l'institut. Le numéro est dans la nav, dans chaque hero, en bas de chaque page
de soin, dans le pied de page et dans une barre fixe en bas d'écran sur mobile.
Aucun formulaire, aucun champ, rien à héberger côté serveur.

## Images

`public/images/` en WebP. Le JPEG `salle-reflexologie.jpg` n'est là que pour
`og:image` (partage Facebook). Pour régénérer depuis un JPEG :

```bash
ffmpeg -y -i source.jpg -vf "scale='min(1600,iw)':-2" -c:v libwebp -quality 74 sortie.webp
```

## Budget

| | Mesuré | Cible |
|---|---|---|
| JS gzip | 76 kB | ≤ 250 kB |
| CSS gzip | 7,1 kB | — |
| Vidéos | 4,0 Mo au total, différées sauf le hero (1,7 Mo) | — |
| Images | 219 kB, toutes en `loading="lazy"` | — |
| Contraste titre sur le hero | 21:1 | ≥ 4,5:1 |
| Contraste paragraphe sur le hero | 14,9:1 | ≥ 4,5:1 |

## Avant mise en ligne

1. Vérifier que `https://www.brigitte-baradel.fr` pointe vers le nouvel
   hébergement, et rediriger les anciennes URL sans `.html` :
   `/reflexologie-plantaire` → `/reflexologie-plantaire.html`, etc.
2. Mettre à jour l'hébergeur dans les mentions légales (`src/lib/site.ts`,
   champ `hebergeur`) — il indique encore 1&1, l'hébergeur du site actuel.
3. Servir `public/video/` avec un cache long (`Cache-Control: max-age=31536000,
   immutable`) : les fichiers ne changent jamais.
4. Soumettre `sitemap.xml` dans la Search Console.
