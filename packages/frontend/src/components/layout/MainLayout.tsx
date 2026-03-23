import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const HEADER_HEIGHT = 64;
const BOTTOM_NAV_HEIGHT = 64;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', bgcolor: '#FAF9F6' }}>
      <Header onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={handleCloseSidebar}
        onToggleCollapse={handleToggleCollapse}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: 3,
          mt: `${HEADER_HEIGHT}px`,
          mb: isSmall ? `${BOTTOM_NAV_HEIGHT}px` : 0,
          transition: (t) =>
            t.transitions.create(['margin', 'width'], {
              easing: t.transitions.easing.easeInOut,
              duration: 280,
            }),
        }}
      >
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
}
