import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 60;
const HEADER_HEIGHT = 64;
const BOTTOM_NAV_HEIGHT = 64;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!isLarge);

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

  // Calculate content margin based on sidebar state
  const contentMarginLeft = isMobile
    ? 0
    : sidebarCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header onToggleSidebar={handleToggleSidebar} />

      {/* Sidebar (hidden on small mobile, shown as drawer or permanent) */}
      {!isSmall && (
        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={handleCloseSidebar}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      {/* Mobile drawer sidebar (for sm-md range) */}
      {isSmall && (
        <Sidebar
          open={sidebarOpen}
          collapsed={false}
          onClose={handleCloseSidebar}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${contentMarginLeft}px`,
          mt: `${HEADER_HEIGHT}px`,
          mb: isSmall ? `${BOTTOM_NAV_HEIGHT}px` : 0,
          p: { xs: 2, sm: 3 },
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          transition: 'margin-left 0.2s ease',
          backgroundColor: 'background.default',
        }}
      >
        <Outlet />
      </Box>

      {/* Bottom navigation (mobile only) */}
      <BottomNav />
    </Box>
  );
}
