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
  Divider,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CalendarMonth,
  ListAlt,
  People,
  LocalShipping,
  Settings,
  ManageAccounts,
  Timer,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 60;

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path: string;
}

interface NavSection {
  key: string;
  label: string;
  color: string;
  sezione: 'produzione' | 'consegne' | 'impostazioni';
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    key: 'produzione',
    label: 'PRODUZIONE',
    color: '#1B2A4A',
    sezione: 'produzione',
    items: [
      { label: 'Calendario', icon: <CalendarMonth />, path: '/produzione/calendario' },
      { label: 'Prenotazioni', icon: <ListAlt />, path: '/produzione/prenotazioni' },
      { label: 'Clienti', icon: <People />, path: '/produzione/clienti' },
      { label: 'Trasportatori', icon: <LocalShipping />, path: '/produzione/trasportatori' },
    ],
  },
  {
    key: 'consegne',
    label: 'CONSEGNE',
    color: '#C2410C',
    sezione: 'consegne',
    items: [
      { label: 'Calendario', icon: <CalendarMonth />, path: '/consegne/calendario' },
      { label: 'Prenotazioni', icon: <ListAlt />, path: '/consegne/prenotazioni' },
      { label: 'Clienti', icon: <People />, path: '/consegne/clienti' },
      { label: 'Trasportatori', icon: <LocalShipping />, path: '/consegne/trasportatori' },
    ],
  },
  {
    key: 'impostazioni',
    label: 'IMPOSTAZIONI',
    color: '#78716C',
    sezione: 'impostazioni',
    items: [
      { label: 'Gestione Utenti', icon: <ManageAccounts />, path: '/impostazioni/utenti' },
      { label: 'Tempi Ciclo', icon: <Timer />, path: '/impostazioni/tempi-ciclo' },
    ],
  },
];

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    produzione: true,
    consegne: true,
    impostazioni: true,
  });

  const toggleSection = (key: string) => {
    if (collapsed && !isMobile) return;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const visibleSections = sections.filter((section) => {
    if (section.sezione === 'impostazioni') {
      return user?.livello_accesso === 'modifica';
    }
    return user?.sezioni_abilitate?.includes(section.sezione as 'produzione' | 'consegne');
  });

  const currentWidth = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const drawerContent = (
    <Box
      sx={{
        width: currentWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Collapse button (desktop only) */}
      {!isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
          <IconButton onClick={onToggleCollapse} size="small">
            <ChevronLeft
              sx={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
        </Box>
      )}

      <Divider />

      {/* Navigation sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleSections.map((section) => (
          <React.Fragment key={section.key}>
            {/* Section header */}
            <ListItem
              disablePadding
              sx={{ display: 'block' }}
            >
              <ListItemButton
                onClick={() => toggleSection(section.key)}
                sx={{
                  minHeight: 40,
                  px: collapsed && !isMobile ? 1.5 : 2,
                  backgroundColor: section.color,
                  '&:hover': { backgroundColor: section.color, opacity: 0.9 },
                }}
              >
                {collapsed && !isMobile ? (
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: '#fff' }}>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                ) : (
                  <>
                    <ListItemText
                      primary={section.label}
                      primaryTypographyProps={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        color: '#fff',
                      }}
                    />
                    {openSections[section.key] ? (
                      <ExpandLess sx={{ color: '#fff', fontSize: 18 }} />
                    ) : (
                      <ExpandMore sx={{ color: '#fff', fontSize: 18 }} />
                    )}
                  </>
                )}
              </ListItemButton>
            </ListItem>

            {/* Section items */}
            <Collapse
              in={collapsed && !isMobile ? false : openSections[section.key]}
              timeout="auto"
              unmountOnExit
            >
              <List disablePadding>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          minHeight: 44,
                          px: collapsed && !isMobile ? 1.5 : 3,
                          backgroundColor: isActive ? `${section.color}14` : 'transparent',
                          borderRight: isActive ? `3px solid ${section.color}` : '3px solid transparent',
                          '&:hover': {
                            backgroundColor: `${section.color}0A`,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: collapsed && !isMobile ? 0 : 36,
                            justifyContent: 'center',
                            color: isActive ? section.color : 'text.secondary',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        {!(collapsed && !isMobile) && (
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: 14,
                              fontWeight: isActive ? 600 : 400,
                              color: isActive ? section.color : 'text.primary',
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </Box>

      {/* Version footer */}
      {!(collapsed && !isMobile) && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Planner Molino v4.0
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            top: 64,
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: currentWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
