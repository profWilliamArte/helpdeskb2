// src/components/layout/Navigation.jsx (VERSIÓN CORREGIDA)
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin, isAgent, isAuthenticated, userName, userRole } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [logoutLoading, setLogoutLoading] = useState(false);

  // Controlar tema claro/oscuro
  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  // Aplicar tema al cargar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
      setDarkMode(savedTheme === 'dark');
    } else if (prefersDark) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      setDarkMode(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      // Cerrar modal si está abierto (forma segura)
      const modalElement = document.getElementById('quickTicketModal');
      if (modalElement) {
        // Usar Bootstrap vía data attributes en lugar de JS directo
        const bsModal = window.bootstrap ?
          window.bootstrap.Modal.getInstance(modalElement) : null;
        if (bsModal) {
          bsModal.hide();
        }
      }

      console.log('🔴 Intentando cerrar sesión...');

      // Llamar a la función signOut del contexto
      const result = await signOut();

      if (result && result.success) {
        console.log('✅ Logout exitoso, redirigiendo a login...');

        // Redirigir a login después de éxito
        navigate('/login', {
          replace: true,
          state: {
            message: 'Sesión cerrada exitosamente',
            type: 'success'
          }
        });
      } else {
        const errorMsg = result?.error || 'Error desconocido';
        console.error('❌ Error en logout:', errorMsg);
        alert(`Error al cerrar sesión: ${errorMsg}`);
      }

    } catch (error) {
      console.error('❌ Error inesperado en logout:', error);
      alert('Error inesperado al cerrar sesión: ' + error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  // Si no está autenticado, mostrar navbar básico
  if (!isAuthenticated) {
    return (
      <nav className="navbar navbar-expand-lg bg-body-tertiary sticky-top shadow-sm border-bottom">
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center fw-bold" to="/">
            <i className="bi bi-tools fs-4 me-2"></i>
            <span className="text-primary-emphasis">HelpDesk</span>
            <span className="text-body-emphasis ms-1">Pro</span>
          </Link>

          {/* Botón hamburguesa */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menú para no autenticados */}
          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active fw-semibold' : ''}`
                  }
                >
                  <i className="bi bi-house-door me-1"></i>
                  Inicio
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active fw-semibold' : ''}`
                  }
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Iniciar Sesión
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active fw-semibold' : ''}`
                  }
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Registrarse
                </NavLink>
              </li>

              {/* Botón tema */}
              <li className="nav-item ms-2">
                <button
                  className={`btn btn-sm ${darkMode ? 'btn-outline-light' : 'btn-outline-dark'} border-0`}
                  onClick={toggleTheme}
                  title={darkMode ? 'Modo claro' : 'Modo oscuro'}
                  style={{ width: '40px' }}
                >
                  {darkMode ? (
                    <i className="bi bi-sun-fill"></i>
                  ) : (
                    <i className="bi bi-moon-stars-fill"></i>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  // Navbar para usuarios autenticados
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary sticky-top shadow-sm border-bottom">
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center fw-bold" to="/dashboard">
          <i className="bi bi-tools fs-4 me-2"></i>
          <span className="text-primary-emphasis">HelpDesk</span>
          <span className="text-body-emphasis ms-1">Pro</span>
          <span className="badge bg-primary ms-2">v1.0</span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú principal para autenticados */}
        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto">
            {/* Dashboard */}
            <li className="nav-item">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center ${isActive ? 'active fw-semibold' : ''}`
                }
              >
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </NavLink>
            </li>

            {/* Tickets Dropdown */}

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-ticket-detailed me-1"></i>
                Tickets
              </a>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/tickets">
                    <i className="bi bi-list-task me-2"></i>
                    Todos los Tickets
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/tickets?view=my">
                    <i className="bi bi-person-circle me-2"></i>
                    Mis Tickets
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/tickets?view=assigned">
                    <i className="bi bi-person-check me-2"></i>
                    Asignados a mí
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <span className="dropdown-header">
                    <i className="bi bi-plus-circle me-2"></i>
                    Crear Nuevo
                  </span>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => navigate('/tickets?create=general')}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Ticket General
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => navigate('/tickets?create=purchase')}
                  >
                    <i className="bi bi-cart me-2"></i>
                    Solicitud de Compra
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => navigate('/tickets?create=error')}
                  >
                    <i className="bi bi-bug me-2"></i>
                    Reportar Error
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => navigate('/tickets?create=support')}
                  >
                    <i className="bi bi-headset me-2"></i>
                    Solicitar Soporte
                  </button>
                </li>
              </ul>
            </li>

            {/* Calendario */}
            <li className="nav-item">
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center ${isActive ? 'active fw-semibold' : ''}`
                }
              >
                <i className="bi bi-calendar me-1"></i>
                Calendario
              </NavLink>
            </li>

            {/* Reportes */}
            <li className="nav-item">
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center ${isActive ? 'active fw-semibold' : ''}`
                }
              >
                <i className="bi bi-graph-up me-1"></i>
                Reportes
              </NavLink>
            </li>

            {/* Admin Section - Solo para admins */}
            {isAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center text-danger-emphasis"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-shield-lock me-1"></i>
                  Administración
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item d-flex align-items-center" to="/admin/users">
                      <i className="bi bi-people me-2"></i>
                      Gestión de Usuarios
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center" to="/admin/categories">
                      <i className="bi bi-tags me-2"></i>
                      Categorías
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center" to="/admin/settings">
                      <i className="bi bi-gear me-2"></i>
                      Configuración
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center text-danger-emphasis" to="/admin/audit">
                      <i className="bi bi-clipboard-data me-2"></i>
                      Auditoría
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Agent Section - Solo para agentes */}
            {isAgent && !isAdmin && (
              <li className="nav-item">
                <NavLink
                  to="/agent/queue"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center ${isActive ? 'active fw-semibold' : ''}`
                  }
                >
                  <i className="bi bi-inboxes me-1"></i>
                  Cola de Tickets
                  <span className="badge bg-danger ms-2">3</span>
                </NavLink>
              </li>
            )}
          </ul>

          {/* Menú derecho */}
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Botón tema */}
            <li className="nav-item">
              <button
                className={`btn btn-sm ${darkMode ? 'btn-outline-light' : 'btn-outline-dark'} border-0 me-2`}
                onClick={toggleTheme}
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
                style={{ width: '40px' }}
              >
                {darkMode ? (
                  <i className="bi bi-sun-fill"></i>
                ) : (
                  <i className="bi bi-moon-stars-fill"></i>
                )}
              </button>
            </li>

            {/* Notificaciones */}
            <li className="nav-item dropdown me-3">
              <a
                className="nav-link position-relative"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-bell fs-5"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  5
                  <span className="visually-hidden">notificaciones</span>
                </span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: '300px' }}>
                <li className="dropdown-header d-flex justify-content-between align-items-center">
                  <span>Notificaciones</span>
                  <button className="btn btn-sm btn-outline-primary">Limpiar</button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item d-flex align-items-start py-2" href="#">
                    <div className="me-3">
                      <i className="bi bi-ticket-detailed text-primary fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-semibold">Nuevo ticket asignado</div>
                      <div className="text-body-secondary small">Error en el sistema de login</div>
                      <div className="text-body-secondary small">Hace 5 minutos</div>
                    </div>
                  </a>
                </li>
                <li>
                  <a className="dropdown-item d-flex align-items-start py-2" href="#">
                    <div className="me-3">
                      <i className="bi bi-chat-left-text text-success fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-semibold">Nuevo comentario</div>
                      <div className="text-body-secondary small">En tu ticket #TKT-001</div>
                      <div className="text-body-secondary small">Hace 1 hora</div>
                    </div>
                  </a>
                </li>
              </ul>
            </li>

            {/* Perfil del usuario */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="position-relative me-2">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px' }}>
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {userRole === 'admin' && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                      <span className="visually-hidden">Admin</span>
                    </span>
                  )}
                </div>
                <div className="d-none d-md-block">
                  <div className="fw-semibold text-body-emphasis">{userName || 'Usuario'}</div>
                  <div className="small text-body-secondary">{userRole || 'Usuario'}</div>
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/profile">
                    <i className="bi bi-person-circle me-2"></i>
                    Mi Perfil
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/settings">
                    <i className="bi bi-gear me-2"></i>
                    Configuración
                  </Link>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    data-bs-toggle="modal"
                    data-bs-target="#quickTicketModal"
                  >
                    <i className="bi bi-lightning me-2"></i>
                    Ticket Rápido
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/help">
                    <i className="bi bi-question-circle me-2"></i>
                    Ayuda
                  </Link>
                </li>
                <li>
                  <a className="dropdown-item d-flex align-items-center" href="#">
                    <i className="bi bi-box-arrow-up-right me-2"></i>
                    Documentación
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center text-danger-emphasis"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Cerrando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Cerrar Sesión
                      </>
                    )}
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal para Ticket Rápido (Simplificado - Sin cerrar con JS) */}
      <div className="modal fade" id="quickTicketModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-lightning me-2"></i>
                Ticket Rápido
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Título</label>
                  <input type="text" className="form-control" placeholder="Describe brevemente el problema" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows="3" placeholder="Detalla el problema..."></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Prioridad</label>
                  <select className="form-select">
                    <option value="low">Baja</option>
                    <option value="medium" selected>Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="button" className="btn btn-primary">
                <i className="bi bi-plus-circle me-1"></i>
                Crear Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;