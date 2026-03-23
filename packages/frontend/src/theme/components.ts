import { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        padding: '8px 22px',
        borderRadius: 8,
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(27, 42, 74, 0.15)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            boxShadow: '0 0 0 3px rgba(27, 42, 74, 0.08)',
          },
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid #E8E5DF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 14,
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        },
      },
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: {
        '& .MuiTableRow-root:nth-of-type(even)': {
          backgroundColor: '#FAFAF9',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
  },
};
