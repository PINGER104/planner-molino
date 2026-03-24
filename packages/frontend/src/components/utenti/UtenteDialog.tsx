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
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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

  // Reset password sub-dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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
    if (!utente || newPassword.length < 6) {
      setResetError('La password deve essere di almeno 6 caratteri');
      return;
    }
    setResetting(true);
    setResetError(null);
    try {
      await utentiService.resetPassword(utente.id, newPassword);
      setResetSuccess(true);
      setNewPassword('');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Errore nel reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleCloseReset = () => {
    setResetOpen(false);
    setResetSuccess(false);
    setNewPassword('');
    setResetError(null);
    setShowPassword(false);
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
      <Dialog open={resetOpen} onClose={handleCloseReset} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success">
              Password reimpostata con successo per l'utente <strong>{utente?.username}</strong>.
            </Alert>
          ) : (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Inserisci la nuova password per l'utente <strong>{utente?.username}</strong>.
              </Typography>
              {resetError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetError}
                </Alert>
              )}
              <TextField
                fullWidth
                size="small"
                label="Nuova Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!resetError && newPassword.length < 6}
                helperText="Minimo 6 caratteri"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReset}>
            {resetSuccess ? 'Chiudi' : 'Annulla'}
          </Button>
          {!resetSuccess && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleResetPassword}
              disabled={resetting || newPassword.length < 6}
              startIcon={resetting ? <CircularProgress size={16} /> : undefined}
            >
              {resetting ? 'Reset in corso...' : 'Imposta Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
