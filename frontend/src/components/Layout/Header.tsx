import React from 'react';
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
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user, logout, canModify } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
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
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuToggle}
          sx={{
            mr: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
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
            gap: 1,
            cursor: 'pointer',
          }}
        >
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: '1.1rem',
            }}
          >
            PLANNER
          </Typography>
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/logo-molino.png`}
            alt="Molino 4.0"
            sx={{
              height: 32,
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.95,
            }}
          />
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={canModify ? 'Modifica' : 'Sola Lettura'}
              color={canModify ? 'success' : 'default'}
              size="small"
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.35)',
                fontSize: '0.75rem',
                height: 26,
                '& .MuiChip-label': { px: 1.5 },
              }}
            />

            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 0.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 500, opacity: 0.9 }}>
                {user.nome} {user.cognome}
              </Typography>
              <IconButton
                size="small"
                aria-label="account menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '2px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {user.nome.charAt(0)}
                  {user.cognome.charAt(0)}
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
                  <Typography variant="body2" color="textSecondary">
                    {user.ruolo || 'Utente'}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSettings}>
                  <Settings fontSize="small" sx={{ mr: 1 }} />
                  Impostazioni profilo
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Esci
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
