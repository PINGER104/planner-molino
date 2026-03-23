import { ThemeOptions } from '@mui/material/styles';

export const typography: ThemeOptions['typography'] = {
  fontFamily: '"Figtree", "Helvetica Neue", "Arial", sans-serif',
  h1: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  h2: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  h3: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
  },
  h4: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.015em',
    lineHeight: 1.3,
  },
  h5: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.35,
  },
  h6: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 600,
    letterSpacing: '-0.005em',
    lineHeight: 1.4,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  subtitle2: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 600,
    fontSize: '0.8125rem',
    letterSpacing: '0.01em',
  },
  body1: {
    lineHeight: 1.65,
    fontSize: '0.9375rem',
  },
  body2: {
    lineHeight: 1.6,
    fontSize: '0.8125rem',
  },
  button: {
    textTransform: 'none' as const,
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 600,
    letterSpacing: '0.005em',
    fontSize: '0.8125rem',
  },
  overline: {
    fontFamily: '"Sora", "Figtree", sans-serif',
    fontWeight: 700,
    letterSpacing: '0.12em',
    fontSize: '0.625rem',
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#78716C',
  },
};
