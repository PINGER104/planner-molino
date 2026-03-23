import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { LABELS_STATO, COLORI_STATO } from '@planner-molino/shared';
import { prenotazioniService } from '../../../services';

interface TransizioniStatoProps {
  transizioniPossibili: string[];
  prenotazioneId: number;
  onTransizione: () => void;
}

export default function TransizioniStato({
  transizioniPossibili,
  prenotazioneId,
  onTransizione,
}: TransizioniStatoProps) {
  const [annullaDialogOpen, setAnnullaDialogOpen] = useState(false);
  const [annullaNote, setAnnullaNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteError, setNoteError] = useState('');

  const handleTransizione = async (stato: string) => {
    if (stato === 'annullato') {
      setAnnullaDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      await prenotazioniService.cambioStato(prenotazioneId, stato);
      onTransizione();
    } catch (err) {
      console.error('Errore cambio stato:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnullamento = async () => {
    if (!annullaNote.trim()) {
      setNoteError('Le note sono obbligatorie per l\'annullamento');
      return;
    }

    setLoading(true);
    try {
      await prenotazioniService.cambioStato(
        prenotazioneId,
        'annullato',
        annullaNote
      );
      setAnnullaDialogOpen(false);
      setAnnullaNote('');
      setNoteError('');
      onTransizione();
    } catch (err) {
      console.error('Errore annullamento:', err);
    } finally {
      setLoading(false);
    }
  };

  if (transizioniPossibili.length === 0) {
    return null;
  }

  return (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Azioni
          </Typography>
          <Stack spacing={1}>
            {transizioniPossibili.map((stato) => {
              const isAnnullato = stato === 'annullato';
              const color = COLORI_STATO[stato] || '#9E9E9E';

              return (
                <Button
                  key={stato}
                  variant={isAnnullato ? 'outlined' : 'contained'}
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  disabled={loading}
                  onClick={() => handleTransizione(stato)}
                  sx={
                    isAnnullato
                      ? {
                          color: '#DC2626',
                          borderColor: '#DC2626',
                          '&:hover': {
                            borderColor: '#B91C1C',
                            bgcolor: 'rgba(220, 38, 38, 0.04)',
                          },
                        }
                      : {
                          bgcolor: color,
                          '&:hover': { bgcolor: color, opacity: 0.9 },
                        }
                  }
                >
                  {LABELS_STATO[stato] || stato}
                </Button>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* Annullamento Dialog */}
      <Dialog
        open={annullaDialogOpen}
        onClose={() => {
          setAnnullaDialogOpen(false);
          setAnnullaNote('');
          setNoteError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Annullamento Prenotazione</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Inserisci il motivo dell'annullamento (obbligatorio):
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={annullaNote}
            onChange={(e) => {
              setAnnullaNote(e.target.value);
              if (e.target.value.trim()) setNoteError('');
            }}
            error={!!noteError}
            helperText={noteError}
            placeholder="Motivo dell'annullamento..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAnnullaDialogOpen(false);
              setAnnullaNote('');
              setNoteError('');
            }}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleAnnullamento}
            disabled={loading}
          >
            Conferma Annullamento
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
