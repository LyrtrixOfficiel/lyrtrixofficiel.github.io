import { useCallback, type ElementType, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import Rayons from './Rayons';
import { AVERTISSEMENT } from '../lib/site';

/**
 * Apparition au scroll. L'observateur est branche par la ref de rappel et se
 * debranche des que l'element est passe — un seul declenchement par element.
 */
export function Reveal({
  children,
  delai = 0,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delai?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article' | 'p';
}) {
  const attacher = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Balise = as as ElementType;

  return (
    <Balise
      ref={attacher}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delai}ms` } as React.CSSProperties}
    >
      {children}
    </Balise>
  );
}

/** Lucide 1.x ne fournit plus les logos de marque — celui-ci est dessine ici. */
export function IconeFacebook({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M14 8.5V6.9c0-.8.2-1.2 1.4-1.2H17V3h-2.5c-3 0-4 1.4-4 3.8v1.7H8V11h2.5v10H14V11h2.4l.4-2.5H14Z" />
    </svg>
  );
}

/** Puce de section : deux barres obliques, puis l'intitule. */
export function Puce({ children }: { children: ReactNode }) {
  return (
    <span className="mb-6 inline-flex items-center gap-2 text-xs font-light tracking-wide text-white/60">
      <span className="text-amber">//</span>
      {children}
    </span>
  );
}

/** Pastille de badge, dans les heros. */
export function Pastille({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
        {children}
      </span>
    </>
  );
}

/** Filet horizontal, degrade vers le vide. */
export function Filet({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(224,162,92,.6) 0%, rgba(255,255,255,.14) 45%, rgba(255,255,255,0) 100%)',
      }}
    />
  );
}

/** Le rappel legal, identique sur toutes les pages de soin. */
export function Avertissement() {
  return (
    <p className="liquid-glass flex items-start gap-3 rounded-2xl px-5 py-4 text-[13px] font-light leading-relaxed text-white/70">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
      <span>{AVERTISSEMENT}</span>
    </p>
  );
}

/** Bouton plein — blanc sur noir, l'action principale. */
export function BoutonPlein({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.04] ${className}`}
    >
      {children}
    </a>
  );
}

/** Bouton verre — action secondaire. */
export function BoutonVerre({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`liquid-glass-strong inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.04] ${className}`}
    >
      {children}
    </a>
  );
}

/** Lien nu avec le soleil en pastille — troisieme niveau d'action. */
export function LienOnde({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2.5 text-sm font-medium text-white/85 transition-colors hover:text-white ${className}`}
    >
      <Rayons taille={18} className="text-amber" anime={false} />
      {children}
    </a>
  );
}
