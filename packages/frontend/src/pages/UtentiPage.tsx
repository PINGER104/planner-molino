import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/common/PageHeader';
import SearchField from '../components/common/SearchField';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UtentiTable from '../components/utenti/UtentiTable';
import UtenteDialog from '../components/utenti/UtenteDialog';
import { utentiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Utente } from '@planner-molino/shared';

export default function UtentiPage() {
  const { user: currentUser } = useAuth();

  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [soloAttivi, setSoloAttivi] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUtente, setEditingUtente] = useState<Utente | null>(null);

  // Confirm deactivation
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    utente: Utente | null;
  }>({ open: false, utente: null });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const fetchUtenti = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page + 1),
        limit: String(rowsPerPage),
      };
      if (search) params.search = search;
      if (soloAttivi) params.attivo = 'true';

      const result = await utentiService.list(params);
      setUtenti(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Errore caricamento utenti:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, soloAttivi]);

  useEffect(() => {
    fetchUtenti();
  }, [fetchUtenti]);

  const handleEdit = (utente: Utente) => {
    setEditingUtente(utente);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUtente(null);
    setDialogOpen(true);
  };

  const handleToggleAttivo = (utente: Utente) => {
    setConfirmDialog({ open: true, utente });
  };

  const handleConfirmToggle = async () => {
    const utente = confirmDialog.utente;
    if (!utente) return;
    try {
      await utentiService.update(utente.id, { attivo: !utente.attivo } as Partial<Utente>);
      setSnackbar({
        open: true,
        message: utente.attivo ? 'Utente disattivato' : 'Utente riattivato',
        severity: 'success',
      });
      fetchUtenti();
    } catch {
      setSnackbar({ open: true, message: 'Errore nella modifica', severity: 'error' });
    }
    setConfirmDialog({ open: false, utente: null });
  };

  const handleResetPassword = (utente: Utente) => {
    // Open the edit dialog, the reset password sub-dialog will be there
    setEditingUtente(utente);
    setDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="Gestione Utenti"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Nuovo Utente
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        <SearchField
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          placeholder="Cerca per nome, username, email..."
        />
        <FormControlLabel
          control={
            <Switch
              checked={soloAttivi}
              onChange={(e) => {
                setSoloAttivi(e.target.checked);
                setPage(0);
              }}
            />
          }
          label="Solo attivi"
        />
      </Stack>

      {loading ? (
        <LoadingSpinner text="Caricamento utenti..." />
      ) : (
        <UtentiTable
          utenti={utenti}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(0);
          }}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onToggleAttivo={handleToggleAttivo}
          currentUserId={currentUser?.id || ''}
        />
      )}

      {/* Create/Edit Dialog */}
      <UtenteDialog
        open={dialogOpen}
        utente={editingUtente}
        onClose={() => {
          setDialogOpen(false);
          setEditingUtente(null);
        }}
        onSaved={() => {
          setSnackbar({
            open: true,
            message: editingUtente ? 'Utente aggiornato' : 'Utente creato',
            severity: 'success',
          });
          fetchUtenti();
        }}
      />

      {/* Confirm Deactivation */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.utente?.attivo ? 'Disattivare utente?' : 'Riattivare utente?'}
        message={
          confirmDialog.utente?.attivo
            ? `Sei sicuro di voler disattivare l'utente "${confirmDialog.utente?.username}"? Non potra' piu' accedere al sistema.`
            : `Vuoi riattivare l'utente "${confirmDialog.utente?.username}"?`
        }
        confirmLabel={confirmDialog.utente?.attivo ? 'Disattiva' : 'Riattiva'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmDialog({ open: false, utente: null })}
        severity={confirmDialog.utente?.attivo ? 'error' : 'warning'}
      />

      {/* Snackbar */}
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
