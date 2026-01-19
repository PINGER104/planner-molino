import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

import { prenotazioniApi, clientiApi, trasportatoriApi, configurazioneApi } from '../services/api';
import {
  PrenotazioneForm as FormData,
  ClienteDropdown,
  TrasportatoreDropdown,
  TipologiaPrenotazione,
  Prenotazione,
} from '../types';
import { LoadingSpinner } from '../components/common';
import {
  LABEL_CATEGORIA,
  LABEL_UNITA,
  LABEL_TIPOLOGIA_CARICO,
  LABEL_ORIGINE_MATERIALE,
  PRIORITA_OPTIONS,
} from '../utils/statiConfig';

const steps = ['Cliente e Data', 'Prodotto', 'Dettagli'];

const PrenotazioneFormPage: React.FC = () => {
  const { section, id } = useParams<{ section: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const tipologia: TipologiaPrenotazione = section === 'produzione' ? 'produzione' : 'consegna';

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienti, setClienti] = useState<ClienteDropdown[]>([]);
  const [trasportatori, setTrasportatori] = useState<TrasportatoreDropdown[]>([]);
  const [calcoloDurata, setCalcoloDurata] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      tipologia,
      data_pianificata: searchParams.get('data') || new Date().toISOString().split('T')[0],
      ora_inizio_prevista: '08:00',
      priorita: 5,
      unita_misura: 'ton',
    },
  });

  const categoriaProdotto = watch('categoria_prodotto');
  const quantitaKg = watch('quantita_kg');

  // Load dropdown data
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [clientiRes, trasportatoriRes] = await Promise.all([
          clientiApi.getDropdown(),
          trasportatoriApi.getDropdown(),
        ]);
        setClienti(clientiRes.data.data);
        setTrasportatori(trasportatoriRes.data.data);
      } catch (err) {
        console.error('Error loading dropdowns:', err);
      }
    };
    loadDropdowns();
  }, []);

  // Load existing data for edit
  useEffect(() => {
    if (isEdit && id) {
      const loadPrenotazione = async () => {
        try {
          const response = await prenotazioniApi.getById(parseInt(id));
          const data: Prenotazione = response.data.data;
          reset({
            tipologia: data.tipologia,
            cliente_id: data.cliente_id || undefined,
            trasportatore_id: data.trasportatore_id || undefined,
            data_pianificata: data.data_pianificata.split('T')[0],
            ora_inizio_prevista: data.ora_inizio_prevista?.substring(0, 5) || '08:00',
            prodotto_codice: data.prodotto_codice || undefined,
            prodotto_descrizione: data.prodotto_descrizione || undefined,
            categoria_prodotto: data.categoria_prodotto || undefined,
            specifica_w: data.specifica_w || undefined,
            specifica_w_tolleranza: data.specifica_w_tolleranza || undefined,
            specifica_pl: data.specifica_pl || undefined,
            specifica_pl_tolleranza: data.specifica_pl_tolleranza || undefined,
            quantita_prevista: data.quantita_prevista || undefined,
            unita_misura: data.unita_misura || undefined,
            quantita_kg: data.quantita_kg || undefined,
            lotto_previsto: data.lotto_previsto || undefined,
            origine_materiale: data.origine_materiale || undefined,
            silos_origine: data.silos_origine || undefined,
            linea_produzione: data.linea_produzione || undefined,
            tipologia_carico: data.tipologia_carico || undefined,
            ordine_riferimento: data.ordine_riferimento || undefined,
            priorita: data.priorita || 5,
            note: data.note || undefined,
          });
        } catch (err) {
          setError('Errore nel caricamento della prenotazione');
        } finally {
          setLoading(false);
        }
      };
      loadPrenotazione();
    }
  }, [isEdit, id, reset]);

  // Calculate duration when product/quantity changes
  useEffect(() => {
    if (categoriaProdotto && quantitaKg) {
      configurazioneApi
        .calcolaDurata({
          categoria_prodotto: categoriaProdotto,
          quantita_kg: quantitaKg,
        })
        .then((res) => {
          setCalcoloDurata(res.data.data.durata_minuti);
        })
        .catch(() => {
          setCalcoloDurata(null);
        });
    } else {
      setCalcoloDurata(null);
    }
  }, [categoriaProdotto, quantitaKg]);

  // Convert quantity to kg
  const handleQuantityChange = useCallback(
    (quantita: number, unita: string) => {
      let kg = quantita;
      switch (unita) {
        case 'ton':
          kg = quantita * 1000;
          break;
        case 'sacchi':
          kg = quantita * 25;
          break;
        case 'pallet':
          kg = quantita * 1000;
          break;
      }
      setValue('quantita_kg', kg);
    },
    [setValue]
  );

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await prenotazioniApi.update(parseInt(id), data);
      } else {
        await prenotazioniApi.create(data);
      }
      navigate(`/${section}/prenotazioni`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Indietro
        </Button>
        <Typography variant="h5">
          {isEdit ? 'Modifica Prenotazione' : 'Nuova Prenotazione'} -{' '}
          {tipologia === 'produzione' ? 'Produzione' : 'Consegna'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Cliente e Data */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="cliente_id"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={clienti}
                      getOptionLabel={(option) =>
                        `${option.codice} - ${option.ragione_sociale}${option.citta ? ` (${option.citta})` : ''}`
                      }
                      value={clienti.find((c) => c.id === value) || null}
                      onChange={(_, newValue) => onChange(newValue?.id || undefined)}
                      renderInput={(params) => <TextField {...params} label="Cliente" />}
                    />
                  )}
                />
              </Grid>

              {tipologia === 'consegna' && (
                <Grid item xs={12}>
                  <Controller
                    name="trasportatore_id"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={trasportatori}
                        getOptionLabel={(option) =>
                          `${option.codice} - ${option.ragione_sociale}`
                        }
                        value={trasportatori.find((t) => t.id === value) || null}
                        onChange={(_, newValue) => onChange(newValue?.id || undefined)}
                        renderInput={(params) => (
                          <TextField {...params} label="Trasportatore" />
                        )}
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Controller
                  name="data_pianificata"
                  control={control}
                  rules={{ required: 'Data obbligatoria' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Data Pianificata"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.data_pianificata}
                      helperText={errors.data_pianificata?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="ora_inizio_prevista"
                  control={control}
                  rules={{ required: 'Ora inizio obbligatoria' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="time"
                      label="Ora Inizio"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.ora_inizio_prevista}
                      helperText={errors.ora_inizio_prevista?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 2: Prodotto */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="prodotto_codice"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Codice Prodotto" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="prodotto_descrizione"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Descrizione Prodotto" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="categoria_prodotto"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Categoria</InputLabel>
                      <Select {...field} label="Categoria">
                        {Object.entries(LABEL_CATEGORIA).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="quantita_prevista"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Quantita"
                      fullWidth
                      inputProps={{ min: 0, step: 0.1 }}
                      onChange={(e) => {
                        field.onChange(e);
                        const unita = watch('unita_misura') || 'ton';
                        handleQuantityChange(parseFloat(e.target.value) || 0, unita);
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="unita_misura"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Unita</InputLabel>
                      <Select
                        {...field}
                        label="Unita"
                        onChange={(e) => {
                          field.onChange(e);
                          const quantita = watch('quantita_prevista') || 0;
                          handleQuantityChange(quantita, e.target.value);
                        }}
                      >
                        {Object.entries(LABEL_UNITA).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {calcoloDurata && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Durata prevista: {calcoloDurata} minuti (
                    {Math.floor(calcoloDurata / 60)}h {calcoloDurata % 60}min)
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12} sm={3}>
                <Controller
                  name="specifica_w"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="W (Forza)"
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">W</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="specifica_w_tolleranza"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Tolleranza W"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">{String.fromCharCode(177)}</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="specifica_pl"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="P/L"
                      fullWidth
                      inputProps={{ step: 0.01 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="specifica_pl_tolleranza"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Tolleranza P/L"
                      fullWidth
                      inputProps={{ step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">{String.fromCharCode(177)}</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 3: Dettagli */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="lotto_previsto"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Lotto" fullWidth />}
                />
              </Grid>

              {tipologia === 'produzione' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="origine_materiale"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Origine Materiale</InputLabel>
                          <Select {...field} label="Origine Materiale">
                            {Object.entries(LABEL_ORIGINE_MATERIALE).map(([value, label]) => (
                              <MenuItem key={value} value={value}>
                                {label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="linea_produzione"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Linea Produzione" fullWidth />
                      )}
                    />
                  </Grid>
                </>
              )}

              {tipologia === 'consegna' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="tipologia_carico"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Tipologia Carico</InputLabel>
                          <Select {...field} label="Tipologia Carico">
                            {Object.entries(LABEL_TIPOLOGIA_CARICO).map(([value, label]) => (
                              <MenuItem key={value} value={value}>
                                {label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="ordine_riferimento"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Ordine Riferimento" fullWidth />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6}>
                <Controller
                  name="priorita"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Priorita</InputLabel>
                      <Select {...field} label="Priorita">
                        {PRIORITA_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Note" fullWidth multiline rows={3} />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Indietro
            </Button>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Avanti
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva'}
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PrenotazioneFormPage;
