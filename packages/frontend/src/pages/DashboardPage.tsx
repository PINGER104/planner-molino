import React, { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import KpiCard from '../components/dashboard/KpiCard';
import PrenotazioniTable from '../components/dashboard/PrenotazioniTable';
import QuickNavCards from '../components/dashboard/QuickNavCards';
import { configurazioneService, prenotazioniService } from '../services';
import type { Prenotazione } from '@planner-molino/shared';

interface DashboardStats {
  prenotazioniOggi: number;
  prenotazioniSettimana: number;
  clientiAttivi: number;
  trasportatoriAttivi: number;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function DashboardPage() {
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

  if (loading) {
    return <LoadingSpinner text="Caricamento dashboard..." />;
  }

  // Derive KPI values from fetched data
  const oggiTotale = stats?.prenotazioniOggi ?? prenotazioniOggi.length;
  const oggiInCorso = prenotazioniOggi.filter(
    (p) => ['preso_in_carico', 'in_produzione', 'in_preparazione', 'in_carico'].includes(p.stato)
  ).length;
  const oggiCompletate = prenotazioniOggi.filter(
    (p) => ['completato', 'caricato', 'partito'].includes(p.stato)
  ).length;
  const inAttesa = prenotazioniOggi.filter(
    (p) => ['pianificato', 'pronto_carico'].includes(p.stato)
  ).length;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Panoramica giornaliera" />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <KpiCard title="Oggi" value={oggiTotale} icon={CalendarTodayIcon} color="#1B2A4A" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard title="In corso" value={oggiInCorso} icon={PlayArrowIcon} color="#ED6C02" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard title="Completate" value={oggiCompletate} icon={CheckCircleIcon} color="#2E7D32" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard title="In attesa" value={inAttesa} icon={HourglassEmptyIcon} color="#C2410C" />
        </Grid>
      </Grid>

      {/* Prenotazioni Oggi */}
      <Box sx={{ mb: 4 }}>
        <PrenotazioniTable
          prenotazioni={prenotazioniOggi}
          title="Prenotazioni Oggi"
          emptyMessage="Nessuna prenotazione per oggi"
        />
      </Box>

      {/* Prenotazioni Domani */}
      <Box sx={{ mb: 4 }}>
        <PrenotazioniTable
          prenotazioni={prenotazioniDomani}
          title="Prenotazioni Domani"
          emptyMessage="Nessuna prenotazione per domani"
        />
      </Box>

      {/* Quick Nav */}
      <Box sx={{ mb: 2 }}>
        <QuickNavCards />
      </Box>
    </Box>
  );
}
