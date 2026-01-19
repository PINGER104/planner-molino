import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
} from '@mui/material';
import { Factory, Inventory, CalendarMonth, ListAlt } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasSection } = useAuth();

  const sections = [
    {
      title: 'Planning Produzione',
      subtitle: 'Calendario e prenotazioni produzione',
      icon: Factory,
      color: '#1976d2',
      path: '/produzione/calendario',
      enabled: hasSection('produzione'),
    },
    {
      title: 'Planning Consegne',
      subtitle: 'Calendario e prenotazioni consegne',
      icon: Inventory,
      color: '#9c27b0',
      path: '/consegne/calendario',
      enabled: hasSection('consegne'),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Benvenuto, {user?.nome}!
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Seleziona una sezione per iniziare
      </Typography>

      <Grid container spacing={3}>
        {sections
          .filter((s) => s.enabled)
          .map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.path}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(section.path)}
                  sx={{ height: '100%' }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      py: 4,
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: `${section.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <section.icon sx={{ fontSize: 40, color: section.color }} />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {section.subtitle}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
