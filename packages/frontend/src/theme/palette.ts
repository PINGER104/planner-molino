import { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  primary: {
    main: '#0F172A',      // Slate 900 — deep corporate navy
    light: '#3B82F6',     // Blue 500 — vibrant accent
    dark: '#020617',      // Slate 950
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#DC2626',      // Red 600 — consegne, alert accent
    light: '#EF4444',     // Red 500
    dark: '#991B1B',      // Red 800
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#059669',      // Emerald 600
    light: '#10B981',     // Emerald 500
    dark: '#047857',      // Emerald 700
  },
  warning: {
    main: '#D97706',      // Amber 600
    light: '#F59E0B',     // Amber 500
    dark: '#B45309',      // Amber 700
  },
  error: {
    main: '#DC2626',      // Red 600
    light: '#EF4444',     // Red 500
    dark: '#B91C1C',      // Red 700
  },
  background: {
    default: '#F8FAFC',   // Slate 50 — cool off-white
    paper: '#FFFFFF',
  },
  grey: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  text: {
    primary: '#0F172A',   // Slate 900
    secondary: '#475569', // Slate 600
  },
  divider: '#E2E8F0',    // Slate 200
};
