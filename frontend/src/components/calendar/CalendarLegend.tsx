import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import { Circle, FiberManualRecord } from '@mui/icons-material';

import { COLORI_STATO, COLORI_CATEGORIA, LABEL_STATO, LABEL_CATEGORIA } from '../../utils/statiConfig';
import { TipologiaPrenotazione } from '../../types';

interface CalendarLegendProps {
  tipologia: TipologiaPrenotazione;
  compact?: boolean;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({ tipologia, compact = false }) => {
  const statiProduzione = [
    'pianificato',
    'preso_in_carico',
    'in_produzione',
    'completato',
    'annullato',
  ];

  const statiConsegna = [
    'pianificato',
    'preso_in_carico',
    'in_preparazione',
    'pronto_carico',
    'in_carico',
    'caricato',
    'partito',
    'annullato',
  ];

  const stati = tipologia === 'produzione' ? statiProduzione : statiConsegna;
  const categorie = Object.keys(COLORI_CATEGORIA);

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {stati.slice(0, 4).map((stato) => (
          <Chip
            key={stato}
            size="small"
            icon={
              <FiberManualRecord
                sx={{ fontSize: 10, color: `${COLORI_STATO[stato]} !important` }}
              />
            }
            label={LABEL_STATO[stato]}
            sx={{ fontSize: '0.65rem', height: 20 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Legenda Stati
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {stati.map((stato) => (
          <Box
            key={stato}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                backgroundColor: COLORI_STATO[stato],
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {LABEL_STATO[stato]}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Categorie Prodotto
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {categorie.map((categoria) => (
          <Box
            key={categoria}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 12,
                borderRadius: 0.5,
                backgroundColor: COLORI_CATEGORIA[categoria],
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {LABEL_CATEGORIA[categoria]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CalendarLegend;
