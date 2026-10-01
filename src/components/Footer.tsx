import { ArrowUp, Instagram } from 'lucide-react';
import BrandLockup from './BrandLockup';

export default function Footer() {
  return (
    <footer className="relative border-t border-primary-container/70 bg-surface-container-lowest">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-primary-container/40" />
      <div className="mx-auto grid max-w-7xl gap-7 px-6 py-8 md:grid-cols-[1fr_auto_1fr] md:items-center md:px-16 md:py-7">
        <BrandLockup href="#inicio" ariaLabel="Legion-IX, volver al inicio" filterId="footer-brand-mark-filter" className="justify-self-start" />
        <a href="https://www.instagram.com/leg_ix_airsoft?igsh=YTZpZDM5MGNhN3hz" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Legion-IX" className="inline-flex min-h-11 items-center gap-3 justify-self-start border-y border-outline-variant/70 py-2 text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container md:justify-self-center md:border-y-0 md:px-5">
          <Instagram className="h-5 w-5" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">@leg_ix_airsoft</span>
        </a>
        <div className="flex items-center justify-between gap-4 md:justify-self-end">
          <span className="font-mono text-[9px] font-bold uppercase leading-relaxed tracking-widest text-on-surface-variant">
            © {new Date().getFullYear()} Legion-IX<br />Todos los derechos reservados
          </span>
          <a href="#inicio" aria-label="Volver arriba" title="Volver arriba" className="flex h-10 w-10 shrink-0 items-center justify-center border border-outline-variant text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container">
            <ArrowUp className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
