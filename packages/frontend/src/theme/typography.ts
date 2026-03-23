import { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography: TypographyOptions = {
  fontFamily: '"Source Sans 3", "Helvetica", "Arial", sans-serif',
  h1: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
  },
  h4: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 600,
  },
  h5: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 600,
  },
  h6: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 600,
  },
  body1: {
    lineHeight: 1.6,
  },
  body2: {
    lineHeight: 1.55,
  },
  button: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 600,
    textTransform: 'none' as const,
  },
  overline: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 600,
    letterSpacing: '0.08em',
  },
};
