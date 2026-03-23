import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import StatoBadge from '../../common/StatoBadge';
import {
  CATEGORIE_PRODOTTO,
  UNITA_MISURA,
  ORIGINE_MATERIALE,
  TIPOLOGIA_CARICO,
  PRIORITA_LABELS,
} from '@planner-molino/shared';
import type { PrenotazioneView } from '@planner-molino/shared';
import { format, parseISO } from 'date-fns';

interface InfoCardProps {
  prenotazione: PrenotazioneView;
}

function LabelValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={mono ? { fontFamily: '"JetBrains Mono", monospace' } : undefined}
      >
        {value || (
          <Typography component="span" color="text.disabled">
            -
          </Typography>
        )}
      </Typography>
    </Box>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5);
}

function formatDateTime(dtStr: string | null): string {
  if (!dtStr) return '-';
  try {
    return format(parseISO(dtStr), 'dd/MM/yyyy HH:mm');
  } catch {
    return dtStr;
  }
}

export default function InfoCard({ prenotazione }: InfoCardProps) {
  const navigate = useNavigate();
  const p = prenotazione;

  const collegataId =
    p.tipologia === 'produzione'
      ? p.prenotazione_consegna_collegata
      : p.prenotazione_produzione_collegata;
  const collegataPath =
    p.tipologia === 'produzione'
      ? `/consegne/prenotazioni/${collegataId}`
      : `/produzione/prenotazioni/${collegataId}`;

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}
          >
            {p.codice_prenotazione}
          </Typography>
          <StatoBadge stato={p.stato} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Generale */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Generale
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue
              label="Tipologia"
              value={
                <Chip
                  label={p.tipologia === 'produzione' ? 'Produzione' : 'Consegna'}
                  size="small"
                  color={p.tipologia === 'produzione' ? 'secondary' : 'primary'}
                />
              }
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue
              label="Priorita"
              value={`${p.priorita} - ${PRIORITA_LABELS[p.priorita] || ''}`}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <LabelValue label="Creato il" value={formatDateTime(p.created_at)} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Cliente */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Cliente
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LabelValue
              label="Ragione Sociale"
              value={p.cliente_ragione_sociale}
            />
          </Grid>
        </Grid>

        {/* Trasportatore */}
        {p.trasportatore_ragione_sociale && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Trasportatore
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelValue
                  label="Ragione Sociale"
                  value={p.trasportatore_ragione_sociale}
                />
              </Grid>
            </Grid>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Prodotto */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Prodotto
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue label="Codice" value={p.prodotto_codice} mono />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue label="Descrizione" value={p.prodotto_descrizione} />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue
              label="Categoria"
              value={
                p.categoria_prodotto
                  ? CATEGORIE_PRODOTTO[p.categoria_prodotto]
                  : null
              }
            />
          </Grid>
          {(p.specifica_w != null || p.specifica_pl != null) && (
            <>
              <Grid size={{ xs: 6, md: 3 }}>
                <LabelValue
                  label="Specifica W"
                  value={
                    p.specifica_w != null
                      ? `${p.specifica_w}${p.specifica_w_tolleranza != null ? ` (+/-${p.specifica_w_tolleranza})` : ''}`
                      : null
                  }
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LabelValue
                  label="Specifica PL"
                  value={
                    p.specifica_pl != null
                      ? `${p.specifica_pl}${p.specifica_pl_tolleranza != null ? ` (+/-${p.specifica_pl_tolleranza})` : ''}`
                      : null
                  }
                />
              </Grid>
            </>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Quantita */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Quantita
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue
              label="Quantita Prevista"
              value={
                p.quantita_prevista != null
                  ? `${p.quantita_prevista.toLocaleString('it-IT')} ${p.unita_misura ? UNITA_MISURA[p.unita_misura] || p.unita_misura : ''}`
                  : null
              }
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <LabelValue
              label="Quantita Kg"
              value={
                p.quantita_kg != null
                  ? `${p.quantita_kg.toLocaleString('it-IT')} kg`
                  : null
              }
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Programmazione */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Programmazione
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue label="Data" value={formatDate(p.data_pianificata)} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue
              label="Ora Inizio"
              value={formatTime(p.ora_inizio_prevista)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue
              label="Ora Fine"
              value={formatTime(p.ora_fine_prevista)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue
              label="Durata"
              value={
                p.durata_prevista_minuti
                  ? `${p.durata_prevista_minuti} min`
                  : null
              }
            />
          </Grid>
        </Grid>

        {/* Lotto */}
        {(p.lotto_previsto || p.lotto_scadenza) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Lotto
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 6 }}>
                <LabelValue label="Lotto Previsto" value={p.lotto_previsto} />
              </Grid>
              <Grid size={{ xs: 6, md: 6 }}>
                <LabelValue
                  label="Scadenza"
                  value={formatDate(p.lotto_scadenza)}
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Note */}
        {p.note && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Note
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {p.note}
            </Typography>
          </>
        )}

        {/* Link prenotazione collegata */}
        {collegataId && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Prenotazione Collegata
            </Typography>
            <Chip
              label={
                p.tipologia === 'produzione'
                  ? `Consegna #${collegataId}`
                  : `Produzione #${collegataId}`
              }
              color="info"
              variant="outlined"
              clickable
              onClick={() => navigate(collegataPath)}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
