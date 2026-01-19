import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add, Search, Edit, Delete, Clear, Visibility } from '@mui/icons-material';

import { clientiApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Cliente, PaginatedResponse } from '../types';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import { LABEL_CANALE, LABEL_MODALITA_CONSEGNA } from '../utils/statiConfig';

const Clienti: React.FC = () => {
  const navigate = useNavigate();
  const { canModify } = useAuth();

  const [data, setData] = useState<PaginatedResponse<Cliente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    codice: '',
    ragione_sociale: '',
    partita_iva: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    telefono: '',
    email: '',
    canale: '',
    modalita_consegna: '',
    note: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientiApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        attivo: 'true',
      });
      setData(response.data.data);
    } catch (err) {
      setError('Errore nel caricamento dei clienti');
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
      await clientiApi.delete(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nella cancellazione');
    }
  };

  const handleOpenForm = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        codice: cliente.codice,
        ragione_sociale: cliente.ragione_sociale,
        partita_iva: cliente.partita_iva || '',
        indirizzo: cliente.indirizzo || '',
        cap: cliente.cap || '',
        citta: cliente.citta || '',
        provincia: cliente.provincia || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        canale: cliente.canale || '',
        modalita_consegna: cliente.modalita_consegna || '',
        note: cliente.note || '',
      });
    } else {
      setEditingCliente(null);
      setFormData({
        codice: '',
        ragione_sociale: '',
        partita_iva: '',
        indirizzo: '',
        cap: '',
        citta: '',
        provincia: '',
        telefono: '',
        email: '',
        canale: '',
        modalita_consegna: '',
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
      if (editingCliente) {
        await clientiApi.update(editingCliente.id, formData);
      } else {
        await clientiApi.create(formData);
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
        <Typography variant="h5">Anagrafica Clienti</Typography>
        {canModify && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
            Nuovo Cliente
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
          placeholder="Cerca per codice, ragione sociale o citta..."
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
                    <TableCell>Citta</TableCell>
                    <TableCell>Canale</TableCell>
                    <TableCell>Telefono</TableCell>
                    <TableCell>Email</TableCell>
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
                      <TableCell>
                        {row.citta}
                        {row.provincia && ` (${row.provincia})`}
                      </TableCell>
                      <TableCell>
                        {row.canale && (
                          <Chip
                            label={LABEL_CANALE[row.canale] || row.canale}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>{row.telefono || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
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
        <DialogTitle>{editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Codice"
                value={formData.codice}
                onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                disabled={!!editingCliente}
                helperText={!editingCliente ? 'Lascia vuoto per generazione automatica' : ''}
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
                label="Indirizzo"
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="CAP"
                value={formData.cap}
                onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Citta"
                value={formData.citta}
                onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Provincia"
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Canale</InputLabel>
                <Select
                  value={formData.canale}
                  label="Canale"
                  onChange={(e) => setFormData({ ...formData, canale: e.target.value })}
                >
                  <MenuItem value="">-</MenuItem>
                  {Object.entries(LABEL_CANALE).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Modalita Consegna</InputLabel>
                <Select
                  value={formData.modalita_consegna}
                  label="Modalita Consegna"
                  onChange={(e) => setFormData({ ...formData, modalita_consegna: e.target.value })}
                >
                  <MenuItem value="">-</MenuItem>
                  {Object.entries(LABEL_MODALITA_CONSEGNA).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
        message="Sei sicuro di voler eliminare questo cliente?"
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

export default Clienti;
