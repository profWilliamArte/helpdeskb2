// src/components/tickets/TicketCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPriorityBadgeClass, 
  getPriorityIcon,
  getStatusBadgeClass, 
  getStatusIcon,
  formatDateForUI,
  getPriorityText,
  getStatusText,
  generateTicketId
} from '../../services/ticketService';

const TicketCard = ({ ticket, showAssignee = true, showCategory = true, onEdit }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tickets/${ticket.id}`);
  };

  const getCategoryColor = () => {
    return ticket.categories?.color || '#6c757d';
  };

  const getAssigneeName = () => {
    if (!ticket.assignee) return 'Sin asignar';
    return ticket.assignee.full_name || ticket.assignee.email || 'Usuario';
  };

  const getCreatorName = () => {
    if (!ticket.creator) return 'Usuario';
    return ticket.creator.full_name || ticket.creator.email || 'Usuario';
  };

  const getCommentsCount = () => {
    return ticket.comments?.[0]?.count || 0;
  };

  return (
    <div 
      className="card card-hover shadow-sm mb-3"
      onClick={handleClick}
      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          {/* Contenido principal */}
          <div className="flex-grow-1 me-3">
            {/* Header con ID y título */}
            <div className="d-flex align-items-center mb-2">
              <h5 className="card-title mb-0 me-2">{ticket.title}</h5>
              <small className="text-muted">{generateTicketId(ticket.id)}</small>
            </div>
            
            {/* Descripción truncada */}
            <p className="card-text text-muted small mb-3">
              {ticket.description.length > 150 
                ? `${ticket.description.substring(0, 150)}...` 
                : ticket.description}
            </p>
            
            {/* Badges y etiquetas */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              {/* Categoría */}
              {showCategory && ticket.categories && (
                <span 
                  className="badge"
                  style={{ 
                    backgroundColor: getCategoryColor(),
                    color: 'white'
                  }}
                >
                  <i className={`bi ${ticket.categories.icon || 'bi-tag'} me-1`}></i>
                  {ticket.categories.name}
                </span>
              )}
              
              {/* Prioridad */}
              <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                <i className={`bi ${getPriorityIcon(ticket.priority)} me-1`}></i>
                {getPriorityText(ticket.priority)}
              </span>
              
              {/* Estado */}
              <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                <i className={`bi ${getStatusIcon(ticket.status)} me-1`}></i>
                {getStatusText(ticket.status)}
              </span>
              
              {/* Módulo específico */}
              {ticket.module && ticket.module !== 'support' && (
                <span className="badge bg-info">
                  <i className={`bi ${getModuleIcon(ticket.module)} me-1`}></i>
                  {getModuleText(ticket.module)}
                </span>
              )}
              
              {/* Comentarios */}
              {getCommentsCount() > 0 && (
                <span className="badge bg-light text-dark border">
                  <i className="bi bi-chat-left-text me-1"></i>
                  {getCommentsCount()}
                </span>
              )}
            </div>
            
            {/* Información secundaria */}
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                {/* Creador */}
                <small className="text-muted">
                  <i className="bi bi-person me-1"></i>
                  {getCreatorName()}
                </small>
                
                {/* Fecha */}
                <small className="text-muted">
                  <i className="bi bi-calendar me-1"></i>
                  {formatDateForUI(ticket.created_at)}
                </small>
                
                {/* Fecha límite */}
                {ticket.due_date && (
                  <small className={`fw-semibold ${isDateOverdue(ticket.due_date) ? 'text-danger' : 'text-warning'}`}>
                    <i className="bi bi-clock me-1"></i>
                    {formatDateForUI(ticket.due_date)}
                  </small>
                )}
              </div>
              
              {/* Asignado */}
              {showAssignee && (
                <div className="d-flex align-items-center">
                  <small className="text-muted me-2">
                    <i className="bi bi-person-check me-1"></i>
                    {getAssigneeName()}
                  </small>
                  {!ticket.assignee && (
                    <span className="badge bg-warning">Sin asignar</span>
                  )}
                </div>
              )}
            </div>
          </div>
          

          {/* Acciones (si se pasa onEdit) */}
          <div className="d-flex flex-column align-items-center ms-2">
            {onEdit && (
              <button
                className="btn btn-sm btn-outline-primary mb-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(ticket.id);
                }}
                title="Editar ticket"
              >
                <i className="bi bi-pencil"></i>
              </button>
            )}
            <i className="bi bi-chevron-right text-muted fs-4"></i>
            <small className="text-muted mt-1">Ver</small>
          </div>


          {/* Flecha indicadora */}
          <div className="d-flex flex-column align-items-center">
            <i className="bi bi-chevron-right text-muted fs-4"></i>
            <div className="mt-2">
              <small className="badge bg-light text-dark">
                Ver detalles
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
const getModuleIcon = (module) => {
  const icons = {
    purchases: 'bi-cart',
    errors: 'bi-bug',
    support: 'bi-headset',
    other: 'bi-question-circle'
  };
  return icons[module] || 'bi-question-circle';
};

const getModuleText = (module) => {
  const texts = {
    purchases: 'Compra',
    errors: 'Error',
    support: 'Soporte',
    other: 'Otro'
  };
  return texts[module] || 'Otro';
};

const isDateOverdue = (dateString) => {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  const now = new Date();
  return dueDate < now && dueDate.toDateString() !== now.toDateString();
};

export default TicketCard;