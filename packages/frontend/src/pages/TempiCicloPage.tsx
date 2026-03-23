import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { configurazioneService } from '../services';
import { CATEGORIE_PRODOTTO } from '@planner-molino/shared';
import type { ConfigurazioneTempiCiclo } from '@planner-molino/shared';

interface RowState {
  ton_ora: number;
  tempo_setup_minuti: number;
  tempo_pulizia_minuti: number;
  saving: boolean;
  dirty: boolean;
}

export default function TempiCicloPage() {
  const [tempiCiclo, setTempiCiclo] = useState<ConfigurazioneTempiCiclo[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await configurazioneService.getTempiCiclo();
      setTempiCiclo(data);
      const states: Record<string, RowState> = {};
      data.forEach((tc) => {
        states[tc.categoria] = {
          ton_ora: tc.ton_ora,
          tempo_setup_minuti: tc.tempo_setup_minuti,
          tempo_pulizia_minuti: tc.tempo_pulizia_minuti,
          saving: false,
          dirty: false,
        };
      });
      setRowStates(states);
    } catch (err) {
      console.error('Errore caricamento tempi ciclo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (categoria: string, field: keyof RowState, value: number) => {
    setRowStates((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [field]: value,
        dirty: true,
      },
    }));
  };

  const handleSave = async (categoria: string) => {
    const row = rowStates[categoria];
    if (!row) return;

    setRowStates((prev) => ({
      ...prev,
      [categoria]: { ...prev[categoria], saving: true },
    }));

    try {
      await configurazioneService.updateTempiCiclo(categoria, {
        ton_ora: row.ton_ora,
        tempo_setup_minuti: row.tempo_setup_minuti,
        tempo_pulizia_minuti: row.tempo_pulizia_minuti,
      });
      setRowStates((prev) => ({
        ...prev,
        [categoria]: { ...prev[categoria], saving: false, dirty: false },
      }));
      setSnackbar({
        open: true,
        message: `Tempi ciclo "${CATEGORIE_PRODOTTO[categoria] || categoria}" aggiornati`,
        severity: 'success',
      });
    } catch {
      setRowStates((prev) => ({
        ...prev,
        [categoria]: { ...prev[categoria], saving: false },
      }));
      setSnackbar({ open: true, message: 'Errore nel salvataggio', severity: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Configurazione Tempi Ciclo"
        subtitle="Questi parametri influenzano il calcolo automatico della durata delle prenotazioni"
      />

      {loading ? (
        <LoadingSpinner text="Caricamento configurazione..." />
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ton/Ora</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Setup (min)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Pulizia (min)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Azione</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tempiCiclo.map((tc) => {
                    const row = rowStates[tc.categoria];
                    if (!row) return null;
                    return (
                      <TableRow key={tc.categoria}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {CATEGORIE_PRODOTTO[tc.categoria] || tc.categoria}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={row.ton_ora}
                            onChange={(e) =>
                              handleChange(tc.categoria, 'ton_ora', parseFloat(e.target.value) || 0)
                            }
                            inputProps={{ min: 0, step: 0.1 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={row.tempo_setup_minuti}
                            onChange={(e) =>
                              handleChange(
                                tc.categoria,
                                'tempo_setup_minuti',
                                parseInt(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={row.tempo_pulizia_minuti}
                            onChange={(e) =>
                              handleChange(
                                tc.categoria,
                                'tempo_pulizia_minuti',
                                parseInt(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              row.saving ? <CircularProgress size={14} /> : <SaveIcon />
                            }
                            onClick={() => handleSave(tc.categoria)}
                            disabled={row.saving || !row.dirty}
                          >
                            Salva
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
