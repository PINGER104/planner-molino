import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Utente } from '@shared/types';

interface AuthContextType {
  user: Utente | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TIMEOUT_MS = 8000; // Safety timeout to avoid infinite loading

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utente | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('utenti')
        .select('*')
        .eq('id', supabaseUser.id)
        .eq('attivo', true)
        .single();

      if (error || !data) {
        setUser(null);
        return;
      }

      // Update ultimo_accesso
      await supabase
        .from('utenti')
        .update({ ultimo_accesso: new Date().toISOString() })
        .eq('id', supabaseUser.id);

      setUser(data as Utente);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Safety timeout
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, AUTH_TIMEOUT_MS);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        loadProfile(initialSession.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile, loading]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
