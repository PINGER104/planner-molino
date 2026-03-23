import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  LinearProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isAfter, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import StatoBadge from '../common/StatoBadge';
import { COLORI_STATO, LABELS_STATO } from '@planner-molino/shared';
import type { CalendarEvent } from '../../hooks/useCalendar';

interface CalendarSidebarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  tipologia: string;
}

// Custom day renderer with dot for days that have events
function EventDay(
  props: PickersDayProps<Date> & { eventDays?: Set<string> }
) {
  const { eventDays, day, ...other } = props;
  const dayStr = format(day, 'yyyy-MM-dd');
  const hasEvent = eventDays?.has(dayStr);

  return (
    <Box sx={{ position: 'relative' }}>
      <PickersDay day={day} {...other} />
      {hasEvent && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: '#3B6FD4',
          }}
        />
      )}
    </Box>
  );
}

export default function CalendarSidebar({
  selectedDate,
  onDateChange,
  events,
  tipologia,
}: CalendarSidebarProps) {
  const navigate = useNavigate();
  const basePath = tipologia === 'consegna' ? '/consegne' : '/produzione';

  // Days with events
  const eventDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach((e) => {
      const d = e.start.substring(0, 10);
      days.add(d);
    });
    return days;
  }, [events]);

  // Stats for selected date
  const stats = useMemo(() => {
    const today = selectedDate || new Date();
    const dayEvents = events.filter((e) =>
      isSameDay(parseISO(e.start), today)
    );
    const pianificate = dayEvents.filter(
      (e) => (e.extendedProps?.stato as string) === 'pianificato'
    ).length;
    const inCorso = dayEvents.filter((e) => {
      const stato = e.extendedProps?.stato as string;
      return (
        stato &&
        stato !== 'pianificato' &&
        stato !== 'completato' &&
        stato !== 'partito' &&
        stato !== 'annullato'
      );
    }).length;
    const completate = dayEvents.filter((e) => {
      const stato = e.extendedProps?.stato as string;
      return stato === 'completato' || stato === 'partito';
    }).length;
    const totale = dayEvents.length;
    return { pianificate, inCorso, completate, totale };
  }, [events, selectedDate]);

  // Prossimi eventi (next 5 upcoming from now)
  const prossimiEventi = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => isAfter(parseISO(e.start), now))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5);
  }, [events]);

  // Legenda
  const statiLegenda = useMemo(() => {
    return Object.entries(COLORI_STATO).map(([key, color]) => ({
      key,
      label: LABELS_STATO[key] || key,
      color,
    }));
  }, []);

  const progressPercent =
    stats.totale > 0
      ? Math.round(((stats.completate) / stats.totale) * 100)
      : 0;

  return (
    <Box sx={{ width: 280, flexShrink: 0 }}>
      <Stack spacing={2}>
        {/* Mini Calendar */}
        <Card variant="outlined">
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <DateCalendar
              value={selectedDate}
              onChange={(date) => date && onDateChange(date)}
              slots={{
                day: EventDay as React.ComponentType<PickersDayProps<Date>>,
              }}
              slotProps={{
                day: { eventDays } as Record<string, unknown>,
              }}
              sx={{
                width: '100%',
                '& .MuiPickersCalendarHeader-root': { px: 0 },
              }}
            />
          </CardContent>
        </Card>

        {/* Statistiche */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Statistiche {selectedDate ? format(selectedDate, 'dd/MM', { locale: it }) : 'oggi'}
            </Typography>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Pianificate
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats.pianificate}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  In corso
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats.inCorso}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Completate
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats.completate}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600}>
                  Totale
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats.totale}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary" align="right">
                {progressPercent}% completate
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Prossimi Eventi */}
        <Card variant="outlined">
          <CardContent sx={{ pb: 0 }}>
            <Typography variant="subtitle2" gutterBottom>
              Prossimi eventi
            </Typography>
          </CardContent>
          {prossimiEventi.length === 0 ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nessun evento imminente
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {prossimiEventi.map((ev) => (
                <ListItemButton
                  key={ev.id}
                  onClick={() => navigate(`${basePath}/prenotazioni/${ev.id}`)}
                  sx={{ px: 2 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {(ev.extendedProps?.codice_prenotazione as string) || ''}
                        </Typography>
                        <StatoBadge stato={(ev.extendedProps?.stato as string) || ''} />
                      </Stack>
                    }
                    secondary={format(parseISO(ev.start), 'dd/MM HH:mm', { locale: it })}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Card>

        {/* Legenda */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Legenda
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {statiLegenda.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  size="small"
                  sx={{
                    backgroundColor: s.color,
                    color: '#fff',
                    fontSize: '0.7rem',
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
