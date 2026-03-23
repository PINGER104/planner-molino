import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { loginSchema, type LoginInput } from '@planner-molino/shared';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Credenziali non valide';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left panel — branding */}
      <Box
        sx={{
          flex: { xs: 'none', md: '0 0 42%' },
          minHeight: { xs: 180, md: '100vh' },
          background: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          px: 4,
          py: { xs: 5, md: 0 },
        }}
      >
        {/* Subtle grid pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow accent */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '40%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 340 }}>
          <Box
            component="img"
            src="/logo-molino.png"
            alt="Molino 4.0"
            sx={{
              height: { xs: 44, md: 52 },
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.9,
              mb: 3,
            }}
          />
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '1.5rem', md: '2rem' },
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              mb: 1.5,
            }}
          >
            PLANNER
          </Typography>
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Sistema di pianificazione
            <br />
            produzione e consegne
          </Typography>

          {/* Decorative line */}
          <Box
            sx={{
              width: 32,
              height: 2,
              borderRadius: 1,
              bgcolor: '#3B82F6',
              mx: 'auto',
              mt: 3,
              opacity: 0.6,
            }}
          />
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: { xs: 5, md: 0 },
          bgcolor: '#FFFFFF',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 360 }}>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              fontSize: '1.375rem',
              color: '#0F172A',
              mb: 0.5,
            }}
          >
            Accedi
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              mb: 4,
              fontSize: '0.8125rem',
            }}
          >
            Inserisci le tue credenziali per continuare
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ mb: 2.5 }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#334155',
                  mb: 0.75,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Email
              </Typography>
              <TextField
                {...register('email')}
                fullWidth
                type="email"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                placeholder="nome@azienda.it"
                size="medium"
              />
            </Box>

            <Box sx={{ mb: 3.5 }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#334155',
                  mb: 0.75,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Password
              </Typography>
              <TextField
                {...register('password')}
                fullWidth
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                placeholder="Inserisci password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.3,
                fontSize: '0.875rem',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 600,
              }}
            >
              {isLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Accedi al sistema'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
