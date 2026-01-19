import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Drawer,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  Card,
  CardContent,
  ButtonGroup,
  Menu,
  MenuItem,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Close,
  Edit,
  ArrowForward,
  FileDownload,
  CalendarViewMonth,
  CalendarViewWeek,
  CalendarViewDay,
  Today,
  ChevronLeft,
  ChevronRight,
  Refresh,
  Menu as MenuIcon,
  MoreVert,
  Print,
  TableChart,
  Event,
  AccessTime,
  Person,
  LocalShipping,
  Inventory2,
  Schedule,
  CheckCircle,
  PlayArrow,
  PendingActions,
  Cancel,
  Share,
  FilterList,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO, addDays } from 'date-fns';
import { it } from 'date-fns/locale/it';

import { prenotazioniApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CalendarEvent, Prenotazione, TipologiaPrenotazione } from '../types';
import { LoadingSpinner } from '../components/common';
import { CalendarSidebar, ExportDialog, EditSlotDialog } from '../components/calendar';
import {
  COLORI_STATO,
  COLORI_CATEGORIA,
  LABEL_CATEGORIA,
  LABEL_STATO,
  getContrastColor,
} from '../utils/statiConfig';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const Calendario: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { canModify } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const tipologia: TipologiaPrenotazione = section === 'produzione' ? 'produzione' : 'consegna';

  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allPrenotazioni, setAllPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Prenotazione | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile && !isTablet);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [currentView, setCurrentView] = useState<CalendarView>('timeGridWeek');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [calendarRef, setCalendarRef] = useState<FullCalendar | null>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [editSlotDialogOpen, setEditSlotDialogOpen] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const total = allPrenotazioni.length;
    const pianificate = allPrenotazioni.filter((p) => p.stato === 'pianificato').length;
    const inCorso = allPrenotazioni.filter((p) =>
      ['preso_in_carico', 'in_produzione', 'in_preparazione', 'pronto_carico', 'in_carico'].includes(p.stato)
    ).length;
    const completate = allPrenotazioni.filter((p) =>
      ['completato', 'caricato', 'partito'].includes(p.stato)
    ).length;
    const annullate = allPrenotazioni.filter((p) => p.stato === 'annullato').length;

    return { total, pianificate, inCorso, completate, annullate };
  }, [allPrenotazioni]);

  // Load events
  const loadEvents = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await prenotazioniApi.getCalendario({
        tipologia,
        data_da: start,
        data_a: end,
      });
      setEvents(response.data.data);
      const prenotazioni = response.data.data.map((e: CalendarEvent) => e.extendedProps);
      setAllPrenotazioni(prenotazioni);
    } catch (err) {
      setError('Errore nel caricamento delle prenotazioni');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tipologia]);

  useEffect(() => {
    if (currentDateRange.start && currentDateRange.end) {
      loadEvents(currentDateRange.start, currentDateRange.end);
    }
  }, [currentDateRange, loadEvents]);

  // Calendar navigation handlers
  const handleDatesSet = (arg: { startStr: string; endStr: string; view: { type: string } }) => {
    setCurrentDateRange({
      start: arg.startStr.split('T')[0],
      end: arg.endStr.split('T')[0],
    });
    setCurrentView(arg.view.type as CalendarView);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.extendedProps as Prenotazione);
    setDrawerOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateClick = (info: any) => {
    if (canModify) {
      navigate(`/${section}/prenotazioni/nuova?data=${info.dateStr}`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventDrop = async (info: any) => {
    if (!canModify) {
      info.revert();
      setSnackbar({
        open: true,
        message: 'Non hai i permessi per modificare le prenotazioni',
        severity: 'error',
      });
      return;
    }

    // Check if the booking is in a final state
    const prenotazione = info.event.extendedProps as Prenotazione;
    if (['completato', 'partito', 'annullato'].includes(prenotazione.stato)) {
      info.revert();
      setSnackbar({
        open: true,
        message: `Non è possibile spostare una prenotazione in stato "${LABEL_STATO[prenotazione.stato]}"`,
        severity: 'error',
      });
      return;
    }

    try {
      const newDate = info.event.startStr.split('T')[0];
      const newTime = info.event.startStr.split('T')[1]?.substring(0, 5) || '08:00';

      await prenotazioniApi.update(parseInt(info.event.id), {
        data_pianificata: newDate,
        ora_inizio_prevista: newTime,
      });

      setSnackbar({
        open: true,
        message: `Prenotazione ${prenotazione.codice_prenotazione} spostata al ${format(parseISO(newDate), 'dd/MM/yyyy', { locale: it })} alle ${newTime}`,
        severity: 'success',
      });

      if (currentDateRange.start && currentDateRange.end) {
        loadEvents(currentDateRange.start, currentDateRange.end);
      }
    } catch (err: any) {
      info.revert();
      const errorMessage = err?.response?.data?.error || 'Errore nello spostamento della prenotazione';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleMiniCalendarDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (calendarRef) {
      const api = calendarRef.getApi();
      api.gotoDate(date);
    }
  };

  const handleViewChange = (newView: CalendarView) => {
    if (calendarRef) {
      const api = calendarRef.getApi();
      api.changeView(newView);
      setCurrentView(newView);
    }
  };

  const handleToday = () => {
    if (calendarRef) {
      const api = calendarRef.getApi();
      api.today();
      setSelectedDate(new Date());
    }
  };

  const handlePrev = () => {
    if (calendarRef) {
      const api = calendarRef.getApi();
      api.prev();
    }
  };

  const handleNext = () => {
    if (calendarRef) {
      const api = calendarRef.getApi();
      api.next();
    }
  };

  const handleRefresh = () => {
    if (currentDateRange.start && currentDateRange.end) {
      loadEvents(currentDateRange.start, currentDateRange.end);
    }
  };

  // Event rendering
  const getEventColor = (event: CalendarEvent) => {
    const stato = event.extendedProps.stato;
    return COLORI_STATO[stato] || '#6B7280';
  };

  const getEventBorderColor = (event: CalendarEvent) => {
    const categoria = event.extendedProps.categoria_prodotto;
    return categoria ? COLORI_CATEGORIA[categoria] : undefined;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  };

  // Current period title
  const periodTitle = useMemo(() => {
    if (!currentDateRange.start) return '';
    try {
      const start = parseISO(currentDateRange.start);
      if (currentView === 'dayGridMonth') {
        return format(start, 'MMMM yyyy', { locale: it });
      } else if (currentView === 'timeGridDay') {
        return format(start, 'EEEE dd MMMM yyyy', { locale: it });
      } else {
        const end = parseISO(currentDateRange.end);
        return `${format(start, 'dd MMM', { locale: it })} - ${format(addDays(end, -1), 'dd MMM yyyy', { locale: it })}`;
      }
    } catch {
      return '';
    }
  }, [currentDateRange, currentView]);

  const viewLabels: Record<CalendarView, string> = {
    dayGridMonth: 'Mese',
    timeGridWeek: 'Settimana',
    timeGridDay: 'Giorno',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: 0 }}>
      {/* ========== PAGE HEADER ========== */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 2.5,
          mb: 2,
          borderRadius: 3,
          background: tipologia === 'produzione'
            ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e3a8a 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #5b21b6 100%)',
          color: 'white',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.4,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          {/* Title Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 48,
                height: 48,
              }}
            >
              <Event sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Calendario {tipologia === 'produzione' ? 'Produzione' : 'Consegne'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Gestione e pianificazione prenotazioni
              </Typography>
            </Box>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Totale</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.3)', display: { xs: 'none', md: 'block' } }} />
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
              <Chip
                icon={<Schedule sx={{ color: 'inherit !important' }} />}
                label={`${stats.pianificate} Pianificate`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
              <Chip
                icon={<PlayArrow sx={{ color: 'inherit !important' }} />}
                label={`${stats.inCorso} In corso`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
              <Chip
                icon={<CheckCircle sx={{ color: 'inherit !important' }} />}
                label={`${stats.completate} Completate`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ========== TOOLBAR ========== */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          mb: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          {/* Left: Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Sidebar Toggle */}
            <Tooltip title={sidebarOpen ? 'Nascondi pannello laterale' : 'Mostra pannello laterale'}>
              <IconButton
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{
                  bgcolor: sidebarOpen ? 'primary.50' : 'transparent',
                  '&:hover': { bgcolor: 'primary.100' },
                }}
              >
                <MenuIcon color={sidebarOpen ? 'primary' : 'inherit'} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Date Navigation */}
            <ButtonGroup variant="outlined" size="small">
              <Button onClick={handlePrev} sx={{ minWidth: 36 }}>
                <ChevronLeft />
              </Button>
              <Button onClick={handleToday} startIcon={<Today />}>
                Oggi
              </Button>
              <Button onClick={handleNext} sx={{ minWidth: 36 }}>
                <ChevronRight />
              </Button>
            </ButtonGroup>

            {/* Period Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                ml: 2,
                textTransform: 'capitalize',
                color: 'text.primary',
                display: { xs: 'none', md: 'block' },
              }}
            >
              {periodTitle}
            </Typography>
          </Box>

          {/* Center: View Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={currentView}
              exclusive
              onChange={(_, v) => v && handleViewChange(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                },
                '& .Mui-selected': {
                  bgcolor: 'primary.main !important',
                  color: 'white !important',
                },
              }}
            >
              <ToggleButton value="dayGridMonth">
                <CalendarViewMonth sx={{ mr: 0.5, fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Mese</Box>
              </ToggleButton>
              <ToggleButton value="timeGridWeek">
                <CalendarViewWeek sx={{ mr: 0.5, fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Settimana</Box>
              </ToggleButton>
              <ToggleButton value="timeGridDay">
                <CalendarViewDay sx={{ mr: 0.5, fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Giorno</Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Refresh */}
            <Tooltip title="Aggiorna dati">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* EXPORT BUTTON - Always visible */}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FileDownload />}
              onClick={() => setExportDialogOpen(true)}
              sx={{
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'primary.50',
                },
              }}
            >
              Esporta
            </Button>

            {/* New Prenotazione */}
            {canModify && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => navigate(`/${section}/prenotazioni/nuova`)}
                sx={{
                  fontWeight: 600,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                Nuova Prenotazione
              </Button>
            )}

            {/* More Menu */}
            <Tooltip title="Altre opzioni">
              <IconButton onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
                <MoreVert />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={moreMenuAnchor}
              open={Boolean(moreMenuAnchor)}
              onClose={() => setMoreMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setExportDialogOpen(true); setMoreMenuAnchor(null); }}>
                <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
                <ListItemText>Esporta Calendario</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setMoreMenuAnchor(null); }}>
                <ListItemIcon><Print fontSize="small" /></ListItemIcon>
                <ListItemText>Stampa</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleRefresh(); setMoreMenuAnchor(null); }}>
                <ListItemIcon><Refresh fontSize="small" /></ListItemIcon>
                <ListItemText>Aggiorna</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      {/* ========== MAIN CONTENT ========== */}
      <Box sx={{ display: 'flex', flex: 1, gap: 2, minHeight: 0 }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <Box
            sx={{
              width: 300,
              flexShrink: 0,
              display: { xs: 'none', md: 'block' },
              overflowY: 'auto',
            }}
          >
            <CalendarSidebar
              selectedDate={selectedDate}
              onDateSelect={handleMiniCalendarDateSelect}
              prenotazioni={allPrenotazioni}
              tipologia={tipologia}
              onEventClick={(p) => {
                setSelectedEvent(p);
                setDrawerOpen(true);
              }}
            />
          </Box>
        )}

        {/* Calendar Container */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Loading Bar */}
          {loading && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
              }}
            />
          )}

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ borderRadius: 0 }}
            >
              {error}
            </Alert>
          )}

          {/* Calendar */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflow: 'hidden',
              position: 'relative',
              '& .fc': {
                fontFamily: theme.typography.fontFamily,
                height: '100%',
              },
              '& .fc-toolbar': {
                display: 'none !important',
              },
              '& .fc-view-harness': {
                height: '100% !important',
              },
              '& .fc-timegrid-slot': {
                height: '48px',
              },
              '& .fc-timegrid-slot-label': {
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
              },
              '& .fc-col-header': {
                backgroundColor: theme.palette.grey[50],
              },
              '& .fc-col-header-cell': {
                padding: '12px 8px',
                borderBottom: `2px solid ${theme.palette.primary.main}`,
              },
              '& .fc-col-header-cell-cushion': {
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
                textTransform: 'capitalize',
              },
              '& .fc-daygrid-day': {
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              },
              '& .fc-daygrid-day-number': {
                padding: '8px 12px',
                fontWeight: 500,
                fontSize: '0.875rem',
              },
              '& .fc-day-today': {
                backgroundColor: `${theme.palette.primary.main}08 !important`,
              },
              '& .fc-day-today .fc-daygrid-day-number': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              },
              '& .fc-timegrid-now-indicator-line': {
                borderColor: theme.palette.error.main,
                borderWidth: 2,
              },
              '& .fc-timegrid-now-indicator-arrow': {
                borderColor: theme.palette.error.main,
              },
              '& .fc-event': {
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: theme.shadows[4],
                  zIndex: 10,
                },
              },
              '& .fc-timegrid-event': {
                borderRadius: '8px',
              },
              '& .fc-daygrid-event': {
                marginTop: '3px',
                marginBottom: '1px',
              },
              '& .fc-daygrid-more-link': {
                fontWeight: 600,
                color: theme.palette.primary.main,
                fontSize: '0.75rem',
              },
              '& .fc-scrollgrid': {
                borderColor: theme.palette.divider,
                borderRadius: '8px',
                overflow: 'hidden',
              },
              '& .fc-scrollgrid td, & .fc-scrollgrid th': {
                borderColor: theme.palette.divider,
              },
            }}
          >
            {loading && events.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <LoadingSpinner />
              </Box>
            ) : (
              <FullCalendar
                ref={(ref) => setCalendarRef(ref)}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={currentView}
                headerToolbar={false}
                locale="it"
                firstDay={1}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                slotDuration="00:30:00"
                slotLabelInterval="01:00:00"
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }}
                allDaySlot={false}
                events={events}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                eventDrop={handleEventDrop}
                editable={canModify}
                droppable={canModify}
                datesSet={handleDatesSet}
                dayMaxEvents={4}
                moreLinkText={(num) => `+${num} altri`}
                nowIndicator={true}
                eventContent={(arg) => {
                  const bgColor = getEventColor(arg.event as unknown as CalendarEvent);
                  const borderColor = getEventBorderColor(arg.event as unknown as CalendarEvent);
                  const textColor = getContrastColor(bgColor);
                  const isMonthView = currentView === 'dayGridMonth';

                  return (
                    <Box
                      sx={{
                        p: isMonthView ? 0.5 : 1,
                        borderRadius: 1,
                        backgroundColor: bgColor,
                        borderLeft: borderColor ? `4px solid ${borderColor}` : undefined,
                        color: textColor,
                        overflow: 'hidden',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: isMonthView ? '0.7rem' : '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.3,
                        }}
                      >
                        {arg.event.title}
                      </Typography>
                      {!isMonthView && (
                        <>
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              opacity: 0.9,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              mt: 0.25,
                            }}
                          >
                            {arg.event.extendedProps.prodotto_descrizione || ''}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              opacity: 0.85,
                              fontWeight: 600,
                              mt: 'auto',
                            }}
                          >
                            {arg.event.extendedProps.quantita_prevista}{' '}
                            {arg.event.extendedProps.unita_misura}
                          </Typography>
                        </>
                      )}
                    </Box>
                  );
                }}
                height="100%"
                dayHeaderFormat={{
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* ========== DETAIL DRAWER ========== */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            borderRadius: { sm: '16px 0 0 16px' },
          },
        }}
      >
        {selectedEvent && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${COLORI_STATO[selectedEvent.stato]} 0%, ${COLORI_STATO[selectedEvent.stato]}dd 100%)`,
                color: getContrastColor(COLORI_STATO[selectedEvent.stato]),
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Chip
                    label={selectedEvent.tipologia === 'produzione' ? 'Produzione' : 'Consegna'}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'inherit',
                      fontWeight: 500,
                    }}
                  />
                  <Typography variant="h5" fontWeight={700}>
                    {selectedEvent.codice_prenotazione}
                  </Typography>
                  <Chip
                    label={LABEL_STATO[selectedEvent.stato]}
                    size="small"
                    sx={{
                      mt: 1.5,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      color: COLORI_STATO[selectedEvent.stato],
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    color: 'inherit',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* Drawer Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {/* Date & Time Card */}
              <Card variant="outlined" sx={{ m: 2, borderRadius: 2 }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.main' }}>
                      <AccessTime />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Data e Orario
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {formatDate(selectedEvent.data_pianificata)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(selectedEvent.ora_inizio_prevista)} - {formatTime(selectedEvent.ora_fine_prevista)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Product Card */}
              <Card variant="outlined" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.100', color: 'success.main' }}>
                      <Inventory2 />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Prodotto
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedEvent.prodotto_descrizione || 'N/D'}
                      </Typography>
                      {selectedEvent.categoria_prodotto && (
                        <Chip
                          label={LABEL_CATEGORIA[selectedEvent.categoria_prodotto]}
                          size="small"
                          sx={{
                            mt: 1,
                            bgcolor: `${COLORI_CATEGORIA[selectedEvent.categoria_prodotto]}15`,
                            color: COLORI_CATEGORIA[selectedEvent.categoria_prodotto],
                            fontWeight: 500,
                            border: `1px solid ${COLORI_CATEGORIA[selectedEvent.categoria_prodotto]}40`,
                          }}
                        />
                      )}
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Quantità
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {selectedEvent.quantita_prevista || '-'} {selectedEvent.unita_misura || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Client/Carrier Info */}
              {(selectedEvent.cliente_ragione_sociale || selectedEvent.trasportatore_ragione_sociale) && (
                <Card variant="outlined" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    {selectedEvent.cliente_ragione_sociale && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: selectedEvent.trasportatore_ragione_sociale ? 2 : 0 }}>
                        <Avatar sx={{ bgcolor: 'info.100', color: 'info.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Cliente
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {selectedEvent.cliente_ragione_sociale}
                          </Typography>
                          {selectedEvent.cliente_citta && (
                            <Typography variant="body2" color="text.secondary">
                              {selectedEvent.cliente_citta}
                              {selectedEvent.cliente_provincia && ` (${selectedEvent.cliente_provincia})`}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    {selectedEvent.tipologia === 'consegna' && selectedEvent.trasportatore_ragione_sociale && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'warning.100', color: 'warning.main' }}>
                          <LocalShipping />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Trasportatore
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {selectedEvent.trasportatore_ragione_sociale}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {(selectedEvent.lotto_previsto || selectedEvent.ordine_riferimento || selectedEvent.specifica_w) && (
                <Card variant="outlined" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                      Dettagli Aggiuntivi
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {selectedEvent.specifica_w && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Specifiche</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            W{selectedEvent.specifica_w} (±{selectedEvent.specifica_w_tolleranza || 0})
                            {selectedEvent.specifica_pl && ` / P/L ${selectedEvent.specifica_pl}`}
                          </Typography>
                        </Box>
                      )}
                      {selectedEvent.lotto_previsto && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Lotto</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedEvent.lotto_previsto}</Typography>
                        </Box>
                      )}
                      {selectedEvent.ordine_riferimento && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Ordine</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedEvent.ordine_riferimento}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedEvent.note && (
                <Card variant="outlined" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                      Note
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        p: 1.5,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        fontStyle: 'italic',
                        color: 'text.secondary',
                      }}
                    >
                      {selectedEvent.note}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Drawer Actions */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Stack spacing={1.5}>
                {/* Quick Edit Slot Button */}
                {canModify && !['completato', 'partito', 'annullato'].includes(selectedEvent.stato) && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Schedule />}
                    fullWidth
                    size="large"
                    onClick={() => {
                      setEditSlotDialogOpen(true);
                    }}
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    Modifica Slot
                  </Button>
                )}
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowForward />}
                    fullWidth
                    size="large"
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(`/${section}/prenotazioni/${selectedEvent.id}`);
                    }}
                  >
                    Vedi Dettaglio
                  </Button>
                  {canModify && (
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      fullWidth
                      size="large"
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate(`/${section}/prenotazioni/${selectedEvent.id}/modifica`);
                      }}
                    >
                      Modifica Completa
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ========== EXPORT DIALOG ========== */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        prenotazioni={allPrenotazioni}
        dateRange={currentDateRange}
        tipologia={tipologia}
      />

      {/* ========== EDIT SLOT DIALOG ========== */}
      <EditSlotDialog
        open={editSlotDialogOpen}
        onClose={() => setEditSlotDialogOpen(false)}
        prenotazione={selectedEvent}
        onSuccess={() => {
          setSnackbar({
            open: true,
            message: 'Slot aggiornato con successo',
            severity: 'success',
          });
          if (currentDateRange.start && currentDateRange.end) {
            loadEvents(currentDateRange.start, currentDateRange.end);
          }
        }}
      />

      {/* ========== SNACKBAR FOR FEEDBACK ========== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Global Styles for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default Calendario;
