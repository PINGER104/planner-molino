import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
type RealtimeCallback = (payload: { eventType: RealtimeEvent; new: Record<string, unknown>; old: Record<string, unknown> }) => void;

interface RealtimeSubscription {
  table: string;
  callback: RealtimeCallback;
}

interface RealtimeContextType {
  subscribe: (table: string, callback: RealtimeCallback) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const subscribersRef = useRef<Map<string, Set<RealtimeCallback>>>(new Map());

  // Setup channels when authenticated
  useEffect(() => {
    if (!session) return;

    const tables = ['prenotazioni', 'dati_carico', 'clienti', 'trasportatori'];

    tables.forEach(table => {
      const channel = supabase
        .channel(`public:${table}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            const subscribers = subscribersRef.current.get(table);
            if (subscribers) {
              subscribers.forEach(cb => cb({
                eventType: payload.eventType as RealtimeEvent,
                new: payload.new as Record<string, unknown>,
                old: payload.old as Record<string, unknown>,
              }));
            }
          }
        )
        .subscribe();

      channelsRef.current.set(table, channel);
    });

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [session]);

  const subscribe = (table: string, callback: RealtimeCallback): (() => void) => {
    if (!subscribersRef.current.has(table)) {
      subscribersRef.current.set(table, new Set());
    }
    subscribersRef.current.get(table)!.add(callback);

    return () => {
      subscribersRef.current.get(table)?.delete(callback);
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
