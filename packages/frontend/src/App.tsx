import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientiPage = lazy(() => import('./pages/ClientiPage'));
const TrasportatoriPage = lazy(() => import('./pages/TrasportatoriPage'));

// Placeholder for pages not yet implemented
const PlaceholderPage = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <h2>Pagina in costruzione</h2>
  </Box>
);

// Loading fallback
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Private route wrapper
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;

  return (
    <Routes>
      {/* Login - outside MainLayout */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage />
            </Suspense>
          )
        }
      />

      {/* Private routes - inside MainLayout */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>} />
        <Route path="/produzione/clienti" element={<Suspense fallback={<LoadingFallback />}><ClientiPage /></Suspense>} />
        <Route path="/produzione/trasportatori" element={<Suspense fallback={<LoadingFallback />}><TrasportatoriPage /></Suspense>} />
        <Route path="/produzione/*" element={<PlaceholderPage />} />
        <Route path="/consegne/*" element={<PlaceholderPage />} />
        <Route path="/impostazioni/*" element={<PlaceholderPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
