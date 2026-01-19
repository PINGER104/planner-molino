import React from 'react';
import { Box, Typography, Tooltip, Chip } from '@mui/material';
import {
  AccessTime,
  Person,
  LocalShipping,
  Inventory2,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { Prenotazione } from '../../types';
import {
  COLORI_STATO,
  COLORI_CATEGORIA,
  LABEL_STATO,
  LABEL_CATEGORIA,
  getContrastColor,
} from '../../utils/statiConfig';

interface CalendarEventCardProps {
  prenotazione: Prenotazione;
  compact?: boolean;
  onClick?: () => void;
}

const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  prenotazione,
  compact = false,
  onClick,
}) => {
  const statoColor = COLORI_STATO[prenotazione.stato] || '#6B7280';
  const categoriaColor = prenotazione.categoria_prodotto
    ? COLORI_CATEGORIA[prenotazione.categoria_prodotto]
    : undefined;
  const textColor = getContrastColor(statoColor);

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  if (compact) {
    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {prenotazione.codice_prenotazione}
            </Typography>
            <Typography variant="body2">
              {prenotazione.prodotto_descrizione}
            </Typography>
            <Typography variant="caption" display="block">
              {prenotazione.cliente_ragione_sociale}
            </Typography>
            <Typography variant="caption" display="block">
              {formatTime(prenotazione.ora_inizio_prevista)} -{' '}
              {formatTime(prenotazione.ora_fine_prevista)}
            </Typography>
            <Typography variant="caption" display="block">
              {prenotazione.quantita_prevista} {prenotazione.unita_misura}
            </Typography>
          </Box>
        }
        arrow
        placement="right"
      >
        <Box
          onClick={onClick}
          sx={{
            p: 0.75,
            borderRadius: 1,
            backgroundColor: statoColor,
            borderLeft: categoriaColor ? `4px solid ${categoriaColor}` : undefined,
            color: textColor,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: 2,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {prenotazione.codice_prenotazione}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              opacity: 0.9,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {prenotazione.quantita_prevista} {prenotazione.unita_misura}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${statoColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            {prenotazione.codice_prenotazione}
          </Typography>
          <Chip
            label={LABEL_STATO[prenotazione.stato]}
            size="small"
            sx={{
              backgroundColor: statoColor,
              color: textColor,
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        </Box>
        {categoriaColor && (
          <Chip
            label={prenotazione.categoria_prodotto ? LABEL_CATEGORIA[prenotazione.categoria_prodotto] : ''}
            size="small"
            sx={{
              backgroundColor: `${categoriaColor}20`,
              color: categoriaColor,
              fontSize: '0.6rem',
              height: 18,
              border: `1px solid ${categoriaColor}`,
            }}
          />
        )}
      </Box>

      {/* Time */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
        <AccessTime sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
        <Typography variant="caption" color="text.secondary">
          {formatTime(prenotazione.ora_inizio_prevista)}
          {prenotazione.ora_fine_prevista && ` - ${formatTime(prenotazione.ora_fine_prevista)}`}
        </Typography>
      </Box>

      {/* Product */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
        <Inventory2 sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
        <Typography
          variant="caption"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {prenotazione.prodotto_descrizione || 'N/D'}
        </Typography>
      </Box>

      {/* Client */}
      {prenotazione.cliente_ragione_sociale && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
          <Person sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {prenotazione.cliente_ragione_sociale}
          </Typography>
        </Box>
      )}

      {/* Carrier (for deliveries) */}
      {prenotazione.tipologia === 'consegna' && prenotazione.trasportatore_ragione_sociale && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
          <LocalShipping sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {prenotazione.trasportatore_ragione_sociale}
          </Typography>
        </Box>
      )}

      {/* Quantity */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 1,
          pt: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" fontWeight={500}>
          Quantità:
        </Typography>
        <Typography variant="caption" fontWeight={600} color="primary.main">
          {prenotazione.quantita_prevista} {prenotazione.unita_misura}
        </Typography>
      </Box>
    </Box>
  );
};

export default CalendarEventCard;
