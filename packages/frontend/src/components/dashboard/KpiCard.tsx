import React, { useEffect, useState } from 'react';
import { Card, CardContent, Box, Typography, SvgIconProps } from '@mui/material';

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
}

export default function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 500;
    const steps = 20;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}1A`,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 28, color }} />
        </Box>
        <Box>
          <Typography variant="h3" fontWeight="bold" sx={{ color, lineHeight: 1.2 }}>
            {displayValue}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
