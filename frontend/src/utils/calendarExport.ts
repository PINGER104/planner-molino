import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale/it';
import { Prenotazione, TipologiaPrenotazione } from '../types';
import {
  LABEL_STATO,
  LABEL_CATEGORIA,
  LABEL_UNITA,
  LABEL_TIPOLOGIA_CARICO,
} from './statiConfig';

// ============================================
// iCalendar Export (.ics)
// ============================================

const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

const formatICalDate = (dateStr: string, timeStr: string | null): string => {
  const date = parseISO(dateStr);
  const time = timeStr || '08:00';
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);

  return format(date, "yyyyMMdd'T'HHmmss");
};

export const generateICalEvent = (prenotazione: Prenotazione): string => {
  const startDateTime = formatICalDate(
    prenotazione.data_pianificata,
    prenotazione.ora_inizio_prevista
  );

  const endDateTime = formatICalDate(
    prenotazione.data_pianificata,
    prenotazione.ora_fine_prevista || prenotazione.ora_inizio_prevista
  );

  const description = [
    `Stato: ${LABEL_STATO[prenotazione.stato] || prenotazione.stato}`,
    prenotazione.cliente_ragione_sociale ? `Cliente: ${prenotazione.cliente_ragione_sociale}` : '',
    prenotazione.trasportatore_ragione_sociale ? `Trasportatore: ${prenotazione.trasportatore_ragione_sociale}` : '',
    prenotazione.prodotto_descrizione ? `Prodotto: ${prenotazione.prodotto_descrizione}` : '',
    prenotazione.categoria_prodotto ? `Categoria: ${LABEL_CATEGORIA[prenotazione.categoria_prodotto]}` : '',
    prenotazione.quantita_prevista ? `Quantità: ${prenotazione.quantita_prevista} ${prenotazione.unita_misura || ''}` : '',
    prenotazione.lotto_previsto ? `Lotto: ${prenotazione.lotto_previsto}` : '',
    prenotazione.ordine_riferimento ? `Ordine: ${prenotazione.ordine_riferimento}` : '',
    prenotazione.note ? `Note: ${prenotazione.note}` : '',
  ].filter(Boolean).join('\\n');

  const location = prenotazione.cliente_citta
    ? `${prenotazione.cliente_citta}${prenotazione.cliente_provincia ? `, ${prenotazione.cliente_provincia}` : ''}`
    : '';

  return [
    'BEGIN:VEVENT',
    `UID:${prenotazione.codice_prenotazione}@planner-molino`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${escapeICalText(prenotazione.codice_prenotazione)} - ${escapeICalText(prenotazione.prodotto_descrizione || 'N/D')}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    location ? `LOCATION:${escapeICalText(location)}` : '',
    `CATEGORIES:${prenotazione.tipologia === 'produzione' ? 'Produzione' : 'Consegna'}`,
    `STATUS:${prenotazione.stato === 'annullato' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
};

export const generateICalendar = (
  prenotazioni: Prenotazione[],
  calendarName: string
): string => {
  const events = prenotazioni.map(generateICalEvent).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planner Molino//IT',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadICalendar = (
  prenotazioni: Prenotazione[],
  filename: string,
  calendarName: string
): void => {
  const icalContent = generateICalendar(prenotazioni, calendarName);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// CSV Export
// ============================================

const escapeCSVField = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const generateCSV = (prenotazioni: Prenotazione[]): string => {
  const headers = [
    'Codice Prenotazione',
    'Tipologia',
    'Stato',
    'Data Pianificata',
    'Ora Inizio',
    'Ora Fine',
    'Cliente',
    'Trasportatore',
    'Prodotto Codice',
    'Prodotto Descrizione',
    'Categoria',
    'Quantità',
    'Unità Misura',
    'Quantità (kg)',
    'Lotto Previsto',
    'Scadenza Lotto',
    'Ordine Riferimento',
    'DDT Riferimento',
    'Tipologia Carico',
    'Priorità',
    'Note',
    'Specifica W',
    'Specifica P/L',
    'Linea Produzione',
    'Data Creazione',
  ];

  const rows = prenotazioni.map((p) => [
    p.codice_prenotazione,
    p.tipologia === 'produzione' ? 'Produzione' : 'Consegna',
    LABEL_STATO[p.stato] || p.stato,
    format(parseISO(p.data_pianificata), 'dd/MM/yyyy'),
    p.ora_inizio_prevista?.substring(0, 5) || '',
    p.ora_fine_prevista?.substring(0, 5) || '',
    p.cliente_ragione_sociale || '',
    p.trasportatore_ragione_sociale || '',
    p.prodotto_codice || '',
    p.prodotto_descrizione || '',
    p.categoria_prodotto ? LABEL_CATEGORIA[p.categoria_prodotto] : '',
    p.quantita_prevista || '',
    p.unita_misura ? LABEL_UNITA[p.unita_misura] : '',
    p.quantita_kg || '',
    p.lotto_previsto || '',
    p.lotto_scadenza ? format(parseISO(p.lotto_scadenza), 'dd/MM/yyyy') : '',
    p.ordine_riferimento || '',
    p.ddt_riferimento || '',
    p.tipologia_carico ? LABEL_TIPOLOGIA_CARICO[p.tipologia_carico] : '',
    p.priorita,
    p.note || '',
    p.specifica_w ? `W${p.specifica_w}` : '',
    p.specifica_pl || '',
    p.linea_produzione || '',
    format(parseISO(p.created_at), 'dd/MM/yyyy HH:mm'),
  ].map(escapeCSVField));

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const downloadCSV = (prenotazioni: Prenotazione[], filename: string): void => {
  const csvContent = generateCSV(prenotazioni);
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// Print View Generation
// ============================================

export interface PrintOptions {
  title: string;
  dateRange: { start: string; end: string };
  tipologia: TipologiaPrenotazione;
  showDetails: boolean;
  groupByDate: boolean;
}

export const generatePrintHTML = (
  prenotazioni: Prenotazione[],
  options: PrintOptions
): string => {
  const { title, dateRange, tipologia, showDetails, groupByDate } = options;

  // Group by date if requested
  const groupedByDate: Record<string, Prenotazione[]> = {};

  if (groupByDate) {
    prenotazioni.forEach((p) => {
      const dateKey = p.data_pianificata;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(p);
    });
  }

  const formatDateRange = () => {
    const start = format(parseISO(dateRange.start), 'dd MMMM yyyy', { locale: it });
    const end = format(parseISO(dateRange.end), 'dd MMMM yyyy', { locale: it });
    return `${start} - ${end}`;
  };

  const renderPrenotazione = (p: Prenotazione): string => {
    const statoLabel = LABEL_STATO[p.stato] || p.stato;
    const categoriaLabel = p.categoria_prodotto ? LABEL_CATEGORIA[p.categoria_prodotto] : '';

    return `
      <div class="event-card">
        <div class="event-header">
          <span class="event-code">${p.codice_prenotazione}</span>
          <span class="event-time">${p.ora_inizio_prevista?.substring(0, 5) || ''} - ${p.ora_fine_prevista?.substring(0, 5) || ''}</span>
        </div>
        <div class="event-status stato-${p.stato}">${statoLabel}</div>
        <div class="event-product">${p.prodotto_descrizione || 'N/D'}</div>
        ${p.cliente_ragione_sociale ? `<div class="event-client">Cliente: ${p.cliente_ragione_sociale}</div>` : ''}
        ${p.trasportatore_ragione_sociale ? `<div class="event-carrier">Trasportatore: ${p.trasportatore_ragione_sociale}</div>` : ''}
        <div class="event-quantity">Quantità: ${p.quantita_prevista || '-'} ${p.unita_misura || ''}</div>
        ${categoriaLabel ? `<div class="event-category">Categoria: ${categoriaLabel}</div>` : ''}
        ${showDetails ? `
          ${p.lotto_previsto ? `<div class="event-detail">Lotto: ${p.lotto_previsto}</div>` : ''}
          ${p.ordine_riferimento ? `<div class="event-detail">Ordine: ${p.ordine_riferimento}</div>` : ''}
          ${p.specifica_w ? `<div class="event-detail">Specifica W: ${p.specifica_w}</div>` : ''}
          ${p.note ? `<div class="event-notes">Note: ${p.note}</div>` : ''}
        ` : ''}
      </div>
    `;
  };

  const renderContent = (): string => {
    if (groupByDate) {
      const sortedDates = Object.keys(groupedByDate).sort();
      return sortedDates.map((dateKey) => `
        <div class="date-group">
          <h3 class="date-header">${format(parseISO(dateKey), 'EEEE dd MMMM yyyy', { locale: it })}</h3>
          <div class="events-list">
            ${groupedByDate[dateKey].map(renderPrenotazione).join('')}
          </div>
        </div>
      `).join('');
    } else {
      return `
        <div class="events-list">
          ${prenotazioni.map(renderPrenotazione).join('')}
        </div>
      `;
    }
  };

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
      background: #fff;
    }

    .print-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }

    .print-header h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #1a1a1a;
    }

    .print-header .subtitle {
      font-size: 14px;
      color: #666;
    }

    .print-header .date-range {
      font-size: 16px;
      font-weight: 500;
      margin-top: 8px;
    }

    .print-header .meta {
      font-size: 11px;
      color: #888;
      margin-top: 8px;
    }

    .summary {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .summary-item {
      text-align: center;
    }

    .summary-item .value {
      font-size: 24px;
      font-weight: 700;
      color: #1976d2;
    }

    .summary-item .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
    }

    .date-group {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .date-header {
      font-size: 16px;
      font-weight: 600;
      padding: 10px 15px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-bottom: 10px;
      text-transform: capitalize;
    }

    .events-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
    }

    .event-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      background: #fff;
      page-break-inside: avoid;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .event-code {
      font-weight: 700;
      font-size: 14px;
      color: #1a1a1a;
    }

    .event-time {
      font-size: 11px;
      color: #666;
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .event-status {
      display: inline-block;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .stato-pianificato { background: #e3f2fd; color: #1565c0; }
    .stato-preso_in_carico { background: #fff3e0; color: #e65100; }
    .stato-in_produzione, .stato-in_preparazione { background: #f3e5f5; color: #7b1fa2; }
    .stato-pronto_carico { background: #e8f5e9; color: #2e7d32; }
    .stato-in_carico { background: #e0f2f1; color: #00695c; }
    .stato-completato, .stato-caricato, .stato-partito { background: #f5f5f5; color: #616161; }
    .stato-annullato { background: #ffebee; color: #c62828; }

    .event-product {
      font-weight: 500;
      margin-bottom: 6px;
    }

    .event-client, .event-carrier, .event-category {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }

    .event-quantity {
      font-weight: 600;
      color: #1976d2;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #eee;
    }

    .event-detail {
      font-size: 10px;
      color: #777;
      margin-top: 4px;
    }

    .event-notes {
      font-size: 10px;
      color: #888;
      margin-top: 6px;
      padding: 6px;
      background: #fafafa;
      border-radius: 4px;
      font-style: italic;
    }

    .print-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10px;
      color: #888;
    }

    @media print {
      body {
        padding: 10px;
      }

      .event-card {
        break-inside: avoid;
      }

      .date-group {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>${title}</h1>
    <div class="subtitle">Calendario ${tipologia === 'produzione' ? 'Produzione' : 'Consegne'}</div>
    <div class="date-range">${formatDateRange()}</div>
    <div class="meta">Generato il ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}</div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="value">${prenotazioni.length}</div>
      <div class="label">Totale Prenotazioni</div>
    </div>
    <div class="summary-item">
      <div class="value">${prenotazioni.filter(p => p.stato === 'pianificato').length}</div>
      <div class="label">Pianificate</div>
    </div>
    <div class="summary-item">
      <div class="value">${prenotazioni.filter(p => ['in_produzione', 'in_preparazione', 'preso_in_carico'].includes(p.stato)).length}</div>
      <div class="label">In Corso</div>
    </div>
    <div class="summary-item">
      <div class="value">${prenotazioni.filter(p => ['completato', 'partito', 'caricato'].includes(p.stato)).length}</div>
      <div class="label">Completate</div>
    </div>
  </div>

  ${renderContent()}

  <div class="print-footer">
    Planner Molino - Sistema di Gestione Prenotazioni
  </div>
</body>
</html>
`;
};

export const openPrintView = (
  prenotazioni: Prenotazione[],
  options: PrintOptions
): void => {
  const htmlContent = generatePrintHTML(prenotazioni, options);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load before triggering print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};

// ============================================
// HTML Download (new function)
// ============================================

export const downloadHTML = (
  prenotazioni: Prenotazione[],
  filename: string,
  options: PrintOptions
): void => {
  const htmlContent = generatePrintHTML(prenotazioni, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// JSON Export (for backup/import)
// ============================================

export const downloadJSON = (prenotazioni: Prenotazione[], filename: string): void => {
  const jsonContent = JSON.stringify(prenotazioni, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
