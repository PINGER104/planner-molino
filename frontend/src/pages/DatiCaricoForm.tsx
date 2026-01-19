import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

import { prenotazioniApi } from '../services/api';
import { DatiCaricoForm as FormData, Prenotazione } from '../types';
import { LoadingSpinner } from '../components/common';
import { LABEL_TIPOLOGIA_CARICO } from '../utils/statiConfig';

const DatiCaricoFormPage: React.FC = () => {
  const { section, id } = useParams<{ section: string; id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prenotazione, setPrenotazione] = useState<Prenotazione | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      data_carico: new Date().toISOString().split('T')[0],
      ora_inizio_carico: new Date().toTimeString().substring(0, 5),
      idoneita_trasporto: true,
    },
  });

  const idoneitaTrasporto = watch('idoneita_trasporto');

  useEffect(() => {
    if (id) {
      const loadPrenotazione = async () => {
        try {
          const response = await prenotazioniApi.getById(parseInt(id));
          setPrenotazione(response.data.data);

          if (response.data.data.stato !== 'in_carico') {
            setError('I dati carico possono essere registrati solo quando lo stato e "In carico"');
          }
        } catch (err) {
          setError('Errore nel caricamento della prenotazione');
        } finally {
          setLoading(false);
        }
      };
      loadPrenotazione();
    }
  }, [id]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    setSaving(true);
    setError(null);
    try {
      await prenotazioniApi.createDatiCarico(parseInt(id), data);
      navigate(`/${section}/prenotazioni/${id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!prenotazione || prenotazione.stato !== 'in_carico') {
    return (
      <Box>
        <Alert severity="error">
          {error || 'I dati carico possono essere registrati solo quando lo stato e "In carico"'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Torna indietro
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Indietro
        </Button>
        <Typography variant="h5">
          Registrazione Dati Carico - {prenotazione.codice_prenotazione}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Info prenotazione */}
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Cliente: {prenotazione.cliente_ragione_sociale || '-'}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Prodotto: {prenotazione.prodotto_descrizione || '-'} -{' '}
            {prenotazione.quantita_prevista} {prenotazione.unita_misura}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Dati Temporali
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="data_carico"
                control={control}
                rules={{ required: 'Data carico obbligatoria' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Data Carico"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.data_carico}
                    helperText={errors.data_carico?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="ora_inizio_carico"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="time"
                    label="Ora Inizio Carico"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="ora_fine_carico"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="time"
                    label="Ora Fine Carico"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Verifica Mezzo
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="idoneita_trasporto"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Mezzo idoneo al trasporto"
                  />
                )}
              />
            </Grid>
            {!idoneitaTrasporto && (
              <Grid item xs={12}>
                <Controller
                  name="idoneita_note"
                  control={control}
                  rules={{ required: !idoneitaTrasporto ? 'Note obbligatorie se non idoneo' : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Note Idoneita (obbligatorio)"
                      fullWidth
                      multiline
                      rows={2}
                      error={!!errors.idoneita_note}
                      helperText={errors.idoneita_note?.message}
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <Controller
                name="targa_automezzo"
                control={control}
                rules={{ required: 'Targa automezzo obbligatoria' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Targa Automezzo"
                    fullWidth
                    error={!!errors.targa_automezzo}
                    helperText={errors.targa_automezzo?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="targa_rimorchio"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Targa Rimorchio" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="nome_autista"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Nome Autista" fullWidth />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Dati Prodotto Caricato
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="lotto_caricato"
                control={control}
                rules={{ required: 'Lotto obbligatorio' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Lotto Caricato"
                    fullWidth
                    error={!!errors.lotto_caricato}
                    helperText={errors.lotto_caricato?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="scadenza_lotto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Scadenza Lotto"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="peso_caricato_kg"
                control={control}
                rules={{ required: 'Peso obbligatorio', min: { value: 0.1, message: 'Peso deve essere maggiore di 0' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Peso Caricato (kg)"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                    error={!!errors.peso_caricato_kg}
                    helperText={errors.peso_caricato_kg?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="peso_tara_kg"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Peso Tara (kg)"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="peso_lordo_kg"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Peso Lordo (kg)"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <Controller
                name="numero_colli"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Numero Colli"
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Documentazione
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="ddt_numero"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Numero DDT" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="ddt_data"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Data DDT"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
              size="large"
            >
              {saving ? 'Salvataggio...' : 'Registra e Completa Carico'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default DatiCaricoFormPage;
