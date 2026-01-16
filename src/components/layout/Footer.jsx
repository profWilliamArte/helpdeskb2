import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';

  return (
    <footer className="bg-body-tertiary border-top">
      {/* Sección principal del footer */}
      <div className="container py-5">
        <div className="row">
          {/* Columna 1: Logo y descripción */}
          <div className="col-lg-4 mb-4 mb-lg-0">
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-tools fs-3 text-primary me-2"></i>
              <h5 className="fw-bold mb-0">HelpDesk Pro</h5>
            </div>
            <p className="text-body-secondary mb-3">
              Sistema de gestión de tickets desarrollado con React, Bootstrap y Supabase.
              Proyecto educativo para el aprendizaje de desarrollo web moderno.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-body-secondary text-decoration-none">
                <i className="bi bi-github fs-5"></i>
              </a>
              <a href="#" className="text-body-secondary text-decoration-none">
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a href="#" className="text-body-secondary text-decoration-none">
                <i className="bi bi-linkedin fs-5"></i>
              </a>
              <a href="#" className="text-body-secondary text-decoration-none">
                <i className="bi bi-discord fs-5"></i>
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div className="col-lg-2 col-md-4 mb-4 mb-md-0">
            <h6 className="fw-bold mb-3">Sistema</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/dashboard" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/tickets" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-ticket-detailed me-1"></i> Tickets
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/reports" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-graph-up me-1"></i> Reportes
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/calendar" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-calendar me-1"></i> Calendario
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Usuario */}
          <div className="col-lg-2 col-md-4 mb-4 mb-md-0">
            <h6 className="fw-bold mb-3">Cuenta</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/login" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/register" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-person-plus me-1"></i> Registrarse
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-person-circle me-1"></i> Mi Perfil
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/settings" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-gear me-1"></i> Configuración
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Soporte */}
          <div className="col-lg-2 col-md-4">
            <h6 className="fw-bold mb-3">Soporte</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-question-circle me-1"></i> Ayuda
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-book me-1"></i> Documentación
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-chat-left-text me-1"></i> Contacto
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-body-secondary text-decoration-none">
                  <i className="bi bi-shield-check me-1"></i> Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 5: Tecnologías */}
          <div className="col-lg-2">
            <h6 className="fw-bold mb-3">Tecnologías</h6>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-react">React</span>
              <span className="badge bg-bootstrap">Bootstrap</span>
              <span className="badge bg-supabase">Supabase</span>
              <span className="badge bg-vite">Vite</span>
              <span className="badge bg-javascript">JavaScript</span>
            </div>
          </div>
        </div>

        {/* Separador */}
        <hr className="my-4" />

        {/* Newsletter */}
        <div className="row align-items-center">
          <div className="col-md-6 mb-3 mb-md-0">
            <h6 className="fw-bold mb-2">Suscríbete a nuestro boletín</h6>
            <p className="text-body-secondary mb-3 small">
              Recibe actualizaciones sobre nuevas características y mejoras.
            </p>
          </div>
          <div className="col-md-6">
            <form className="input-group">
              <input 
                type="email" 
                className="form-control" 
                placeholder="tu@email.com" 
                aria-label="Email"
              />
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-envelope"></i>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Pie inferior del footer */}
      <div className={isDarkMode ? "bg-dark text-white py-3" : "bg-light text-dark py-3 border-top"}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mb-0 small">
                © {currentYear} HelpDesk Pro. Proyecto educativo para fines de aprendizaje. Ar Sistema
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0 small">
                <span className="me-3">
                  <i className="bi bi-code-slash me-1"></i>
                  Versión: 2.0.0-beta
                </span>
                <span>
                  <i className="bi bi-cpu me-1"></i>
                  Modo: {isDarkMode ? 'Oscuro' : 'Claro'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;