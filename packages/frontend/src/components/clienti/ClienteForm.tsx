import React, { useEffect } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClienteSchema, type CreateClienteInput } from '@planner-molino/shared';
import { CANALE_CLIENTE, MODALITA_CONSEGNA } from '@planner-molino/shared';
import type { Cliente } from '@planner-molino/shared';

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSubmit: (data: CreateClienteInput) => void;
  formId: string;
}

export default function ClienteForm({ cliente, onSubmit, formId }: ClienteFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateClienteInput>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      ragione_sociale: '',
      partita_iva: '',
      codice_fiscale: '',
      indirizzo: '',
      cap: '',
      citta: '',
      provincia: '',
      nazione: 'IT',
      destinazione_diversa: false,
      dest_indirizzo: '',
      dest_cap: '',
      dest_citta: '',
      dest_provincia: '',
      telefono: '',
      email: '',
      referente_ordini: '',
      canale: undefined,
      modalita_consegna: undefined,
      note: '',
    },
  });

  const destinazioneDiversa = watch('destinazione_diversa');

  useEffect(() => {
    if (cliente) {
      reset({
        ragione_sociale: cliente.ragione_sociale || '',
        partita_iva: cliente.partita_iva || '',
        codice_fiscale: cliente.codice_fiscale || '',
        indirizzo: cliente.indirizzo || '',
        cap: cliente.cap || '',
        citta: cliente.citta || '',
        provincia: cliente.provincia || '',
        nazione: cliente.nazione || 'IT',
        destinazione_diversa: cliente.destinazione_diversa || false,
        dest_indirizzo: cliente.dest_indirizzo || '',
        dest_cap: cliente.dest_cap || '',
        dest_citta: cliente.dest_citta || '',
        dest_provincia: cliente.dest_provincia || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        referente_ordini: cliente.referente_ordini || '',
        canale: cliente.canale || undefined,
        modalita_consegna: cliente.modalita_consegna || undefined,
        note: cliente.note || '',
      });
    }
  }, [cliente, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* Codice (read-only for edit) */}
        {cliente && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Codice:
              </Typography>
              <Chip label={cliente.codice} size="small" variant="outlined" />
            </Box>
          </Grid>
        )}

        {/* Row 1: Ragione Sociale */}
        <Grid item xs={12}>
          <Controller
            name="ragione_sociale"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Ragione Sociale"
                fullWidth
                required
                error={!!errors.ragione_sociale}
                helperText={errors.ragione_sociale?.message}
              />
            )}
          />
        </Grid>

        {/* Row 2: P.IVA, CF */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="partita_iva"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Partita IVA"
                fullWidth
                error={!!errors.partita_iva}
                helperText={errors.partita_iva?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="codice_fiscale"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Codice Fiscale"
                fullWidth
                error={!!errors.codice_fiscale}
                helperText={errors.codice_fiscale?.message}
              />
            )}
          />
        </Grid>

        {/* Row 3: Indirizzo */}
        <Grid item xs={12}>
          <Controller
            name="indirizzo"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Indirizzo" fullWidth />
            )}
          />
        </Grid>

        {/* Row 4: CAP, Citta, Provincia, Nazione */}
        <Grid item xs={6} sm={3}>
          <Controller
            name="cap"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="CAP" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={5}>
          <Controller
            name="citta"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Citta" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Controller
            name="provincia"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Prov." fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Controller
            name="nazione"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Nazione" fullWidth />
            )}
          />
        </Grid>

        {/* Row 5: Telefono, Email */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Telefono" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                fullWidth
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Grid>

        {/* Row 6: Referente, Canale, Modalita */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="referente_ordini"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Referente Ordini" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <Controller
            name="canale"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Canale" select fullWidth value={field.value || ''}>
                <MenuItem value="">
                  <em>Nessuno</em>
                </MenuItem>
                {Object.entries(CANALE_CLIENTE).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <Controller
            name="modalita_consegna"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Modalita Consegna"
                select
                fullWidth
                value={field.value || ''}
              >
                <MenuItem value="">
                  <em>Nessuna</em>
                </MenuItem>
                {Object.entries(MODALITA_CONSEGNA).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Row 7: Destinazione diversa */}
        <Grid item xs={12}>
          <Controller
            name="destinazione_diversa"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Destinazione diversa dalla sede"
              />
            )}
          />
        </Grid>

        {/* Destination fields (conditional) */}
        {destinazioneDiversa && (
          <>
            <Grid item xs={12}>
              <Controller
                name="dest_indirizzo"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Indirizzo Destinazione" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Controller
                name="dest_cap"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="CAP Dest." fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={6} sm={5}>
              <Controller
                name="dest_citta"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Citta Dest." fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Controller
                name="dest_provincia"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Prov. Dest." fullWidth />
                )}
              />
            </Grid>
          </>
        )}

        {/* Row 8: Note */}
        <Grid item xs={12}>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Note"
                fullWidth
                multiline
                rows={3}
              />
            )}
          />
        </Grid>
      </Grid>
    </form>
  );
}
