import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import { type UseFormGetValues } from 'react-hook-form';
import {
  CATEGORIE_PRODOTTO,
  UNITA_MISURA,
  ORIGINE_MATERIALE,
  TIPOLOGIA_CARICO,
  PRIORITA_LABELS,
} from '@planner-molino/shared';
import type { TipologiaPrenotazione } from '@planner-molino/shared';
import { clientiService, trasportatoriService } from '../../../services';
import { format, parseISO } from 'date-fns';

interface StepRiepilogoProps {
  getValues: UseFormGetValues<any>;
  tipologia: TipologiaPrenotazione;
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
            Non specificato
          </Typography>
        )}
      </Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {children}
      </Typography>
    </>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export default function StepRiepilogo({
  getValues,
  tipologia,
}: StepRiepilogoProps) {
  const values = getValues();
  const [clienteLabel, setClienteLabel] = useState<string>('');
  const [trasportatoreLabel, setTrasportatoreLabel] = useState<string>('');

  useEffect(() => {
    if (values.cliente_id) {
      clientiService
        .dropdown()
        .then((items) => {
          const found = items.find(
            (c: { id: number }) => c.id === values.cliente_id
          );
          if (found) setClienteLabel(`${found.codice} - ${found.ragione_sociale}`);
        })
        .catch(console.error);
    }
    if (values.trasportatore_id) {
      trasportatoriService
        .dropdown()
        .then((items) => {
          const found = items.find(
            (t: { id: number }) => t.id === values.trasportatore_id
          );
          if (found)
            setTrasportatoreLabel(`${found.codice} - ${found.ragione_sociale}`);
        })
        .catch(console.error);
    }
  }, [values.cliente_id, values.trasportatore_id]);

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Generale */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Generale
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LabelValue
              label="Tipologia"
              value={
                <Chip
                  label={tipologia === 'produzione' ? 'Produzione' : 'Consegna'}
                  size="small"
                  color={tipologia === 'produzione' ? 'secondary' : 'primary'}
                />
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LabelValue label="Cliente" value={clienteLabel} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LabelValue label="Trasportatore" value={trasportatoreLabel} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LabelValue
              label="Priorita"
              value={
                values.priorita
                  ? `${values.priorita} - ${PRIORITA_LABELS[values.priorita] || ''}`
                  : ''
              }
            />
          </Grid>
        </Grid>

        {/* Prodotto */}
        <SectionTitle>Prodotto</SectionTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <LabelValue label="Codice" value={values.prodotto_codice} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <LabelValue label="Descrizione" value={values.prodotto_descrizione} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <LabelValue
              label="Categoria"
              value={
                values.categoria_prodotto
                  ? CATEGORIE_PRODOTTO[values.categoria_prodotto]
                  : ''
              }
            />
          </Grid>
          {(values.specifica_w != null || values.specifica_pl != null) && (
            <>
              <Grid size={{ xs: 6, md: 3 }}>
                <LabelValue
                  label="Specifica W"
                  value={
                    values.specifica_w != null
                      ? `${values.specifica_w}${values.specifica_w_tolleranza != null ? ` (+/-${values.specifica_w_tolleranza})` : ''}`
                      : ''
                  }
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LabelValue
                  label="Specifica PL"
                  value={
                    values.specifica_pl != null
                      ? `${values.specifica_pl}${values.specifica_pl_tolleranza != null ? ` (+/-${values.specifica_pl_tolleranza})` : ''}`
                      : ''
                  }
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue
              label="Quantita"
              value={
                values.quantita_prevista
                  ? `${values.quantita_prevista} ${values.unita_misura ? UNITA_MISURA[values.unita_misura] || values.unita_misura : ''}`
                  : ''
              }
            />
          </Grid>
          {tipologia === 'produzione' && values.origine_materiale && (
            <Grid size={{ xs: 6, md: 3 }}>
              <LabelValue
                label="Origine Materiale"
                value={ORIGINE_MATERIALE[values.origine_materiale] || ''}
              />
            </Grid>
          )}
          {tipologia === 'consegna' && values.tipologia_carico && (
            <Grid size={{ xs: 6, md: 3 }}>
              <LabelValue
                label="Tipologia Carico"
                value={TIPOLOGIA_CARICO[values.tipologia_carico] || ''}
              />
            </Grid>
          )}
        </Grid>

        {/* Programmazione */}
        <SectionTitle>Programmazione</SectionTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue
              label="Data"
              value={formatDate(values.data_pianificata)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue label="Ora Inizio" value={values.ora_inizio_prevista} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue
              label="Durata"
              value={
                values.durata_prevista_minuti
                  ? `${values.durata_prevista_minuti} minuti`
                  : ''
              }
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LabelValue label="Ora Fine" value={values.ora_fine_prevista} />
          </Grid>
        </Grid>

        {/* Note */}
        {values.note && (
          <>
            <SectionTitle>Note</SectionTitle>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {values.note}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
