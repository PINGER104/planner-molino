import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Box,
  Tooltip,
} from '@mui/material';
import { Menu as MenuIcon, Logout } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith('/produzione')) return 'Produzione';
  if (pathname.startsWith('/consegne')) return 'Consegne';
  if (pathname.startsWith('/impostazioni')) return 'Impostazioni';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  return 'Planner Molino';
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const sectionTitle = getSectionTitle(location.pathname);
  const userInitial = user?.nome?.charAt(0)?.toUpperCase() || 'U';
  const userName = user ? `${user.nome} ${user.cognome}` : '';

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout errors
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'primary.main',
        height: 64,
      }}
    >
      <Toolbar sx={{ height: 64 }}>
        {/* Hamburger menu */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          {sectionTitle}
        </Typography>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* User info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.light',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {userInitial}
          </Avatar>
          <Typography
            variant="body2"
            color="inherit"
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontWeight: 500,
            }}
          >
            {userName}
          </Typography>

          {/* Logout */}
          <Tooltip title="Esci">
            <IconButton color="inherit" onClick={handleLogout} size="small">
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
