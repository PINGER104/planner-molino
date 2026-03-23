import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Box,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { TIPOLOGIA_CARICO } from '@planner-molino/shared';
import type { DatiCarico, PrenotazioneView } from '@planner-molino/shared';
import { format, parseISO } from 'date-fns';
import DatiCaricoForm from './DatiCaricoForm';

interface DatiCaricoSectionProps {
  datiCarico: DatiCarico | null;
  prenotazione: PrenotazioneView;
  onRegistra: () => void;
}

function LabelValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">
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

// Determine if stato is before "in_carico"
const STATI_BEFORE_IN_CARICO = [
  'pianificato',
  'preso_in_carico',
  'in_preparazione',
  'pronto_carico',
];

export default function DatiCaricoSection({
  datiCarico,
  prenotazione,
  onRegistra,
}: DatiCaricoSectionProps) {
  const [formOpen, setFormOpen] = useState(false);

  // Only visible for consegne
  if (prenotazione.tipologia !== 'consegna') return null;

  const isBeforeInCarico = STATI_BEFORE_IN_CARICO.includes(prenotazione.stato);

  // If no dati carico and not yet in_carico
  if (!datiCarico && isBeforeInCarico) {
    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Dati di Carico
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Disponibile quando in stato "In carico"
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // If no dati carico and stato is in_carico
  if (!datiCarico && prenotazione.stato === 'in_carico') {
    return (
      <>
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Dati di Carico
            </Typography>
            <Button
              variant="contained"
              startIcon={<LocalShippingIcon />}
              onClick={() => setFormOpen(true)}
            >
              Registra Dati Carico
            </Button>
          </CardContent>
        </Card>
        <DatiCaricoForm
          open={formOpen}
          prenotazioneId={prenotazione.id}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            onRegistra();
          }}
        />
      </>
    );
  }

  // If no dati carico and stato after in_carico
  if (!datiCarico) {
    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Dati di Carico
          </Typography>
          <Button
            variant="contained"
            startIcon={<LocalShippingIcon />}
            onClick={() => setFormOpen(true)}
          >
            Registra Dati Carico
          </Button>
        </CardContent>
        <DatiCaricoForm
          open={formOpen}
          prenotazioneId={prenotazione.id}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            onRegistra();
          }}
        />
      </Card>
    );
  }

  // Display dati carico
  const dc = datiCarico;

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Dati di Carico
        </Typography>

        {/* Veicolo */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Veicolo
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <LabelValue label="Targa Automezzo" value={dc.targa_automezzo} />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <LabelValue label="Targa Rimorchio" value={dc.targa_rimorchio} />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <LabelValue label="Autista" value={dc.nome_autista} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Lotto */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Lotto
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <LabelValue label="Lotto Caricato" value={dc.lotto_caricato} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <LabelValue
              label="Scadenza"
              value={formatDate(dc.scadenza_lotto)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Pesi */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Pesi
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <LabelValue
              label="Peso Netto"
              value={
                dc.peso_caricato_kg != null
                  ? `${dc.peso_caricato_kg.toLocaleString('it-IT')} kg`
                  : null
              }
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <LabelValue
              label="Tara"
              value={
                dc.peso_tara_kg != null
                  ? `${dc.peso_tara_kg.toLocaleString('it-IT')} kg`
                  : null
              }
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <LabelValue
              label="Peso Lordo"
              value={
                dc.peso_lordo_kg != null
                  ? `${dc.peso_lordo_kg.toLocaleString('it-IT')} kg`
                  : null
              }
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Orari */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Orari
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <LabelValue label="Inizio" value={formatTime(dc.ora_inizio_carico)} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <LabelValue label="Fine" value={formatTime(dc.ora_fine_carico)} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Idoneita */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Idoneita Trasporto
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Chip
            label={dc.idoneita_trasporto ? 'Idoneo' : 'Non Idoneo'}
            color={dc.idoneita_trasporto ? 'success' : 'error'}
            size="small"
          />
        </Box>
        {dc.idoneita_note && (
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {dc.idoneita_note}
          </Typography>
        )}

        {/* DDT */}
        {(dc.ddt_numero || dc.ddt_data) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              DDT
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <LabelValue label="Numero" value={dc.ddt_numero} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LabelValue label="Data" value={formatDate(dc.ddt_data)} />
              </Grid>
            </Grid>
          </>
        )}

        {/* Tipologia carico */}
        {dc.tipologia_carico && (
          <>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <LabelValue
                  label="Tipologia Carico"
                  value={TIPOLOGIA_CARICO[dc.tipologia_carico] || dc.tipologia_carico}
                />
              </Grid>
              {dc.numero_colli != null && (
                <Grid size={{ xs: 6 }}>
                  <LabelValue
                    label="Numero Colli"
                    value={dc.numero_colli}
                  />
                </Grid>
              )}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}
