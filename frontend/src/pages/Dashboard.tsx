import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Factory,
  Inventory,
  CalendarToday,
  Schedule,
  PlayArrow,
  CheckCircle,
  OpenInNew,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { prenotazioniApi } from '../services/supabaseApi';
import { Prenotazione } from '../types';
import { StatoBadge } from '../components/common';
import { isStatoFinale } from '../utils/statiConfig';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5); // "HH:MM:SS" → "HH:MM"
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card
    sx={{
      height: '100%',
      borderLeft: `4px solid ${color}`,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 3 },
    }}
  >
    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color, mt: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

interface ActivityTableProps {
  title: string;
  subtitle: string;
  prenotazioni: Prenotazione[];
  loading: boolean;
  onRowClick: (p: Prenotazione) => void;
  emptyMessage: string;
}

const ActivityTable: React.FC<ActivityTableProps> = ({
  title,
  subtitle,
  prenotazioni,
  loading,
  onRowClick,
  emptyMessage,
}) => (
  <Paper sx={{ overflow: 'hidden' }}>
    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ fontSize: '1rem' }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
    <TableContainer sx={{ maxHeight: 400 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Orario</TableCell>
            <TableCell>Codice</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Prodotto</TableCell>
            <TableCell>Quantit&agrave;</TableCell>
            <TableCell>Stato</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : prenotazioni.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            prenotazioni.map((p) => (
              <TableRow
                key={p.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onRowClick(p)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {formatTime(p.ora_inizio_prevista)}
                  </Typography>
                  {p.ora_fine_prevista && (
                    <Typography variant="caption" color="text.secondary">
                      - {formatTime(p.ora_fine_prevista)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                    {p.codice_prenotazione}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.tipologia === 'produzione' ? 'Prod.' : 'Cons.'}
                    size="small"
                    variant="outlined"
                    color={p.tipologia === 'produzione' ? 'primary' : 'secondary'}
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                    {p.cliente_ragione_sociale || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                    {p.prodotto_descrizione || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {p.quantita_prevista != null
                      ? `${p.quantita_prevista} ${p.unita_misura || 'kg'}`
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatoBadge stato={p.stato} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Apri dettaglio">
                    <IconButton size="small">
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasSection } = useAuth();

  const [todayData, setTodayData] = useState<Prenotazione[]>([]);
  const [tomorrowData, setTomorrowData] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = getToday();
    const tomorrow = getTomorrow();

    try {
      const [todayRes, tomorrowRes] = await Promise.all([
        prenotazioniApi.getAll({ data_da: today, data_a: today, limit: 100 }),
        prenotazioniApi.getAll({ data_da: tomorrow, data_a: tomorrow, limit: 100 }),
      ]);

      // Sort by time ascending
      const sortByTime = (a: Prenotazione, b: Prenotazione) =>
        a.ora_inizio_prevista.localeCompare(b.ora_inizio_prevista);

      setTodayData(todayRes.data.sort(sortByTime));
      setTomorrowData(tomorrowRes.data.sort(sortByTime));
    } catch {
      setError('Errore nel caricamento dei dati della dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPI calculations for today
  const STATI_ATTIVI = [
    'preso_in_carico', 'in_produzione',                          // produzione
    'in_preparazione', 'pronto_carico', 'in_carico', 'caricato', // consegne
  ];
  const todayTotal = todayData.length;
  const todayActive = todayData.filter((p) => STATI_ATTIVI.includes(p.stato)).length;
  const todayCompleted = todayData.filter((p) =>
    isStatoFinale(p.tipologia, p.stato) && p.stato !== 'annullato'
  ).length;
  const todayPlanned = todayData.filter((p) => p.stato === 'pianificato').length;

  const todayProduzione = todayData.filter((p) => p.tipologia === 'produzione').length;
  const todayConsegne = todayData.filter((p) => p.tipologia === 'consegna').length;
  const tomorrowTotal = tomorrowData.length;

  const handleRowClick = (p: Prenotazione) => {
    navigate(`/${p.tipologia === 'produzione' ? 'produzione' : 'consegne'}/prenotazioni/${p.id}`);
  };

  const sections = [
    {
      title: 'Planning Produzione',
      subtitle: 'Calendario e prenotazioni',
      icon: Factory,
      color: '#1e40af',
      path: '/produzione/calendario',
      enabled: hasSection('produzione'),
    },
    {
      title: 'Planning Consegne',
      subtitle: 'Calendario e prenotazioni',
      icon: Inventory,
      color: '#7c3aed',
      path: '/consegne/calendario',
      enabled: hasSection('consegne'),
    },
  ];

  const today = getToday();
  const tomorrow = getTomorrow();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4">
            Buongiorno, {user?.nome}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {formatDate(today)} &middot; Riepilogo operativo
          </Typography>
        </Box>
        <IconButton onClick={loadData} disabled={loading} aria-label="Aggiorna dati">
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Oggi Totale"
            value={loading ? 0 : todayTotal}
            icon={<CalendarToday sx={{ color: '#1e40af', fontSize: 24 }} />}
            color="#1e40af"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="In Corso"
            value={loading ? 0 : todayActive}
            icon={<PlayArrow sx={{ color: '#f59e0b', fontSize: 24 }} />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Completati"
            value={loading ? 0 : todayCompleted}
            icon={<CheckCircle sx={{ color: '#059669', fontSize: 24 }} />}
            color="#059669"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Pianificati"
            value={loading ? 0 : todayPlanned}
            icon={<Schedule sx={{ color: '#3b82f6', fontSize: 24 }} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Produzione"
            value={loading ? 0 : todayProduzione}
            icon={<Factory sx={{ color: '#1e40af', fontSize: 24 }} />}
            color="#1e40af"
            subtitle="oggi"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Consegne"
            value={loading ? 0 : todayConsegne}
            icon={<Inventory sx={{ color: '#7c3aed', fontSize: 24 }} />}
            color="#7c3aed"
            subtitle="oggi"
          />
        </Grid>
      </Grid>

      {/* Activity Tables */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <ActivityTable
            title={`Attivit\u00e0 di Oggi`}
            subtitle={`${formatDate(today)} \u2014 ${todayTotal} prenotazion${todayTotal === 1 ? 'e' : 'i'}`}
            prenotazioni={todayData}
            loading={loading}
            onRowClick={handleRowClick}
            emptyMessage="Nessuna attivit\u00e0 pianificata per oggi"
          />
        </Grid>
        <Grid item xs={12}>
          <ActivityTable
            title={`Attivit\u00e0 di Domani`}
            subtitle={`${formatDate(tomorrow)} \u2014 ${tomorrowTotal} prenotazion${tomorrowTotal === 1 ? 'e' : 'i'}`}
            prenotazioni={tomorrowData}
            loading={loading}
            onRowClick={handleRowClick}
            emptyMessage="Nessuna attivit\u00e0 pianificata per domani"
          />
        </Grid>
      </Grid>

      {/* Quick Navigation */}
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
        Accesso rapido
      </Typography>
      <Grid container spacing={2}>
        {sections
          .filter((s) => s.enabled)
          .map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.path}>
              <Card
                sx={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(section.path)}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        bgcolor: `${section.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <section.icon sx={{ fontSize: 24, color: section.color }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {section.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {section.subtitle}
                      </Typography>
                    </Box>
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
