import React from 'react';
import { Chip } from '@mui/material';
import { COLORI_STATO, LABEL_STATO, getContrastColor } from '../../utils/statiConfig';

interface StatoBadgeProps {
  stato: string;
  size?: 'small' | 'medium';
}

const StatoBadge: React.FC<StatoBadgeProps> = ({ stato, size = 'small' }) => {
  const backgroundColor = COLORI_STATO[stato] || '#9CA3AF';
  const textColor = getContrastColor(backgroundColor);
  const label = LABEL_STATO[stato] || stato;

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        backgroundColor,
        color: textColor,
        fontWeight: 500,
      }}
    />
  );
};

export default StatoBadge;
