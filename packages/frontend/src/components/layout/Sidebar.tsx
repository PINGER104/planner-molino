import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  CalendarMonth,
  ListAlt,
  People,
  LocalShipping,
  Settings,
  Factory,
  Inventory,
  ManageAccounts,
  Timer,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 256;

// Section accent colors
const SECTION_COLORS = {
  produzione: '#3B82F6',   // Blue 500
  consegne: '#EF4444',     // Red 500
  impostazioni: '#64748B', // Slate 500
};

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hasSection = (sezione: string) =>
    user?.sezioni_abilitate?.includes(sezione as 'produzione' | 'consegne');
  const canModify = user?.livello_accesso === 'modifica';

  const [produzioneOpen, setProduzioneOpen] = useState(
    location.pathname.startsWith('/produzione')
  );
  const [consegneOpen, setConsegneOpen] = useState(
    location.pathname.startsWith('/consegne')
  );
  const [impostazioniOpen, setImpostazioniOpen] = useState(
    location.pathname.startsWith('/impostazioni')
  );

  React.useEffect(() => {
    if (location.pathname.startsWith('/produzione')) setProduzioneOpen(true);
    if (location.pathname.startsWith('/consegne')) setConsegneOpen(true);
    if (location.pathname.startsWith('/impostazioni')) setImpostazioniOpen(true);
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const sectionHeaderSx = {
    px: 2,
    py: 1,
    mx: 1,
    borderRadius: '6px',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
  };

  const navItemSx = (path: string, accentColor: string) => ({
    pl: 3,
    py: 0.75,
    mx: 1,
    my: 0.25,
    borderRadius: '6px',
    position: 'relative' as const,
    transition: 'all 0.15s ease',
    ...(isActive(path) ? {
      bgcolor: 'rgba(255,255,255,0.08)',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '25%',
        bottom: '25%',
        width: '2px',
        borderRadius: '0 2px 2px 0',
        backgroundColor: accentColor,
      },
    } : {
      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
    }),
  });

  const iconSx = (active: boolean, color: string) => ({
    color: active ? color : 'rgba(255,255,255,0.45)',
    fontSize: 18,
    transition: 'color 0.15s ease',
  });

  const textSx = (active: boolean) => ({
    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
    fontSize: '0.8125rem',
    fontWeight: active ? 600 : 400,
    fontFamily: '"DM Sans", sans-serif',
  });

  const drawerPaperSx = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    top: 64,
    height: 'calc(100% - 64px)',
    overflowX: 'hidden' as const,
    background: '#0F172A',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', mt: 2, pb: 2 }}>
      {/* Produzione */}
      {hasSection('produzione') && (
        <Box sx={{ mb: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton sx={sectionHeaderSx} onClick={() => setProduzioneOpen(!produzioneOpen)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Factory sx={{ color: SECTION_COLORS.produzione, fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Produzione"
                primaryTypographyProps={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                }}
              />
              {produzioneOpen
                ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
                : <ExpandMore sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
              }
            </ListItemButton>
          </ListItem>
          <Collapse in={produzioneOpen} timeout="auto">
            <List component="div" disablePadding>
              {[
                { path: '/produzione/calendario', label: 'Calendario', icon: CalendarMonth },
                { path: '/produzione/prenotazioni', label: 'Prenotazioni', icon: ListAlt },
                { path: '/produzione/clienti', label: 'Clienti', icon: People },
                { path: '/produzione/trasportatori', label: 'Trasportatori', icon: LocalShipping },
              ].map(({ path, label, icon: Icon }) => (
                <ListItemButton key={path} sx={navItemSx(path, SECTION_COLORS.produzione)} onClick={() => handleNavigate(path)}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Icon sx={iconSx(isActive(path), SECTION_COLORS.produzione)} />
                  </ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={textSx(isActive(path))} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
          <Box sx={{ mx: 2.5, my: 1.5, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
        </Box>
      )}

      {/* Consegne */}
      {hasSection('consegne') && (
        <Box sx={{ mb: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton sx={sectionHeaderSx} onClick={() => setConsegneOpen(!consegneOpen)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Inventory sx={{ color: SECTION_COLORS.consegne, fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Consegne"
                primaryTypographyProps={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                }}
              />
              {consegneOpen
                ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
                : <ExpandMore sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
              }
            </ListItemButton>
          </ListItem>
          <Collapse in={consegneOpen} timeout="auto">
            <List component="div" disablePadding>
              {[
                { path: '/consegne/calendario', label: 'Calendario', icon: CalendarMonth },
                { path: '/consegne/prenotazioni', label: 'Prenotazioni', icon: ListAlt },
                { path: '/consegne/clienti', label: 'Clienti', icon: People },
                { path: '/consegne/trasportatori', label: 'Trasportatori', icon: LocalShipping },
              ].map(({ path, label, icon: Icon }) => (
                <ListItemButton key={path} sx={navItemSx(path, SECTION_COLORS.consegne)} onClick={() => handleNavigate(path)}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Icon sx={iconSx(isActive(path), SECTION_COLORS.consegne)} />
                  </ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={textSx(isActive(path))} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
          <Box sx={{ mx: 2.5, my: 1.5, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
        </Box>
      )}

      {/* Impostazioni */}
      {canModify && (
        <Box>
          <ListItem disablePadding>
            <ListItemButton sx={sectionHeaderSx} onClick={() => setImpostazioniOpen(!impostazioniOpen)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Settings sx={{ color: SECTION_COLORS.impostazioni, fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Impostazioni"
                primaryTypographyProps={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                }}
              />
              {impostazioniOpen
                ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
                : <ExpandMore sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
              }
            </ListItemButton>
          </ListItem>
          <Collapse in={impostazioniOpen} timeout="auto">
            <List component="div" disablePadding>
              {[
                { path: '/impostazioni/utenti', label: 'Gestione Utenti', icon: ManageAccounts },
                { path: '/impostazioni/tempi-ciclo', label: 'Tempi Ciclo', icon: Timer },
              ].map(({ path, label, icon: Icon }) => (
                <ListItemButton key={path} sx={navItemSx(path, '#FFFFFF')} onClick={() => handleNavigate(path)}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Icon sx={iconSx(isActive(path), '#FFFFFF')} />
                  </ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={textSx(isActive(path))} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      {/* Version footer */}
      <Box sx={{ mt: 4, mx: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography
          sx={{
            fontSize: '0.625rem',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Molino 4.0
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': drawerPaperSx }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={!collapsed}
      sx={{
        width: collapsed ? 0 : DRAWER_WIDTH,
        flexShrink: 0,
        transition: (t: any) =>
          t.transitions.create('width', {
            easing: t.transitions.easing.easeInOut,
            duration: 200,
          }),
        '& .MuiDrawer-paper': drawerPaperSx,
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
