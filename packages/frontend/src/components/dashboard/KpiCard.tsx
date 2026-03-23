import React, { useEffect, useState } from 'react';
import { Card, CardContent, Box, Typography, SvgIconProps } from '@mui/material';

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
  subtitle?: string;
}

export default function KpiCard({ title, value, icon: Icon, color, subtitle }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 600;
    const steps = 24;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out curve
      const progress = 1 - Math.pow(1 - step / steps, 3);
      current = Math.min(Math.round(value * progress), value);
      setDisplayValue(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: color,
          opacity: 0.9,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#78716C',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                lineHeight: 1,
                mb: 1,
                display: 'block',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1C1917',
                lineHeight: 1,
                fontSize: '2rem',
                letterSpacing: '-0.03em',
                fontFamily: '"Sora", sans-serif',
              }}
            >
              {displayValue}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#A8A29E', mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${color}12`,
              border: `1px solid ${color}20`,
            }}
          >
            <Icon sx={{ fontSize: 20, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
