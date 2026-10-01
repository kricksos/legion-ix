import { lazy, Suspense, useState } from 'react';
import { Instagram, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import BrandLockup from './BrandLockup';
import { useAuth } from '../contexts/AuthContext';

const AuthDialog = lazy(() => import('./AuthDialog'));
const AdminPanel = lazy(() => import('./AdminPanel'));

const navigationLinks = [
  { label: 'El equipo', href: '#intel' },
  { label: 'Eventos', href: '#calendar' },
  { label: 'Galería', href: '#gallery' },
];

export default function TopNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const { user, isAdmin, loading } = useAuth();

  return (
    <>
      <nav aria-label="Navegación principal" className="sticky top-0 z-50 w-full border-b border-outline-variant bg-surface/95 shadow-[0_0_20px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 md:px-16 md:py-4">
          <BrandLockup href="#inicio" ariaLabel="Legion-IX, inicio" filterId="header-brand-mark-filter" />

          <div className="hidden items-center gap-8 md:flex">
            {navigationLinks.map((link) => (
              <a key={link.href} className="font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-emerald-200" href={link.href}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <a href="https://www.instagram.com/leg_ix_airsoft?igsh=YTZpZDM5MGNhN3hz" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Legion-IX" className="inline-flex h-10 w-10 items-center justify-center border border-primary/30 text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary md:w-auto md:gap-2 md:px-3">
              <Instagram className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden font-mono text-xs font-bold uppercase tracking-widest lg:inline">Instagram</span>
            </a>
            {loading ? (
              <button type="button" disabled aria-label="Comprobando sesión" className="inline-flex h-10 items-center justify-center gap-2 border border-outline-variant px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant disabled:opacity-60">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-surface-variant border-t-transparent" />
                <span className="hidden sm:inline">...</span>
              </button>
            ) : user ? (
              <>
                <button type="button" onClick={() => setAuthOpen(true)} aria-label="Abrir cuenta" className="inline-flex h-10 items-center justify-center gap-2 border border-outline-variant px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container">
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">Cuenta</span>
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => setAdminPanelOpen(true)} aria-label="Abrir panel admin" className="inline-flex h-10 items-center justify-center gap-2 border border-primary-container/60 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-container transition-colors hover:border-primary-container hover:bg-primary-container hover:text-on-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
              </>
            ) : (
              <button type="button" onClick={() => setAuthOpen(true)} aria-label="Iniciar sesión" className="inline-flex h-10 items-center justify-center gap-2 border border-outline-variant px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container">
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">Acceder</span>
              </button>
            )}
            <a className="hidden bg-primary-container px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary md:inline-flex" href="#contact">Únete al equipo</a>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border border-outline-variant text-primary transition-colors hover:border-primary-container md:hidden"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-navigation" className="border-t border-outline-variant bg-surface px-5 py-4 shadow-xl md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col">
              {navigationLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="border-b border-outline-variant/60 py-4 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary-container">
                  {link.label}
                </a>
              ))}
              <button type="button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 border border-primary-container bg-primary-container px-5 font-mono text-xs font-bold uppercase tracking-widest text-on-primary">
                <UserRound className="h-4 w-4" />
                {user ? 'Mi cuenta' : 'Iniciar sesión'}
              </button>
              {user && isAdmin && (
                <button type="button" onClick={() => { setMenuOpen(false); setAdminPanelOpen(true); }} className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 border border-primary-container px-5 font-mono text-xs font-bold uppercase tracking-widest text-primary-container">
                  <ShieldCheck className="h-4 w-4" />
                  Panel admin
                </button>
              )}
              <a href="#contact" onClick={() => setMenuOpen(false)} className="mt-3 inline-flex min-h-11 items-center justify-center bg-surface-container px-5 font-mono text-xs font-bold uppercase tracking-widest text-primary">
                Únete al equipo
              </a>
            </div>
          </div>
        )}
      </nav>
      {authOpen && (
        <Suspense fallback={null}>
          <AuthDialog open onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}
      {adminPanelOpen && (
        <Suspense fallback={null}>
          <AdminPanel open onClose={() => setAdminPanelOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
