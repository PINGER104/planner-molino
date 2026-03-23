import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import ClienteForm from './ClienteForm';
import type { Cliente, CreateClienteInput } from '@planner-molino/shared';

interface ClienteDialogProps {
  open: boolean;
  cliente?: Cliente | null;
  onClose: () => void;
  onSave: (data: CreateClienteInput) => void;
}

const FORM_ID = 'cliente-form';

export default function ClienteDialog({ open, cliente, onClose, onSave }: ClienteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
      <DialogContent dividers>
        <ClienteForm cliente={cliente} onSubmit={onSave} formId={FORM_ID} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button type="submit" form={FORM_ID} variant="contained">
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
}
