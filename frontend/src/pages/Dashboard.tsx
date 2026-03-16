import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  LinearProgress,
  Fade,
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
  TrendingUp,
  ArrowDownward,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { prenotazioniApi } from '../services/supabaseApi';
import { Prenotazione } from '../types';
import { StatoBadge } from '../components/common';
import { isStatoFinale } from '../utils/statiConfig';

/* ─── helpers ────────────────────────────────────────────────────────── */

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
  return timeStr.slice(0, 5);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

/* ─── animated counter ───────────────────────────────────────────────── */

const useAnimatedValue = (target: number, duration = 600) => {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

/* ─── pull-to-refresh hook ───────────────────────────────────────────── */

const PULL_THRESHOLD = 80;

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY > 0) {
        // Dampen the pull — feels more natural
        const dampened = Math.min(deltaY * 0.45, 140);
        setPullDistance(dampened);
        if (dampened > 10) {
          e.preventDefault();
        }
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh]);

  return { containerRef, pullDistance, refreshing };
}

/* ─── KPI card (redesigned) ──────────────────────────────────────────── */

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading: boolean;
  delay?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, subtitle, loading, delay = 0 }) => {
  const animatedValue = useAnimatedValue(loading ? 0 : value);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Fade in={visible} timeout={500}>
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 24px -4px ${color}30`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
          },
        }}
      >
        <CardContent sx={{ py: 2.5, px: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.2,
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color,
                  mt: 0.75,
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {loading ? (
                  <Skeleton width={48} height={36} />
                ) : (
                  animatedValue
                )}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: '0.7rem' }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                border: `1px solid ${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

/* ─── activity table (improved) ──────────────────────────────────────── */

interface ActivityTableProps {
  title: string;
  subtitle: string;
  prenotazioni: Prenotazione[];
  loading: boolean;
  onRowClick: (p: Prenotazione) => void;
  emptyMessage: string;
  count: number;
}

const ActivityTable: React.FC<ActivityTableProps> = ({
  title,
  subtitle,
  prenotazioni,
  loading,
  onRowClick,
  emptyMessage,
  count,
}) => (
  <Paper
    sx={{
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '14px',
    }}
  >
    {/* Header */}
    <Box
      sx={{
        px: 2.5,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
            {title}
          </Typography>
          <Chip
            label={count}
            size="small"
            sx={{
              height: 22,
              minWidth: 28,
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: count > 0 ? 'primary.main' : 'grey.300',
              color: count > 0 ? 'white' : 'text.secondary',
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>

    {/* Table */}
    <TableContainer sx={{ maxHeight: 420 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 90 }}>Orario</TableCell>
            <TableCell sx={{ width: 110 }}>Codice</TableCell>
            <TableCell sx={{ width: 70 }}>Tipo</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Prodotto</TableCell>
            <TableCell sx={{ width: 100 }}>Quantit&agrave;</TableCell>
            <TableCell sx={{ width: 120 }}>Stato</TableCell>
            <TableCell align="right" sx={{ width: 50 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" sx={{ borderRadius: 1 }} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : prenotazioni.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Box sx={{ py: 5 }}>
                  <Schedule sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            prenotazioni.map((p, idx) => (
              <TableRow
                key={p.id}
                hover
                sx={{
                  cursor: 'pointer',
                  bgcolor: idx % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.6)',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    bgcolor: 'rgba(30,64,175,0.04) !important',
                  },
                }}
                onClick={() => onRowClick(p)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                    {formatTime(p.ora_inizio_prevista)}
                  </Typography>
                  {p.ora_fine_prevista && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      – {formatTime(p.ora_fine_prevista)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'primary.dark',
                      bgcolor: 'primary.main',
                      px: 0.8,
                      py: 0.2,
                      borderRadius: '4px',
                      display: 'inline-block',
                      background: 'rgba(30,64,175,0.06)',
                    }}
                  >
                    {p.codice_prenotazione}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.tipologia === 'produzione' ? 'Prod.' : 'Cons.'}
                    size="small"
                    sx={{
                      fontSize: '0.68rem',
                      height: 22,
                      fontWeight: 600,
                      bgcolor: p.tipologia === 'produzione' ? 'rgba(30,64,175,0.08)' : 'rgba(124,58,237,0.08)',
                      color: p.tipologia === 'produzione' ? 'primary.dark' : 'secondary.dark',
                      border: 'none',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 160, fontSize: '0.82rem' }}>
                    {p.cliente_ragione_sociale || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 140, fontSize: '0.82rem', color: 'text.secondary' }}>
                    {p.prodotto_descrizione || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>
                    {p.quantita_prevista != null
                      ? `${p.quantita_prevista} ${p.unita_misura || 'kg'}`
                      : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatoBadge stato={p.stato} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Apri dettaglio" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        opacity: 0.5,
                        transition: 'opacity 0.15s',
                        'tr:hover &': { opacity: 1 },
                      }}
                    >
                      <OpenInNew sx={{ fontSize: 16 }} />
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

/* ─── summary bar ────────────────────────────────────────────────────── */

const SummaryBar: React.FC<{
  todayProd: number;
  todayCons: number;
  total: number;
  loading: boolean;
}> = ({ todayProd, todayCons, total, loading }) => {
  if (loading || total === 0) return null;
  const prodPct = (todayProd / total) * 100;
  const consPct = (todayCons / total) * 100;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Distribuzione attivit&agrave;
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          {todayProd} produzione &middot; {todayCons} consegne
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'grey.100',
        }}
      >
        <Box
          sx={{
            width: `${prodPct}%`,
            bgcolor: 'primary.main',
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
            borderRadius: prodPct === 100 ? 3 : '3px 0 0 3px',
          }}
        />
        <Box
          sx={{
            width: `${consPct}%`,
            bgcolor: 'secondary.main',
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
            borderRadius: consPct === 100 ? 3 : '0 3px 3px 0',
          }}
        />
      </Box>
    </Box>
  );
};

/* ─── pull indicator ─────────────────────────────────────────────────── */

const PullIndicator: React.FC<{ distance: number; refreshing: boolean }> = ({
  distance,
  refreshing,
}) => {
  const progress = Math.min(distance / PULL_THRESHOLD, 1);
  const rotation = refreshing ? undefined : progress * 180;
  const isReady = distance >= PULL_THRESHOLD;

  if (distance === 0 && !refreshing) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: distance,
        overflow: 'hidden',
        transition: refreshing ? 'none' : 'height 0.15s ease-out',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: 'background.paper',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.5 + progress * 0.5})`,
          opacity: 0.3 + progress * 0.7,
          transition: refreshing ? 'none' : 'transform 0.1s ease-out, opacity 0.1s ease-out',
        }}
      >
        {refreshing ? (
          <Box
            sx={{
              width: 20,
              height: 20,
              border: '2px solid',
              borderColor: 'primary.main',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'ptr-spin 0.7s linear infinite',
              '@keyframes ptr-spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        ) : (
          <ArrowDownward
            sx={{
              fontSize: 18,
              color: isReady ? 'primary.main' : 'text.secondary',
              transform: `rotate(${rotation}deg)`,
              transition: 'color 0.15s',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

/* ─── Dashboard ──────────────────────────────────────────────────────── */

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasSection } = useAuth();

  const [todayData, setTodayData] = useState<Prenotazione[]>([]);
  const [tomorrowData, setTomorrowData] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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

      const sortByTime = (a: Prenotazione, b: Prenotazione) =>
        a.ora_inizio_prevista.localeCompare(b.ora_inizio_prevista);

      setTodayData(todayRes.data.sort(sortByTime));
      setTomorrowData(tomorrowRes.data.sort(sortByTime));
      setLastRefresh(new Date());
    } catch {
      setError('Errore nel caricamento dei dati della dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull-to-refresh
  const { containerRef, pullDistance, refreshing } = usePullToRefresh(loadData);

  // KPI calculations
  const STATI_ATTIVI = [
    'preso_in_carico', 'in_produzione',
    'in_preparazione', 'pronto_carico', 'in_carico', 'caricato',
  ];
  const todayTotal = todayData.length;
  const todayActive = todayData.filter((p) => STATI_ATTIVI.includes(p.stato)).length;
  const todayCompleted = todayData.filter(
    (p) => isStatoFinale(p.tipologia, p.stato) && p.stato !== 'annullato'
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
    <Box
      ref={containerRef}
      sx={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull-to-refresh indicator */}
      <PullIndicator distance={pullDistance} refreshing={refreshing} />

      {/* Loading bar */}
      {(loading || refreshing) && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            zIndex: 1200,
            height: 2,
          }}
        />
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.4rem', sm: '1.65rem' },
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {getGreeting()}, {user?.nome}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: 'text.secondary',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {formatDate(today)}
            {lastRefresh && (
              <>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    bgcolor: 'text.disabled',
                    mx: 0.5,
                  }}
                />
                Agg. {lastRefresh.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </>
            )}
          </Typography>
        </Box>
        <Tooltip title="Aggiorna dati" arrow>
          <span>
          <IconButton
            onClick={loadData}
            disabled={loading || refreshing}
            aria-label="Aggiorna dati"
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              width: 40,
              height: 40,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'grey.50',
                borderColor: 'grey.300',
              },
              '& svg': {
                transition: 'transform 0.3s ease',
              },
              '&:hover svg': {
                transform: 'rotate(90deg)',
              },
            }}
          >
            <Refresh sx={{ fontSize: 20 }} />
          </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 1.5 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Oggi Totale"
            value={todayTotal}
            icon={<CalendarToday sx={{ color: '#1e40af', fontSize: 22 }} />}
            color="#1e40af"
            loading={loading}
            delay={0}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="In Corso"
            value={todayActive}
            icon={<PlayArrow sx={{ color: '#f59e0b', fontSize: 22 }} />}
            color="#f59e0b"
            loading={loading}
            delay={60}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Completati"
            value={todayCompleted}
            icon={<CheckCircle sx={{ color: '#059669', fontSize: 22 }} />}
            color="#059669"
            loading={loading}
            delay={120}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Pianificati"
            value={todayPlanned}
            icon={<Schedule sx={{ color: '#3b82f6', fontSize: 22 }} />}
            color="#3b82f6"
            loading={loading}
            delay={180}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Produzione"
            value={todayProduzione}
            icon={<Factory sx={{ color: '#1e40af', fontSize: 22 }} />}
            color="#1e40af"
            subtitle="oggi"
            loading={loading}
            delay={240}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            title="Consegne"
            value={todayConsegne}
            icon={<Inventory sx={{ color: '#7c3aed', fontSize: 22 }} />}
            color="#7c3aed"
            subtitle="oggi"
            loading={loading}
            delay={300}
          />
        </Grid>
      </Grid>

      {/* Distribution bar */}
      <SummaryBar
        todayProd={todayProduzione}
        todayCons={todayConsegne}
        total={todayTotal}
        loading={loading}
      />

      {/* Activity Tables */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
        <ActivityTable
          title={"Attivit\u00e0 di Oggi"}
          subtitle={formatDate(today)}
          prenotazioni={todayData}
          loading={loading}
          onRowClick={handleRowClick}
          emptyMessage={"Nessuna attivit\u00e0 pianificata per oggi"}
          count={todayTotal}
        />
        <ActivityTable
          title={"Attivit\u00e0 di Domani"}
          subtitle={formatDate(tomorrow)}
          prenotazioni={tomorrowData}
          loading={loading}
          onRowClick={handleRowClick}
          emptyMessage={"Nessuna attivit\u00e0 pianificata per domani"}
          count={tomorrowTotal}
        />
      </Box>

      {/* Quick Navigation */}
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            mb: 1.5,
            display: 'block',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
          }}
        >
          Accesso rapido
        </Typography>
        <Grid container spacing={2}>
          {sections
            .filter((s) => s.enabled)
            .map((section, idx) => (
              <Grid item xs={12} sm={6} md={4} key={section.path}>
                <Fade in timeout={400} style={{ transitionDelay: `${idx * 100}ms` }}>
                  <Card
                    sx={{
                      transition: 'transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 24px -6px ${section.color}25`,
                      },
                    }}
                  >
                    <CardActionArea onClick={() => navigate(section.path)}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            background: `linear-gradient(135deg, ${section.color}15, ${section.color}08)`,
                            border: `1px solid ${section.color}12`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <section.icon sx={{ fontSize: 24, color: section.color }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {section.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                            {section.subtitle}
                          </Typography>
                        </Box>
                        <TrendingUp
                          sx={{
                            ml: 'auto',
                            fontSize: 18,
                            color: 'grey.300',
                            transition: 'color 0.2s',
                            '.MuiCardActionArea-root:hover &': { color: section.color },
                          }}
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
