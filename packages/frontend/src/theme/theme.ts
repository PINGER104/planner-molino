import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { components } from './components';

const theme = createTheme({
  palette,
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(15 23 42 / 0.04)',
    '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
    '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
    '0 10px 15px -3px rgb(15 23 42 / 0.06), 0 4px 6px -4px rgb(15 23 42 / 0.03)',
    '0 20px 25px -5px rgb(15 23 42 / 0.06), 0 8px 10px -6px rgb(15 23 42 / 0.03)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
    '0 25px 50px -12px rgb(15 23 42 / 0.12)',
  ],
});

export default theme;
