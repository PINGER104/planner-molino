import { useEffect } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';

/**
 * Hook to subscribe to realtime changes on a specific table.
 * Usage: useRealtimeSubscription('prenotazioni', { onInsert, onUpdate, onDelete })
 */
export function useRealtimeSubscription(
  table: string,
  handlers: {
    onInsert?: (record: Record<string, unknown>) => void;
    onUpdate?: (record: Record<string, unknown>, old: Record<string, unknown>) => void;
    onDelete?: (old: Record<string, unknown>) => void;
  }
) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe(table, (payload) => {
      switch (payload.eventType) {
        case 'INSERT':
          handlers.onInsert?.(payload.new);
          break;
        case 'UPDATE':
          handlers.onUpdate?.(payload.new, payload.old);
          break;
        case 'DELETE':
          handlers.onDelete?.(payload.old);
          break;
      }
    });

    return unsubscribe;
  }, [table, subscribe]); // Don't include handlers to avoid infinite loops
}
