import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
    } catch {
      // Ignore logout errors
    }
    navigate('/login');
  };

  const handleSettings = () => {
    handleClose();
    navigate('/impostazioni/profilo');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #E7E5E4',
        color: 'text.primary',
        height: 64,
      }}
    >
      <Toolbar sx={{ height: 64 }}>
        <IconButton
          aria-label="open drawer"
          edge="start"
          onClick={onToggleSidebar}
          sx={{
            mr: 2,
            color: '#44403C',
            '&:hover': { bgcolor: '#FAFAF9' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          onClick={() => navigate('/')}
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
          }}
        >
          <Box
            component="img"
            src="/logo-molino.png"
            alt="Molino 4.0"
            sx={{
              height: 26,
              width: 'auto',
              opacity: 0.9,
            }}
          />
          <Box
            sx={{
              height: 20,
              width: '1px',
              bgcolor: '#E7E5E4',
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: '"Sora", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontSize: '0.6875rem',
              color: '#78716C',
              textTransform: 'uppercase',
            }}
          >
            Planner
          </Typography>
          <Chip
            label="4.0"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.5625rem',
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              bgcolor: '#F5F5F4',
              color: '#A8A29E',
              border: '1px solid #E7E5E4',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                mr: 0.5,
                fontWeight: 500,
                color: '#57534E',
                fontSize: '0.8125rem',
                display: { xs: 'none', sm: 'block' },
                fontFamily: '"Figtree", sans-serif',
              }}
            >
              {user.nome} {user.cognome}
            </Typography>
            <IconButton
              size="small"
              aria-label="account menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{ '&:hover': { bgcolor: '#FAFAF9' } }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#292524',
                  fontSize: '0.6875rem',
                  fontFamily: '"Sora", sans-serif',
                  fontWeight: 700,
                }}
              >
                {user.nome?.charAt(0)}
                {user.cognome?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              slotProps={{
                paper: {
                  sx: { borderRadius: 2, border: '1px solid #E7E5E4', mt: 0.5, minWidth: 180 },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1C1917', fontSize: '0.8125rem' }}>
                  {user.nome} {user.cognome}
                </Typography>
                <Typography variant="caption" sx={{ color: '#A8A29E' }}>
                  {user.ruolo || 'Operatore'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleSettings} sx={{ fontSize: '0.8125rem', py: 1 }}>
                <Settings fontSize="small" sx={{ mr: 1.5, color: '#78716C', fontSize: 18 }} />
                Impostazioni
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ fontSize: '0.8125rem', py: 1, color: '#DC2626' }}>
                <Logout fontSize="small" sx={{ mr: 1.5, fontSize: 18 }} />
                Esci
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
