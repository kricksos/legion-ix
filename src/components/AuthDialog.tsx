import { useEffect, useState, type FormEvent } from 'react';
import { LogIn, LogOut, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { user, isAdmin, memberStatus, loading, configured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user || !supabase) return;

    let active = true;
    setNicknameLoading(true);
    void (async () => {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        if (!active) return;
        if (profileError) {
          setError('No se pudo cargar tu nick. Inténtalo de nuevo.');
        } else {
          setNickname(data?.display_name ?? String(user.user_metadata.display_name ?? ''));
        }
      } catch {
        if (active) setError('No se pudo cargar tu nick. Inténtalo de nuevo.');
      } finally {
        if (active) setNicknameLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, user?.id]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    setError('');

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        onClose();
      } else {
        const confirmationRequired = await signUp(displayName, email, password);
        setNotice(confirmationRequired ? 'Cuenta creada. Confirma el correo y, después, espera la aprobación de la administración.' : 'Cuenta creada. Ahora queda pendiente la aprobación de la administración.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    try {
      await signOut();
      onClose();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se pudo cerrar la sesión.');
    }
  };

  const handleSaveNickname = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;

    const cleanNickname = nickname.trim().replace(/\s+/g, ' ');
    if (!cleanNickname) {
      setError('Escribe un nick antes de guardar.');
      return;
    }

    setNicknameSaving(true);
    setNotice('');
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: cleanNickname })
        .eq('id', user.id);
      if (updateError) throw updateError;
      setNickname(cleanNickname);
      setNotice('Nick actualizado.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el nick.');
    } finally {
      setNicknameSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md border border-outline-variant bg-surface p-6 shadow-2xl sm:p-8">
        <div aria-hidden="true" className="absolute inset-2 border border-primary-container/15" />
        <button type="button" aria-label="Cerrar acceso" onClick={onClose} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center border border-outline-variant text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container">
          <X className="h-4 w-4" />
        </button>

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">
            <ShieldCheck className="h-4 w-4" />
            Acceso de unidad
          </div>
          <h2 id="auth-title" className="max-w-[calc(100%-3rem)] font-tactical text-4xl font-bold uppercase leading-none text-primary">
            {user ? 'Sesión activa' : mode === 'sign-in' ? 'Identificación' : 'Alta de usuario'}
          </h2>

          {!configured ? (
            <p role="status" className="mt-6 border border-outline-variant bg-surface-container-low p-4 font-body text-sm leading-relaxed text-on-surface-variant">
              Supabase aún no está configurado. Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` a `.env.local` y reinicia Vite.
            </p>
          ) : loading ? (
            <p role="status" className="mt-6 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">Comprobando credenciales...</p>
          ) : user ? (
            <div className="mt-6 flex flex-col gap-5">
              <div className="border-l-2 border-primary-container pl-4">
                <span className="block break-all font-body text-sm text-primary">{user.email}</span>
                <span className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-primary-container' : 'bg-emerald-300'}`} />
                  {isAdmin ? 'Administrador' : memberStatus === 'approved' ? 'Miembro' : memberStatus === 'pending' ? 'Pendiente de aprobación' : memberStatus === 'rejected' ? 'Solicitud rechazada' : 'Estado sin confirmar'}
                </span>
              </div>
              {memberStatus === 'pending' && (
                <p role="status" className="border border-amber-300/40 bg-amber-950/20 p-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-amber-100">
                  Tu alta está pendiente de aprobación. Cuando se apruebe, podrás apuntarte a operaciones.
                </p>
              )}
              {memberStatus === 'rejected' && (
                <p role="status" className="border border-red-300/40 bg-red-950/20 p-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-red-100">
                  Tu solicitud de alta no ha sido aprobada. Contacta con la administración.
                </p>
              )}
              <form onSubmit={handleSaveNickname} className="flex flex-col gap-3 border-t border-outline-variant/70 pt-5">
                <div>
                  <label htmlFor="account-nickname" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nick visible</label>
                  <input id="account-nickname" name="nickname" type="text" autoComplete="nickname" maxLength={32} minLength={2} required disabled={nicknameLoading} value={nickname} onChange={(event) => setNickname(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container disabled:opacity-60" placeholder={nicknameLoading ? 'Cargando nick...' : 'Escribe tu nick'} />
                </div>
                <button type="submit" disabled={nicknameLoading || nicknameSaving || nickname.trim().length < 2} className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary-container px-4 font-mono text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {nicknameSaving ? 'Guardando...' : 'Guardar nick'}
                </button>
                {notice && <p role="status" className="border border-emerald-300/40 bg-emerald-950/20 p-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-emerald-100">{notice}</p>}
                {error && <p role="alert" className="border border-red-400/50 bg-red-950/25 p-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-red-200">{error}</p>}
              </form>
              <button type="button" onClick={handleSignOut} className="inline-flex min-h-11 items-center justify-center gap-2 border border-outline-variant px-4 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <>
              <div role="tablist" aria-label="Tipo de acceso" className="mt-6 grid grid-cols-2 border border-outline-variant">
                <button type="button" role="tab" aria-selected={mode === 'sign-in'} onClick={() => { setMode('sign-in'); setNotice(''); setError(''); }} className={`min-h-10 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${mode === 'sign-in' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}>
                  Iniciar sesión
                </button>
                <button type="button" role="tab" aria-selected={mode === 'sign-up'} onClick={() => { setMode('sign-up'); setNotice(''); setError(''); }} className={`min-h-10 border-l border-outline-variant font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${mode === 'sign-up' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}>
                  Crear cuenta
                </button>
              </div>

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
                {mode === 'sign-up' && (
                  <div>
                    <label htmlFor="auth-display-name" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nombre</label>
                    <input id="auth-display-name" name="displayName" autoComplete="name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
                  <input id="auth-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                </div>
                <div>
                  <label htmlFor="auth-password" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contraseña</label>
                  <input id="auth-password" name="password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                </div>
                <button type="submit" disabled={submitting} className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 bg-primary-container px-4 font-mono text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-60">
                  {mode === 'sign-in' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {submitting ? 'Procesando...' : mode === 'sign-in' ? 'Acceder' : 'Crear cuenta'}
                </button>
                {notice && <p role="status" className="border border-emerald-300/40 bg-emerald-950/20 p-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-emerald-100">{notice}</p>}
                {error && <p role="alert" className="border border-red-400/50 bg-red-950/25 p-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-red-200">{error}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}