import React from 'react';
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

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSection, canModify } = useAuth();

  const [produzioneOpen, setProduzioneOpen] = React.useState(
    location.pathname.startsWith('/produzione')
  );
  const [consegneOpen, setConsegneOpen] = React.useState(
    location.pathname.startsWith('/consegne')
  );
  const [impostazioniOpen, setImpostazioniOpen] = React.useState(
    location.pathname.startsWith('/impostazioni')
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 1 }}>
        {/* Planning Produzione */}
        {hasSection('produzione') && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setProduzioneOpen(!produzioneOpen)}>
                <ListItemIcon>
                  <Factory color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Planning Produzione"
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
                {produzioneOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={produzioneOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/produzione/calendario')}
                  onClick={() => handleNavigate('/produzione/calendario')}
                >
                  <ListItemIcon>
                    <CalendarMonth />
                  </ListItemIcon>
                  <ListItemText primary="Calendario Produzione" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/produzione/prenotazioni')}
                  onClick={() => handleNavigate('/produzione/prenotazioni')}
                >
                  <ListItemIcon>
                    <ListAlt />
                  </ListItemIcon>
                  <ListItemText primary="Prenotazioni Produzione" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/produzione/clienti')}
                  onClick={() => handleNavigate('/produzione/clienti')}
                >
                  <ListItemIcon>
                    <People />
                  </ListItemIcon>
                  <ListItemText primary="Anagrafica Clienti" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/produzione/trasportatori')}
                  onClick={() => handleNavigate('/produzione/trasportatori')}
                >
                  <ListItemIcon>
                    <LocalShipping />
                  </ListItemIcon>
                  <ListItemText primary="Anagrafica Trasportatori" />
                </ListItemButton>
              </List>
            </Collapse>
            <Divider sx={{ my: 1 }} />
          </>
        )}

        {/* Planning Consegne */}
        {hasSection('consegne') && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setConsegneOpen(!consegneOpen)}>
                <ListItemIcon>
                  <Inventory color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Planning Consegne"
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
                {consegneOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={consegneOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/consegne/calendario')}
                  onClick={() => handleNavigate('/consegne/calendario')}
                >
                  <ListItemIcon>
                    <CalendarMonth />
                  </ListItemIcon>
                  <ListItemText primary="Calendario Consegne" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/consegne/prenotazioni')}
                  onClick={() => handleNavigate('/consegne/prenotazioni')}
                >
                  <ListItemIcon>
                    <ListAlt />
                  </ListItemIcon>
                  <ListItemText primary="Prenotazioni Consegne" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/consegne/clienti')}
                  onClick={() => handleNavigate('/consegne/clienti')}
                >
                  <ListItemIcon>
                    <People />
                  </ListItemIcon>
                  <ListItemText primary="Anagrafica Clienti" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/consegne/trasportatori')}
                  onClick={() => handleNavigate('/consegne/trasportatori')}
                >
                  <ListItemIcon>
                    <LocalShipping />
                  </ListItemIcon>
                  <ListItemText primary="Anagrafica Trasportatori" />
                </ListItemButton>
              </List>
            </Collapse>
            <Divider sx={{ my: 1 }} />
          </>
        )}

        {/* Impostazioni (solo utenti modifica) */}
        {canModify && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setImpostazioniOpen(!impostazioniOpen)}>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText
                  primary="Impostazioni"
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
                {impostazioniOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={impostazioniOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/impostazioni/utenti')}
                  onClick={() => handleNavigate('/impostazioni/utenti')}
                >
                  <ListItemIcon>
                    <ManageAccounts />
                  </ListItemIcon>
                  <ListItemText primary="Gestione Utenti" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={isActive('/impostazioni/tempi-ciclo')}
                  onClick={() => handleNavigate('/impostazioni/tempi-ciclo')}
                >
                  <ListItemIcon>
                    <Timer />
                  </ListItemIcon>
                  <ListItemText primary="Configurazione Tempi Ciclo" />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
