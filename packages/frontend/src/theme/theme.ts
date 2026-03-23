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
    '0 1px 2px 0 rgba(28, 25, 23, 0.03)',
    '0 1px 3px 0 rgba(28, 25, 23, 0.05), 0 1px 2px -1px rgba(28, 25, 23, 0.03)',
    '0 4px 6px -1px rgba(28, 25, 23, 0.05), 0 2px 4px -2px rgba(28, 25, 23, 0.03)',
    '0 8px 15px -3px rgba(28, 25, 23, 0.06), 0 4px 6px -4px rgba(28, 25, 23, 0.03)',
    '0 16px 25px -5px rgba(28, 25, 23, 0.06), 0 8px 10px -6px rgba(28, 25, 23, 0.03)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
    '0 20px 40px -8px rgba(28, 25, 23, 0.1)',
  ],
});

export default theme;
