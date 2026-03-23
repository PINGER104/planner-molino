import { ThemeOptions } from '@mui/material/styles';

export const typography: ThemeOptions['typography'] = {
  fontFamily: '"DM Sans", "Helvetica Neue", "Arial", sans-serif',
  h1: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 800,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.015em',
  },
  h4: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  h5: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 600,
    letterSpacing: '-0.005em',
  },
  h6: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 600,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.8125rem',
  },
  body1: {
    lineHeight: 1.6,
    fontSize: '0.9375rem',
  },
  body2: {
    lineHeight: 1.55,
    fontSize: '0.8125rem',
  },
  button: {
    textTransform: 'none' as const,
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 600,
    letterSpacing: '0.01em',
    fontSize: '0.875rem',
  },
  overline: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
    fontWeight: 600,
    letterSpacing: '0.1em',
    fontSize: '0.6875rem',
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#64748B',
  },
};
