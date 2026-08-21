import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const page = (name: string) => resolve(import.meta.dirname, `${name}.html`);

// Site multipage : une vraie URL par univers de prestations. C'est ce qui
// permet d'etre trouve sur « microblading Strasbourg » et sur « hydrafacial
// Strasbourg » avec deux pages differentes, plutot qu'une seule qui parle
// de tout.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        accueil: page('index'),
        permanent: page('maquillage-permanent'),
        soins: page('soins'),
        regard: page('regard'),
        epilation: page('epilation'),
        tarifs: page('tarifs'),
        institut: page('institut'),
      },
    },
  },
});
