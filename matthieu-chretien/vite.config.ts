import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const page = (name: string) => resolve(import.meta.dirname, `${name}.html`);

// Site multipage : une vraie URL par prestation (SEO local Houssen / Colmar).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        accueil: page('index'),
        reflexologie: page('reflexologie-plantaire'),
        bach: page('fleurs-de-bach'),
        avancee: page('reflexologie-avancee'),
        tarifs: page('tarifs'),
        contact: page('contact'),
        mentions: page('mentions-legales'),
        admin: page('admin'),
      },
    },
  },
});
