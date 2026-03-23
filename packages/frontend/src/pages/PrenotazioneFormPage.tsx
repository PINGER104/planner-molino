import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPrenotazioneSchema } from '@planner-molino/shared';
import type { TipologiaPrenotazione } from '@planner-molino/shared';
import PageHeader from '../components/common/PageHeader';
import StepGenerale from '../components/prenotazioni/form/StepGenerale';
import StepProdotto from '../components/prenotazioni/form/StepProdotto';
import StepDataOra from '../components/prenotazioni/form/StepDataOra';
import StepRiepilogo from '../components/prenotazioni/form/StepRiepilogo';
import { prenotazioniService } from '../services';

const STEPS = ['Generale', 'Prodotto', 'Data e Ora', 'Riepilogo'];

export default function PrenotazioneFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = !!id;

  const tipologia: TipologiaPrenotazione = location.pathname.includes('produzione')
    ? 'produzione'
    : 'consegna';

  const [activeStep, setActiveStep] = useState(0);
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
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPrenotazioneSchema),
    defaultValues: {
      tipologia,
      cliente_id: undefined as number | undefined,
      trasportatore_id: undefined as number | undefined,
      priorita: 5,
      note: '',
      prodotto_codice: '',
      prodotto_descrizione: '',
      categoria_prodotto: undefined as string | undefined,
      specifica_w: undefined as number | undefined,
      specifica_w_tolleranza: undefined as number | undefined,
      specifica_pl: undefined as number | undefined,
      specifica_pl_tolleranza: undefined as number | undefined,
      quantita_prevista: undefined as number | undefined,
      unita_misura: undefined as string | undefined,
      origine_materiale: undefined as string | undefined,
      silos_origine: '',
      linea_produzione: '',
      tipologia_carico: undefined as string | undefined,
      ordine_riferimento: '',
      prenotazione_consegna_collegata: undefined as number | undefined,
      prenotazione_produzione_collegata: undefined as number | undefined,
      data_pianificata: '',
      ora_inizio_prevista: '',
      ora_fine_prevista: undefined as string | undefined,
      durata_prevista_minuti: undefined as number | undefined,
      cambio_prodotto: false,
    },
  });

  // Load prenotazione data for edit mode
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      prenotazioniService
        .getById(Number(id))
        .then((res) => {
          const p = res.prenotazione;
          reset({
            tipologia: p.tipologia,
            cliente_id: p.cliente_id,
            trasportatore_id: p.trasportatore_id ?? undefined,
            priorita: p.priorita,
            note: p.note || '',
            prodotto_codice: p.prodotto_codice || '',
            prodotto_descrizione: p.prodotto_descrizione || '',
            categoria_prodotto: p.categoria_prodotto || undefined,
            specifica_w: p.specifica_w ?? undefined,
            specifica_w_tolleranza: p.specifica_w_tolleranza ?? undefined,
            specifica_pl: p.specifica_pl ?? undefined,
            specifica_pl_tolleranza: p.specifica_pl_tolleranza ?? undefined,
            quantita_prevista: p.quantita_prevista ?? undefined,
            unita_misura: p.unita_misura || undefined,
            origine_materiale: p.origine_materiale || undefined,
            silos_origine: p.silos_origine || '',
            linea_produzione: p.linea_produzione || '',
            tipologia_carico: p.tipologia_carico || undefined,
            ordine_riferimento: p.ordine_riferimento || '',
            prenotazione_consegna_collegata:
              p.prenotazione_consegna_collegata ?? undefined,
            prenotazione_produzione_collegata:
              p.prenotazione_produzione_collegata ?? undefined,
            data_pianificata: p.data_pianificata || '',
            ora_inizio_prevista: p.ora_inizio_prevista
              ? p.ora_inizio_prevista.substring(0, 5)
              : '',
            ora_fine_prevista: p.ora_fine_prevista
              ? p.ora_fine_prevista.substring(0, 5)
              : undefined,
            durata_prevista_minuti: p.durata_prevista_minuti ?? undefined,
          });
        })
        .catch((err) => {
          console.error('Errore caricamento prenotazione:', err);
          setSnackbar({
            open: true,
            message: 'Errore nel caricamento della prenotazione',
            severity: 'error',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, reset]);

  const handleNext = async () => {
    // Validate current step fields
    let fieldsToValidate: string[] = [];
    if (activeStep === 0) {
      fieldsToValidate = ['cliente_id', 'priorita'];
    } else if (activeStep === 2) {
      fieldsToValidate = ['data_pianificata', 'ora_inizio_prevista'];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Clean up form-only fields not in the schema
      const { cambio_prodotto, ...submitData } = data;

      // Remove empty strings and undefined values
      const cleanData = Object.fromEntries(
        Object.entries(submitData).filter(
          ([_, v]) => v !== '' && v !== undefined && v !== null
        )
      );

      let result;
      if (isEdit && id) {
        result = await prenotazioniService.update(Number(id), cleanData);
      } else {
        result = await prenotazioniService.create(cleanData);
      }

      setSnackbar({
        open: true,
        message: isEdit
          ? 'Prenotazione aggiornata con successo'
          : 'Prenotazione creata con successo',
        severity: 'success',
      });

      const basePath = tipologia === 'produzione' ? '/produzione' : '/consegne';
      setTimeout(() => {
        navigate(`${basePath}/prenotazioni/${result.id}`);
      }, 500);
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

  const basePath = tipologia === 'produzione' ? '/produzione' : '/consegne';

  return (
    <Box>
      <PageHeader
        title={
          isEdit
            ? 'Modifica Prenotazione'
            : `Nuova Prenotazione ${tipologia === 'produzione' ? 'Produzione' : 'Consegna'}`
        }
        action={
          <Button
            variant="outlined"
            onClick={() => navigate(`${basePath}/prenotazioni`)}
          >
            Torna alla Lista
          </Button>
        }
      />

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Form content */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {activeStep === 0 && (
            <StepGenerale
              control={control}
              errors={errors}
              tipologia={tipologia}
            />
          )}
          {activeStep === 1 && (
            <StepProdotto
              control={control}
              errors={errors}
              watch={watch}
              tipologia={tipologia}
            />
          )}
          {activeStep === 2 && (
            <StepDataOra
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />
          )}
          {activeStep === 3 && (
            <StepRiepilogo getValues={getValues} tipologia={tipologia} />
          )}
        </form>
      </Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Indietro
        </Button>
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardIcon />}
          >
            Avanti
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit(onSubmit)}
            startIcon={<CheckIcon />}
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : 'Conferma'}
          </Button>
        )}
      </Box>

      {/* Snackbar */}
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
    </Box>
  );
}
