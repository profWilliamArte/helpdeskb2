import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Importar páginas básicas
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import TicketEdit from './pages/TicketEdit';

// Layout principal reutilizable con grid
const MainLayout = ({ children }) => {
  return (
    <>
      <Navigation />
      <main className="main-content py-4">
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
};

// Layout para páginas auth (sin footer)
const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout d-flex align-items-center justify-content-center min-vh-100">
      <div className="container py-5">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Rutas públicas con layout auth */}
          <Route path="/login" element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          } />
          
          <Route path="/register" element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          } />
          
          {/* Rutas principales con layout completo */}
          <Route path="/" element={
            <MainLayout>
              <div className="text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-tools display-1 text-primary"></i>
                </div>
                <h1 className="display-5 fw-bold mb-3">
                  HelpDesk Pro
                </h1>
                <p className="lead mb-4">
                  Sistema profesional de gestión de tickets desarrollado con las tecnologías más modernas.
                </p>
                <div className="row justify-content-center mt-5">
                  <div className="col-md-8">
                    <div className="card shadow">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-rocket-takeoff me-2 text-primary"></i>
                          Proyecto Educativo
                        </h5>
                        <p className="card-text">
                          Esta es la <strong>Etapa 0</strong> del proyecto. Hemos establecido la estructura base con:
                        </p>
                        <div className="row text-center mt-3">
                          <div className="col">
                            <i className="bi bi-bootstrap-fill fs-1 text-primary"></i>
                            <p className="mt-2 fw-semibold">Bootstrap 5</p>
                          </div>
                          <div className="col">
                            <i className="bi bi-react fs-1 text-info"></i>
                            <p className="mt-2 fw-semibold">React 18</p>
                          </div>
                          <div className="col">
                            <i className="bi bi-lightning-charge fs-1 text-warning"></i>
                            <p className="mt-2 fw-semibold">Vite</p>
                          </div>
                          <div className="col">
                            <i className="bi bi-database fs-1 text-success"></i>
                            <p className="mt-2 fw-semibold">Supabase</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </MainLayout>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tickets" element={
            <ProtectedRoute>
              <MainLayout>
                <Tickets />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tickets/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <TicketDetail />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tickets/:id/edit" element={
            <ProtectedRoute>
              <MainLayout>
                <TicketEdit />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Rutas adicionales para el footer */}
          <Route path="/reports" element={
            <MainLayout>
              <div className="text-center py-5">
                <h2><i className="bi bi-graph-up me-2 text-primary"></i>Reportes</h2>
                <p className="lead">Página de reportes - En construcción</p>
              </div>
            </MainLayout>
          } />
          
          <Route path="/calendar" element={
            <MainLayout>
              <div className="text-center py-5">
                <h2><i className="bi bi-calendar me-2 text-primary"></i>Calendario</h2>
                <p className="lead">Calendario de tickets - En construcción</p>
              </div>
            </MainLayout>
          } />
          
          <Route path="/profile" element={
            <MainLayout>
              <div className="text-center py-5">
                <h2><i className="bi bi-person-circle me-2 text-primary"></i>Mi Perfil</h2>
                <p className="lead">Perfil de usuario - En construcción</p>
              </div>
            </MainLayout>
          } />
          
          <Route path="/settings" element={
            <MainLayout>
              <div className="text-center py-5">
                <h2><i className="bi bi-gear me-2 text-primary"></i>Configuración</h2>
                <p className="lead">Configuración del sistema - En construcción</p>
              </div>
            </MainLayout>
          } />
          
          {/* Ruta 404 */}
          <Route path="*" element={
            <MainLayout>
              <div className="text-center py-5">
                <h1 className="display-1 text-muted">404</h1>
                <h2>Página no encontrada</h2>
                <p className="lead">La página que buscas no existe.</p>
                <a href="/" className="btn btn-primary mt-3">
                  <i className="bi bi-house-door me-2"></i>
                  Volver al inicio
                </a>
              </div>
            </MainLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;