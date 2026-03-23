import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Breadcrumbs,
  Link,
  Typography,
  Skeleton,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { prenotazioniService } from '../services';
import type {
  PrenotazioneView,
  StoricoStato,
  DatiCarico,
  TipologiaPrenotazione,
} from '@planner-molino/shared';
import InfoCard from '../components/prenotazioni/dettaglio/InfoCard';
import StoricoTimeline from '../components/prenotazioni/dettaglio/StoricoTimeline';
import TransizioniStato from '../components/prenotazioni/dettaglio/TransizioniStato';
import DatiCaricoSection from '../components/prenotazioni/dettaglio/DatiCaricoSection';

export default function PrenotazioneDettaglioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const tipologia: TipologiaPrenotazione = location.pathname.includes('produzione')
    ? 'produzione'
    : 'consegna';
  const basePath = tipologia === 'produzione' ? '/produzione' : '/consegne';

  const [prenotazione, setPrenotazione] = useState<PrenotazioneView | null>(null);
  const [storico, setStorico] = useState<StoricoStato[]>([]);
  const [datiCarico, setDatiCarico] = useState<DatiCarico | null>(null);
  const [transizioniPossibili, setTransizioniPossibili] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await prenotazioniService.getById(Number(id));
      setPrenotazione(res.prenotazione as PrenotazioneView);
      setStorico(res.storico);
      setDatiCarico(res.datiCarico);
      setTransizioniPossibili(res.transizioniPossibili);
    } catch (err) {
      console.error('Errore caricamento prenotazione:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rounded" height={600} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!prenotazione) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6">Prenotazione non trovata</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate(`${basePath}/prenotazioni`)}
        >
          Torna alla Lista
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 2 }}
      >
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(basePath)}
        >
          {tipologia === 'produzione' ? 'Produzione' : 'Consegne'}
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`${basePath}/prenotazioni`)}
        >
          Prenotazioni
        </Link>
        <Typography
          color="text.primary"
          sx={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          {prenotazione.codice_prenotazione}
        </Typography>
      </Breadcrumbs>

      {/* Edit button */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() =>
            navigate(`${basePath}/prenotazioni/${prenotazione.id}/modifica`)
          }
        >
          Modifica
        </Button>
      </Stack>

      {/* Content: 2 columns on desktop */}
      <Grid container spacing={3}>
        {/* Left Column: InfoCard + DatiCarico */}
        <Grid size={{ xs: 12, md: 8 }}>
          <InfoCard prenotazione={prenotazione} />
          <DatiCaricoSection
            datiCarico={datiCarico}
            prenotazione={prenotazione}
            onRegistra={fetchData}
          />
        </Grid>

        {/* Right Column: TransizioniStato + StoricoTimeline */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TransizioniStato
            transizioniPossibili={transizioniPossibili}
            prenotazioneId={prenotazione.id}
            onTransizione={fetchData}
          />
          <StoricoTimeline storico={storico} />
        </Grid>
      </Grid>
    </Box>
  );
}
