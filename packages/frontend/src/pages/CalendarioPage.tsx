import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CalendarView from '../components/calendario/CalendarView';
import CalendarSidebar from '../components/calendario/CalendarSidebar';
import EventPopup from '../components/calendario/EventPopup';
import ExportDialog from '../components/calendario/ExportDialog';
import { useCalendar } from '../hooks/useCalendar';
import type { CalendarEvent } from '../hooks/useCalendar';
import { prenotazioniService } from '../services';

export default function CalendarioPage() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Derive tipologia from route
  const tipologia = location.pathname.startsWith('/consegne') ? 'consegna' : 'produzione';
  const titoloSezione = tipologia === 'consegna' ? 'Consegne' : 'Produzione';

  const calendarRef = useRef<FullCalendar | null>(null);
  const { events, loading, fetchEvents, refetch } = useCalendar(tipologia);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Event popup state
  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null);

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);

  // Confirm dialog for drag & drop
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Current visible date range for refetching
  const currentRangeRef = useRef<{ start: string; end: string } | null>(null);

  const handleDatesSet = useCallback(
    (info: DatesSetArg) => {
      const start = format(info.start, 'yyyy-MM-dd');
      const end = format(info.end, 'yyyy-MM-dd');
      currentRangeRef.current = { start, end };
      fetchEvents(start, end);
    },
    [fetchEvents]
  );

  const handleEventClick = useCallback((info: EventClickArg) => {
    const event = info.event;
    const calEvent: CalendarEvent = {
      id: parseInt(event.id),
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor,
      extendedProps: event.extendedProps as Record<string, unknown>,
    };
    setPopupEvent(calEvent);
    setPopupAnchor(info.el);
  }, []);

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const event = info.event;
      const newStart = event.start;
      const newEnd = event.end;
      if (!newStart) {
        info.revert();
        return;
      }
      setConfirmDialog({
        open: true,
        title: 'Spostare prenotazione?',
        message: `Vuoi spostare la prenotazione al ${format(newStart, 'dd/MM/yyyy HH:mm')}?`,
        onConfirm: async () => {
          try {
            await prenotazioniService.update(parseInt(event.id), {
              data_pianificata: format(newStart, 'yyyy-MM-dd'),
              ora_inizio_prevista: format(newStart, 'HH:mm'),
              ...(newEnd ? { ora_fine_prevista: format(newEnd, 'HH:mm') } : {}),
            });
            setSnackbar({ open: true, message: 'Prenotazione spostata', severity: 'success' });
            if (currentRangeRef.current) {
              refetch(currentRangeRef.current.start, currentRangeRef.current.end);
            }
          } catch {
            info.revert();
            setSnackbar({ open: true, message: 'Errore nello spostamento', severity: 'error' });
          }
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
      // Revert if user cancels - handled via the dialog cancel
    },
    [refetch]
  );

  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const event = info.event;
      const newEnd = event.end;
      if (!newEnd || !event.start) {
        info.revert();
        return;
      }
      setConfirmDialog({
        open: true,
        title: 'Modificare durata?',
        message: `Vuoi aggiornare la fine a ${format(newEnd, 'HH:mm')}?`,
        onConfirm: async () => {
          try {
            await prenotazioniService.update(parseInt(event.id), {
              ora_fine_prevista: format(newEnd, 'HH:mm'),
            });
            setSnackbar({ open: true, message: 'Durata aggiornata', severity: 'success' });
            if (currentRangeRef.current) {
              refetch(currentRangeRef.current.start, currentRangeRef.current.end);
            }
          } catch {
            info.revert();
            setSnackbar({ open: true, message: 'Errore nella modifica', severity: 'error' });
          }
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [refetch]
  );

  const handleCambioStato = useCallback(
    async (eventId: number, nuovoStato: string) => {
      try {
        await prenotazioniService.cambioStato(eventId, nuovoStato);
        setSnackbar({ open: true, message: 'Stato aggiornato', severity: 'success' });
        if (currentRangeRef.current) {
          refetch(currentRangeRef.current.start, currentRangeRef.current.end);
        }
      } catch {
        setSnackbar({ open: true, message: 'Errore nel cambio stato', severity: 'error' });
      }
    },
    [refetch]
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const calApi = calendarRef.current?.getApi();
      if (calApi) {
        calApi.gotoDate(date);
        calApi.changeView('timeGridDay');
      }
    },
    []
  );

  const sidebarContent = useMemo(
    () => (
      <CalendarSidebar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        events={events}
        tipologia={tipologia}
      />
    ),
    [selectedDate, handleDateChange, events, tipologia]
  );

  return (
    <Box>
      <PageHeader
        title={`Calendario ${titoloSezione}`}
        action={
          isMobile ? (
            <IconButton onClick={() => setSidebarOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : undefined
        }
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <CalendarView
          events={events}
          loading={loading}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDatesSet={handleDatesSet}
          onExportClick={() => setExportOpen(true)}
          calendarRef={calendarRef}
        />

        {/* Desktop sidebar */}
        {!isMobile && sidebarContent}

        {/* Mobile sidebar drawer */}
        {isMobile && (
          <Drawer
            anchor="right"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            PaperProps={{ sx: { p: 2, width: 300 } }}
          >
            {sidebarContent}
          </Drawer>
        )}
      </Box>

      {/* Event popup */}
      <EventPopup
        event={popupEvent}
        anchorEl={popupAnchor}
        onClose={() => {
          setPopupEvent(null);
          setPopupAnchor(null);
        }}
        onCambioStato={handleCambioStato}
        tipologia={tipologia}
      />

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        tipologia={tipologia}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          // Refetch to revert visual changes
          if (currentRangeRef.current) {
            refetch(currentRangeRef.current.start, currentRangeRef.current.end);
          }
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
