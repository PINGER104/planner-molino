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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Clear,
  LockReset,
  PersonOff,
  PersonOutline,
} from '@mui/icons-material';

import { utentiAdminApi } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { User, PaginatedResponse, LivelloAccesso, SezioneAbilitata } from '../types';
import { LoadingSpinner, ConfirmDialog } from '../components/common';

const LIVELLI_ACCESSO: { value: LivelloAccesso; label: string }[] = [
  { value: 'visualizzazione', label: 'Visualizzazione' },
  { value: 'modifica', label: 'Modifica' },
];

const SEZIONI: { value: SezioneAbilitata; label: string }[] = [
  { value: 'produzione', label: 'Produzione' },
  { value: 'consegne', label: 'Consegne' },
];

interface FormData {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  telefono: string;
  ruolo: string;
  livello_accesso: LivelloAccesso;
  sezioni_abilitate: SezioneAbilitata[];
}

const emptyForm: FormData = {
  email: '',
  password: '',
  nome: '',
  cognome: '',
  telefono: '',
  ruolo: '',
  livello_accesso: 'visualizzazione',
  sezioni_abilitate: ['produzione', 'consegne'],
};

const GestioneUtenti: React.FC = () => {
  const { canModify, user: currentUser } = useAuth();

  // List state
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Deactivate/reactivate dialog state
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Reset password dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Success notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utentiAdminApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });
      setData(result);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Form handlers ──

  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email || '',
        password: '', // Never pre-fill password
        nome: user.nome,
        cognome: user.cognome,
        telefono: user.telefono || '',
        ruolo: user.ruolo || '',
        livello_accesso: user.livello_accesso,
        sezioni_abilitate: user.sezioni_abilitate || [],
      });
    } else {
      setEditingUser(null);
      setFormData({ ...emptyForm });
    }
    setFormDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cognome || !formData.livello_accesso) {
      setError('Nome, cognome e livello di accesso sono obbligatori');
      return;
    }

    if (!editingUser) {
      // Create mode: email and password required
      if (!formData.email) {
        setError('Email obbligatoria');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('La password deve avere almeno 6 caratteri');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingUser) {
        await utentiAdminApi.update(editingUser.id, {
          nome: formData.nome,
          cognome: formData.cognome,
          telefono: formData.telefono || null,
          ruolo: formData.ruolo || null,
          livello_accesso: formData.livello_accesso,
          sezioni_abilitate: formData.sezioni_abilitate,
        });
        setSuccessMessage('Utente aggiornato con successo');
      } else {
        await utentiAdminApi.create({
          email: formData.email,
          password: formData.password,
          nome: formData.nome,
          cognome: formData.cognome,
          telefono: formData.telefono || undefined,
          ruolo: formData.ruolo || undefined,
          livello_accesso: formData.livello_accesso,
          sezioni_abilitate: formData.sezioni_abilitate,
        });
        setSuccessMessage('Utente creato con successo');
      }
      setFormDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active handlers ──

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    try {
      if (selectedUser.attivo) {
        await utentiAdminApi.delete(selectedUser.id);
        setSuccessMessage('Utente disattivato');
      } else {
        await utentiAdminApi.update(selectedUser.id, { attivo: true });
        setSuccessMessage('Utente riattivato');
      }
      setToggleDialogOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Errore nella modifica stato utente');
    }
  };

  // ── Reset password handlers ──

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;
    if (newPassword.length < 6) {
      setError('La password deve avere almeno 6 caratteri');
      return;
    }

    setResetting(true);
    try {
      await utentiAdminApi.resetPassword(resetUserId, newPassword);
      setResetDialogOpen(false);
      setResetUserId(null);
      setNewPassword('');
      setSuccessMessage('Password reimpostata con successo');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Errore nel reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Gestione Utenti</Typography>
        {canModify && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
            Nuovo Utente
          </Button>
        )}
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          placeholder="Cerca per nome, cognome o email..."
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

      {/* Table */}
      <Paper>
        {loading ? (
          <LoadingSpinner fullPage />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Ruolo</TableCell>
                    <TableCell>Livello Accesso</TableCell>
                    <TableCell>Sezioni</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          Nessun utente trovato
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.data.map((row) => (
                    <TableRow key={row.id} hover sx={{ opacity: row.attivo ? 1 : 0.5 }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {row.cognome} {row.nome}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.ruolo || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.livello_accesso === 'modifica' ? 'Modifica' : 'Visualizzazione'}
                          size="small"
                          color={row.livello_accesso === 'modifica' ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {row.sezioni_abilitate?.map((s) => (
                          <Chip
                            key={s}
                            label={s === 'produzione' ? 'Produzione' : 'Consegne'}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.attivo ? 'Attivo' : 'Inattivo'}
                          size="small"
                          color={row.attivo ? 'success' : 'default'}
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
                            <Tooltip title="Reset Password">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setResetUserId(row.id);
                                  setNewPassword('');
                                  setResetDialogOpen(true);
                                }}
                              >
                                <LockReset />
                              </IconButton>
                            </Tooltip>
                            {row.id !== currentUser?.id && (
                              <Tooltip title={row.attivo ? 'Disattiva' : 'Riattiva'}>
                                <IconButton
                                  size="small"
                                  color={row.attivo ? 'error' : 'success'}
                                  onClick={() => {
                                    setSelectedUser(row);
                                    setToggleDialogOpen(true);
                                  }}
                                >
                                  {row.attivo ? <PersonOff /> : <PersonOutline />}
                                </IconButton>
                              </Tooltip>
                            )}
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

      {/* ── Create/Edit Dialog ── */}
      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cognome"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={!editingUser}
                disabled={!!editingUser}
                helperText={editingUser ? "L'email non può essere modificata" : ''}
              />
            </Grid>
            {!editingUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  helperText="Minimo 6 caratteri"
                />
              </Grid>
            )}
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
                label="Ruolo"
                value={formData.ruolo}
                onChange={(e) => setFormData({ ...formData, ruolo: e.target.value })}
                placeholder="es. Operatore, Responsabile..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Livello Accesso</InputLabel>
                <Select
                  value={formData.livello_accesso}
                  label="Livello Accesso"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livello_accesso: e.target.value as LivelloAccesso,
                    })
                  }
                >
                  {LIVELLI_ACCESSO.map((l) => (
                    <MenuItem key={l.value} value={l.value}>
                      {l.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sezioni Abilitate</InputLabel>
                <Select
                  multiple
                  value={formData.sezioni_abilitate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sezioni_abilitate: e.target.value as SezioneAbilitata[],
                    })
                  }
                  input={<OutlinedInput label="Sezioni Abilitate" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value === 'produzione' ? 'Produzione' : 'Consegne'}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {SEZIONI.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      {/* ── Reset Password Dialog ── */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nuova Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimo 6 caratteri"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Annulla</Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetting || newPassword.length < 6}
          >
            {resetting ? 'Reimpostazione...' : 'Reimposta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toggle Active Confirm Dialog ── */}
      <ConfirmDialog
        open={toggleDialogOpen}
        title={selectedUser?.attivo ? 'Disattiva Utente' : 'Riattiva Utente'}
        message={
          selectedUser?.attivo
            ? `Sei sicuro di voler disattivare l'utente ${selectedUser?.nome} ${selectedUser?.cognome}? L'utente non potrà più accedere al sistema.`
            : `Vuoi riattivare l'utente ${selectedUser?.nome} ${selectedUser?.cognome}?`
        }
        confirmLabel={selectedUser?.attivo ? 'Disattiva' : 'Riattiva'}
        confirmColor={selectedUser?.attivo ? 'error' : 'success'}
        onConfirm={handleToggleActive}
        onCancel={() => {
          setToggleDialogOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* ── Success Snackbar ── */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestioneUtenti;
