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
            <button type="button" onClick={() => user && isAdmin ? setAdminPanelOpen(true) : setAuthOpen(true)} aria-label={user && isAdmin ? 'Abrir panel admin' : user ? 'Abrir cuenta' : 'Iniciar sesión'} className="inline-flex h-10 items-center justify-center gap-2 border border-outline-variant px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container">
              {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-surface-variant border-t-transparent" /> : user && isAdmin ? <ShieldCheck className="h-4 w-4 text-primary-container" /> : <UserRound className="h-4 w-4" />}
              <span className="hidden sm:inline">{loading ? '...' : user ? (isAdmin ? 'Admin' : 'Cuenta') : 'Acceder'}</span>
            </button>
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
              <button type="button" onClick={() => { setMenuOpen(false); user && isAdmin ? setAdminPanelOpen(true) : setAuthOpen(true); }} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 border border-primary-container bg-primary-container px-5 font-mono text-xs font-bold uppercase tracking-widest text-on-primary">
                {user ? (isAdmin ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />) : <UserRound className="h-4 w-4" />}
                {user ? (isAdmin ? 'Panel admin' : 'Mi cuenta') : 'Iniciar sesión'}
              </button>
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
