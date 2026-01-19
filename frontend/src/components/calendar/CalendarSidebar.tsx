import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  CheckCircle,
  Cancel,
  PlayArrow,
  AccessTime,
  CalendarToday,
  FiberManualRecord,
} from '@mui/icons-material';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { it } from 'date-fns/locale/it';

import MiniCalendar from './MiniCalendar';
import { Prenotazione, TipologiaPrenotazione } from '../../types';
import { COLORI_STATO, COLORI_CATEGORIA, LABEL_STATO, LABEL_CATEGORIA } from '../../utils/statiConfig';

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  prenotazioni: Prenotazione[];
  tipologia: TipologiaPrenotazione;
  onEventClick?: (prenotazione: Prenotazione) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  selectedDate,
  onDateSelect,
  prenotazioni,
  tipologia,
  onEventClick,
}) => {
  // Count events per date for mini calendar
  const eventsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    prenotazioni.forEach((p) => {
      const dateKey = p.data_pianificata;
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [prenotazioni]);

  // Statistics
  const stats = useMemo(() => {
    const total = prenotazioni.length;
    const pianificate = prenotazioni.filter((p) => p.stato === 'pianificato').length;
    const inCorso = prenotazioni.filter((p) =>
      ['preso_in_carico', 'in_produzione', 'in_preparazione', 'pronto_carico', 'in_carico'].includes(p.stato)
    ).length;
    const completate = prenotazioni.filter((p) =>
      ['completato', 'caricato', 'partito'].includes(p.stato)
    ).length;
    const annullate = prenotazioni.filter((p) => p.stato === 'annullato').length;

    const completionRate = total > 0 ? Math.round((completate / total) * 100) : 0;

    return { total, pianificate, inCorso, completate, annullate, completionRate };
  }, [prenotazioni]);

  // Upcoming events (today and tomorrow)
  const upcomingEvents = useMemo(() => {
    return prenotazioni
      .filter((p) => {
        const date = parseISO(p.data_pianificata);
        return (isToday(date) || isTomorrow(date)) && !['completato', 'partito', 'caricato', 'annullato'].includes(p.stato);
      })
      .sort((a, b) => {
        const dateA = `${a.data_pianificata}T${a.ora_inizio_prevista || '00:00'}`;
        const dateB = `${b.data_pianificata}T${b.ora_inizio_prevista || '00:00'}`;
        return dateA.localeCompare(dateB);
      })
      .slice(0, 5);
  }, [prenotazioni]);

  // Stati for legend
  const statiProduzione = ['pianificato', 'preso_in_carico', 'in_produzione', 'completato', 'annullato'];
  const statiConsegna = ['pianificato', 'preso_in_carico', 'in_preparazione', 'pronto_carico', 'in_carico', 'caricato', 'partito', 'annullato'];
  const stati = tipologia === 'produzione' ? statiProduzione : statiConsegna;
  const categorie = Object.keys(COLORI_CATEGORIA);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* Mini Calendar */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Calendario
              </Typography>
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            <MiniCalendar
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              eventsCount={eventsCount}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Riepilogo Periodo
              </Typography>
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            {/* Progress Bar */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Completamento
                </Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">
                  {stats.completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.completionRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  },
                }}
              />
            </Box>

            {/* Stats Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.100',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {stats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Totale
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'info.50',
                  border: '1px solid',
                  borderColor: 'info.100',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 16, color: 'info.main' }} />
                  <Typography variant="h6" fontWeight={700} color="info.main">
                    {stats.pianificate}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Pianificate
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'warning.50',
                  border: '1px solid',
                  borderColor: 'warning.100',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <PlayArrow sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    {stats.inCorso}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  In corso
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'success.50',
                  border: '1px solid',
                  borderColor: 'success.100',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {stats.completate}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Completate
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ fontSize: 18, color: 'warning.main' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Prossime Prenotazioni
                </Typography>
              </Box>
            </Box>
            <List disablePadding>
              {upcomingEvents.map((event, index) => {
                const eventDate = parseISO(event.data_pianificata);
                const dateLabel = isToday(eventDate) ? 'Oggi' : 'Domani';
                const isLast = index === upcomingEvents.length - 1;

                return (
                  <ListItem
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      cursor: 'pointer',
                      borderBottom: isLast ? 'none' : '1px solid',
                      borderColor: 'divider',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: COLORI_STATO[event.stato],
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {event.codice_prenotazione}
                          </Typography>
                          <Chip
                            label={dateLabel}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              bgcolor: isToday(eventDate) ? 'error.100' : 'grey.200',
                              color: isToday(eventDate) ? 'error.dark' : 'text.secondary',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {event.ora_inizio_prevista?.substring(0, 5)} • {event.prodotto_descrizione || 'N/D'}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Legenda
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {/* Stati */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              STATI
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {stati.slice(0, 5).map((stato) => (
                <Chip
                  key={stato}
                  size="small"
                  icon={
                    <FiberManualRecord
                      sx={{ fontSize: '10px !important', color: `${COLORI_STATO[stato]} !important` }}
                    />
                  }
                  label={LABEL_STATO[stato]}
                  sx={{
                    fontSize: '0.65rem',
                    height: 22,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                />
              ))}
            </Box>

            {/* Categorie */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              CATEGORIE PRODOTTO
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {categorie.map((categoria) => (
                <Box
                  key={categoria}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 16,
                      borderRadius: 0.5,
                      bgcolor: COLORI_CATEGORIA[categoria],
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {LABEL_CATEGORIA[categoria]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarSidebar;
