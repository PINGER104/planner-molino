import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SezioneAbilitata } from '../types';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  canModify: boolean;
  hasSection: (section: SezioneAbilitata) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

async function fetchProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('utenti')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) {
      console.warn('fetchProfile failed:', error?.message || 'No profile found');
      return null;
    }
    return data as User;
  } catch (err) {
    console.warn('fetchProfile exception:', err);
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialDone = false;

    // Attach listener BEFORE getSession to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        // Skip duplicate processing during initial load
        if (!initialDone) return;
        setSession(newSession);
        if (newSession?.user) {
          const profile = await fetchProfile(newSession.user.id);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      }
    );

    // Get initial session — unlock loading ASAP, then fetch profile in background
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      initialDone = true;
      setSession(s);

      if (s?.user) {
        // Unlock loading immediately so the page renders while profile loads
        setIsLoading(false);
        const profile = await fetchProfile(s.user.id);
        if (mounted) setUser(profile);
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      initialDone = true;
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Set profile immediately for instant UI response
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(profile);

      // Update last access in background (fire-and-forget, non-blocking)
      supabase
        .from('utenti')
        .update({ ultimo_accesso: new Date().toISOString() })
        .eq('id', data.user.id)
        .then(() => {});
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const canModify = user?.livello_accesso === 'modifica';

  const hasSection = useCallback(
    (section: SezioneAbilitata) => {
      return user?.sezioni_abilitate?.includes(section) || false;
    },
    [user]
  );

  // Allow access with just a valid session — profile loads in background.
  // This means pages render faster; features that depend on user profile
  // (canModify, hasSection) will update once the profile arrives.
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session,
    isLoading,
    login,
    logout,
    canModify,
    hasSection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
