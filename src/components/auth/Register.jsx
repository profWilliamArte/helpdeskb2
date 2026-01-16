// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calcular fortaleza de contraseña
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 6) strength += 25;
      if (/[A-Z]/.test(value)) strength += 25;
      if (/[0-9]/.test(value)) strength += 25;
      if (/[^A-Za-z0-9]/.test(value)) strength += 25;
      setPasswordStrength(strength);
    }
    
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      return setLocalError('Por favor completa todos los campos');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return setLocalError('Por favor ingresa un email válido');
    }

    if (formData.password.length < 6) {
      return setLocalError('La contraseña debe tener al menos 6 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      return setLocalError('Las contraseñas no coinciden');
    }

    if (formData.fullName.length < 2) {
      return setLocalError('Por favor ingresa tu nombre completo');
    }

    setLocalError('');
    setLoading(true);

    const result = await signUp(formData.email, formData.password, formData.fullName);
    
    if (result.success) {
      setSuccessMessage('¡Registro exitoso! Redirigiendo al dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      let errorMessage = result.error || 'Error al registrar usuario';
      
      if (errorMessage.includes('already registered')) {
        errorMessage = 'Este email ya está registrado';
      } else if (errorMessage.includes('weak_password')) {
        errorMessage = 'La contraseña es demasiado débil';
      }
      
      setLocalError(errorMessage);
    }
    
    setLoading(false);
  };

  const getPasswordStrengthClass = () => {
    if (passwordStrength >= 75) return 'bg-success';
    if (passwordStrength >= 50) return 'bg-warning';
    if (passwordStrength >= 25) return 'bg-info';
    return 'bg-danger';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Fuerte';
    if (passwordStrength >= 50) return 'Media';
    if (passwordStrength >= 25) return 'Débil';
    return 'Muy débil';
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6 col-xl-5">
        <div className="card shadow-lg border-0">
          <div className="card-header bg-success bg-gradient text-white py-4">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <i className="bi bi-person-plus display-6"></i>
            </div>
            <h3 className="text-center mb-0 fw-bold">
              Crear Cuenta
            </h3>
            <p className="text-center mb-0 opacity-75">
              Únete a nuestro sistema HelpDesk
            </p>
          </div>
          
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h4 className="fw-bold">
                <i className="bi bi-person-plus me-2 text-success"></i>
                Registro de Usuario
              </h4>
              <p className="text-muted mb-0">
                Completa el formulario para crear tu cuenta
              </p>
            </div>
            
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <div className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <div>
                    <strong>¡Éxito!</strong> {successMessage}
                  </div>
                </div>
              </div>
            )}
            
            {localError && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
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
            
            <form onSubmit={handleSubmit}>
              {/* Nombre completo */}
              <div className="mb-4">
                <label htmlFor="fullName" className="form-label fw-semibold">
                  <i className="bi bi-person me-1 text-success"></i>
                  Nombre Completo
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-person-badge"></i>
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="form-control"
                    placeholder="Juan Pérez"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="form-label fw-semibold">
                  <i className="bi bi-envelope me-1 text-success"></i>
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
                    className="form-control"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Contraseña */}
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-semibold">
                  <i className="bi bi-key me-1 text-success"></i>
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
                    className="form-control"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Indicador de fortaleza de contraseña */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="d-flex justify-content-between small">
                      <span>Fortaleza:</span>
                      <span>{getPasswordStrengthText()}</span>
                    </div>
                    <div className="progress" style={{ height: '5px' }}>
                      <div 
                        className={`progress-bar ${getPasswordStrengthClass()}`}
                        role="progressbar"
                        style={{ width: `${passwordStrength}%` }}
                        aria-valuenow={passwordStrength}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <div className="form-text small">
                      <i className="bi bi-info-circle me-1"></i>
                      Usa mayúsculas, números y caracteres especiales
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confirmar Contraseña */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label fw-semibold">
                  <i className="bi bi-key-fill me-1 text-success"></i>
                  Confirmar Contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-control ${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    Las contraseñas no coinciden
                  </div>
                )}
              </div>
              
              {/* Términos y condiciones */}
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="terms"
                  required
                />
                <label className="form-check-label" htmlFor="terms">
                  Acepto los{' '}
                  <Link to="/terms" className="text-decoration-none">
                    Términos y Condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link to="/privacy" className="text-decoration-none">
                    Política de Privacidad
                  </Link>
                </label>
              </div>
              
              {/* Botón de registro */}
              <div className="d-grid gap-2 mb-4">
                <button 
                  type="submit" 
                  className="btn btn-success btn-lg fw-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Crear Cuenta
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="mb-3">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-decoration-none fw-semibold">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Inicia Sesión aquí
                </Link>
              </p>
              
              <div className="alert alert-light border small">
                <div className="d-flex align-items-center">
                  <i className="bi bi-shield-check me-2 text-success"></i>
                  <div>
                    <strong>Seguridad:</strong> Tus datos están protegidos y no serán compartidos
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-footer bg-body-tertiary py-3 text-center">
            <small className="text-muted">
              <i className="bi bi-clock-history me-1"></i>
              El registro es instantáneo. Podrás crear tickets inmediatamente.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;