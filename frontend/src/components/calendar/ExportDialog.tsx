import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  RadioGroup,
  Radio,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
} from '@mui/material';
import {
  Download,
  CalendarMonth,
  TableChart,
  Description,
  Close,
  Code,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale/it';

import { Prenotazione, TipologiaPrenotazione } from '../../types';
import {
  downloadICalendar,
  downloadCSV,
  downloadJSON,
  downloadHTML,
} from '../../utils/calendarExport';

type ExportFormat = 'ical' | 'csv' | 'json' | 'html';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  prenotazioni: Prenotazione[];
  dateRange: { start: string; end: string };
  tipologia: TipologiaPrenotazione;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  prenotazioni,
  dateRange,
  tipologia,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');

  const formatDateRange = () => {
    if (!dateRange.start || !dateRange.end) return '';
    try {
      const start = format(parseISO(dateRange.start), 'dd MMM yyyy', { locale: it });
      const end = format(parseISO(dateRange.end), 'dd MMM yyyy', { locale: it });
      return `${start} - ${end}`;
    } catch {
      return '';
    }
  };

  const getFilename = () => {
    const tipologiaStr = tipologia === 'produzione' ? 'produzione' : 'consegne';
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    return `calendario-${tipologiaStr}-${dateStr}`;
  };

  const handleExport = () => {
    const filename = getFilename();
    const calendarName = `Planner Molino - ${tipologia === 'produzione' ? 'Produzione' : 'Consegne'}`;

    switch (selectedFormat) {
      case 'ical':
        downloadICalendar(prenotazioni, filename, calendarName);
        break;
      case 'csv':
        downloadCSV(prenotazioni, filename);
        break;
      case 'json':
        downloadJSON(prenotazioni, filename);
        break;
      case 'html':
        downloadHTML(prenotazioni, filename, {
          title: `Calendario ${tipologia === 'produzione' ? 'Produzione' : 'Consegne'}`,
          dateRange,
          tipologia,
          showDetails: true,
          groupByDate: true,
        });
        break;
    }

    onClose();
  };

  const exportOptions = [
    {
      value: 'html' as ExportFormat,
      icon: <Code />,
      title: 'HTML (Visualizzazione)',
      description: 'Scarica come pagina web visualizzabile e stampabile',
      color: '#e11d48',
    },
    {
      value: 'ical' as ExportFormat,
      icon: <CalendarMonth />,
      title: 'iCalendar (.ics)',
      description: 'Importa in Apple Calendar, Google Calendar, Outlook',
      color: '#1e40af',
    },
    {
      value: 'csv' as ExportFormat,
      icon: <TableChart />,
      title: 'Excel / CSV',
      description: 'Apri con Excel, Google Sheets o altri fogli di calcolo',
      color: '#059669',
    },
    {
      value: 'json' as ExportFormat,
      icon: <Description />,
      title: 'JSON (Backup)',
      description: 'Esporta tutti i dati in formato JSON per backup',
      color: '#7c3aed',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Download sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Esporta Calendario</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Summary Info */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Periodo selezionato
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatDateRange()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tipologia
            </Typography>
            <Chip
              label={tipologia === 'produzione' ? 'Produzione' : 'Consegne'}
              size="small"
              color={tipologia === 'produzione' ? 'primary' : 'secondary'}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Prenotazioni da esportare
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {prenotazioni.length}
            </Typography>
          </Box>
        </Paper>

        {prenotazioni.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Non ci sono prenotazioni nel periodo selezionato da esportare.
          </Alert>
        )}

        {/* Format Selection */}
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
          Seleziona formato di esportazione
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
          >
            <List disablePadding>
              {exportOptions.map((option) => (
                <Paper
                  key={option.value}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    borderColor: selectedFormat === option.value ? option.color : 'divider',
                    borderWidth: selectedFormat === option.value ? 2 : 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: option.color,
                      backgroundColor: `${option.color}08`,
                    },
                  }}
                >
                  <ListItem
                    sx={{ cursor: 'pointer', py: 1.5 }}
                    onClick={() => setSelectedFormat(option.value)}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${option.color}15`,
                          color: option.color,
                        }}
                      >
                        {option.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={500}>
                          {option.title}
                        </Typography>
                      }
                      secondary={option.description}
                    />
                    <Radio
                      checked={selectedFormat === option.value}
                      sx={{ color: option.color }}
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          </RadioGroup>
        </FormControl>

      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          startIcon={<Close />}
          color="inherit"
        >
          Annulla
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<Download />}
          disabled={prenotazioni.length === 0}
        >
          Esporta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
