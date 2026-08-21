# Sousi Beauty — maquette de prospection

Institut de beauté et maquillage permanent, 12 place des Halles à Strasbourg.
Page unique, construite à partir de sa fiche Planity publique.

> ⚠️ **Le dépôt s'appelle encore `energie-et-bien-etre`** — c'était le site de
> Brigitte Baradel, qui n'a pas donné suite. Le contenu a été remplacé, pas le
> nom. **À renommer avant d'envoyer le lien à Saliha** : une URL au nom d'une
> autre prestataire fait passer la maquette pour un gabarit recyclé, et c'est
> exactement ce qui tue un premier message.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind v4 · GSAP
Build `npm run build`, publication `dist/`.

## Données

Les 165 prestations, leurs prix, leurs durées et leurs descriptions viennent de
`planity.com/sousi-beauty-67000-strasbourg`, relevées le 7 août 2026.
**Rien n'est inventé** — c'est la règle du projet, et elle se vérifie ligne à
ligne dans `src/data/site.ts`.

## Images

Les trois visuels de `public/media/` sont des images de synthèse **strictement
abstraites** : matière et lumière. Aucune ne représente l'institut, une
praticienne ou le résultat d'une prestation. Les emplacements pour ses vraies
photos sont réservés et documentés dans `clients/sousi-beauty/LIVRAISON.md`.

## Avant la mise en ligne

1. Renommer ce dépôt et le site Netlify
2. Retirer le `noindex` : `index.html`, `public/robots.txt`, `netlify.toml`
3. Brancher le domaine `sousi-beauty.fr` — certificat valide sur l'apex **et**
   sur `www`, redirection apex → www en HTTPS
