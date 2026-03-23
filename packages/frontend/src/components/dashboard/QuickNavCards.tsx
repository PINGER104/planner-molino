import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Typography, Grid } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';

const navItems = [
  {
    label: 'Calendario Produzione',
    path: '/produzione/calendario',
    icon: CalendarMonthIcon,
    color: '#1B2A4A',
  },
  {
    label: 'Prenotazioni Consegne',
    path: '/consegne/prenotazioni',
    icon: LocalShippingIcon,
    color: '#C2410C',
  },
  {
    label: 'Gestione Clienti',
    path: '/produzione/clienti',
    icon: PeopleIcon,
    color: '#16A34A',
  },
];

export default function QuickNavCards() {
  const navigate = useNavigate();

  return (
    <Grid container spacing={2}>
      {navItems.map((item) => (
        <Grid item xs={6} md={4} key={item.path}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea onClick={() => navigate(item.path)} sx={{ p: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <item.icon sx={{ fontSize: 40, color: item.color, mb: 1 }} />
                <Typography variant="body1" fontWeight={500}>
                  {item.label}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
