/**
 * Controle des modules avant de regarder dans le navigateur.
 *
 *   node verifier.mjs
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Les shaders sont ecrits dans des gabarits de chaine JavaScript. Un simple
 * accent grave dans un commentaire GLSL referme la chaine au milieu du shader,
 * et le module entier cesse de se charger. Le navigateur n'annonce alors qu'un
 * « Unexpected identifier » sans ligne utile, et le site bascule en silence
 * sur son repli : on croit regarder la scene 3D alors qu'on regarde une image
 * fixe.
 *
 * L'erreur a ete faite deux fois dans la meme nuit, la seconde apres l'avoir
 * documentee. D'ou ce garde-fou, qui coute deux secondes.
 */
import { readdir, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const DOSSIER = 'js';
let fautes = 0;

for (const f of (await readdir(DOSSIER)).filter((n) => n.endsWith('.js'))) {
  const chemin = path.join(DOSSIER, f);
  const src = await readFile(chemin, 'utf8');

  /* 1. La syntaxe, d'abord. C'est ce qui attrape l'accent grave egare. */
  try {
    await run(process.execPath, ['--check', chemin]);
  } catch (e) {
    const ligne = String(e.stderr).split('\n').slice(0, 4).join('\n');
    console.log(`  ✗ ${f}\n${ligne}`);
    fautes++;
    continue;
  }

  /* 2. Un accent grave a l'interieur d'un gabarit de shader. La syntaxe peut
        passer par hasard si les accents vont par deux : on previent quand
        meme, parce que le shader recoit alors du JavaScript colle dedans. */
  const gabarits = src.match(/`[^`]*(?:precision|gl_FragColor|gl_Position|#version)[^`]*`/gs) || [];
  const total = gabarits.join('').length;
  if (total > 0) {
    // Nombre d'accents graves hors des gabarits reconnus : doit etre pair.
    const dehors = src.split('').filter((c) => c === '`').length - gabarits.length * 2;
    if (dehors % 2 !== 0) {
      console.log(`  ! ${f} — accents graves desequilibres autour des shaders`);
      fautes++;
      continue;
    }
  }

  console.log(`  ✓ ${f}`);
}

if (fautes) {
  console.log(`\n${fautes} module(s) en faute. Corriger avant d'ouvrir le navigateur.`);
  process.exit(1);
}
console.log('\nTous les modules se chargent.');
