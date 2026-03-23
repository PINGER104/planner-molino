import React, { useEffect } from 'react';
import {
  Grid,
  TextField,
  Chip,
  Box,
  Typography,
  Autocomplete,
  Rating,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTrasportatoreSchema, type CreateTrasportatoreInput } from '@planner-molino/shared';
import type { Trasportatore } from '@planner-molino/shared';

interface TrasportatoreFormProps {
  trasportatore?: Trasportatore | null;
  onSubmit: (data: CreateTrasportatoreInput) => void;
  formId: string;
}

const TIPOLOGIE_MEZZI_SUGGERIMENTI = [
  'Bilico',
  'Motrice',
  'Furgone',
  'Cisterna',
  'Autotreno',
  'Centinato',
  'Frigorifero',
];

const CERTIFICAZIONI_SUGGERIMENTI = [
  'ISO 9001',
  'ISO 22000',
  'BRC',
  'IFS',
  'HACCP',
  'ADR',
];

export default function TrasportatoreForm({
  trasportatore,
  onSubmit,
  formId,
}: TrasportatoreFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTrasportatoreInput>({
    resolver: zodResolver(createTrasportatoreSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (trasportatore) {
      reset({
        ragione_sociale: trasportatore.ragione_sociale || '',
        partita_iva: trasportatore.partita_iva || '',
        indirizzo_sede: trasportatore.indirizzo_sede || '',
        referente_nome: trasportatore.referente_nome || '',
        referente_telefono: trasportatore.referente_telefono || '',
        referente_email: trasportatore.referente_email || '',
        tipologie_mezzi: trasportatore.tipologie_mezzi || [],
        certificazioni: trasportatore.certificazioni || [],
        rating_puntualita: trasportatore.rating_puntualita ?? 3,
        note: trasportatore.note || '',
      });
    }
  }, [trasportatore, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* Codice (read-only for edit) */}
        {trasportatore && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Codice:
              </Typography>
              <Chip label={trasportatore.codice} size="small" variant="outlined" />
            </Box>
          </Grid>
        )}

        {/* Ragione Sociale */}
        <Grid item xs={12} sm={8}>
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
        <Grid item xs={12} sm={4}>
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

        {/* Indirizzo Sede */}
        <Grid item xs={12}>
          <Controller
            name="indirizzo_sede"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Indirizzo Sede" fullWidth />
            )}
          />
        </Grid>

        {/* Referente */}
        <Grid item xs={12} sm={4}>
          <Controller
            name="referente_nome"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Referente Nome" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="referente_telefono"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Referente Telefono" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="referente_email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Referente Email"
                fullWidth
                type="email"
                error={!!errors.referente_email}
                helperText={errors.referente_email?.message}
              />
            )}
          />
        </Grid>

        {/* Tipologie Mezzi */}
        <Grid item xs={12}>
          <Controller
            name="tipologie_mezzi"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                freeSolo
                options={TIPOLOGIE_MEZZI_SUGGERIMENTI}
                value={field.value || []}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Tipologie Mezzi" placeholder="Aggiungi..." />
                )}
              />
            )}
          />
        </Grid>

        {/* Certificazioni */}
        <Grid item xs={12}>
          <Controller
            name="certificazioni"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                freeSolo
                options={CERTIFICAZIONI_SUGGERIMENTI}
                value={field.value || []}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Certificazioni" placeholder="Aggiungi..." />
                )}
              />
            )}
          />
        </Grid>

        {/* Rating */}
        <Grid item xs={12}>
          <Controller
            name="rating_puntualita"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Rating Puntualita
                </Typography>
                <Rating
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue ?? 0)}
                  precision={0.5}
                  max={5}
                />
              </Box>
            )}
          />
        </Grid>

        {/* Note */}
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
