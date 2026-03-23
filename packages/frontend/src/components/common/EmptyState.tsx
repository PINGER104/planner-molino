import React, { ReactNode } from 'react';
import { Box, Typography, SvgIconProps } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon: React.ComponentType<SvgIconProps>;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 5,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F5F5F4',
          mb: 2,
        }}
      >
        <Icon sx={{ fontSize: 28, color: '#A8A29E' }} />
      </Box>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 600,
          color: '#57534E',
          fontFamily: '"Sora", sans-serif',
        }}
        gutterBottom
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', maxWidth: 300 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
