import React from 'react';
import {
  Popover,
  Box,
  Typography,
  Divider,
  Button,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import StatoBadge from '../common/StatoBadge';
import { LABELS_STATO } from '@planner-molino/shared';
import type { CalendarEvent } from '../../hooks/useCalendar';

interface EventPopupProps {
  event: CalendarEvent | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onCambioStato: (eventId: number, nuovoStato: string) => void;
  tipologia: string;
}

export default function EventPopup({
  event,
  anchorEl,
  onClose,
  onCambioStato,
  tipologia,
}: EventPopupProps) {
  const navigate = useNavigate();

  if (!event) return null;

  const ext = event.extendedProps || {};
  const stato = (ext.stato as string) || '';
  const codice = (ext.codice_prenotazione as string) || '';
  const cliente = (ext.cliente_ragione_sociale as string) || '';
  const prodotto = (ext.prodotto_descrizione as string) || '';
  const quantita = ext.quantita_prevista;
  const unitaMisura = (ext.unita_misura as string) || '';
  const transizioniPossibili = (ext.transizioni_possibili as string[]) || [];

  const startDate = new Date(event.start);
  const endDate = event.end ? new Date(event.end) : null;
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const basePath = tipologia === 'consegna' ? '/consegne' : '/produzione';

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: { p: 2, minWidth: 280, maxWidth: 360 },
        },
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="subtitle1"
          sx={{ fontFamily: 'monospace', fontWeight: 700 }}
        >
          {codice}
        </Typography>

        <StatoBadge stato={stato} />

        {cliente && (
          <Typography variant="body2" color="text.secondary">
            <strong>Cliente:</strong> {cliente}
          </Typography>
        )}

        {prodotto && (
          <Typography variant="body2" color="text.secondary">
            <strong>Prodotto:</strong> {prodotto}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary">
          <strong>Ora:</strong> {formatTime(startDate)}
          {endDate ? ` - ${formatTime(endDate)}` : ''}
        </Typography>

        {quantita != null && (
          <Typography variant="body2" color="text.secondary">
            <strong>Quantit&agrave;:</strong> {quantita} {unitaMisura}
          </Typography>
        )}

        <Divider />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              onClose();
              navigate(`${basePath}/prenotazioni/${event.id}`);
            }}
          >
            Dettaglio
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              onClose();
              navigate(`${basePath}/prenotazioni/${event.id}/modifica`);
            }}
          >
            Modifica
          </Button>
        </Stack>

        {transizioniPossibili.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Cambio stato rapido:
            </Typography>
            <Select
              size="small"
              displayEmpty
              fullWidth
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onCambioStato(event.id, e.target.value as string);
                  onClose();
                }
              }}
            >
              <MenuItem value="" disabled>
                Seleziona nuovo stato...
              </MenuItem>
              {transizioniPossibili.map((s) => (
                <MenuItem key={s} value={s}>
                  {LABELS_STATO[s] || s}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
      </Stack>
    </Popover>
  );
}
