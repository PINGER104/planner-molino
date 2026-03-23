import React, { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
} from 'react-hook-form';
import {
  CATEGORIE_PRODOTTO,
  UNITA_MISURA,
  ORIGINE_MATERIALE,
  TIPOLOGIA_CARICO,
} from '@planner-molino/shared';
import type { TipologiaPrenotazione } from '@planner-molino/shared';
import { prenotazioniService } from '../../../services';

interface PrenotazioneDropdown {
  id: number;
  codice_prenotazione: string;
  prodotto_descrizione: string | null;
}

interface StepProdottoProps {
  control: Control<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  tipologia: TipologiaPrenotazione;
}

export default function StepProdotto({
  control,
  errors,
  watch,
  tipologia,
}: StepProdottoProps) {
  const [collegateOptions, setCollegateOptions] = useState<
    PrenotazioneDropdown[]
  >([]);
  const origineMateriale = watch('origine_materiale');

  // Fetch prenotazioni collegate
  useEffect(() => {
    const tipoCollegato =
      tipologia === 'produzione' ? 'consegna' : 'produzione';
    prenotazioniService
      .list({ tipologia: tipoCollegato, limit: '100' })
      .then((res) => {
        setCollegateOptions(
          (res.data || []).map((p) => ({
            id: p.id,
            codice_prenotazione: p.codice_prenotazione,
            prodotto_descrizione: p.prodotto_descrizione,
          }))
        );
      })
      .catch(console.error);
  }, [tipologia]);

  const collegataFieldName =
    tipologia === 'produzione'
      ? 'prenotazione_consegna_collegata'
      : 'prenotazione_produzione_collegata';

  return (
    <Grid container spacing={3}>
      {/* Prodotto codice */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="prodotto_codice"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ''}
              label="Codice Prodotto"
              fullWidth
            />
          )}
        />
      </Grid>

      {/* Prodotto descrizione */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="prodotto_descrizione"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ''}
              label="Descrizione Prodotto"
              fullWidth
            />
          )}
        />
      </Grid>

      {/* Categoria */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="categoria_prodotto"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Categoria Prodotto</InputLabel>
              <Select {...field} value={field.value || ''} label="Categoria Prodotto">
                <MenuItem value="">
                  <em>Nessuna</em>
                </MenuItem>
                {Object.entries(CATEGORIE_PRODOTTO).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      {/* Specifica W */}
      <Grid size={{ xs: 6, md: 4 }}>
        <Controller
          name="specifica_w"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              label="Specifica W"
              type="number"
              fullWidth
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <Controller
          name="specifica_w_tolleranza"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              label="Tolleranza W"
              type="number"
              fullWidth
            />
          )}
        />
      </Grid>

      {/* Specifica PL */}
      <Grid size={{ xs: 6, md: 4 }}>
        <Controller
          name="specifica_pl"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              label="Specifica PL"
              type="number"
              fullWidth
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <Controller
          name="specifica_pl_tolleranza"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              label="Tolleranza PL"
              type="number"
              fullWidth
            />
          )}
        />
      </Grid>

      {/* Quantita + Unita */}
      <Grid size={{ xs: 6, md: 4 }}>
        <Controller
          name="quantita_prevista"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              label="Quantita Prevista"
              type="number"
              fullWidth
              error={!!errors.quantita_prevista}
              helperText={
                errors.quantita_prevista
                  ? String(errors.quantita_prevista.message)
                  : undefined
              }
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <Controller
          name="unita_misura"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Unita di Misura</InputLabel>
              <Select {...field} value={field.value || ''} label="Unita di Misura">
                <MenuItem value="">
                  <em>Nessuna</em>
                </MenuItem>
                {Object.entries(UNITA_MISURA).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      {/* Origine Materiale - only for produzione */}
      {tipologia === 'produzione' && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="origine_materiale"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Origine Materiale</InputLabel>
                  <Select
                    {...field}
                    value={field.value || ''}
                    label="Origine Materiale"
                  >
                    <MenuItem value="">
                      <em>Nessuna</em>
                    </MenuItem>
                    {Object.entries(ORIGINE_MATERIALE).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          {origineMateriale === 'silos' && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="silos_origine"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label="Silos Origine"
                    fullWidth
                  />
                )}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="linea_produzione"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  label="Linea Produzione"
                  fullWidth
                />
              )}
            />
          </Grid>
        </>
      )}

      {/* Tipologia Carico - only for consegna */}
      {tipologia === 'consegna' && (
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="tipologia_carico"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Tipologia Carico</InputLabel>
                <Select
                  {...field}
                  value={field.value || ''}
                  label="Tipologia Carico"
                >
                  <MenuItem value="">
                    <em>Nessuna</em>
                  </MenuItem>
                  {Object.entries(TIPOLOGIA_CARICO).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
      )}

      {/* Ordine Riferimento */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="ordine_riferimento"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ''}
              label="Ordine Riferimento"
              fullWidth
            />
          )}
        />
      </Grid>

      {/* Collegamento prenotazione */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={collegataFieldName}
          control={control}
          render={({ field }) => {
            const selected =
              collegateOptions.find((c) => c.id === field.value) || null;
            return (
              <Autocomplete
                options={collegateOptions}
                getOptionLabel={(opt) =>
                  `${opt.codice_prenotazione}${opt.prodotto_descrizione ? ` - ${opt.prodotto_descrizione}` : ''}`
                }
                value={selected}
                onChange={(_, newValue) =>
                  field.onChange(newValue ? newValue.id : null)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      tipologia === 'produzione'
                        ? 'Prenotazione Consegna Collegata'
                        : 'Prenotazione Produzione Collegata'
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
    </Grid>
  );
}
