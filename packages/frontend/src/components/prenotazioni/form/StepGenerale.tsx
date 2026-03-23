import React, { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { PRIORITA_LABELS } from '@planner-molino/shared';
import type { TipologiaPrenotazione } from '@planner-molino/shared';
import { clientiService, trasportatoriService } from '../../../services';

interface DropdownItem {
  id: number;
  codice: string;
  ragione_sociale: string;
}

interface StepGeneraleProps {
  control: Control<any>;
  errors: FieldErrors;
  tipologia: TipologiaPrenotazione;
}

export default function StepGenerale({
  control,
  errors,
  tipologia,
}: StepGeneraleProps) {
  const [clientiOptions, setClientiOptions] = useState<DropdownItem[]>([]);
  const [trasportatoriOptions, setTrasportatoriOptions] = useState<DropdownItem[]>([]);

  useEffect(() => {
    clientiService.dropdown().then(setClientiOptions).catch(console.error);
    trasportatoriService.dropdown().then(setTrasportatoriOptions).catch(console.error);
  }, []);

  return (
    <Grid container spacing={3}>
      {/* Tipologia - read only */}
      <Grid size={{ xs: 12 }}>
        <Chip
          label={tipologia === 'produzione' ? 'Produzione' : 'Consegna'}
          color={tipologia === 'produzione' ? 'secondary' : 'primary'}
          sx={{ fontWeight: 600 }}
        />
      </Grid>

      {/* Cliente */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="cliente_id"
          control={control}
          render={({ field }) => {
            const selectedCliente =
              clientiOptions.find((c) => c.id === field.value) || null;
            return (
              <Autocomplete
                options={clientiOptions}
                getOptionLabel={(opt) =>
                  `${opt.codice} - ${opt.ragione_sociale}`
                }
                value={selectedCliente}
                onChange={(_, newValue) =>
                  field.onChange(newValue ? newValue.id : null)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente *"
                    error={!!errors.cliente_id}
                    helperText={
                      errors.cliente_id
                        ? String(errors.cliente_id.message)
                        : undefined
                    }
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.id === value.id
                }
              />
            );
          }}
        />
      </Grid>

      {/* Trasportatore */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="trasportatore_id"
          control={control}
          render={({ field }) => {
            const selectedTrasportatore =
              trasportatoriOptions.find((t) => t.id === field.value) || null;
            return (
              <Autocomplete
                options={trasportatoriOptions}
                getOptionLabel={(opt) =>
                  `${opt.codice} - ${opt.ragione_sociale}`
                }
                value={selectedTrasportatore}
                onChange={(_, newValue) =>
                  field.onChange(newValue ? newValue.id : null)
                }
                renderInput={(params) => (
                  <TextField {...params} label="Trasportatore" />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.id === value.id
                }
              />
            );
          }}
        />
      </Grid>

      {/* Priorita */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="priorita"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.priorita}>
              <InputLabel>Priorita</InputLabel>
              <Select {...field} label="Priorita">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                  <MenuItem key={p} value={p}>
                    {p} - {PRIORITA_LABELS[p]}
                  </MenuItem>
                ))}
              </Select>
              {errors.priorita && (
                <FormHelperText>
                  {String(errors.priorita.message)}
                </FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {/* Note */}
      <Grid size={{ xs: 12 }}>
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ''}
              label="Note"
              multiline
              rows={3}
              fullWidth
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
