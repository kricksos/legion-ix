import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type MemberStatus = 'pending' | 'approved' | 'rejected' | null;

interface AuthContextValue {
  user: User | null;
  displayName: string;
  isAdmin: boolean;
  memberStatus: MemberStatus;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [roleLoading, setRoleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberStatus, setMemberStatus] = useState<MemberStatus>(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthLoading(false);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('No se pudo recuperar la sesión:', error);
      setSession(data.session);
      setAuthLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error('No se pudo recuperar la sesión:', error);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user.id) {
      setIsAdmin(false);
      setMemberStatus(null);
      setDisplayName('');
      setRoleLoading(false);
      return;
    }

    let active = true;
    setIsAdmin(false);
    setMemberStatus(null);
    setRoleLoading(true);

    void Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('membership_status,display_name')
        .eq('id', session.user.id)
        .maybeSingle(),
    ]).then(([roleResult, profileResult]) => {
      if (!active) return;
      if (roleResult.error) console.error('No se pudo comprobar el rol:', roleResult.error);
      if (profileResult.error) console.error('No se pudo comprobar la aprobación de miembro:', profileResult.error);
      setIsAdmin(!roleResult.error && roleResult.data?.role === 'admin');
      setMemberStatus(profileResult.error ? null : profileResult.data?.membership_status ?? null);
      setDisplayName(profileResult.error ? String(session.user.user_metadata.display_name ?? '') : profileResult.data?.display_name ?? '');
      setRoleLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error('No se pudo cargar el perfil de la sesión:', error);
      setRoleLoading(false);
    });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (displayName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return !data.session;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateDisplayName = (nextDisplayName: string) => {
    setDisplayName(nextDisplayName);
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      displayName,
      isAdmin,
      memberStatus,
      loading: authLoading || roleLoading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}