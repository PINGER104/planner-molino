import { useState, useCallback, useRef } from 'react';
import { prenotazioniService } from '../services';

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: Record<string, unknown>;
}

interface DateRange {
  start: string;
  end: string;
}

export function useCalendar(tipologia: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRangesRef = useRef<DateRange[]>([]);

  const isRangeLoaded = useCallback((start: string, end: string): boolean => {
    return loadedRangesRef.current.some(
      (r) => r.start <= start && r.end >= end
    );
  }, []);

  const fetchEvents = useCallback(
    async (start: string, end: string, force = false) => {
      if (!force && isRangeLoaded(start, end)) return;

      setLoading(true);
      try {
        const data = await prenotazioniService.calendario(start, end, tipologia);
        setEvents((prev) => {
          // Merge new events avoiding duplicates
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = data.filter((e) => !existingIds.has(e.id));
          // Also update existing events that may have changed
          const updatedMap = new Map(data.map((e) => [e.id, e]));
          const merged = prev.map((e) => updatedMap.get(e.id) || e);
          return [...merged, ...newEvents.filter((e) => !updatedMap.has(e.id) || !existingIds.has(e.id))];
        });
        loadedRangesRef.current.push({ start, end });
      } catch (err) {
        console.error('Errore caricamento eventi calendario:', err);
      } finally {
        setLoading(false);
      }
    },
    [tipologia, isRangeLoaded]
  );

  const refetch = useCallback(
    async (start: string, end: string) => {
      loadedRangesRef.current = [];
      setEvents([]);
      await fetchEvents(start, end, true);
    },
    [fetchEvents]
  );

  return { events, loading, fetchEvents, refetch };
}
