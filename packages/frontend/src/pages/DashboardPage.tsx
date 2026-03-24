import React, { useEffect, useState, useMemo } from 'react';
import { Grid, Box, Typography, Card, CardContent, Stack, Chip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FactoryIcon from '@mui/icons-material/Factory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import LoadingSpinner from '../components/common/LoadingSpinner';
import KpiCard from '../components/dashboard/KpiCard';
import PrenotazioniTable from '../components/dashboard/PrenotazioniTable';
import QuickNavCards from '../components/dashboard/QuickNavCards';
import StatusDistribution from '../components/dashboard/StatusDistribution';
import TimelineStrip from '../components/dashboard/TimelineStrip';
import { configurazioneService, prenotazioniService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Prenotazione, DashboardStats } from '@planner-molino/shared';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [prenotazioniOggi, setPrenotazioniOggi] = useState<Prenotazione[]>([]);
  const [prenotazioniDomani, setPrenotazioniDomani] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    Promise.all([
      configurazioneService.getDashboardStats(),
      prenotazioniService.list({ data_da: todayStr, data_a: todayStr, limit: '50' }),
      prenotazioniService.list({ data_da: tomorrowStr, data_a: tomorrowStr, limit: '50' }),
    ])
      .then(([statsRes, oggiRes, domaniRes]) => {
        setStats(statsRes);
        setPrenotazioniOggi(oggiRes.data || []);
        setPrenotazioniDomani(domaniRes.data || []);
      })
      .catch((err) => {
        console.error('Errore caricamento dashboard:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // KPI values from backend stats (already computed server-side)
  const oggiTotale = stats?.oggi_totale ?? prenotazioniOggi.length;
  const oggiInCorso = stats?.oggi_in_corso ?? 0;
  const oggiCompletate = stats?.oggi_completate ?? 0;
  const inAttesa = stats?.in_attesa ?? 0;

  // Split by tipologia (for table/timeline display)
  const produzioneOggi = prenotazioniOggi.filter((p) => p.tipologia === 'produzione');
  const consegneOggi = prenotazioniOggi.filter((p) => p.tipologia === 'consegna');

  if (loading) {
    return <LoadingSpinner text="Caricamento dashboard..." />;
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#1C1917',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {getGreeting()}, {user?.nome || 'Operatore'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#78716C', mt: 0.5 }}>
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })} — Panoramica giornaliera
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard
            title="Oggi"
            value={oggiTotale}
            icon={CalendarTodayIcon}
            color="#292524"
            subtitle="prenotazioni totali"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            title="In corso"
            value={oggiInCorso}
            icon={PlayArrowIcon}
            color="#B45309"
            subtitle="attive ora"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            title="Completate"
            value={oggiCompletate}
            icon={CheckCircleIcon}
            color="#15803D"
            subtitle="finalizzate"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            title="In attesa"
            value={inAttesa}
            icon={HourglassEmptyIcon}
            color="#C2410C"
            subtitle="da avviare"
          />
        </Grid>
      </Grid>

      {/* Timeline + Status distribution */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TimelineStrip prenotazioni={prenotazioniOggi} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <StatusDistribution prenotazioni={prenotazioniOggi} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Production / Delivery split */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              borderColor: '#DBEAFE',
              '&:hover': { borderColor: '#93C5FD' },
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#EFF6FF',
                  }}
                >
                  <FactoryIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" sx={{ color: '#2563EB', lineHeight: 1 }}>
                    Produzione
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#2563EB',
                    fontFamily: '"Sora", sans-serif',
                  }}
                >
                  {stats?.produzione_oggi ?? produzioneOggi.length}
                </Typography>
              </Stack>
              <StatusDistribution prenotazioni={produzioneOggi} title="" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              borderColor: '#FECACA',
              '&:hover': { borderColor: '#FCA5A5' },
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#FEF2F2',
                  }}
                >
                  <LocalShippingIcon sx={{ fontSize: 16, color: '#DC2626' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" sx={{ color: '#DC2626', lineHeight: 1 }}>
                    Consegne
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#DC2626',
                    fontFamily: '"Sora", sans-serif',
                  }}
                >
                  {stats?.consegne_oggi ?? consegneOggi.length}
                </Typography>
              </Stack>
              <StatusDistribution prenotazioni={consegneOggi} title="" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Prenotazioni Tables */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <PrenotazioniTable
            prenotazioni={prenotazioniOggi}
            title="Prenotazioni Oggi"
            emptyMessage="Nessuna prenotazione per oggi"
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <PrenotazioniTable
            prenotazioni={prenotazioniDomani}
            title="Prenotazioni Domani"
            emptyMessage="Nessuna prenotazione per domani"
          />
        </Grid>
      </Grid>

      {/* Quick Nav */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#78716C' }}>
          Accesso rapido
        </Typography>
        <QuickNavCards />
      </Box>
    </Box>
  );
}
