import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  TextField,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import UtenteForm from './UtenteForm';
import type { Utente } from '@planner-molino/shared';
import { utentiService } from '../../services';

interface UtenteDialogProps {
  open: boolean;
  utente?: Utente | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UtenteDialog({ open, utente, onClose, onSaved }: UtenteDialogProps) {
  const isEdit = !!utente;
  const formId = 'utente-form';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset password sub-dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && utente) {
        // Remove password fields and conferma_password from edit data
        const { conferma_password, password, ...editData } = data as Record<string, unknown>;
        await utentiService.update(utente.id, editData as Partial<Utente>);
      } else {
        // Remove conferma_password from create data
        const { conferma_password, ...createData } = data as Record<string, unknown>;
        await utentiService.create(createData as Partial<Utente> & { password: string });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!utente) return;
    setResetting(true);
    try {
      await utentiService.resetPassword(utente.id);
      setResetSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'Modifica Utente' : 'Nuovo Utente'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 1 }}>
            <UtenteForm
              utente={utente}
              onSubmit={handleSubmit}
              formId={formId}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isEdit && (
            <Button
              onClick={() => setResetOpen(true)}
              color="warning"
              sx={{ mr: 'auto' }}
            >
              Reset Password
            </Button>
          )}
          <Button onClick={onClose}>Annulla</Button>
          <Button
            type="submit"
            form={formId}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Salvataggio...' : isEdit ? 'Salva Modifiche' : 'Crea Utente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Sub-Dialog */}
      <Dialog open={resetOpen} onClose={() => { setResetOpen(false); setResetSuccess(false); }} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success">
              Password resettata con successo. L'utente ricever&agrave; un'email con le istruzioni.
            </Alert>
          ) : (
            <Typography variant="body2">
              Sei sicuro di voler resettare la password per l'utente{' '}
              <strong>{utente?.username}</strong>? L'utente ricever&agrave; un'email con un link per
              impostare una nuova password.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setResetOpen(false); setResetSuccess(false); }}>
            {resetSuccess ? 'Chiudi' : 'Annulla'}
          </Button>
          {!resetSuccess && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleResetPassword}
              disabled={resetting}
              startIcon={resetting ? <CircularProgress size={16} /> : undefined}
            >
              {resetting ? 'Reset in corso...' : 'Conferma Reset'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
