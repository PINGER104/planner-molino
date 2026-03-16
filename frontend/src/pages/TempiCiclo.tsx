import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Edit, Save, Close, Add, Delete } from '@mui/icons-material';

import { configurazioneApi } from '../services/supabaseApi';
import { useAuth } from '../contexts/AuthContext';
import { ConfigurazioneTempiCiclo } from '../types';
import { LoadingSpinner, ConfirmDialog } from '../components/common';

const CATEGORIA_LABELS: Record<string, string> = {
  rinfusa: 'Rinfusa',
  confezionato_silos: 'Confezionato (Silos)',
  confezionato_sacco: 'Confezionato (Sacco)',
};

function formatCategoria(categoria: string): string {
  return CATEGORIA_LABELS[categoria] || categoria
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

const TempiCiclo: React.FC = () => {
  const { canModify } = useAuth();

  const [data, setData] = useState<ConfigurazioneTempiCiclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    ton_ora: 0,
    tempo_setup_minuti: 0,
    tempo_pulizia_minuti: 0,
  });

  // New phase dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPhase, setNewPhase] = useState({
    nome: '',
    ton_ora: 1,
    tempo_setup_minuti: 15,
    tempo_pulizia_minuti: 20,
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCategoria, setDeleteCategoria] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await configurazioneApi.getTempiCiclo();
      setData(result as ConfigurazioneTempiCiclo[]);
    } catch {
      setError('Errore nel caricamento della configurazione tempi ciclo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (row: ConfigurazioneTempiCiclo) => {
    setEditingCategoria(row.categoria);
    setEditValues({
      ton_ora: row.ton_ora,
      tempo_setup_minuti: row.tempo_setup_minuti,
      tempo_pulizia_minuti: row.tempo_pulizia_minuti,
    });
  };

  const handleCancel = () => {
    setEditingCategoria(null);
  };

  const handleSave = async () => {
    if (!editingCategoria) return;

    if (editValues.ton_ora <= 0) {
      setError('La velocità (ton/ora) deve essere maggiore di 0');
      return;
    }

    try {
      await configurazioneApi.updateTempiCiclo(editingCategoria, editValues);
      setEditingCategoria(null);
      setSuccess('Configurazione aggiornata con successo');
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch {
      setError('Errore nel salvataggio della configurazione');
    }
  };

  const handleOpenCreate = () => {
    setNewPhase({ nome: '', ton_ora: 1, tempo_setup_minuti: 15, tempo_pulizia_minuti: 20 });
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    const slug = toSlug(newPhase.nome);

    if (!slug) {
      setError('Il nome della fase è obbligatorio');
      return;
    }
    if (slug.length > 30) {
      setError('Il nome della fase è troppo lungo (max 30 caratteri)');
      return;
    }
    if (data.some((d) => d.categoria === slug)) {
      setError(`Esiste già una fase con identificativo "${slug}"`);
      return;
    }
    if (newPhase.ton_ora <= 0) {
      setError('La velocità (ton/ora) deve essere maggiore di 0');
      return;
    }

    setCreating(true);
    try {
      await configurazioneApi.createTempiCiclo({
        categoria: slug,
        ton_ora: newPhase.ton_ora,
        tempo_setup_minuti: newPhase.tempo_setup_minuti,
        tempo_pulizia_minuti: newPhase.tempo_pulizia_minuti,
      });
      setCreateDialogOpen(false);
      setSuccess('Nuova fase di lavorazione creata con successo');
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch {
      setError('Errore nella creazione della fase. Verificare che la policy INSERT sia abilitata su Supabase.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategoria) return;
    try {
      await configurazioneApi.deleteTempiCiclo(deleteCategoria);
      setDeleteDialogOpen(false);
      setDeleteCategoria(null);
      setSuccess('Fase di lavorazione eliminata');
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch {
      setError('Errore nella cancellazione. Verificare che la policy DELETE sia abilitata su Supabase.');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5">Configurazione Tempi Ciclo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestione delle velocità di lavorazione e dei tempi fissi per categoria di prodotto
          </Typography>
        </Box>
        {canModify && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            Nuova Fase
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Categoria Prodotto</TableCell>
                <TableCell align="center">Velocità (ton/ora)</TableCell>
                <TableCell align="center">Tempo Setup (min)</TableCell>
                <TableCell align="center">Tempo Pulizia (min)</TableCell>
                <TableCell align="center">Stato</TableCell>
                {canModify && <TableCell align="right">Azioni</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.categoria} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCategoria(row.categoria)}
                    </Typography>
                  </TableCell>

                  {editingCategoria === row.categoria ? (
                    <>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.ton_ora}
                          onChange={(e) =>
                            setEditValues({ ...editValues, ton_ora: parseFloat(e.target.value) || 0 })
                          }
                          inputProps={{ min: 0.1, step: 0.5 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.tempo_setup_minuti}
                          onChange={(e) =>
                            setEditValues({ ...editValues, tempo_setup_minuti: parseInt(e.target.value, 10) || 0 })
                          }
                          inputProps={{ min: 0, step: 5 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.tempo_pulizia_minuti}
                          onChange={(e) =>
                            setEditValues({ ...editValues, tempo_pulizia_minuti: parseInt(e.target.value, 10) || 0 })
                          }
                          inputProps={{ min: 0, step: 5 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="center">
                        <Typography variant="body2">{row.ton_ora}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{row.tempo_setup_minuti} min</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{row.tempo_pulizia_minuti} min</Typography>
                      </TableCell>
                    </>
                  )}

                  <TableCell align="center">
                    <Chip
                      label={row.attivo ? 'Attivo' : 'Disattivo'}
                      color={row.attivo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>

                  {canModify && (
                    <TableCell align="right">
                      {editingCategoria === row.categoria ? (
                        <>
                          <Tooltip title="Salva">
                            <IconButton size="small" color="primary" onClick={handleSave}>
                              <Save />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Annulla">
                            <IconButton size="small" onClick={handleCancel}>
                              <Close />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Modifica">
                            <IconButton size="small" onClick={() => handleEdit(row)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteCategoria(row.categoria);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canModify ? 6 : 5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      Nessuna configurazione trovata
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuova Fase di Lavorazione</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Fase"
                value={newPhase.nome}
                onChange={(e) => setNewPhase({ ...newPhase, nome: e.target.value })}
                required
                helperText={newPhase.nome ? `Identificativo: ${toSlug(newPhase.nome)}` : 'Es. "Sfuso Liquido", "Pallettizzato"'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Velocità (ton/ora)"
                type="number"
                value={newPhase.ton_ora}
                onChange={(e) => setNewPhase({ ...newPhase, ton_ora: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0.1, step: 0.5 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tempo Setup (min)"
                type="number"
                value={newPhase.tempo_setup_minuti}
                onChange={(e) => setNewPhase({ ...newPhase, tempo_setup_minuti: parseInt(e.target.value, 10) || 0 })}
                inputProps={{ min: 0, step: 5 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tempo Pulizia (min)"
                type="number"
                value={newPhase.tempo_pulizia_minuti}
                onChange={(e) => setNewPhase({ ...newPhase, tempo_pulizia_minuti: parseInt(e.target.value, 10) || 0 })}
                inputProps={{ min: 0, step: 5 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creazione...' : 'Crea Fase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Conferma eliminazione"
        message={`Sei sicuro di voler eliminare la fase "${deleteCategoria ? formatCategoria(deleteCategoria) : ''}"?`}
        confirmLabel="Elimina"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeleteCategoria(null);
        }}
      />
    </Box>
  );
};

export default TempiCiclo;
