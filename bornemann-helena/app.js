/* La Petite Inattendue : les animations et les petites interactions.
   Aucune bibliotheque. Tout ce qui bouge s'arrete si le visiteur a demande
   a reduire les animations, et tout le contenu reste lisible sans JavaScript. */

(() => {
  /* Les liens d'invitation et de mot de passe oublie d'Identity pointent vers
     la racine du site : on les renvoie vers l'espace personnel. */
  if (/(invite|recovery)_token=/.test(location.hash)) { location.replace(`/admin/${location.hash}`); return; }

  const doux = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointeurFin = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------------------------------------------------------------- */
  /* Decoupage du texte                                                      */
  /* ---------------------------------------------------------------------- */

  /** Enveloppe chaque mot (ou chaque lettre) dans un span, en gardant les <em>. */
  function decouper(racine, mode, classe) {
    let i = 0;
    const marcher = (noeud) => {
      [...noeud.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const morceaux = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          morceaux.forEach((m) => {
            if (!m) return;
            if (/^\s+$/.test(m)) { frag.append(document.createTextNode(' ')); return; }
            if (mode === 'lettres') {
              const bloc = document.createElement('span');
              bloc.className = 'mot-bloc';
              [...m].forEach((c) => {
                const s = document.createElement('span');
                s.className = classe;
                s.style.setProperty('--i', i++);
                s.textContent = c;
                bloc.append(s);
              });
              frag.append(bloc);
            } else {
              const s = document.createElement('span');
              s.className = classe;
              s.style.setProperty('--i', i++);
              s.textContent = m;
              frag.append(s);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.matches('svg, .tournant')) {
          marcher(n);
        }
      });
    };
    marcher(racine);
    racine.setAttribute('aria-label', racine.textContent.replace(/\s+/g, ' ').trim());
    return i;
  }

  $$('[data-mots]').forEach((el) => decouper(el, 'mots', 'mot'));
  $$('[data-lettres]').forEach((el) => decouper(el, 'lettres', 'l'));
  $$('[data-encre] p').forEach((p) => decouper(p, 'mots', 'mot'));

  /* ---------------------------------------------------------------------- */
  /* Apparitions au defilement                                               */
  /* ---------------------------------------------------------------------- */

  const cibles = '[data-reveal], [data-pop], [data-mots], [data-lettres], .puces-cascade, .telephone, .carte-boite, .appel-boite';
  const vu = new IntersectionObserver(
    (entrees) => entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.target.matches(cibles)) e.target.classList.add('est-visible');
      (e.target._rideaux || []).forEach((el) => el.classList.add('est-visible'));
      vu.unobserve(e.target);
    }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  $$(cibles).forEach((el) => vu.observe(el));
  /* Un element entierement masque par son propre clip-path n'est jamais vu
     comme « visible » par l'observateur : on surveille donc son parent. */
  $$('[data-rideau]').forEach((el) => {
    const p = el.parentElement;
    (p._rideaux || (p._rideaux = [])).push(el);
    vu.observe(p);
  });

  /* Une image deja a l'ecran au chargement ne doit pas attendre le defilement. */
  requestAnimationFrame(() => document.documentElement.classList.add('pret'));

  /* ---------------------------------------------------------------------- */
  /* Le mot qui change dans le hero                                          */
  /* ---------------------------------------------------------------------- */

  const tournant = document.querySelector('[data-tournant]');
  if (tournant && !doux) {
    const mots = JSON.parse(tournant.dataset.tournant);
    const cible = tournant.querySelector('.tournant-mot');
    let n = 0;
    const ecrire = (mot, entree) => {
      cible.innerHTML = '';
      [...mot].forEach((c, i) => {
        const s = document.createElement('span');
        s.className = 'l';
        s.textContent = c;
        s.style.cssText = `transition: opacity .45s ease ${i * 22}ms, transform .6s cubic-bezier(.34,1.56,.64,1) ${i * 22}ms, filter .5s ease ${i * 22}ms;${entree ? 'opacity:0;transform:translateY(.5em);filter:blur(6px)' : ''}`;
        cible.append(s);
      });
      if (entree) requestAnimationFrame(() => requestAnimationFrame(() => $$('.l', cible).forEach((s) => { s.style.opacity = 1; s.style.transform = 'none'; s.style.filter = 'none'; })));
    };
    setTimeout(() => setInterval(() => {
      if (document.hidden) return;
      $$('.l', cible).length || ecrire(cible.textContent, false);
      $$('.l', cible).forEach((s, i) => { s.style.transitionDelay = `${i * 14}ms`; s.style.opacity = 0; s.style.transform = 'translateY(-.45em)'; s.style.filter = 'blur(6px)'; });
      setTimeout(() => {
        n = (n + 1) % mots.length;
        ecrire(mots[n], true);
        tournant.classList.remove('change'); void tournant.offsetWidth; tournant.classList.add('change');
      }, 420);
    }, 3400), 2600);
  }

  /* ---------------------------------------------------------------------- */
  /* Compteurs                                                               */
  /* ---------------------------------------------------------------------- */

  const compteurs = new IntersectionObserver((entrees) => entrees.forEach((e) => {
    if (!e.isIntersecting) return;
    compteurs.unobserve(e.target);
    const brut = e.target.dataset.compte;
    const virgule = brut.includes(',');
    const fin = parseFloat(brut.replace(',', '.'));
    if (doux || !isFinite(fin)) return;
    const debut = performance.now();
    const duree = 1600;
    const pas = (t) => {
      const p = Math.min(1, (t - debut) / duree);
      const val = fin * (1 - Math.pow(1 - p, 4));
      e.target.textContent = virgule ? val.toFixed(1).replace('.', ',') : Math.round(val);
      if (p < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }), { threshold: 0.6 });
  $$('[data-compte]').forEach((el) => compteurs.observe(el));

  /* ---------------------------------------------------------------------- */
  /* Tout ce qui depend du defilement, dans une seule boucle                 */
  /* ---------------------------------------------------------------------- */

  const racine = document.documentElement;
  const entete = document.querySelector('.entete-site');
  const barre = document.querySelector('.barre-mobile');
  const parallaxes = doux ? [] : $$('[data-parallax]');
  const encres = $$('[data-encre]');
  const sentiers = $$('[data-sentier]');
  let dernierY = scrollY;
  let enAttente = false;

  function surDefilement() {
    enAttente = false;
    const y = scrollY;
    const h = innerHeight;
    const max = racine.scrollHeight - h;
    racine.style.setProperty('--progression', max > 0 ? (y / max).toFixed(4) : 0);

    document.body.classList.toggle('defile-haut', y > 30);
    if (entete && !document.body.classList.contains('menu-ouvert')) {
      /* On compare a la derniere position retenue, pas a l'image precedente :
         un defilement lent avance de moins de 6 px par image. */
      const ecart = y - dernierY;
      if (y <= 420) { entete.classList.remove('cachee'); dernierY = y; }
      else if (Math.abs(ecart) > 12) { entete.classList.toggle('cachee', ecart > 0); dernierY = y; }
    }
    if (barre) barre.classList.toggle('visible', y > 520);

    parallaxes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > h + 200) return;
      const decalage = (r.top + r.height / 2 - h / 2) * parseFloat(el.dataset.parallax);
      el.style.translate = `0 ${decalage.toFixed(1)}px`;
    });

    encres.forEach((bloc) => {
      const r = bloc.getBoundingClientRect();
      const mots = bloc._mots || (bloc._mots = $$('.mot', bloc));
      const p = doux ? 1 : Math.min(1, Math.max(0, (h * 0.88 - r.top) / (r.height + h * 0.35)));
      const n = Math.round(p * mots.length * 1.15);
      mots.forEach((m, i) => m.classList.toggle('encre-ok', i < n));
    });

    sentiers.forEach((s) => {
      const r = s.getBoundingClientRect();
      const p = doux ? 1 : Math.min(1, Math.max(0, (h * 0.85 - r.top) / (h * 0.6)));
      s.style.setProperty('--sentier', p.toFixed(3));
    });
  }
  addEventListener('scroll', () => { if (!enAttente) { enAttente = true; requestAnimationFrame(surDefilement); } }, { passive: true });
  addEventListener('resize', surDefilement);
  surDefilement();

  /* ---------------------------------------------------------------------- */
  /* Menu mobile                                                             */
  /* ---------------------------------------------------------------------- */

  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  if (burger && menu) {
    const basculer = (ouvrir) => {
      burger.setAttribute('aria-expanded', ouvrir);
      burger.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
      document.body.classList.toggle('menu-ouvert', ouvrir);
      document.body.style.overflow = ouvrir ? 'hidden' : '';
      if (ouvrir) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('ouvert')); entete.classList.remove('cachee'); }
      else { menu.classList.remove('ouvert'); setTimeout(() => { if (!menu.classList.contains('ouvert')) menu.hidden = true; }, 600); }
    };
    burger.addEventListener('click', () => basculer(burger.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('ouvert')) { basculer(false); burger.focus(); } });
    $$('a', menu).forEach((a) => a.addEventListener('click', () => basculer(false)));
  }

  /* ---------------------------------------------------------------------- */
  /* Boutons aimantes et portraits qui s'inclinent                           */
  /* ---------------------------------------------------------------------- */

  if (pointeurFin && !doux) {
    $$('[data-aimant]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    $$('[data-incline]').forEach((c) => {
      const f = c.querySelector('figure');
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        f.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
        f.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`);
      });
      c.addEventListener('pointerleave', () => { f.style.setProperty('--rx', '0deg'); f.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Carrousel des animaux                                                   */
  /* ---------------------------------------------------------------------- */

  $$('[data-carrousel]').forEach((piste) => {
    const section = piste.closest('section');
    const pas = () => (piste.querySelector('.portrait')?.offsetWidth || 280) + 24;
    section.querySelector('[data-carrousel-prec]')?.addEventListener('click', () => piste.scrollBy({ left: -pas(), behavior: 'smooth' }));
    section.querySelector('[data-carrousel-suiv]')?.addEventListener('click', () => piste.scrollBy({ left: pas(), behavior: 'smooth' }));
    piste.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') piste.scrollBy({ left: pas(), behavior: 'smooth' });
      if (e.key === 'ArrowLeft') piste.scrollBy({ left: -pas(), behavior: 'smooth' });
    });
    /* glisser a la souris ; au doigt, le defilement natif suffit */
    let x0 = 0, s0 = 0, tire = false, bouge = false;
    piste.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      tire = true; bouge = false; x0 = e.clientX; s0 = piste.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!tire) return;
      if (Math.abs(e.clientX - x0) > 5) { bouge = true; piste.classList.add('tire'); }
      piste.scrollLeft = s0 - (e.clientX - x0);
    });
    addEventListener('pointerup', () => {
      if (!tire) return;
      tire = false;
      piste.classList.remove('tire');
    });
    piste.addEventListener('click', (e) => { if (bouge) { e.preventDefault(); bouge = false; } }, true);
  });

  /* ---------------------------------------------------------------------- */
  /* Onglets                                                                 */
  /* ---------------------------------------------------------------------- */

  $$('[data-onglets]').forEach((bloc) => {
    const liste = bloc.querySelector('[role="tablist"]');
    const boutons = $$('[role="tab"]', liste);
    const curseur = liste.querySelector('.onglets-curseur');
    const placer = (b) => {
      if (!curseur) return;
      curseur.style.width = `${b.offsetWidth}px`;
      curseur.style.transform = `translateX(${b.offsetLeft}px)`;
      curseur.style.top = `${b.offsetTop}px`;
      curseur.style.height = `${b.offsetHeight}px`;
      curseur.style.bottom = 'auto';
    };
    const choisir = (b, focus = false) => {
      boutons.forEach((x) => {
        const actif = x === b;
        x.setAttribute('aria-selected', actif);
        x.tabIndex = actif ? 0 : -1;
        const p = document.getElementById(x.getAttribute('aria-controls'));
        p.hidden = !actif;
        if (actif) $$('.puces-cascade, [data-reveal], [data-rideau]', p).forEach((el) => el.classList.add('est-visible'));
      });
      placer(b);
      if (focus) b.focus();
    };
    boutons.forEach((b, i) => {
      b.addEventListener('click', () => choisir(b));
      b.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); choisir(boutons[(i + d + boutons.length) % boutons.length], true); }
      });
    });
    const depuisAncre = () => {
      const id = location.hash.slice(1);
      const b = boutons.find((x) => x.getAttribute('aria-controls') === id);
      if (b) choisir(b);
    };
    if (bloc.hasAttribute('data-ancre')) { depuisAncre(); addEventListener('hashchange', depuisAncre); }
    const actif = boutons.find((b) => b.getAttribute('aria-selected') === 'true') || boutons[0];
    requestAnimationFrame(() => placer(actif));
    addEventListener('resize', () => placer(boutons.find((b) => b.getAttribute('aria-selected') === 'true')));
    document.fonts?.ready.then(() => placer(boutons.find((b) => b.getAttribute('aria-selected') === 'true')));
  });

  /* ---------------------------------------------------------------------- */
  /* Formulaire                                                              */
  /* ---------------------------------------------------------------------- */

  const form = document.querySelector('[data-formulaire]');
  if (form) {
    const etat = form.querySelector('.formulaire-etat');
    const bouton = form.querySelector('.bouton-envoi');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      bouton.classList.add('envoi');
      bouton.disabled = true;
      etat.className = 'formulaire-etat';
      etat.textContent = '';
      try {
        const r = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        /* Hors Netlify (apercu local, GitHub Pages), un POST est refuse : on ne
           dit « merci » que si le service des formulaires a vraiment accepte. */
        if (!r.ok) throw new Error(String(r.status));
        form.reset();
        etat.classList.add('ok');
        etat.textContent = 'Merci ! Votre message est bien parti. Je vous réponds très vite.';
      } catch {
        etat.classList.add('erreur');
        etat.textContent = `Le message n'a pas pu partir. Appelez-moi directement au ${etat.dataset.tel.replace(/&nbsp;/g, ' ')}, ou réessayez dans un instant.`;
      } finally {
        bouton.classList.remove('envoi');
        bouton.disabled = false;
      }
    });
  }
})();
