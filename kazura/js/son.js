/* ══════════════════════════════════════════════════════════════════════════
   LE SON
   --------------------------------------------------------------------------
   Des notes de koto, synthetisees dans le navigateur. Aucun fichier audio :
   tout est fabrique par oscillateurs, donc le module pese ce que pese son
   code et rien de plus. C'est aussi ce qui permet au timbre de suivre le
   geste, ce qu'un echantillon ne sait pas faire.

   QUATRE REGLES, ET ELLES COMPTENT PLUS QUE LE CODE.

   1. COUPE PAR DEFAUT. Un son qui demarre tout seul est la pire chose qu'un
      site puisse faire. On l'allume, on ne le subit pas.

   2. AUCUNE FAUSSE NOTE POSSIBLE. Les hauteurs sont tirees d'une gamme
      hirajoshi, l'accord classique du koto. Cinq degres choisis pour que deux
      notes quelconques sonnent ensemble : quel que soit l'ordre dans lequel le
      visiteur declenche les sons, ca reste musical. C'est ce qui separe une
      interface qui chante d'une interface qui bipe.

   3. JAMAIS DEUX FOIS LA MEME NOTE DE SUITE, et jamais plus d'une toutes les
      90 ms. Une interface qui repete la meme hauteur devient une alarme.

   4. LE CONTEXTE AUDIO NE NAIT QU'AU PREMIER GESTE. Les navigateurs refusent
      de le demarrer autrement, et le creer d'avance laisse un contexte suspendu
      qui consomme pour rien.
   ══════════════════════════════════════════════════════════════════════════ */

/* Hirajoshi sur re, en rapports de frequence par rapport a la fondamentale.
   re, mi bemol, sol, la, si bemol : la tierce mineure et la seconde mineure
   donnent la couleur japonaise, la quinte juste donne l'assise. */
const GAMME = [1, 1.0595, 1.3348, 1.4983, 1.5874, 2, 2.1189, 2.6697];
const FONDAMENTALE = 174.61;        // fa2, assez grave pour ne jamais percer

let ctx = null;
let sortie = null;
let dernierTemps = 0;
let dernierDegre = -1;
let allume = false;

function reveiller() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();

  /* Un compresseur en sortie, doux. Deux notes qui se superposent doublent la
     pression : sans lui, un visiteur qui survole vite une rangee de boutons
     recoit un pic desagreable. */
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -26;
  comp.knee.value = 24;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;

  sortie = ctx.createGain();
  sortie.gain.value = 0.5;
  sortie.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

/* ── Une note ───────────────────────────────────────────────────────────── */
/* Un koto pince est une corde : attaque quasi instantanee, longue decroissance
   exponentielle, et un contenu harmonique qui s'eteint plus vite que la
   fondamentale. On empile donc deux oscillateurs dont le second, plus aigu,
   meurt trois fois plus vite. C'est ce decalage qui donne le « pincement »
   plutot qu'un bip. */
function pincer(degre, force = 1, duree = 2.2) {
  if (!allume) return;
  const c = reveiller();
  if (!c) return;

  const t = c.currentTime;
  const f = FONDAMENTALE * GAMME[degre % GAMME.length] * (degre >= GAMME.length ? 2 : 1);

  const mix = c.createGain();
  mix.gain.value = 0;
  mix.connect(sortie);

  /* Un passe-bas qui se referme pendant la note : une corde perd ses aigus en
     s'eteignant. Sans ce mouvement le son reste vitreux jusqu'au bout. */
  const filtre = c.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.setValueAtTime(f * 7, t);
  filtre.frequency.exponentialRampToValueAtTime(f * 1.6, t + duree * 0.7);
  filtre.Q.value = 0.7;
  filtre.connect(mix);

  const corps = c.createOscillator();
  corps.type = 'triangle';
  corps.frequency.value = f;

  const harmonique = c.createOscillator();
  harmonique.type = 'sine';
  harmonique.frequency.value = f * 2.01;   // legerement faux, ca fait battre

  const gCorps = c.createGain();
  const gHarm  = c.createGain();
  gCorps.gain.value = 0.62;
  gHarm.gain.value  = 0.20;

  corps.connect(gCorps); gCorps.connect(filtre);
  harmonique.connect(gHarm); gHarm.connect(filtre);

  /* L'enveloppe. L'attaque tient en six millisecondes : au dela on entend un
     souffle qui monte, pas une corde qu'on pince. */
  const pic = 0.34 * force;
  mix.gain.setValueAtTime(0.0001, t);
  mix.gain.exponentialRampToValueAtTime(pic, t + 0.006);
  mix.gain.exponentialRampToValueAtTime(0.0001, t + duree);

  corps.start(t); harmonique.start(t);
  corps.stop(t + duree + 0.05);
  harmonique.stop(t + duree * 0.4);        // l'harmonique s'eteint bien avant

  corps.onended = () => { try { mix.disconnect(); filtre.disconnect(); } catch (e) {} };
}

/* ── Le souffle ─────────────────────────────────────────────────────────── */
/* Pour la traversee du seuil : du bruit filtre en bande etroite qui monte
   puis retombe, comme un courant d'air dans un couloir de pierre. Rien de
   melodique, c'est un mouvement d'air, pas une note. */
export function souffler(duree = 2.4) {
  if (!allume) return;
  const c = reveiller();
  if (!c) return;
  const t = c.currentTime;

  const n = Math.floor(c.sampleRate * duree);
  const tampon = c.createBuffer(1, n, c.sampleRate);
  const d = tampon.getChannelData(0);
  /* Bruit rose approche par filtrage d'un bruit blanc : le blanc pur siffle,
     le rose ressemble a de l'air. */
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const blanc = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + blanc * 0.0990460;
    b1 = 0.96300 * b1 + blanc * 0.2965164;
    b2 = 0.57000 * b2 + blanc * 1.0526913;
    d[i] = (b0 + b1 + b2 + blanc * 0.1848) * 0.16;
  }

  const source = c.createBufferSource();
  source.buffer = tampon;

  const bande = c.createBiquadFilter();
  bande.type = 'bandpass';
  bande.Q.value = 1.4;
  bande.frequency.setValueAtTime(220, t);
  bande.frequency.exponentialRampToValueAtTime(900, t + duree * 0.55);
  bande.frequency.exponentialRampToValueAtTime(260, t + duree);

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.20, t + duree * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);

  source.connect(bande); bande.connect(g); g.connect(sortie);
  source.start(t);
  source.stop(t + duree + 0.05);
}

/* ── L'interface publique ───────────────────────────────────────────────── */
/* Une note prise dans la gamme, jamais la meme que la precedente, et jamais
   plus d'une toutes les 90 ms. Sans ce garde-fou, un survol rapide de la barre
   de navigation produit une mitraille. */
export function note(hauteur = 0.5, force = 1) {
  if (!allume) return;
  const maintenant = performance.now();
  if (maintenant - dernierTemps < 90) return;
  dernierTemps = maintenant;

  let degre = Math.round(Math.max(0, Math.min(1, hauteur)) * (GAMME.length - 1));
  if (degre === dernierDegre) degre = (degre + 1) % GAMME.length;
  dernierDegre = degre;
  pincer(degre, force, 1.6 + Math.random() * 0.8);
}

/* Un accord de trois notes, egrenees. Pour les moments qui comptent. */
export function accord(force = 1) {
  if (!allume) return;
  [0, 2, 4].forEach((deg, i) => setTimeout(() => pincer(deg, force * (1 - i * 0.18), 3.2), i * 130));
}

export function estAllume() { return allume; }

export function basculer(v) {
  allume = v === undefined ? !allume : !!v;
  try { localStorage.setItem('kazura-son', allume ? '1' : '0'); } catch (e) {}
  if (allume) { reveiller(); note(0.5, 0.7); }   // on s'annonce, doucement
  return allume;
}

export function reprendreLeChoix() {
  try { allume = localStorage.getItem('kazura-son') === '1'; } catch (e) { allume = false; }
  return allume;
}
