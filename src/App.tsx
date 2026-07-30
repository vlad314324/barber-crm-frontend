import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PageLoader from './components/PageLoader';
import './index.css';

const Login = lazy(() => import('./pages/Login'));
const RegisterSalon = lazy(() => import('./pages/RegisterSalon'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetails = lazy(() => import('./pages/ClientDetails'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Employees = lazy(() => import('./pages/Employees'));
const Services = lazy(() => import('./pages/Services'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const BookingPage = lazy(() => import('./pages/BookingPage'));

function App() {
  return (
    <ThemeProvider>
    <LocaleProvider>
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/:salonSlug" element={<Login />} />
          <Route path="/register-salon" element={<RegisterSalon />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/book/:salonSlug" element={<BookingPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            }/>
            <Route path="clients" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Clients />
              </ProtectedRoute>
            }/>
            <Route path="clients/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ClientDetails />
              </ProtectedRoute>
            }/>
            <Route path="appointments" element={
              <ProtectedRoute allowedRoles={['admin', 'barber']}>
                <Appointments />
              </ProtectedRoute>
            }/>
            <Route path="employees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Employees />
              </ProtectedRoute>
            }/>
            <Route path="services" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Services />
              </ProtectedRoute>
            }/>
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            }/>
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['admin', 'barber']}>
                <Settings />
              </ProtectedRoute>
            }/>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
    </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;