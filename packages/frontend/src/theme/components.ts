import { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: '#CBD5E1 #F1F5F9',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          backgroundColor: '#CBD5E1',
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#94A3B8',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
        padding: '8px 20px',
        boxShadow: 'none',
        transition: 'all 0.15s ease',
        '&:hover': {
          boxShadow: '0 1px 3px 0 rgb(15 23 42 / 0.1)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.2)',
        },
      },
      containedPrimary: {
        backgroundColor: '#0F172A',
        '&:hover': {
          backgroundColor: '#1E293B',
        },
      },
      outlined: {
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        color: '#334155',
        '&:hover': {
          borderWidth: 1.5,
          borderColor: '#CBD5E1',
          backgroundColor: '#F8FAFC',
        },
      },
      sizeSmall: {
        padding: '5px 14px',
        fontSize: '0.8125rem',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation0: {
        border: '1px solid #E2E8F0',
      },
      elevation1: {
        boxShadow: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        border: '1px solid #F1F5F9',
      },
      elevation2: {
        boxShadow: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.05)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.08)',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontFamily: '"Plus Jakarta Sans", "DM Sans", sans-serif',
        fontWeight: 600,
        backgroundColor: '#F8FAFC',
        color: '#475569',
        borderBottom: '2px solid #E2E8F0',
        fontSize: '0.6875rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        padding: '12px 16px',
      },
      body: {
        borderBottom: '1px solid #F1F5F9',
        padding: '10px 16px',
        fontSize: '0.8125rem',
        color: '#334155',
      },
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: {
        '& .MuiTableRow-root:nth-of-type(even)': {
          backgroundColor: '#FAFBFD',
        },
        '& .MuiTableRow-root:hover': {
          backgroundColor: '#F1F5F9',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500,
        borderRadius: 6,
        fontSize: '0.75rem',
        height: 26,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          fontSize: '0.875rem',
          transition: 'box-shadow 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3B82F6',
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 40px -8px rgb(15 23 42 / 0.15)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: 'none',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#0F172A',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '6px 12px',
        borderRadius: 6,
        boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.25)',
      },
      arrow: {
        color: '#0F172A',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
        fontSize: '0.8125rem',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: '1px 8px',
        padding: '8px 14px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
          },
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 4,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: '#E2E8F0',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 600,
      },
    },
  },
};
