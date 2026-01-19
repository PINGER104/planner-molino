import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import { Add, Search, Edit, Delete, Clear, Star } from '@mui/icons-material';

import { trasportatoriApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Trasportatore, PaginatedResponse } from '../types';
import { LoadingSpinner, ConfirmDialog } from '../components/common';

const TIPOLOGIE_MEZZI = ['cisterna', 'bilico', 'furgone', 'motrice'];
const CERTIFICAZIONI = ['ATP', 'BIO', 'trasporto_alimentari'];

const Trasportatori: React.FC = () => {
  const { canModify } = useAuth();

  const [data, setData] = useState<PaginatedResponse<Trasportatore> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTrasportatore, setEditingTrasportatore] = useState<Trasportatore | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    codice: '',
    ragione_sociale: '',
    partita_iva: '',
    indirizzo_sede: '',
    referente_nome: '',
    referente_telefono: '',
    referente_email: '',
    tipologie_mezzi: [] as string[],
    certificazioni: [] as string[],
    rating_puntualita: 3,
    note: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await trasportatoriApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        attivo: 'true',
      });
      setData(response.data.data);
    } catch (err) {
      setError('Errore nel caricamento dei trasportatori');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await trasportatoriApi.delete(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nella cancellazione');
    }
  };

  const handleOpenForm = (trasportatore?: Trasportatore) => {
    if (trasportatore) {
      setEditingTrasportatore(trasportatore);
      setFormData({
        codice: trasportatore.codice,
        ragione_sociale: trasportatore.ragione_sociale,
        partita_iva: trasportatore.partita_iva || '',
        indirizzo_sede: trasportatore.indirizzo_sede || '',
        referente_nome: trasportatore.referente_nome || '',
        referente_telefono: trasportatore.referente_telefono || '',
        referente_email: trasportatore.referente_email || '',
        tipologie_mezzi: trasportatore.tipologie_mezzi || [],
        certificazioni: trasportatore.certificazioni || [],
        rating_puntualita: trasportatore.rating_puntualita || 3,
        note: trasportatore.note || '',
      });
    } else {
      setEditingTrasportatore(null);
      setFormData({
        codice: '',
        ragione_sociale: '',
        partita_iva: '',
        indirizzo_sede: '',
        referente_nome: '',
        referente_telefono: '',
        referente_email: '',
        tipologie_mezzi: [],
        certificazioni: [],
        rating_puntualita: 3,
        note: '',
      });
    }
    setFormDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.ragione_sociale) {
      setError('Ragione sociale obbligatoria');
      return;
    }

    setSaving(true);
    try {
      if (editingTrasportatore) {
        await trasportatoriApi.update(editingTrasportatore.id, formData);
      } else {
        await trasportatoriApi.create(formData);
      }
      setFormDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Anagrafica Trasportatori</Typography>
        {canModify && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
            Nuovo Trasportatore
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          placeholder="Cerca per codice, ragione sociale..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: 400 }}
        />
      </Paper>

      <Paper>
        {loading ? (
          <LoadingSpinner fullPage />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Codice</TableCell>
                    <TableCell>Ragione Sociale</TableCell>
                    <TableCell>Referente</TableCell>
                    <TableCell>Telefono</TableCell>
                    <TableCell>Mezzi</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.data.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {row.codice}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.ragione_sociale}</TableCell>
                      <TableCell>{row.referente_nome || '-'}</TableCell>
                      <TableCell>{row.referente_telefono || '-'}</TableCell>
                      <TableCell>
                        {row.tipologie_mezzi?.map((mezzo) => (
                          <Chip key={mezzo} label={mezzo} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Rating
                          value={row.rating_puntualita}
                          precision={0.5}
                          size="small"
                          readOnly
                        />
                      </TableCell>
                      <TableCell align="right">
                        {canModify && (
                          <>
                            <Tooltip title="Modifica">
                              <IconButton size="small" onClick={() => handleOpenForm(row)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Elimina">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedId(row.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {data && data.total > 0 && (
              <TablePagination
                component="div"
                count={data.total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Righe per pagina"
              />
            )}
          </>
        )}
      </Paper>

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTrasportatore ? 'Modifica Trasportatore' : 'Nuovo Trasportatore'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Codice"
                value={formData.codice}
                onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                disabled={!!editingTrasportatore}
                helperText={!editingTrasportatore ? 'Lascia vuoto per generazione automatica' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Ragione Sociale"
                value={formData.ragione_sociale}
                onChange={(e) => setFormData({ ...formData, ragione_sociale: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Partita IVA"
                value={formData.partita_iva}
                onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Indirizzo Sede"
                value={formData.indirizzo_sede}
                onChange={(e) => setFormData({ ...formData, indirizzo_sede: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Referente"
                value={formData.referente_nome}
                onChange={(e) => setFormData({ ...formData, referente_nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Telefono Referente"
                value={formData.referente_telefono}
                onChange={(e) => setFormData({ ...formData, referente_telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email Referente"
                type="email"
                value={formData.referente_email}
                onChange={(e) => setFormData({ ...formData, referente_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipologie Mezzi</InputLabel>
                <Select
                  multiple
                  value={formData.tipologie_mezzi}
                  onChange={(e) =>
                    setFormData({ ...formData, tipologie_mezzi: e.target.value as string[] })
                  }
                  input={<OutlinedInput label="Tipologie Mezzi" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {TIPOLOGIE_MEZZI.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Certificazioni</InputLabel>
                <Select
                  multiple
                  value={formData.certificazioni}
                  onChange={(e) =>
                    setFormData({ ...formData, certificazioni: e.target.value as string[] })
                  }
                  input={<OutlinedInput label="Certificazioni" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {CERTIFICAZIONI.map((cert) => (
                    <MenuItem key={cert} value={cert}>
                      {cert}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="legend">Rating Puntualita</Typography>
              <Rating
                value={formData.rating_puntualita}
                onChange={(_, value) =>
                  setFormData({ ...formData, rating_puntualita: value || 3 })
                }
                precision={0.5}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questo trasportatore?"
        confirmLabel="Elimina"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedId(null);
        }}
      />
    </Box>
  );
};

export default Trasportatori;
