import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  InputAdornment,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDatiCaricoSchema, TIPOLOGIA_CARICO } from '@planner-molino/shared';
import { prenotazioniService } from '../../../services';
import { format, parseISO, parse } from 'date-fns';

interface DatiCaricoFormProps {
  open: boolean;
  prenotazioneId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DatiCaricoForm({
  open,
  prenotazioneId,
  onClose,
  onSuccess,
}: DatiCaricoFormProps) {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDatiCaricoSchema),
    defaultValues: {
      data_carico: format(new Date(), 'yyyy-MM-dd'),
      ora_inizio_carico: undefined as string | undefined,
      ora_fine_carico: undefined as string | undefined,
      idoneita_trasporto: true,
      idoneita_note: '',
      targa_automezzo: '',
      targa_rimorchio: '',
      nome_autista: '',
      lotto_caricato: '',
      scadenza_lotto: undefined as string | undefined,
      peso_caricato_kg: undefined as number | undefined,
      peso_tara_kg: undefined as number | undefined,
      peso_lordo_kg: undefined as number | undefined,
      tipologia_carico: undefined as string | undefined,
      numero_colli: undefined as number | undefined,
      ddt_numero: '',
      ddt_data: undefined as string | undefined,
      foto_carico: [] as string[],
    },
  });

  const pesoNetto = watch('peso_caricato_kg');
  const pesoTara = watch('peso_tara_kg');
  const idoneitaTrasporto = watch('idoneita_trasporto');

  // Auto-calculate peso lordo
  useEffect(() => {
    if (pesoNetto != null && pesoTara != null) {
      setValue('peso_lordo_kg', pesoNetto + pesoTara);
    } else if (pesoNetto != null) {
      setValue('peso_lordo_kg', pesoNetto);
    }
  }, [pesoNetto, pesoTara, setValue]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        data_carico: format(new Date(), 'yyyy-MM-dd'),
        ora_inizio_carico: undefined,
        ora_fine_carico: undefined,
        idoneita_trasporto: true,
        idoneita_note: '',
        targa_automezzo: '',
        targa_rimorchio: '',
        nome_autista: '',
        lotto_caricato: '',
        scadenza_lotto: undefined,
        peso_caricato_kg: undefined,
        peso_tara_kg: undefined,
        peso_lordo_kg: undefined,
        tipologia_carico: undefined,
        numero_colli: undefined,
        ddt_numero: '',
        ddt_data: undefined,
        foto_carico: [],
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Clean empty strings
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, v]) => v !== '' && v !== undefined && v !== null
        )
      );
      // Ensure required fields
      cleanData.idoneita_trasporto = data.idoneita_trasporto;
      if (data.foto_carico) cleanData.foto_carico = data.foto_carico;

      await prenotazioniService.createDatiCarico(prenotazioneId, cleanData);
      setSnackbar({
        open: true,
        message: 'Dati di carico registrati con successo',
        severity: 'success',
      });
      setTimeout(() => onSuccess(), 500);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Errore nel salvataggio',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Registra Dati di Carico</DialogTitle>
        <DialogContent>
          <form id="dati-carico-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              {/* Sezione Veicolo */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Veicolo
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="targa_automezzo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Targa Automezzo *"
                      fullWidth
                      error={!!errors.targa_automezzo}
                      helperText={
                        errors.targa_automezzo
                          ? String(errors.targa_automezzo.message)
                          : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="targa_rimorchio"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Targa Rimorchio"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="nome_autista"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Nome Autista"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Sezione Carico */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Carico
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="data_carico"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Data Carico *"
                      value={field.value ? parseISO(field.value) : null}
                      onChange={(date) =>
                        field.onChange(
                          date ? format(date, 'yyyy-MM-dd') : ''
                        )
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.data_carico,
                          helperText: errors.data_carico
                            ? String(errors.data_carico.message)
                            : undefined,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="ora_inizio_carico"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Ora Inizio"
                      ampm={false}
                      value={
                        field.value
                          ? parse(field.value, 'HH:mm', new Date())
                          : null
                      }
                      onChange={(time) =>
                        field.onChange(time ? format(time, 'HH:mm') : undefined)
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="ora_fine_carico"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Ora Fine"
                      ampm={false}
                      value={
                        field.value
                          ? parse(field.value, 'HH:mm', new Date())
                          : null
                      }
                      onChange={(time) =>
                        field.onChange(time ? format(time, 'HH:mm') : undefined)
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Sezione Lotto */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Lotto
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="lotto_caricato"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Lotto Caricato *"
                      fullWidth
                      error={!!errors.lotto_caricato}
                      helperText={
                        errors.lotto_caricato
                          ? String(errors.lotto_caricato.message)
                          : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="scadenza_lotto"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Scadenza Lotto"
                      value={field.value ? parseISO(field.value) : null}
                      onChange={(date) =>
                        field.onChange(
                          date ? format(date, 'yyyy-MM-dd') : undefined
                        )
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Sezione Pesi */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Pesi
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="peso_caricato_kg"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      label="Peso Netto *"
                      type="number"
                      fullWidth
                      error={!!errors.peso_caricato_kg}
                      helperText={
                        errors.peso_caricato_kg
                          ? String(errors.peso_caricato_kg.message)
                          : undefined
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">kg</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="peso_tara_kg"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      label="Tara"
                      type="number"
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">kg</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="peso_lordo_kg"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label="Peso Lordo"
                      type="number"
                      fullWidth
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">kg</InputAdornment>
                        ),
                      }}
                      sx={{ bgcolor: 'action.hover' }}
                    />
                  )}
                />
              </Grid>

              {/* Sezione Idoneita */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Idoneita
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="idoneita_trasporto"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Trasporto idoneo"
                    />
                  )}
                />
              </Grid>
              {!idoneitaTrasporto && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="idoneita_note"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value || ''}
                        label="Note Idoneita *"
                        multiline
                        rows={2}
                        fullWidth
                        error={!!errors.idoneita_note}
                        helperText={
                          errors.idoneita_note
                            ? String(errors.idoneita_note.message)
                            : 'Obbligatorio se trasporto non idoneo'
                        }
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Sezione DDT */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  DDT
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="ddt_numero"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Numero DDT"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="ddt_data"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Data DDT"
                      value={field.value ? parseISO(field.value) : null}
                      onChange={(date) =>
                        field.onChange(
                          date ? format(date, 'yyyy-MM-dd') : undefined
                        )
                      }
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Sezione Carico details */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dettagli Carico
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tipologia_carico"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Tipologia Carico</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        label="Tipologia Carico"
                      >
                        <MenuItem value="">
                          <em>Nessuna</em>
                        </MenuItem>
                        {Object.entries(TIPOLOGIA_CARICO).map(
                          ([key, label]) => (
                            <MenuItem key={key} value={key}>
                              {label}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="numero_colli"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      label="Numero Colli"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button
            variant="contained"
            type="submit"
            form="dati-carico-form"
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : 'Registra'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
