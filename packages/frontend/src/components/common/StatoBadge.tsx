import React from 'react';
import { Chip } from '@mui/material';
import { COLORI_STATO, LABELS_STATO } from '@planner-molino/shared';

interface StatoBadgeProps {
  stato: string;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1C1917' : '#FFFFFF';
}

export default function StatoBadge({ stato }: StatoBadgeProps) {
  const bgColor = COLORI_STATO[stato] || '#A8A29E';
  const label = LABELS_STATO[stato] || stato;
  const textColor = getContrastColor(bgColor);

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: bgColor,
        color: textColor,
        fontWeight: 600,
        fontSize: '0.625rem',
        height: 22,
        letterSpacing: '0.02em',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
