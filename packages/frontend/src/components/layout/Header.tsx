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
        borderBottom: '1px solid #E2E8F0',
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
            color: '#334155',
            '&:hover': { bgcolor: '#F1F5F9' },
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
              height: 28,
              width: 'auto',
              opacity: 0.85,
            }}
          />
          <Box
            sx={{
              height: 18,
              width: '1px',
              bgcolor: '#E2E8F0',
            }}
          />
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontSize: '0.75rem',
              color: '#475569',
              textTransform: 'uppercase',
            }}
          >
            Planner
          </Typography>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                mr: 1,
                fontWeight: 500,
                color: '#475569',
                fontSize: '0.8125rem',
                display: { xs: 'none', sm: 'block' },
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
              sx={{ '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#0F172A',
                  fontSize: '0.75rem',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
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
            >
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                  {user.ruolo || 'Utente'}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSettings} sx={{ fontSize: '0.8125rem' }}>
                <Settings fontSize="small" sx={{ mr: 1, color: '#64748B' }} />
                Impostazioni profilo
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ fontSize: '0.8125rem' }}>
                <Logout fontSize="small" sx={{ mr: 1, color: '#64748B' }} />
                Esci
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
