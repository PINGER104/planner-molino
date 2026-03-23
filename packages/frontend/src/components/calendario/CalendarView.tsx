import React, { useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import type { EventClickArg, EventDropArg, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { CalendarEvent } from '../../hooks/useCalendar';

import './calendar-styles.css';

interface CalendarViewProps {
  events: CalendarEvent[];
  loading: boolean;
  onEventClick: (info: EventClickArg) => void;
  onEventDrop: (info: EventDropArg) => void;
  onEventResize: (info: EventResizeDoneArg) => void;
  onDatesSet: (info: DatesSetArg) => void;
  onExportClick: () => void;
  calendarRef: React.RefObject<FullCalendar | null>;
}

function darkenColor(hex: string, amount = 30): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function renderEventContent(eventInfo: EventContentArg) {
  const bgColor = eventInfo.event.backgroundColor || '#3B6FD4';
  const ext = eventInfo.event.extendedProps || {};
  const clienteName = (ext.cliente_ragione_sociale as string) || '';
  const isTimeGrid = eventInfo.view.type.includes('timeGrid');

  if (!isTimeGrid) {
    // Month view - compact
    return (
      <Box
        sx={{
          px: 0.75,
          py: 0.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.6875rem',
          lineHeight: 1.3,
          color: '#fff',
          fontFamily: '"Figtree", sans-serif',
        }}
      >
        <Box component="span" sx={{ fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.625rem' }}>
          {eventInfo.timeText}
        </Box>
        {' '}
        <Box component="span" sx={{ fontWeight: 500 }}>{eventInfo.event.title}</Box>
      </Box>
    );
  }

  // Time grid view - rich card
  return (
    <Box
      sx={{
        px: 0.75,
        py: 0.5,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        borderLeft: `3px solid ${darkenColor(bgColor, 40)}`,
        fontFamily: '"Figtree", sans-serif',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: '0.625rem',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1,
          }}
        >
          {eventInfo.timeText}
        </Typography>
      </Box>
      <Typography
        component="div"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#fff',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {eventInfo.event.title}
      </Typography>
      {clienteName && (
        <Typography
          component="div"
          sx={{
            fontSize: '0.625rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {clienteName}
        </Typography>
      )}
    </Box>
  );
}

export default function CalendarView({
  events,
  loading,
  onEventClick,
  onEventDrop,
  onEventResize,
  onDatesSet,
  onExportClick,
  calendarRef,
}: CalendarViewProps) {
  const handleDatesSet = useCallback(
    (info: DatesSetArg) => {
      onDatesSet(info);
    },
    [onDatesSet]
  );

  return (
    <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
      {/* Export button */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <Tooltip title="Esporta calendario">
          <IconButton
            onClick={onExportClick}
            size="small"
            sx={{
              bgcolor: '#FAFAF9',
              border: '1px solid #E7E5E4',
              '&:hover': { bgcolor: '#F5F5F4' },
            }}
          >
            <FileDownloadIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="it"
          buttonText={{
            today: 'Oggi',
            month: 'Mese',
            week: 'Settimana',
            day: 'Giorno',
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          height="auto"
          expandRows
          nowIndicator
          editable
          selectable
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          datesSet={handleDatesSet}
          events={events.map((e) => ({
            ...e,
            id: String(e.id),
            borderColor: 'transparent',
            textColor: '#ffffff',
          }))}
          eventContent={renderEventContent}
          dayMaxEvents={4}
          moreLinkText={(n) => `+${n} altri`}
          noEventsText="Nessun evento in questo periodo"
        />
      </Box>
    </Box>
  );
}
