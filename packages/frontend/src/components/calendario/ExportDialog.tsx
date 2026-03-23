import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  FormControl,
  FormLabel,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addDays } from 'date-fns';
import { prenotazioniService } from '../../services';
import type { CalendarEvent } from '../../hooks/useCalendar';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  tipologia: string;
}

type ExportFormat = 'ical' | 'csv' | 'json' | 'html';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toICalDate(dateStr: string): string {
  return dateStr.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function eventsToICal(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planner Molino//IT',
    'CALSCALE:GREGORIAN',
  ];
  events.forEach((e) => {
    const ext = e.extendedProps || {};
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.id}@planner-molino`);
    lines.push(`DTSTART:${toICalDate(e.start)}`);
    if (e.end) lines.push(`DTEND:${toICalDate(e.end)}`);
    lines.push(`SUMMARY:${e.title}`);
    if (ext.codice_prenotazione) lines.push(`DESCRIPTION:Codice: ${ext.codice_prenotazione}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function eventsToCSV(events: CalendarEvent[]): string {
  const header = 'codice,data,ora_inizio,ora_fine,cliente,stato,prodotto,quantita';
  const rows = events.map((e) => {
    const ext = e.extendedProps || {};
    return [
      ext.codice_prenotazione || '',
      e.start.substring(0, 10),
      e.start.substring(11, 16),
      e.end ? e.end.substring(11, 16) : '',
      `"${(ext.cliente_ragione_sociale as string || '').replace(/"/g, '""')}"`,
      ext.stato || '',
      `"${(ext.prodotto_descrizione as string || '').replace(/"/g, '""')}"`,
      ext.quantita_prevista ?? '',
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function eventsToHTML(events: CalendarEvent[]): string {
  const rows = events
    .map(
      (e) => {
        const ext = e.extendedProps || {};
        return `<tr>
      <td>${ext.codice_prenotazione || ''}</td>
      <td>${e.start.substring(0, 10)}</td>
      <td>${e.start.substring(11, 16)}</td>
      <td>${e.end ? e.end.substring(11, 16) : ''}</td>
      <td>${ext.cliente_ragione_sociale || ''}</td>
      <td>${ext.stato || ''}</td>
      <td>${ext.prodotto_descrizione || ''}</td>
      <td>${ext.quantita_prevista ?? ''}</td>
    </tr>`;
      }
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Esportazione Calendario</title>
  <style>
    body { font-family: 'Source Sans 3', Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #E8E5DF; padding: 8px 12px; text-align: left; }
    th { background-color: #1B2A4A; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Calendario Prenotazioni</h1>
  <table>
    <thead>
      <tr>
        <th>Codice</th><th>Data</th><th>Ora Inizio</th><th>Ora Fine</th>
        <th>Cliente</th><th>Stato</th><th>Prodotto</th><th>Quantit&agrave;</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

export default function ExportDialog({ open, onClose, tipologia }: ExportDialogProps) {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 30));
  const [formatType, setFormatType] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) return;

    setExporting(true);
    try {
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');
      const events = await prenotazioniService.calendario(start, end, tipologia);

      let content: string;
      let mimeType: string;
      let ext: string;

      switch (formatType) {
        case 'ical':
          content = eventsToICal(events);
          mimeType = 'text/calendar;charset=utf-8';
          ext = 'ics';
          break;
        case 'csv':
          content = eventsToCSV(events);
          mimeType = 'text/csv;charset=utf-8';
          ext = 'csv';
          break;
        case 'json':
          content = JSON.stringify(events, null, 2);
          mimeType = 'application/json;charset=utf-8';
          ext = 'json';
          break;
        case 'html':
          content = eventsToHTML(events);
          mimeType = 'text/html;charset=utf-8';
          ext = 'html';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      downloadBlob(blob, `calendario-${tipologia}-${start}-${end}.${ext}`);
      onClose();
    } catch (err) {
      console.error('Errore esportazione:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Esporta Calendario</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Da"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="A"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Stack>

          <FormControl>
            <FormLabel>Formato</FormLabel>
            <RadioGroup
              value={formatType}
              onChange={(e) => setFormatType(e.target.value as ExportFormat)}
            >
              <FormControlLabel value="csv" control={<Radio />} label="CSV" />
              <FormControlLabel value="ical" control={<Radio />} label="iCal (.ics)" />
              <FormControlLabel value="json" control={<Radio />} label="JSON" />
              <FormControlLabel value="html" control={<Radio />} label="HTML (tabella)" />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={exporting || !startDate || !endDate}
          startIcon={exporting ? <CircularProgress size={16} /> : undefined}
        >
          {exporting ? 'Esportazione...' : 'Esporta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
