import { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  primary: {
    main: '#292524',      // Stone 800 — warm industrial dark
    light: '#2563EB',     // Blue 600 — vibrant production accent
    dark: '#1C1917',      // Stone 900
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#C2410C',      // Orange 700 — terracotta/grain warmth
    light: '#EA580C',     // Orange 600
    dark: '#9A3412',      // Orange 800
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#15803D',      // Green 700
    light: '#16A34A',     // Green 600
    dark: '#166534',      // Green 800
  },
  warning: {
    main: '#B45309',      // Amber 700
    light: '#D97706',     // Amber 600
    dark: '#92400E',      // Amber 800
  },
  error: {
    main: '#DC2626',      // Red 600
    light: '#EF4444',     // Red 500
    dark: '#B91C1C',      // Red 700
  },
  background: {
    default: '#FAF9F6',   // Warm cream off-white
    paper: '#FFFFFF',
  },
  grey: {
    50:  '#FAFAF9',       // Stone 50
    100: '#F5F5F4',       // Stone 100
    200: '#E7E5E4',       // Stone 200
    300: '#D6D3D1',       // Stone 300
    400: '#A8A29E',       // Stone 400
    500: '#78716C',       // Stone 500
    600: '#57534E',       // Stone 600
    700: '#44403C',       // Stone 700
    800: '#292524',       // Stone 800
    900: '#1C1917',       // Stone 900
  },
  text: {
    primary: '#1C1917',   // Stone 900
    secondary: '#57534E', // Stone 600
  },
  divider: '#E7E5E4',    // Stone 200
};
