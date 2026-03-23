import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Factory as FactoryIcon,
  LocalShipping as LocalShippingIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', sezione: null },
  { label: 'Produzione', icon: <FactoryIcon />, path: '/produzione/calendario', sezione: 'produzione' as const },
  { label: 'Consegne', icon: <LocalShippingIcon />, path: '/consegne/calendario', sezione: 'consegne' as const },
  { label: 'Impostazioni', icon: <SettingsIcon />, path: '/impostazioni/utenti', sezione: 'impostazioni' as const },
];

export default function BottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!isMobile) return null;

  const visibleItems = navItems.filter((item) => {
    if (!item.sezione) return true;
    if (item.sezione === 'impostazioni') return user?.livello_accesso === 'modifica';
    return user?.sezioni_abilitate?.includes(item.sezione);
  });

  const currentIndex = visibleItems.findIndex((item) =>
    location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'))
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      elevation={8}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_event, newValue) => {
          const item = visibleItems[newValue];
          if (item) navigate(item.path);
        }}
        showLabels
        sx={{
          height: 64,
          '& .Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        {visibleItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
