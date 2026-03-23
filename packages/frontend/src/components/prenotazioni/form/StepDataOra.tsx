import React, { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form';
import { configurazioneService } from '../../../services';
import { format, parseISO, parse, addMinutes } from 'date-fns';

interface StepDataOraProps {
  control: Control<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export default function StepDataOra({
  control,
  errors,
  watch,
  setValue,
}: StepDataOraProps) {
  const [durataCalcolata, setDurataCalcolata] = useState<number | null>(null);
  const [oraFineCalcolata, setOraFineCalcolata] = useState<string | null>(null);

  const quantita = watch('quantita_prevista');
  const unitaMisura = watch('unita_misura');
  const categoria = watch('categoria_prodotto');
  const oraInizio = watch('ora_inizio_prevista');
  const cambioProdotto = watch('cambio_prodotto');

  // Calculate durata when relevant fields change
  useEffect(() => {
    if (!quantita || !categoria) {
      setDurataCalcolata(null);
      setOraFineCalcolata(null);
      return;
    }

    // Convert to tons
    let quantitaTon = quantita;
    if (unitaMisura === 'kg') quantitaTon = quantita / 1000;
    else if (unitaMisura === 'sacchi') quantitaTon = (quantita * 25) / 1000;
    else if (unitaMisura === 'pallet') quantitaTon = quantita; // pallet ~ 1 ton

    configurazioneService
      .calcolaDurata({ categoria, quantita_ton: quantitaTon })
      .then((res) => {
        const durata = cambioProdotto
          ? res.durata_minuti + res.tempo_pulizia
          : res.durata_minuti;
        setDurataCalcolata(durata);
        setValue('durata_prevista_minuti', durata);

        // Calculate end time
        if (oraInizio) {
          try {
            const startTime = parse(oraInizio, 'HH:mm', new Date());
            const endTime = addMinutes(startTime, durata);
            const oraFine = format(endTime, 'HH:mm');
            setOraFineCalcolata(oraFine);
            setValue('ora_fine_prevista', oraFine);
          } catch {
            setOraFineCalcolata(null);
          }
        }
      })
      .catch(() => {
        setDurataCalcolata(null);
        setOraFineCalcolata(null);
      });
  }, [quantita, unitaMisura, categoria, oraInizio, cambioProdotto, setValue]);

  return (
    <Grid container spacing={3}>
      {/* Data Pianificata */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="data_pianificata"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Data Pianificata *"
              value={field.value ? parseISO(field.value) : null}
              onChange={(date) =>
                field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.data_pianificata,
                  helperText: errors.data_pianificata
                    ? String(errors.data_pianificata.message)
                    : undefined,
                },
              }}
            />
          )}
        />
      </Grid>

      {/* Ora Inizio Prevista */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="ora_inizio_prevista"
          control={control}
          render={({ field }) => (
            <TimePicker
              label="Ora Inizio Prevista *"
              ampm={false}
              value={
                field.value
                  ? parse(field.value, 'HH:mm', new Date())
                  : null
              }
              onChange={(time) =>
                field.onChange(time ? format(time, 'HH:mm') : '')
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.ora_inizio_prevista,
                  helperText: errors.ora_inizio_prevista
                    ? String(errors.ora_inizio_prevista.message)
                    : undefined,
                },
              }}
            />
          )}
        />
      </Grid>

      {/* Cambio Prodotto Switch */}
      <Grid size={{ xs: 12 }}>
        <Controller
          name="cambio_prodotto"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label="Cambio prodotto (aggiunge tempo di pulizia)"
            />
          )}
        />
      </Grid>

      {/* Calculated fields */}
      {durataCalcolata != null && (
        <Grid size={{ xs: 12 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2, bgcolor: 'action.hover' }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Durata prevista
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {durataCalcolata} minuti
                </Typography>
              </Box>
              {oraFineCalcolata && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fine prevista
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {oraFineCalcolata}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}
