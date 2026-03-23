import { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: '#D6D3D1 transparent',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          backgroundColor: '#D6D3D1',
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#A8A29E',
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
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: 'none',
        },
        '&:active': {
          transform: 'scale(0.97)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 2px 8px -2px rgba(28, 25, 23, 0.2)',
        },
      },
      containedPrimary: {
        backgroundColor: '#292524',
        '&:hover': {
          backgroundColor: '#1C1917',
        },
      },
      outlined: {
        borderWidth: 1.5,
        borderColor: '#E7E5E4',
        color: '#44403C',
        '&:hover': {
          borderWidth: 1.5,
          borderColor: '#D6D3D1',
          backgroundColor: '#FAFAF9',
        },
      },
      sizeSmall: {
        padding: '5px 14px',
        fontSize: '0.8125rem',
        borderRadius: 6,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation0: {
        border: '1px solid #E7E5E4',
      },
      elevation1: {
        boxShadow: '0 1px 3px 0 rgba(28, 25, 23, 0.04), 0 1px 2px -1px rgba(28, 25, 23, 0.03)',
        border: '1px solid #F5F5F4',
      },
      elevation2: {
        boxShadow: '0 2px 6px -1px rgba(28, 25, 23, 0.06), 0 1px 3px -1px rgba(28, 25, 23, 0.04)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid #E7E5E4',
        boxShadow: '0 1px 2px 0 rgba(28, 25, 23, 0.03)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: '#D6D3D1',
          boxShadow: '0 4px 12px -4px rgba(28, 25, 23, 0.08)',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontFamily: '"Sora", "Figtree", sans-serif',
        fontWeight: 600,
        backgroundColor: '#FAFAF9',
        color: '#57534E',
        borderBottom: '2px solid #E7E5E4',
        fontSize: '0.6875rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        padding: '12px 16px',
      },
      body: {
        borderBottom: '1px solid #F5F5F4',
        padding: '10px 16px',
        fontSize: '0.8125rem',
        color: '#44403C',
      },
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: {
        '& .MuiTableRow-root:hover': {
          backgroundColor: '#FAFAF9',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: 6,
        fontSize: '0.6875rem',
        height: 24,
        fontFamily: '"Sora", "Figtree", sans-serif',
        letterSpacing: '0.01em',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          fontSize: '0.875rem',
          transition: 'box-shadow 0.2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E7E5E4',
            borderWidth: 1.5,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D6D3D1',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(194, 65, 12, 0.08)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#C2410C',
            borderWidth: 1.5,
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 14,
        border: '1px solid #E7E5E4',
        boxShadow: '0 24px 48px -12px rgba(28, 25, 23, 0.18)',
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
        backgroundColor: '#292524',
        fontFamily: '"Figtree", sans-serif',
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '6px 12px',
        borderRadius: 6,
        boxShadow: '0 4px 12px -2px rgba(28, 25, 23, 0.3)',
      },
      arrow: {
        color: '#292524',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        fontWeight: 500,
        fontSize: '0.8125rem',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '1px 8px',
        padding: '8px 14px',
        transition: 'all 0.15s ease',
        '&.Mui-selected': {
          backgroundColor: 'rgba(194, 65, 12, 0.06)',
          '&:hover': {
            backgroundColor: 'rgba(194, 65, 12, 0.1)',
          },
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 5,
        backgroundColor: '#E7E5E4',
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: '#E7E5E4',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontFamily: '"Sora", sans-serif',
        fontWeight: 600,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        fontFamily: '"Sora", "Figtree", sans-serif',
        fontWeight: 600,
        textTransform: 'none',
        fontSize: '0.8125rem',
        letterSpacing: '0.005em',
      },
    },
  },
};
