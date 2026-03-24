import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUtenteSchema,
  updateUtenteSchema,
  LIVELLO_ACCESSO,
  SEZIONI,
} from '@planner-molino/shared';
import type { Utente } from '@planner-molino/shared';

// Extend shared schemas with frontend-only fields
// conferma_password is UI-only — not sent to the backend
const createFormSchema = createUtenteSchema
  .extend({
    conferma_password: z.string().min(1, 'Conferma la password'),
  })
  .refine((data) => data.password === data.conferma_password, {
    message: 'Le password non corrispondono',
    path: ['conferma_password'],
  });

// Edit schema uses shared updateUtenteSchema directly — no frontend-only fields needed
const editFormSchema = updateUtenteSchema;

type CreateFormData = z.infer<typeof createFormSchema>;
type EditFormData = z.infer<typeof editFormSchema>;

interface UtenteFormProps {
  utente?: Utente | null;
  onSubmit: (data: CreateFormData | EditFormData) => Promise<void>;
  formId: string;
}

export default function UtenteForm({ utente, onSubmit, formId }: UtenteFormProps) {
  const isEdit = !!utente;
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
    defaultValues: isEdit
      ? {
          username: utente.username,
          nome: utente.nome,
          cognome: utente.cognome,
          email: utente.email,
          telefono: utente.telefono || '',
          ruolo: utente.ruolo || '',
          livello_accesso: utente.livello_accesso,
          sezioni_abilitate: utente.sezioni_abilitate,
        }
      : {
          username: '',
          nome: '',
          cognome: '',
          email: '',
          password: '',
          conferma_password: '',
          telefono: '',
          ruolo: '',
          livello_accesso: 'modifica' as const,
          sezioni_abilitate: ['produzione'] as ('produzione' | 'consegne')[],
        },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Username"
                fullWidth
                size="small"
                error={!!errors.username}
                helperText={errors.username?.message}
                InputProps={{ readOnly: isEdit }}
                sx={isEdit ? { '& .MuiInputBase-input': { fontFamily: 'monospace' } } : {}}
              />
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
                type="email"
                fullWidth
                size="small"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Grid>

        {!isEdit && (
          <>
            <Grid item xs={12} sm={6}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    size="small"
                    error={!!(errors as Record<string, { message?: string }>).password}
                    helperText={(errors as Record<string, { message?: string }>).password?.message}
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
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="conferma_password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Conferma Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    size="small"
                    error={!!(errors as Record<string, { message?: string }>).conferma_password}
                    helperText={
                      (errors as Record<string, { message?: string }>).conferma_password?.message
                    }
                  />
                )}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <Controller
            name="nome"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nome"
                fullWidth
                size="small"
                error={!!errors.nome}
                helperText={errors.nome?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="cognome"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Cognome"
                fullWidth
                size="small"
                error={!!errors.cognome}
                helperText={errors.cognome?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Telefono"
                fullWidth
                size="small"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="ruolo"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Ruolo"
                fullWidth
                size="small"
                placeholder="es. Responsabile produzione"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="livello_accesso"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small" error={!!errors.livello_accesso}>
                <InputLabel>Livello Accesso</InputLabel>
                <Select {...field} label="Livello Accesso">
                  {Object.entries(LIVELLO_ACCESSO).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.livello_accesso && (
                  <FormHelperText>{errors.livello_accesso.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="sezioni_abilitate"
            control={control}
            render={({ field }) => (
              <FormControl error={!!errors.sezioni_abilitate} component="fieldset">
                <FormGroup row>
                  {Object.entries(SEZIONI).map(([key, label]) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Checkbox
                          checked={(field.value ?? []).includes(key as 'produzione' | 'consegne')}
                          onChange={(e) => {
                            const val = key as 'produzione' | 'consegne';
                            const current = field.value ?? [];
                            if (e.target.checked) {
                              field.onChange([...current, val]);
                            } else {
                              field.onChange(current.filter((v: string) => v !== val));
                            }
                          }}
                        />
                      }
                      label={label}
                    />
                  ))}
                </FormGroup>
                {errors.sezioni_abilitate && (
                  <FormHelperText>{errors.sezioni_abilitate.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </form>
  );
}
