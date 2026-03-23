import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import TrasportatoreForm from './TrasportatoreForm';
import type { Trasportatore, CreateTrasportatoreInput } from '@planner-molino/shared';

interface TrasportatoreDialogProps {
  open: boolean;
  trasportatore?: Trasportatore | null;
  onClose: () => void;
  onSave: (data: CreateTrasportatoreInput) => void;
}

const FORM_ID = 'trasportatore-form';

export default function TrasportatoreDialog({
  open,
  trasportatore,
  onClose,
  onSave,
}: TrasportatoreDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {trasportatore ? 'Modifica Trasportatore' : 'Nuovo Trasportatore'}
      </DialogTitle>
      <DialogContent dividers>
        <TrasportatoreForm
          trasportatore={trasportatore}
          onSubmit={onSave}
          formId={FORM_ID}
        />
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
