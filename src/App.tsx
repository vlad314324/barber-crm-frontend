import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Appointments from './pages/Appointments';
import Employees from './pages/Employees';
import Services from './pages/Services';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Публічний маршрут */}
          <Route path="/login" element={<Login />} />

          {/* Захищені маршрути */}
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
      </Router>
    </AuthProvider>
  );
}

export default App;