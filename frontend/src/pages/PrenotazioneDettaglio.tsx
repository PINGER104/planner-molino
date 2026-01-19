import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Stack,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack,
  Edit,
  LocalShipping,
  CheckCircle,
  Cancel,
  PlayArrow,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale/it';

import { prenotazioniApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Prenotazione, TipologiaPrenotazione } from '../types';
import { StatoBadge, LoadingSpinner } from '../components/common';
import {
  LABEL_STATO,
  LABEL_CATEGORIA,
  LABEL_UNITA,
  LABEL_TIPOLOGIA_CARICO,
  COLORI_STATO,
} from '../utils/statiConfig';

const PrenotazioneDettaglio: React.FC = () => {
  const { section, id } = useParams<{ section: string; id: string }>();
  const navigate = useNavigate();
  const { canModify } = useAuth();

  const [prenotazione, setPrenotazione] = useState<Prenotazione | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statoDialogOpen, setStatoDialogOpen] = useState(false);
  const [selectedStato, setSelectedStato] = useState<string>('');
  const [statoNote, setStatoNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await prenotazioniApi.getById(parseInt(id));
      setPrenotazione(response.data.data);
    } catch (err) {
      setError('Errore nel caricamento della prenotazione');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatoChange = async () => {
    if (!prenotazione || !selectedStato) return;

    setUpdating(true);
    try {
      await prenotazioniApi.updateStato(prenotazione.id, selectedStato, statoNote || undefined);
      setStatoDialogOpen(false);
      setSelectedStato('');
      setStatoNote('');
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nel cambio stato');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!prenotazione) {
    return (
      <Box>
        <Alert severity="error">Prenotazione non trovata</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Torna indietro
        </Button>
      </Box>
    );
  }

  const isConsegna = prenotazione.tipologia === 'consegna';
  const showDatiCarico =
    isConsegna && ['caricato', 'partito'].includes(prenotazione.stato);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            Indietro
          </Button>
          <Typography variant="h5">{prenotazione.codice_prenotazione}</Typography>
          <StatoBadge stato={prenotazione.stato} size="medium" />
        </Box>
        {canModify && !['completato', 'partito', 'annullato'].includes(prenotazione.stato) && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/${section}/prenotazioni/${id}/modifica`)}
          >
            Modifica
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni Generali
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Cliente
                </Typography>
                <Typography variant="body1">
                  {prenotazione.cliente_ragione_sociale || '-'}
                </Typography>
              </Grid>
              {isConsegna && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Trasportatore
                  </Typography>
                  <Typography variant="body1">
                    {prenotazione.trasportatore_ragione_sociale || '-'}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Data Pianificata
                </Typography>
                <Typography variant="body1">
                  {formatDate(prenotazione.data_pianificata)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Orario
                </Typography>
                <Typography variant="body1">
                  {formatTime(prenotazione.ora_inizio_prevista)} -{' '}
                  {formatTime(prenotazione.ora_fine_prevista)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Prodotto
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Codice / Descrizione
                </Typography>
                <Typography variant="body1">
                  {prenotazione.prodotto_codice || '-'} -{' '}
                  {prenotazione.prodotto_descrizione || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Categoria
                </Typography>
                <Typography variant="body1">
                  {prenotazione.categoria_prodotto
                    ? LABEL_CATEGORIA[prenotazione.categoria_prodotto]
                    : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Quantita
                </Typography>
                <Typography variant="body1">
                  {prenotazione.quantita_prevista || '-'}{' '}
                  {prenotazione.unita_misura
                    ? LABEL_UNITA[prenotazione.unita_misura]
                    : ''}
                </Typography>
              </Grid>
              {prenotazione.specifica_w && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Specifiche W / P/L
                  </Typography>
                  <Typography variant="body1">
                    W{prenotazione.specifica_w} ({String.fromCharCode(177)}
                    {prenotazione.specifica_w_tolleranza || 0}) / P/L{' '}
                    {prenotazione.specifica_pl || '-'} ({String.fromCharCode(177)}
                    {prenotazione.specifica_pl_tolleranza || 0})
                  </Typography>
                </Grid>
              )}
              {prenotazione.lotto_previsto && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Lotto Previsto
                  </Typography>
                  <Typography variant="body1">{prenotazione.lotto_previsto}</Typography>
                </Grid>
              )}
            </Grid>

            {prenotazione.note && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Note
                </Typography>
                <Typography variant="body1">{prenotazione.note}</Typography>
              </>
            )}
          </Paper>

          {/* Dati Carico */}
          {showDatiCarico && prenotazione.dati_carico && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dati Carico
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Data Carico
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(prenotazione.dati_carico.data_carico)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Operatore
                  </Typography>
                  <Typography variant="body1">
                    {prenotazione.dati_carico.operatore_nome || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Targa Automezzo
                  </Typography>
                  <Typography variant="body1">
                    {prenotazione.dati_carico.targa_automezzo}
                    {prenotazione.dati_carico.targa_rimorchio &&
                      ` / ${prenotazione.dati_carico.targa_rimorchio}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Autista
                  </Typography>
                  <Typography variant="body1">
                    {prenotazione.dati_carico.nome_autista || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Lotto Caricato
                  </Typography>
                  <Typography variant="body1">
                    {prenotazione.dati_carico.lotto_caricato}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Peso Caricato
                  </Typography>
                  <Typography variant="body1">
                    {prenotazione.dati_carico.peso_caricato_kg} kg
                  </Typography>
                </Grid>
                {prenotazione.dati_carico.ddt_numero && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      DDT
                    </Typography>
                    <Typography variant="body1">
                      {prenotazione.dati_carico.ddt_numero} del{' '}
                      {formatDate(prenotazione.dati_carico.ddt_data)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* State Actions */}
          {canModify &&
            prenotazione.transizioni_possibili &&
            prenotazione.transizioni_possibili.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Azioni
                  </Typography>
                  <Stack spacing={1}>
                    {prenotazione.transizioni_possibili.map((stato) => (
                      <Button
                        key={stato}
                        variant={stato === 'annullato' ? 'outlined' : 'contained'}
                        color={stato === 'annullato' ? 'error' : 'primary'}
                        startIcon={
                          stato === 'annullato' ? (
                            <Cancel />
                          ) : stato.includes('carico') || stato === 'partito' ? (
                            <LocalShipping />
                          ) : stato === 'completato' ? (
                            <CheckCircle />
                          ) : (
                            <PlayArrow />
                          )
                        }
                        onClick={() => {
                          setSelectedStato(stato);
                          setStatoDialogOpen(true);
                        }}
                        fullWidth
                      >
                        {LABEL_STATO[stato]}
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

          {/* State History */}
          {prenotazione.storico_stati && prenotazione.storico_stati.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Storico Stati
              </Typography>
              <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {prenotazione.storico_stati.map((item, index) => (
                  <TimelineItem key={item.id}>
                    <TimelineOppositeContent sx={{ flex: 0.3 }}>
                      <Typography variant="caption" color="textSecondary">
                        {formatDateTime(item.timestamp_cambio)}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        sx={{
                          bgcolor: COLORI_STATO[item.stato_nuovo] || '#6B7280',
                        }}
                      />
                      {index < prenotazione.storico_stati!.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" fontWeight="medium">
                        {LABEL_STATO[item.stato_nuovo]}
                      </Typography>
                      {item.utente_nome && (
                        <Typography variant="caption" color="textSecondary">
                          {item.utente_nome} {item.utente_cognome}
                        </Typography>
                      )}
                      {item.note && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {item.note}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* State Change Dialog */}
      <Dialog open={statoDialogOpen} onClose={() => setStatoDialogOpen(false)}>
        <DialogTitle>Cambio Stato a "{LABEL_STATO[selectedStato]}"</DialogTitle>
        <DialogContent>
          {selectedStato === 'annullato' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Stai per annullare questa prenotazione. Questa azione non puo essere annullata.
            </Alert>
          )}
          <TextField
            fullWidth
            label={selectedStato === 'annullato' ? 'Motivazione (obbligatoria)' : 'Note (opzionale)'}
            multiline
            rows={3}
            value={statoNote}
            onChange={(e) => setStatoNote(e.target.value)}
            required={selectedStato === 'annullato'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatoDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={handleStatoChange}
            variant="contained"
            color={selectedStato === 'annullato' ? 'error' : 'primary'}
            disabled={updating || (selectedStato === 'annullato' && !statoNote)}
          >
            {updating ? 'Aggiornamento...' : 'Conferma'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrenotazioneDettaglio;
