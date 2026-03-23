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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StatoBadge from '../common/StatoBadge';
import { COLORI_STATO, LABELS_STATO } from '@planner-molino/shared';
import type { CalendarEvent } from '../../hooks/useCalendar';

interface CalendarSidebarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  tipologia: string;
}

function EventDay(
  props: PickersDayProps & { eventDays?: Set<string> }
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
            backgroundColor: '#C2410C',
          }}
        />
      )}
    </Box>
  );
}

interface StatRingProps {
  value: number;
  total: number;
  color: string;
  label: string;
}

function StatRing({ value, total, color, label }: StatRingProps) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ position: 'relative', width: 56, height: 56, mx: 'auto' }}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={radius} fill="none" stroke="#F5F5F4" strokeWidth="4" />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <Typography
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: '"Sora", sans-serif',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#1C1917',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: '#78716C',
          mt: 0.5,
          display: 'block',
          fontSize: '0.625rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
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

  const eventDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach((e) => {
      const d = e.start.substring(0, 10);
      days.add(d);
    });
    return days;
  }, [events]);

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

  const prossimiEventi = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => isAfter(parseISO(e.start), now))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5);
  }, [events]);

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
    <Box sx={{ width: 300, flexShrink: 0 }}>
      <Stack spacing={2}>
        {/* Mini Calendar */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <DateCalendar
              value={selectedDate}
              onChange={(date) => date && onDateChange(date)}
              slots={{
                day: EventDay as React.ComponentType<PickersDayProps>,
              }}
              slotProps={{
                day: { eventDays } as Record<string, unknown>,
              }}
              sx={{
                width: '100%',
                '& .MuiPickersCalendarHeader-root': { px: 0.5 },
                '& .MuiPickersCalendarHeader-label': {
                  fontFamily: '"Sora", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  fontFamily: '"Sora", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                  color: '#A8A29E',
                },
                '& .MuiPickersDay-root': {
                  fontFamily: '"Figtree", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  '&.Mui-selected': {
                    bgcolor: '#292524',
                    '&:hover': { bgcolor: '#1C1917' },
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Stats rings */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#A8A29E', display: 'block', mb: 1.5, lineHeight: 1 }}
            >
              {selectedDate ? format(selectedDate, 'dd MMMM', { locale: it }) : 'Oggi'}
            </Typography>
            <Stack direction="row" justifyContent="space-around">
              <StatRing value={stats.pianificate} total={stats.totale} color="#2563EB" label="Pianif." />
              <StatRing value={stats.inCorso} total={stats.totale} color="#B45309" label="In corso" />
              <StatRing value={stats.completate} total={stats.totale} color="#15803D" label="Compl." />
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#78716C' }}>
                  Avanzamento
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: '"Sora", sans-serif',
                    fontWeight: 700,
                    color: '#1C1917',
                  }}
                >
                  {progressPercent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#F5F5F4',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#15803D',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Prossimi Eventi */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2, pb: 0, '&:last-child': { pb: 0 } }}>
            <Typography variant="overline" sx={{ color: '#A8A29E', display: 'block', mb: 1, lineHeight: 1 }}>
              Prossimi eventi
            </Typography>
          </CardContent>
          {prossimiEventi.length === 0 ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                Nessun evento imminente
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding sx={{ pb: 1 }}>
              {prossimiEventi.map((ev) => {
                const color = COLORI_STATO[(ev.extendedProps?.stato as string)] || '#A8A29E';
                return (
                  <ListItemButton
                    key={ev.id}
                    onClick={() => navigate(`${basePath}/prenotazioni/${ev.id}`)}
                    sx={{
                      px: 2,
                      py: 0.75,
                      mx: 0.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#FAFAF9' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 3,
                        alignSelf: 'stretch',
                        borderRadius: 1,
                        bgcolor: color,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: '#1C1917',
                          }}
                        >
                          {(ev.extendedProps?.codice_prenotazione as string) || ''}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                          <AccessTimeIcon sx={{ fontSize: 11, color: '#A8A29E' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#78716C',
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.6875rem',
                            }}
                          >
                            {format(parseISO(ev.start), 'dd/MM HH:mm', { locale: it })}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Card>

        {/* Legenda */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="overline" sx={{ color: '#A8A29E', display: 'block', mb: 1, lineHeight: 1 }}>
              Legenda stati
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
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    height: 22,
                    '& .MuiChip-label': { px: 1 },
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
