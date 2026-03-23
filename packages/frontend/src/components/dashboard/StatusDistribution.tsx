import React from 'react';
import { Box, Typography, Stack, Tooltip } from '@mui/material';
import { COLORI_STATO, LABELS_STATO } from '@planner-molino/shared';
import type { Prenotazione } from '@planner-molino/shared';

interface StatusDistributionProps {
  prenotazioni: Prenotazione[];
  title?: string;
}

export default function StatusDistribution({ prenotazioni, title = 'Distribuzione stati' }: StatusDistributionProps) {
  const statusCounts = prenotazioni.reduce<Record<string, number>>((acc, p) => {
    acc[p.stato] = (acc[p.stato] || 0) + 1;
    return acc;
  }, {});

  const total = prenotazioni.length;
  const segments = Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([stato, count]) => ({
      stato,
      count,
      label: LABELS_STATO[stato] || stato,
      color: COLORI_STATO[stato] || '#A8A29E',
      percent: total > 0 ? (count / total) * 100 : 0,
    }));

  if (total === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{title}</Typography>
        <Box
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#F5F5F4',
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Nessuna prenotazione
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="caption" sx={{ color: '#A8A29E' }}>{total} totali</Typography>
      </Box>

      {/* Segmented bar */}
      <Box
        sx={{
          display: 'flex',
          height: 10,
          borderRadius: 5,
          overflow: 'hidden',
          gap: '1px',
          bgcolor: '#F5F5F4',
        }}
      >
        {segments.map((seg) => (
          <Tooltip
            key={seg.stato}
            title={`${seg.label}: ${seg.count} (${Math.round(seg.percent)}%)`}
            arrow
          >
            <Box
              sx={{
                width: `${seg.percent}%`,
                minWidth: seg.percent > 0 ? 4 : 0,
                bgcolor: seg.color,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            />
          </Tooltip>
        ))}
      </Box>

      {/* Legend */}
      <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 1.5 }}>
        {segments.map((seg) => (
          <Box key={seg.stato} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: seg.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" sx={{ color: '#57534E', whiteSpace: 'nowrap' }}>
              {seg.label} <strong>{seg.count}</strong>
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
