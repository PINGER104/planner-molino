import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, Typography, Grid, Box, Stack } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import FactoryIcon from '@mui/icons-material/Factory';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const navItems = [
  {
    label: 'Calendario Produzione',
    desc: 'Pianifica e gestisci',
    path: '/produzione/calendario',
    icon: CalendarMonthIcon,
    color: '#2563EB',
    bgLight: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  {
    label: 'Calendario Consegne',
    desc: 'Spedizioni e logistica',
    path: '/consegne/calendario',
    icon: LocalShippingIcon,
    color: '#DC2626',
    bgLight: '#FEF2F2',
    borderColor: '#FECACA',
  },
  {
    label: 'Prenotazioni',
    desc: 'Tutte le prenotazioni',
    path: '/produzione/prenotazioni',
    icon: FactoryIcon,
    color: '#B45309',
    bgLight: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  {
    label: 'Gestione Clienti',
    desc: 'Anagrafica clienti',
    path: '/produzione/clienti',
    icon: PeopleIcon,
    color: '#15803D',
    bgLight: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
];

export default function QuickNavCards() {
  const navigate = useNavigate();

  return (
    <Grid container spacing={2}>
      {navItems.map((item) => (
        <Grid item xs={6} md={3} key={item.path}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderColor: item.borderColor,
              '&:hover': {
                borderColor: item.color,
                boxShadow: `0 4px 12px -4px ${item.color}20`,
              },
            }}
          >
            <CardActionArea
              onClick={() => navigate(item.path)}
              sx={{ p: 2, height: '100%' }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: item.bgLight,
                  }}
                >
                  <item.icon sx={{ fontSize: 18, color: item.color }} />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontFamily: '"Sora", sans-serif',
                      color: '#1C1917',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#A8A29E', display: 'block', mt: 0.25 }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ fontSize: 14, color: '#D6D3D1', alignSelf: 'flex-end' }} />
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
