/* ══════════════════════════════════════════════════════════════════════════
   L'ENTREE DE LA VITRINE DU DOMAINE
   --------------------------------------------------------------------------
   Ce fichier ne fait rien d'autre que brancher les morceaux. Il existe pour
   une seule raison, et elle est technique : il est appele par un attribut du
   HTML, donc la publication peut y poser l'empreinte du contenu, et il la
   repasse a tout ce qu'il importe.

   Ecrit en clair dans la page, le meme code aurait charge ses modules SANS
   empreinte. Un visiteur revenu juste apres une mise en ligne aurait alors
   recu la page neuve et l'ancien module, et la vitrine ne se serait pas
   montee, sans la moindre erreur en console. C'est deja arrive au sceau de
   verre, et c'est le genre de panne qu'on ne trouve qu'en y passant la nuit.
   ══════════════════════════════════════════════════════════════════════════ */

const VERSION = new URL(import.meta.url).search;

const { monterLesActes, monterLeVoile, monterLeCurseur, monterLaLecture } =
  await import('./vitrine.js' + VERSION);

const actes = monterLesActes();
monterLeCurseur();

/* Les actes se posent des maintenant, meme si la scene echoue : le texte d'un
   site ne depend jamais de sa decoration. */
monterLaLecture(p => actes && actes.poser(p));

const scene = (async () => {
  try {
    const { monterLaVitrine } = await import('./vitrine-domaine.js' + VERSION);
    const v = await monterLaVitrine(document.getElementById('scene'));
    if (v) window.vitrine = v;
    return v;
  } catch (e) {
    console.warn('scene indisponible', e);
    /* Repli : un degrade de ciel fixe, pour que personne ne voie jamais un
       rectangle noir a la place d'un couchant. */
    document.getElementById('scene').style.background =
      'radial-gradient(120% 90% at 62% 78%, #C85C2E 0%, #6B3A46 34%, #16244A 62%, #05070F 100%)';
    return null;
  }
})();

monterLeVoile(document.getElementById('voile'), scene);
