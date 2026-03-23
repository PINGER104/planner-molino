import React, { useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, IconButton, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import type { EventClickArg, EventDropArg, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { CalendarEvent } from '../../hooks/useCalendar';

// FullCalendar theme overrides
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
  return (
    <Box
      sx={{
        px: 0.5,
        py: 0.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '0.75rem',
        lineHeight: 1.3,
        color: '#fff',
        borderLeft: `3px solid ${darkenColor(bgColor)}`,
        height: '100%',
      }}
    >
      <Box component="span" sx={{ fontWeight: 600 }}>
        {eventInfo.timeText}
      </Box>
      {' '}
      <Box component="span">{eventInfo.event.title}</Box>
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
          <IconButton onClick={onExportClick} size="small">
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
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
            borderColor: darkenColor(e.backgroundColor || '#3B6FD4'),
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
