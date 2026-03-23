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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScaleIcon from '@mui/icons-material/Scale';
import { useNavigate } from 'react-router-dom';
import StatoBadge from '../common/StatoBadge';
import { LABELS_STATO, COLORI_STATO } from '@planner-molino/shared';
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
  const color = COLORI_STATO[stato] || '#A8A29E';

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
          sx: {
            p: 0,
            minWidth: 300,
            maxWidth: 380,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #E7E5E4',
            boxShadow: '0 12px 32px -8px rgba(28, 25, 23, 0.12)',
          },
        },
      }}
    >
      {/* Color header bar */}
      <Box sx={{ height: 4, bgcolor: color }} />

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          {/* Code and status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: '#1C1917',
              }}
            >
              {codice}
            </Typography>
            <StatoBadge stato={stato} />
          </Box>

          {/* Details */}
          <Stack spacing={0.75}>
            {cliente && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 14, color: '#A8A29E' }} />
                <Typography variant="body2" sx={{ color: '#44403C', fontWeight: 500 }}>
                  {cliente}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: '#A8A29E' }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#44403C',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.75rem',
                }}
              >
                {formatTime(startDate)}
                {endDate ? ` — ${formatTime(endDate)}` : ''}
              </Typography>
            </Box>

            {prodotto && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon sx={{ fontSize: 14, color: '#A8A29E' }} />
                <Typography variant="body2" sx={{ color: '#44403C' }}>
                  {prodotto}
                </Typography>
              </Box>
            )}

            {quantita != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScaleIcon sx={{ fontSize: 14, color: '#A8A29E' }} />
                <Typography variant="body2" sx={{ color: '#44403C' }}>
                  {String(quantita)} {unitaMisura}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider />

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
              onClick={() => {
                onClose();
                navigate(`${basePath}/prenotazioni/${event.id}`);
              }}
              sx={{ flex: 1, fontSize: '0.75rem' }}
            >
              Dettaglio
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => {
                onClose();
                navigate(`${basePath}/prenotazioni/${event.id}/modifica`);
              }}
              sx={{ flex: 1, fontSize: '0.75rem' }}
            >
              Modifica
            </Button>
          </Stack>

          {transizioniPossibili.length > 0 && (
            <Box>
              <Typography
                variant="overline"
                sx={{ color: '#A8A29E', display: 'block', mb: 0.5, lineHeight: 1 }}
              >
                Cambio stato
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
                sx={{
                  fontSize: '0.8125rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E7E5E4',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Seleziona nuovo stato...
                </MenuItem>
                {transizioniPossibili.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontSize: '0.8125rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: COLORI_STATO[s] || '#A8A29E',
                        }}
                      />
                      {LABELS_STATO[s] || s}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Stack>
      </Box>
    </Popover>
  );
}
