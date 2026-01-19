import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Save,
  CalendarMonth,
  Inventory2,
  Person,
  Schedule,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';

import { Prenotazione } from '../../types';
import { prenotazioniApi } from '../../services/api';
import {
  COLORI_STATO,
  LABEL_STATO,
  getContrastColor,
} from '../../utils/statiConfig';

interface EditSlotDialogProps {
  open: boolean;
  onClose: () => void;
  prenotazione: Prenotazione | null;
  onSuccess: () => void;
}

const EditSlotDialog: React.FC<EditSlotDialogProps> = ({
  open,
  onClose,
  prenotazione,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Initialize form when prenotazione changes
  useEffect(() => {
    if (prenotazione) {
      setSelectedDate(parseISO(prenotazione.data_pianificata));

      if (prenotazione.ora_inizio_prevista) {
        const [hours, minutes] = prenotazione.ora_inizio_prevista.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        setStartTime(startDate);
      }

      if (prenotazione.ora_fine_prevista) {
        const [hours, minutes] = prenotazione.ora_fine_prevista.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(hours, minutes, 0, 0);
        setEndTime(endDate);
      }

      setError(null);
      setSuccess(false);
    }
  }, [prenotazione]);

  const handleSave = async () => {
    if (!prenotazione || !selectedDate || !startTime) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await prenotazioniApi.update(prenotazione.id, {
        data_pianificata: format(selectedDate, 'yyyy-MM-dd'),
        ora_inizio_prevista: format(startTime, 'HH:mm'),
        ora_fine_prevista: endTime ? format(endTime, 'HH:mm') : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Errore durante il salvataggio';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = prenotazione && !['completato', 'partito', 'annullato'].includes(prenotazione.stato);

  if (!prenotazione) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${COLORI_STATO[prenotazione.stato]} 0%, ${COLORI_STATO[prenotazione.stato]}dd 100%)`,
          color: getContrastColor(COLORI_STATO[prenotazione.stato]),
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Chip
              label="Modifica Slot"
              size="small"
              icon={<Schedule sx={{ color: 'inherit !important', fontSize: 16 }} />}
              sx={{
                mb: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
                fontWeight: 500,
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
            <Typography variant="h5" fontWeight={700}>
              {prenotazione.codice_prenotazione}
            </Typography>
            <Chip
              label={LABEL_STATO[prenotazione.stato]}
              size="small"
              sx={{
                mt: 1.5,
                bgcolor: 'rgba(255,255,255,0.9)',
                color: COLORI_STATO[prenotazione.stato],
                fontWeight: 600,
              }}
            />
          </Box>
          <Button
            onClick={onClose}
            sx={{
              minWidth: 'auto',
              p: 1,
              color: 'inherit',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <Close />
          </Button>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Info Card */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.main' }}>
              <Inventory2 />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Prodotto
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {prenotazione.prodotto_descrizione || 'N/D'}
              </Typography>
            </Box>
          </Box>

          {prenotazione.cliente_ragione_sociale && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.100', color: 'info.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {prenotazione.cliente_ragione_sociale}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {!canEdit && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Non e possibile modificare una prenotazione in stato "{LABEL_STATO[prenotazione.stato]}".
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Slot aggiornato con successo!
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth fontSize="small" color="primary" />
          Modifica Data e Orario
        </Typography>

        {/* Date Picker */}
        <Box sx={{ mb: 3 }}>
          <DatePicker
            label="Data"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            disabled={!canEdit || loading}
            format="dd/MM/yyyy"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </Box>

        {/* Time Pickers */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TimePicker
            label="Ora Inizio"
            value={startTime}
            onChange={(newValue) => setStartTime(newValue)}
            disabled={!canEdit || loading}
            ampm={false}
            minutesStep={15}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
          <TimePicker
            label="Ora Fine"
            value={endTime}
            onChange={(newValue) => setEndTime(newValue)}
            disabled={!canEdit || loading}
            ampm={false}
            minutesStep={15}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </Box>

        {/* Quick time slots */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Slot rapidi:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((time) => (
              <Chip
                key={time}
                label={time}
                size="small"
                variant={startTime && format(startTime, 'HH:mm') === time ? 'filled' : 'outlined'}
                color={startTime && format(startTime, 'HH:mm') === time ? 'primary' : 'default'}
                onClick={() => {
                  if (canEdit && !loading) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const newTime = new Date();
                    newTime.setHours(hours, minutes, 0, 0);
                    setStartTime(newTime);
                  }
                }}
                disabled={!canEdit || loading}
                sx={{ cursor: canEdit && !loading ? 'pointer' : 'default' }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          startIcon={<Close />}
          color="inherit"
          disabled={loading}
        >
          Annulla
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={!canEdit || loading || success}
          sx={{
            minWidth: 120,
          }}
        >
          {loading ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSlotDialog;
