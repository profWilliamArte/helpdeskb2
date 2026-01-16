// src/components/tickets/TicketForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ticketService, { 
  getPriorityBadgeClass,
  getPriorityIcon,
  getPriorityText
} from '../../services/ticketService';

const TicketForm = ({ 
  ticketId = null, 
  categories = [], 
  users = [], 
  onClose, 
  onSuccess,
  initialData = null 
}) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category_id: '',
    assigned_to: '',
    due_date: '',
    module: 'support',
    purchase_details: { items: [], justification: '' },
    error_details: { environment: 'development', steps: [], expected: '', actual: '' }
  });

  // Cargar datos del ticket si es edición
  useEffect(() => {
    if (ticketId) {
      loadTicketData();
    } else if (initialData) {
      setFormData(initialData);
    }
  }, [ticketId, initialData]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const result = await ticketService.getTicketById(ticketId);
      
      if (result.data) {
        const ticket = result.data;
        setFormData({
          title: ticket.title || '',
          description: ticket.description || '',
          priority: ticket.priority || 'medium',
          category_id: ticket.category_id || '',
          assigned_to: ticket.assigned_to || '',
          due_date: ticket.due_date ? ticket.due_date.substring(0, 16) : '',
          module: ticket.module || 'support',
          purchase_details: ticket.purchase_details || { items: [], justification: '' },
          error_details: ticket.error_details || { environment: 'development', steps: [], expected: '', actual: '' }
        });
      }
    } catch (error) {
      console.error('Error cargando ticket:', error);
      alert('Error al cargar el ticket. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (formData.title.length > 200) {
      newErrors.title = 'El título no puede exceder 200 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error si el usuario corrige
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleModuleChange = (module) => {
    setFormData(prev => ({
      ...prev,
      module,
      purchase_details: module === 'purchases' ? { items: [], justification: '' } : null,
      error_details: module === 'errors' ? { 
        environment: 'development', 
        steps: [], 
        expected: '', 
        actual: '' 
      } : null
    }));
  };

  const handlePurchaseItemChange = (index, value) => {
    const newItems = [...formData.purchase_details.items];
    newItems[index] = value;
    
    setFormData(prev => ({
      ...prev,
      purchase_details: {
        ...prev.purchase_details,
        items: newItems.filter(item => item.trim() !== '')
      }
    }));
  };

  const addPurchaseItem = () => {
    setFormData(prev => ({
      ...prev,
      purchase_details: {
        ...prev.purchase_details,
        items: [...prev.purchase_details.items, '']
      }
    }));
  };

  const removePurchaseItem = (index) => {
    const newItems = formData.purchase_details.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      purchase_details: {
        ...prev.purchase_details,
        items: newItems
      }
    }));
  };

  const handleErrorStepChange = (index, value) => {
    const newSteps = [...formData.error_details.steps];
    newSteps[index] = value;
    
    setFormData(prev => ({
      ...prev,
      error_details: {
        ...prev.error_details,
        steps: newSteps.filter(step => step.trim() !== '')
      }
    }));
  };

  const addErrorStep = () => {
    setFormData(prev => ({
      ...prev,
      error_details: {
        ...prev.error_details,
        steps: [...prev.error_details.steps, '']
      }
    }));
  };

  const removeErrorStep = (index) => {
    const newSteps = formData.error_details.steps.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      error_details: {
        ...prev.error_details,
        steps: newSteps
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Preparar datos limpios
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category_id: formData.category_id || null,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        module: formData.module,
        purchase_details: formData.module === 'purchases' ? formData.purchase_details : null,
        error_details: formData.module === 'errors' ? formData.error_details : null,
        created_by: user.id,
        status: 'open'
      };

      console.log('📤 Enviando ticket:', ticketData);

      let result;
      if (ticketId) {
        result = await ticketService.updateTicket(ticketId, ticketData, user.id);
      } else {
        result = await ticketService.createTicket(ticketData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Mostrar notificación de éxito
      const successMessage = ticketId 
        ? '✅ Ticket actualizado exitosamente'
        : '✅ Ticket creado exitosamente';
      
      // Puedes reemplazar esto con un toast mejor
      alert(successMessage);
      
      onSuccess(result.data);
      
    } catch (error) {
      console.error('Error guardando ticket:', error);
      
      // Mostrar error específico si es posible
      const errorMessage = error.message.includes('required')
        ? 'Por favor completa todos los campos requeridos'
        : error.message.includes('permission')
        ? 'No tienes permiso para realizar esta acción'
        : 'Error al guardar el ticket. Por favor, intenta nuevamente.';
      
      alert(`❌ ${errorMessage}`);
      
      // Establecer error general
      setErrors(prev => ({ ...prev, _general: errorMessage }));
      
    } finally {
      setLoading(false);
    }
  };

  // Obtener texto para el botón de asignación
  const getAssignButtonText = () => {
    if (formData.assigned_to === user.id) {
      return 'Asignado a mí';
    } else if (formData.assigned_to) {
      const assignedUser = users.find(u => u.id === formData.assigned_to);
      return assignedUser ? `Asignado a ${assignedUser.full_name || assignedUser.email}` : 'Asignado';
    }
    return 'Sin asignar';
  };

  if (loading && ticketId) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando datos del ticket...</p>
      </div>
    );
  }

  return (
    <div className="ticket-form">
      {/* Header */}
      <div className="modal-header bg-primary text-white">
        <h5 className="modal-title">
          <i className={`bi ${ticketId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
          {ticketId ? 'Editar Ticket' : 'Nuevo Ticket'}
        </h5>
        <button 
          type="button" 
          className="btn-close btn-close-white" 
          onClick={onClose}
          disabled={loading}
        ></button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Error general */}
          {errors._general && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errors._general}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setErrors(prev => ({ ...prev, _general: '' }))}
              ></button>
            </div>
          )}

          {/* Título */}
          <div className="mb-3">
            <label htmlFor="title" className="form-label fw-semibold">
              <i className="bi bi-card-heading me-1"></i>
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Error en el sistema de login, Solicitud de compra de laptops..."
              maxLength="200"
              disabled={loading}
            />
            {errors.title && (
              <div className="invalid-feedback">{errors.title}</div>
            )}
            <div className="form-text">
              Describe brevemente el problema o solicitud. Máximo 200 caracteres.
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label htmlFor="description" className="form-label fw-semibold">
              <i className="bi bi-text-paragraph me-1"></i>
              Descripción Detallada *
            </label>
            <textarea
              id="description"
              name="description"
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe con detalle el problema o solicitud. Incluye todos los detalles relevantes para que otros puedan entender y ayudar..."
              rows="4"
              disabled={loading}
            ></textarea>
            {errors.description && (
              <div className="invalid-feedback">{errors.description}</div>
            )}
            <div className="form-text">
              Sé específico y claro. Incluye pasos para reproducir si es un error.
            </div>
          </div>

          {/* Fila de opciones básicas */}
          <div className="row g-3 mb-4">
            {/* Prioridad */}
            <div className="col-md-6">
              <label htmlFor="priority" className="form-label fw-semibold">
                <i className="bi bi-flag me-1"></i>
                Prioridad
              </label>
              <div className="input-group">
                <span className={`input-group-text ${getPriorityBadgeClass(formData.priority)} text-white`}>
                  <i className={`bi ${getPriorityIcon(formData.priority)}`}></i>
                </span>
                <select
                  id="priority"
                  name="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="low">🟢 Baja - Sin urgencia</option>
                  <option value="medium">🟡 Media - Atención normal</option>
                  <option value="high">🔴 Alta - Necesita atención pronto</option>
                  <option value="urgent">🚨 Urgente - Requiere atención inmediata</option>
                </select>
              </div>
              <div className="form-text">
                Nivel de urgencia: <strong>{getPriorityText(formData.priority)}</strong>
              </div>
            </div>

            {/* Categoría */}
            <div className="col-md-6">
              <label htmlFor="category_id" className="form-label fw-semibold">
                <i className="bi bi-tag me-1"></i>
                Categoría
              </label>
              <select
                id="category_id"
                name="category_id"
                className="form-select"
                value={formData.category_id}
                onChange={handleChange}
                disabled={loading || categories.length === 0}
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="form-text">
                Clasifica tu ticket para mejor organización
              </div>
            </div>
          </div>

          {/* Tipo de solicitud (Módulo) */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              <i className="bi bi-grid-3x3-gap me-1"></i>
              Tipo de Solicitud
            </label>
            <div className="row g-2">
              {[
                { value: 'errors', label: '🐛 Error/Problema', description: 'Reportar un bug o problema técnico', color: 'danger' },
                { value: 'purchases', label: '🛒 Solicitud de Compra', description: 'Solicitar materiales, equipos o servicios', color: 'success' },
                { value: 'support', label: '🛟 Soporte/Ayuda', description: 'Solicitar asistencia técnica o ayuda', color: 'primary' },
                { value: 'other', label: '📋 Otro', description: 'Otra solicitud no clasificada', color: 'secondary' }
              ].map(module => (
                <div key={module.value} className="col-sm-6 col-md-3">
                  <div 
                    className={`card text-center cursor-pointer ${formData.module === module.value ? `border-${module.color} border-2` : ''}`}
                    onClick={() => handleModuleChange(module.value)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="card-body p-3">
                      <div className={`mb-2 text-${module.color}`} style={{ fontSize: '1.5rem' }}>
                        {module.label.split(' ')[0]}
                      </div>
                      <small className="text-muted d-block">{module.description}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalles específicos por módulo */}
          {formData.module === 'purchases' && (
            <div className="card border-success mb-4">
              <div className="card-header bg-success bg-opacity-10">
                <h6 className="mb-0">
                  <i className="bi bi-cart me-2"></i>
                  Detalles de la Solicitud de Compra
                </h6>
              </div>
              <div className="card-body">
                {/* Items a comprar */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-list-ul me-1"></i>
                    Items a comprar
                  </label>
                  {formData.purchase_details.items.map((item, index) => (
                    <div key={index} className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Item ${index + 1} (ej: Laptop Dell, Licencia de Windows, etc.)`}
                        value={item}
                        onChange={(e) => handlePurchaseItemChange(index, e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removePurchaseItem(index)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={addPurchaseItem}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Agregar item
                  </button>
                </div>

                {/* Justificación */}
                <div className="mb-3">
                  <label htmlFor="purchaseJustification" className="form-label fw-semibold">
                    <i className="bi bi-chat-left-text me-1"></i>
                    Justificación
                  </label>
                  <textarea
                    id="purchaseJustification"
                    className="form-control"
                    placeholder="Explica por qué se necesitan estos items y cómo serán utilizados..."
                    value={formData.purchase_details.justification}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      purchase_details: {
                        ...prev.purchase_details,
                        justification: e.target.value
                      }
                    }))}
                    rows="3"
                    disabled={loading}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {formData.module === 'errors' && (
            <div className="card border-danger mb-4">
              <div className="card-header bg-danger bg-opacity-10">
                <h6 className="mb-0">
                  <i className="bi bi-bug me-2"></i>
                  Detalles del Error
                </h6>
              </div>
              <div className="card-body">
                {/* Ambiente */}
                <div className="mb-3">
                  <label htmlFor="environment" className="form-label fw-semibold">
                    <i className="bi bi-pc-display me-1"></i>
                    Ambiente donde ocurre
                  </label>
                  <select
                    id="environment"
                    className="form-select"
                    value={formData.error_details.environment}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      error_details: {
                        ...prev.error_details,
                        environment: e.target.value
                      }
                    }))}
                    disabled={loading}
                  >
                    <option value="development">🧪 Desarrollo</option>
                    <option value="staging">🚦 Staging/Pruebas</option>
                    <option value="production">🏭 Producción</option>
                  </select>
                </div>

                {/* Comportamiento esperado vs actual */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="expectedBehavior" className="form-label fw-semibold">
                      <i className="bi bi-check-circle me-1"></i>
                      Comportamiento esperado
                    </label>
                    <textarea
                      id="expectedBehavior"
                      className="form-control"
                      placeholder="Qué debería suceder normalmente..."
                      value={formData.error_details.expected}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        error_details: {
                          ...prev.error_details,
                          expected: e.target.value
                        }
                      }))}
                      rows="2"
                      disabled={loading}
                    ></textarea>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="actualBehavior" className="form-label fw-semibold">
                      <i className="bi bi-x-circle me-1"></i>
                      Comportamiento actual
                    </label>
                    <textarea
                      id="actualBehavior"
                      className="form-control"
                      placeholder="Qué está sucediendo realmente..."
                      value={formData.error_details.actual}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        error_details: {
                          ...prev.error_details,
                          actual: e.target.value
                        }
                      }))}
                      rows="2"
                      disabled={loading}
                    ></textarea>
                  </div>
                </div>

                {/* Pasos para reproducir */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-list-ol me-1"></i>
                    Pasos para reproducir el error
                  </label>
                  {formData.error_details.steps.map((step, index) => (
                    <div key={index} className="input-group mb-2">
                      <span className="input-group-text">{index + 1}</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Paso ${index + 1} (ej: Click en el botón de login, etc.)`}
                        value={step}
                        onChange={(e) => handleErrorStepChange(index, e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removeErrorStep(index)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={addErrorStep}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Agregar paso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fila de asignación y fecha */}
          <div className="row g-3 mb-4">
            {/* Asignar a */}
            <div className="col-md-6">
              <label htmlFor="assigned_to" className="form-label fw-semibold">
                <i className="bi bi-person-check me-1"></i>
                Asignar a
              </label>
              <div className="input-group">
                <button
                  type="button"
                  className={`btn ${formData.assigned_to === user.id ? 'btn-warning' : formData.assigned_to ? 'btn-info' : 'btn-outline-secondary'} me-2`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    assigned_to: prev.assigned_to === user.id ? '' : user.id 
                  }))}
                  disabled={loading}
                  title={formData.assigned_to === user.id ? "Desasignarme" : "Asignarme a mí"}
                >
                  <i className="bi bi-person-fill me-1"></i>
                  {formData.assigned_to === user.id ? 'Desasignarme' : 'Asignarme'}
                </button>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  className="form-select"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Seleccionar persona...</option>
                  <option value="">👤 Sin asignar (recomendado para tickets nuevos)</option>
                  <optgroup label="Otros usuarios">
                    {users
                      .filter(u => u.id !== user.id)
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email} ({user.role})
                        </option>
                      ))
                    }
                  </optgroup>
                </select>
              </div>
              <div className="form-text">
                Estado actual: <strong>{getAssignButtonText()}</strong>
              </div>
            </div>

            {/* Fecha límite */}
            <div className="col-md-6">
              <label htmlFor="due_date" className="form-label fw-semibold">
                <i className="bi bi-calendar-date me-1"></i>
                Fecha Límite (Opcional)
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-clock"></i>
                </span>
                <input
                  type="datetime-local"
                  id="due_date"
                  name="due_date"
                  className="form-control"
                  value={formData.due_date}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  disabled={loading}
                />
              </div>
              <div className="form-text">
                Cuándo debe estar resuelto este ticket
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            <i className="bi bi-x-circle me-1"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className={`bi ${ticketId ? 'bi-check-circle' : 'bi-plus-circle'} me-1`}></i>
                {ticketId ? 'Actualizar Ticket' : 'Crear Ticket'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;