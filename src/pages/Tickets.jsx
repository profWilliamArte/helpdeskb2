// src/pages/Tickets.jsx - VERSIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ticketService from '../services/ticketService';
import TicketCard from '../components/tickets/TicketCard';
import FilterBar from '../components/tickets/FilterBar';
import TicketFormModal from '../components/tickets/TicketFormModal';

const Tickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isAgent } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  // En Tickets.jsx - Agregar estos estados
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const [initialFormData, setInitialFormData] = useState(null);
  // Estados para filtros
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    category_id: '',
    search: ''
  });

  // Estados para paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  // Vista activa (todos, mis tickets, asignados a mí)
  const [activeView, setActiveView] = useState('all');

  // Cargar tickets y datos maestros
  useEffect(() => {
    if (user) {
      loadInitialData();
      loadTickets();
    }
  }, [user]);

  // Cargar tickets cuando cambian filtros o página
  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [filters, pagination.page, activeView]);

  // Verificar parámetros de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');
    const create = searchParams.get('create');

    if (view) {
      setActiveView(view);
      handleViewChange(view);
    }

    if (create) {
      // Abrir modal con el tipo de ticket pre-seleccionado
      handleCreateTicket(create);
    }
  }, [location]);

  const loadInitialData = async () => {
    try {
      const [categoriesResult, usersResult] = await Promise.all([
        ticketService.getCategories(),
        ticketService.getUsers()
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (usersResult.data) setUsers(usersResult.data);

    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');

      // Construir filtros basados en vista activa
      const finalFilters = buildFiltersForView();

      console.log('📋 Cargando tickets con filtros:', finalFilters);

      const result = await ticketService.getTickets(
        cleanFilters(finalFilters),
        {
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy: 'created_at',
          sortAsc: false
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      setTickets(result.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: result.count || 0,
        totalPages: Math.ceil((result.count || 0) / pagination.pageSize)
      }));

      console.log(`✅ ${result.data?.length || 0} tickets cargados`);

    } catch (error) {
      console.error('❌ Error cargando tickets:', error);
      setError('Error al cargar los tickets. Por favor, intenta nuevamente.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFiltersForView = () => {
    const baseFilters = { ...filters };

    switch (activeView) {
      case 'my':
        return { ...baseFilters, created_by: user.id };
      case 'assigned':
        return { ...baseFilters, assigned_to: user.id };
      case 'unassigned':
        return { ...baseFilters, assigned_to: 'unassigned' };
      default:
        return baseFilters;
    }
  };

  const cleanFilters = (currentFilters) => {
    const cleaned = { ...currentFilters };

    // Eliminar filtros vacíos
    Object.keys(cleaned).forEach(key => {
      if (!cleaned[key] || cleaned[key] === '') {
        delete cleaned[key];
      }
    });

    // Convertir 'unassigned' a null para Supabase
    if (cleaned.assigned_to === 'unassigned') {
      cleaned.assigned_to = null;
    }

    return cleaned;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assigned_to: '',
      category_id: '',
      search: ''
    });
    setActiveView('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setPagination(prev => ({ ...prev, page: 1 }));

    // Limpiar filtros de asignación cuando cambia la vista
    if (view === 'my' || view === 'assigned' || view === 'unassigned') {
      setFilters(prev => ({
        ...prev,
        assigned_to: '',
        created_by: ''
      }));
    }
  };

  const handleCreateTicket = (type = 'support') => {
    setSelectedTicketId(null);

    // Configurar datos iniciales basados en el tipo
    let initialData = {
      title: '',
      description: '',
      priority: 'medium',
      category_id: '',
      assigned_to: '',
      due_date: '',
      module: type,
      purchase_details: type === 'purchases' ? { items: [], justification: '' } : null,
      error_details: type === 'errors' ? {
        environment: 'development',
        steps: [],
        expected: '',
        actual: ''
      } : null
    };

    // Setear título sugerido basado en el tipo
    const titles = {
      'purchases': 'Solicitud de compra de...',
      'errors': 'Error en el sistema de...',
      'support': 'Solicitud de soporte para...',
      'general': 'Ticket general sobre...'
    };

    initialData.title = titles[type] || '';

    setInitialFormData(initialData);
    setShowCreateModal(true);
  };

  const handleEditTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setShowCreateModal(true);
  };


  const handleTicketCreated = (newTicket) => {
    setShowCreateModal(false);
    setSelectedTicketId(null);
    loadTickets(); // Recargar la lista
  };



  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleRefresh = () => {
    loadTickets();
  };

  // Calcular estadísticas rápidas
  const getStats = () => {
    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
    const assignedToMe = tickets.filter(t => t.assigned_to === user?.id).length;

    return { openCount, inProgressCount, assignedToMe };
  };

  const stats = getStats();

  if (loading && tickets.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h4 className="mt-3">Cargando tickets...</h4>
        <p className="text-muted">Obteniendo información del sistema</p>
      </div>
    );
  }

  return (
    <div className="tickets-page">
      {/* Header con título y acciones */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <h1 className="display-6 fw-bold">
            <i className="bi bi-ticket-detailed me-2 text-primary"></i>
            Tickets
          </h1>
          <p className="lead mb-0">
            Gestión y seguimiento de tickets del sistema
          </p>
        </div>

        <div className="mt-3 mt-md-0 d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualizar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreateTicket}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas rápidas */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-primary border-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-circle fs-2 text-primary"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">Abiertos</h6>
                  <h2 className="card-title fw-bold">{stats.openCount}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-warning border-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-arrow-clockwise fs-2 text-warning"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">En Progreso</h6>
                  <h2 className="card-title fw-bold">{stats.inProgressCount}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-info border-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-person-check fs-2 text-info"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">Asignados a mí</h6>
                  <h2 className="card-title fw-bold">{stats.assignedToMe}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-dark">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <h5 className="mb-0">
              <i className="bi bi-funnel me-2"></i>
              Filtros y Búsqueda
            </h5>
            <div className="mt-2 mt-md-0">
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${activeView === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleViewChange('all')}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`btn ${activeView === 'my' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleViewChange('my')}
                >
                  Mis Tickets
                </button>
                <button
                  type="button"
                  className={`btn ${activeView === 'assigned' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleViewChange('assigned')}
                >
                  Asignados a mí
                </button>
                {isAdmin || isAgent ? (
                  <button
                    type="button"
                    className={`btn ${activeView === 'unassigned' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleViewChange('unassigned')}
                  >
                    Sin asignar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            loading={loading}
          />
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="card shadow-sm">
        <div className="card-header bg-dark d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="bi bi-list-task me-2"></i>
              Lista de Tickets
              <span className="badge bg-primary ms-2">{pagination.totalItems}</span>
            </h5>
            <small className="text-muted">
              Vista: <span className="fw-semibold text-capitalize">{activeView.replace('_', ' ')}</span>
            </small>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: '150px' }}>
              <span className="input-group-text">
                <i className="bi bi-list-ol"></i>
              </span>
              <select
                className="form-select"
                value={pagination.pageSize}
                onChange={(e) => setPagination(prev => ({
                  ...prev,
                  pageSize: parseInt(e.target.value),
                  page: 1
                }))}
              >
                <option value="5">5 por página</option>
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body">
          {error ? (
            <div className="alert alert-danger">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
                <div>
                  <h6>Error al cargar tickets</h6>
                  <p className="mb-0">{error}</p>
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-sm btn-outline-danger me-2" onClick={handleRefresh}>
                  Reintentar
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleClearFilters}>
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="bi bi-inbox fs-1 text-muted" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4>No hay tickets</h4>
              <p className="text-muted mb-4">
                {Object.keys(cleanFilters(filters)).length > 0 || activeView !== 'all'
                  ? 'No se encontraron tickets con los filtros aplicados.'
                  : 'No hay tickets en el sistema. ¡Crea el primero!'}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  className="btn btn-primary"
                  onClick={handleCreateTicket}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Primer Ticket
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="tickets-list">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    showAssignee={activeView !== 'assigned'}
                    showCategory={true}
                    onEdit={handleEditTicket}
                  />
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div>
                    <small className="text-muted">
                      Mostrando <strong>{(pagination.page - 1) * pagination.pageSize + 1}</strong> -{' '}
                      <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</strong> de{' '}
                      <strong>{pagination.totalItems}</strong> tickets
                    </small>
                  </div>

                  <nav aria-label="Paginación de tickets">
                    <ul className="pagination mb-0">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          <i className="bi bi-chevron-left"></i> Anterior
                        </button>
                      </li>

                      {/* Mostrar números de página */}
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = index + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + index;
                        } else {
                          pageNum = pagination.page - 2 + index;
                        }

                        return (
                          <li
                            key={pageNum}
                            className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}

                      <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          Siguiente <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con estadísticas */}
        {tickets.length > 0 && (
          <div className="card-footer bg-dark">
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Haz clic en cualquier ticket para ver sus detalles
                </small>
              </div>
              <div className="col-md-6 text-md-end">
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  Última actualización: {new Date().toLocaleTimeString()}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <TicketFormModal
          show={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setInitialFormData(null);
            // Limpiar parámetro de la URL
            navigate('/tickets', { replace: true });
          }}
          ticketId={selectedTicketId}
          initialData={initialFormData}
          onSuccess={handleTicketCreated}
        />
      )}

      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1000 }}>
        <button
          className="btn btn-primary btn-lg rounded-pill shadow-lg"
          onClick={() => handleCreateTicket('general')}
          style={{
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Crear nuevo ticket"
        >
          <i className="bi bi-plus fs-4"></i>
        </button>
      </div>
    </div>
  );
};

export default Tickets;