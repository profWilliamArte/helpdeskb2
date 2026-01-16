// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, authError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores cuando el usuario escribe
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.email || !formData.password) {
      return setLocalError('Por favor completa todos los campos');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setLocalError('Por favor ingresa un email válido');
    }

    setLocalError('');
    setLoading(true);

    const result = await signIn(formData.email, formData.password);
    
    if (result.success) {
      console.log('✅ Login exitoso, redirigiendo...');
      navigate('/dashboard');
    } else {
      // Mensajes de error más amigables
      let errorMessage = result.error || 'Error al iniciar sesión';
      
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Por favor espera unos minutos';
      }
      
      setLocalError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5 col-xl-4">
        <div className="card shadow-lg border-0">
          {/* Header con gradiente */}
          <div className="card-header bg-primary bg-gradient text-white py-4">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <i className="bi bi-shield-lock display-6"></i>
            </div>
            <h3 className="text-center mb-0 fw-bold">
              HelpDesk Pro
            </h3>
            <p className="text-center mb-0 opacity-75">
              Sistema de Gestión de Tickets
            </p>
          </div>
          
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h4 className="fw-bold">
                <i className="bi bi-box-arrow-in-right me-2 text-primary"></i>
                Iniciar Sesión
              </h4>
              <p className="text-muted mb-0">
                Accede a tu cuenta para continuar
              </p>
            </div>
            
            {/* Mostrar errores de autenticación globales */}
            {authError && !localError && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>
                    <strong>Error del sistema:</strong> {authError}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setLocalError('')}
                  aria-label="Cerrar"
                ></button>
              </div>
            )}
            
            {/* Mostrar errores locales del formulario */}
            {localError && (
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  <div>{localError}</div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setLocalError('')}
                  aria-label="Cerrar"
                ></button>
              </div>
            )}
            
            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="mb-4">
                <label htmlFor="email" className="form-label fw-semibold">
                  <i className="bi bi-envelope me-1 text-primary"></i>
                  Correo Electrónico
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-at"></i>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${localError ? 'is-invalid' : ''}`}
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-text">
                  Usa el email con el que te registraste
                </div>
              </div>
              
              {/* Password Input */}
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-semibold">
                  <i className="bi bi-key me-1 text-primary"></i>
                  Contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-control ${localError ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    id="togglePassword"
                    onClick={() => {
                      const passwordInput = document.getElementById('password');
                      const type = passwordInput.type === 'password' ? 'text' : 'password';
                      passwordInput.type = type;
                      const icon = document.querySelector('#togglePassword i');
                      icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
                    }}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
                <div className="form-text">
                  Mínimo 6 caracteres
                </div>
              </div>
              
              {/* Recordar contraseña (opcional) */}
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Recordar mi sesión
                </label>
              </div>
              
              {/* Submit Button */}
              <div className="d-grid gap-2 mb-4">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg fw-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* Línea divisora */}
            <div className="text-center my-4 position-relative">
              <hr className="w-100" />
              <span className="bg-white px-3 position-absolute top-50 start-50 translate-middle text-muted">
                O
              </span>
            </div>
            
            {/* Links adicionales */}
            <div className="text-center">
              <p className="mb-2">
                <Link to="/register" className="text-decoration-none fw-semibold">
                  <i className="bi bi-person-plus me-1"></i>
                  ¿No tienes cuenta? Regístrate aquí
                </Link>
              </p>
              
              <p className="mb-3">
                <Link to="/forgot-password" className="text-decoration-none text-muted small">
                  <i className="bi bi-question-circle me-1"></i>
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
              
              <div className="alert alert-light border mt-3 small">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle me-2 text-info"></i>
                  <div>
                    <strong>Nota:</strong> Usa las credenciales creadas en Supabase
                  </div>
                </div>
              </div>
            </div>
            
            {/* Demo credentials (solo para desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4">
                <div className="accordion" id="demoCredentials">
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button 
                        className="accordion-button collapsed" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#demoCollapse"
                      >
                        <i className="bi bi-key me-2"></i>
                        Credenciales de Demo (Desarrollo)
                      </button>
                    </h2>
                    <div id="demoCollapse" className="accordion-collapse collapse">
                      <div className="accordion-body">
                        <p className="small mb-2">
                          Usa estos datos para pruebas:
                        </p>
                        <ul className="list-unstyled small">
                          <li>
                            <strong>Email:</strong> estudiante@helpdesk.com
                          </li>
                          <li>
                            <strong>Password:</strong> estudiante123
                          </li>
                        </ul>
                        <button 
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => {
                            setFormData({
                              email: 'estudiante@helpdesk.com',
                              password: 'estudiante123'
                            });
                          }}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Autocompletar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer de la card */}
          <div className="card-footer bg-body-tertiary py-3 text-center">
            <small className="text-muted">
              <i className="bi bi-shield-check me-1"></i>
              Tu información está protegida con encriptación SSL
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;