// src/pages/Dashboard.jsx (VERSIÓN ACTUALIZADA CON TICKETSERVICE)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ticketService, {
  getTicketStats,
  getSystemStats,
  getPriorityBadgeClass,
  getPriorityIcon,
  getStatusBadgeClass,
  getStatusIcon,
  formatDateForUI,
  getPriorityText,
  getStatusText
} from '../services/ticketService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, userName, userRole, isAdmin, isAgent, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [ticketsCount, setTicketsCount] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0
  });

  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    avgResponseTime: '24h',
    satisfactionRate: '92%',
    ticketsByStatus: {},
    ticketsByPriority: {}
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📊 Cargando datos del dashboard...');

      // Cargar perfil si no está en auth
      if (!authProfile && user) {
        await loadUserProfile();
      } else {
        setProfile(authProfile);
      }

      // Cargar estadísticas en paralelo
      await Promise.all([
        loadTicketsCount(),
        loadRecentTickets(),
        loadSystemStatistics()
      ]);

      console.log('✅ Dashboard cargado exitosamente');

    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      setError('Error al cargar los datos del dashboard. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Si no tenemos perfil en el auth context, lo cargamos manualmente
      // Esto es un fallback por si acaso
      const { data } = await ticketService.getUsers();
      const userProfile = data?.find(p => p.id === user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const loadTicketsCount = async () => {
    try {
      if (!user) return;

      console.log('📈 Cargando estadísticas de tickets...');

      const result = await getTicketStats(user.id);

      if (result.error) {
        console.error('Error en getTicketStats:', result.error);
        return;
      }

      if (result.data) {
        setTicketsCount({
          total: result.data.totalCreated || 0,
          assigned: result.data.totalAssigned || 0,
          open: result.data.openTickets || 0,
          inProgress: result.data.inProgressTickets || 0,
          resolved: result.data.resolvedTickets || 0
        });
      }

    } catch (error) {
      console.error('Error cargando tickets count:', error);
    }
  };

  const loadRecentTickets = async () => {
    try {
      if (!user) return;

      console.log('🔄 Cargando tickets recientes...');

      // Usar el ticketService para obtener tickets recientes
      const result = await ticketService.getTickets(
        {
          created_by: user.id,
          assigned_to: user.id
        },
        {
          sortBy: 'created_at',
          sortAsc: false,
          pageSize: 5
        }
      );

      if (result.error) {
        console.error('Error en getTickets:', result.error);
        return;
      }

      if (result.data) {
        setRecentTickets(result.data);
      }

    } catch (error) {
      console.error('Error cargando tickets recientes:', error);
    }
  };

  const loadSystemStatistics = async () => {
    try {
      // Solo para admins y agents
      if (!isAdmin && !isAgent) return;

      console.log('📊 Cargando estadísticas del sistema...');

      const result = await getSystemStats();

      if (result.error) {
        console.error('Error en getSystemStats:', result.error);
        return;
      }

      if (result.data) {
        setStats({
          totalUsers: result.data.totalUsers || 0,
          totalTickets: result.data.totalTickets || 0,
          avgResponseTime: result.data.avgResponseTime || '24h',
          satisfactionRate: result.data.satisfactionRate || '92%',
          ticketsByStatus: result.data.ticketsByStatus || {},
          ticketsByPriority: result.data.ticketsByPriority || {}
        });
      }

    } catch (error) {
      console.error('Error cargando estadísticas del sistema:', error);
    }
  };

  const handleCreateTicket = (type = 'general') => {
    navigate(`/tickets?create=${type}`);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Mostrar loading si está cargando el auth o el dashboard
  if (authLoading || loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h4 className="mt-3">Cargando Dashboard...</h4>
        <p className="text-muted">Obteniendo información del sistema</p>
      </div>
    );
  }

  // Mostrar error si hay
  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary mt-3" onClick={handleRefresh}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Reintentar
        </button>
      </div>
    );
  }

  // Si no hay usuario (no debería pasar por ProtectedRoute, pero por si acaso)
  if (!user) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          No hay usuario autenticado. Por favor, inicia sesión.
        </div>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/login')}>
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header con botón de refresh */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center mb-2">
            <h1 className="display-6 fw-bold mb-0">
              <i className="bi bi-speedometer2 me-2 text-primary"></i>
              Dashboard
            </h1>
            <button
              className="btn btn-sm btn-outline-secondary ms-3"
              onClick={handleRefresh}
              title="Refrescar datos"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
          <p className="lead mb-2">
            Bienvenido, <strong className="text-primary">{userName}</strong>
          </p>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge ${userRole === 'admin' ? 'bg-danger' : userRole === 'agent' ? 'bg-warning' : 'bg-primary'}`}>
              <i className="bi bi-person-badge me-1"></i>
              {userRole}
            </span>
            <span className="text-muted small">
              <i className="bi bi-envelope me-1"></i>
              {user.email}
            </span>
            {profile?.full_name && (
              <span className="text-muted small">
                <i className="bi bi-person me-1"></i>
                {profile.full_name}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 mt-md-0">
          <button
            className="btn btn-primary"
            onClick={() => handleCreateTicket()}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="row g-4 mb-4">
        {/* Mis Tickets */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-primary border-2 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-file-earmark-text fs-2 text-primary"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">Mis Tickets</h6>
                  <h2 className="card-title fw-bold">{ticketsCount.total}</h2>
                  <p className="card-text small">Creados por mí</p>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-top-0 py-3">
              <a href="/tickets?filter=my" className="text-decoration-none d-flex align-items-center justify-content-between">
                <span>Ver todos mis tickets</span>
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Asignados a mí */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-warning border-2 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-person-check fs-2 text-warning"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">Asignados a mí</h6>
                  <h2 className="card-title fw-bold">{ticketsCount.assigned}</h2>
                  <p className="card-text small">
                    <span className="text-danger fw-semibold">{ticketsCount.open}</span> pendientes
                  </p>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-top-0 py-3">
              <a href="/tickets?filter=assigned" className="text-decoration-none d-flex align-items-center justify-content-between">
                <span>Ver tareas asignadas</span>
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        {/* En Progreso */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-info border-2 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-arrow-clockwise fs-2 text-info"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">En Progreso</h6>
                  <h2 className="card-title fw-bold">{ticketsCount.inProgress}</h2>
                  <p className="card-text small">En proceso de resolución</p>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-top-0 py-3">
              <a href="/tickets?status=in_progress" className="text-decoration-none d-flex align-items-center justify-content-between">
                <span>Ver en progreso</span>
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Resueltos */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-success border-2 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="bi bi-check-circle fs-2 text-success"></i>
                </div>
                <div>
                  <h6 className="card-subtitle text-muted">Resueltos</h6>
                  <h2 className="card-title fw-bold">{ticketsCount.resolved}</h2>
                  <p className="card-text small">Completados con éxito</p>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-top-0 py-3">
              <a href="/tickets?status=resolved" className="text-decoration-none d-flex align-items-center justify-content-between">
                <span>Ver historial</span>
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="row g-4">
        {/* Columna izquierda */}
        <div className="col-lg-8">
          {/* Acciones rápidas */}


          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Acciones Rápidas
              </h5>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/tickets?create=general')}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Todos los tipos
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6 col-md-3">
                  <button
                    className="btn btn-outline-primary w-100 h-100 p-3 text-start"
                    onClick={() => navigate('/tickets?create=general')}
                  >
                    <div className="d-flex flex-column align-items-center text-center">
                      <i className="bi bi-file-earmark-text fs-1 mb-2"></i>
                      <span className="fw-semibold">General</span>
                      <small className="text-muted">Ticket estándar</small>
                    </div>
                  </button>
                </div>

                <div className="col-sm-6 col-md-3">
                  <button
                    className="btn btn-outline-success w-100 h-100 p-3 text-start"
                    onClick={() => navigate('/tickets?create=purchase')}
                  >
                    <div className="d-flex flex-column align-items-center text-center">
                      <i className="bi bi-cart fs-1 mb-2"></i>
                      <span className="fw-semibold">Compra</span>
                      <small className="text-muted">Solicitar materiales</small>
                    </div>
                  </button>
                </div>

                <div className="col-sm-6 col-md-3">
                  <button
                    className="btn btn-outline-danger w-100 h-100 p-3 text-start"
                    onClick={() => navigate('/tickets?create=error')}
                  >
                    <div className="d-flex flex-column align-items-center text-center">
                      <i className="bi bi-bug fs-1 mb-2"></i>
                      <span className="fw-semibold">Error</span>
                      <small className="text-muted">Reportar problema</small>
                    </div>
                  </button>
                </div>

                <div className="col-sm-6 col-md-3">
                  <button
                    className="btn btn-outline-info w-100 h-100 p-3 text-start"
                    onClick={() => navigate('/tickets?create=support')}
                  >
                    <div className="d-flex flex-column align-items-center text-center">
                      <i className="bi bi-headset fs-1 mb-2"></i>
                      <span className="fw-semibold">Soporte</span>
                      <small className="text-muted">Asistencia técnica</small>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Tickets recientes */}
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Tickets Recientes
              </h5>
              <div>
                <a href="/tickets?filter=my" className="btn btn-sm btn-outline-secondary me-2">
                  Mis tickets
                </a>
                <a href="/tickets" className="btn btn-sm btn-outline-primary">
                  Ver todos
                </a>
              </div>
            </div>
            <div className="card-body p-0">
              {recentTickets.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <p className="text-muted mb-2">No hay tickets recientes</p>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleCreateTicket()}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Crear primer ticket
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentTickets.slice(0, 5).map((ticket) => (
                    <a
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="list-group-item list-group-item-action py-3"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 me-3">
                          <h6 className="mb-1">{ticket.title}</h6>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            {ticket.categories && (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: ticket.categories.color || '#6c757d',
                                  color: 'white'
                                }}
                              >
                                {ticket.categories.name}
                              </span>
                            )}
                            <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                              <i className={`bi ${getPriorityIcon(ticket.priority)} me-1`}></i>
                              {getPriorityText(ticket.priority)}
                            </span>
                            <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                              <i className={`bi ${getStatusIcon(ticket.status)} me-1`}></i>
                              {getStatusText(ticket.status)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              <i className="bi bi-calendar me-1"></i>
                              {formatDateForUI(ticket.created_at)}
                            </small>
                            <small className="text-muted">
                              {ticket.creator?.full_name || ticket.creator?.email || 'Usuario'}
                            </small>
                          </div>
                        </div>
                        <div>
                          <i className="bi bi-chevron-right text-muted"></i>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="col-lg-4">
          {/* Mi información */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Mi Información
              </h5>
              <a href="/profile" className="btn btn-sm btn-outline-primary">
                Editar
              </a>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h5>{userName}</h5>
                <p className="text-muted mb-0">{user.email}</p>
                <span className={`badge mt-2 ${userRole === 'admin' ? 'bg-danger' : userRole === 'agent' ? 'bg-warning' : 'bg-secondary'}`}>
                  {userRole}
                </span>
              </div>

              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-person me-2 text-muted"></i>
                    Nombre
                  </span>
                  <span className="fw-semibold text-end" style={{ maxWidth: '150px' }}>
                    {profile?.full_name || 'No especificado'}
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-envelope me-2 text-muted"></i>
                    Email
                  </span>
                  <span className="text-truncate text-end" style={{ maxWidth: '150px' }}>{user.email}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-calendar me-2 text-muted"></i>
                    Registrado
                  </span>
                  <span>{formatDateForUI(user.created_at)}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-clock-history me-2 text-muted"></i>
                    Último acceso
                  </span>
                  <span>{formatDateForUI(user.last_sign_in_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas del sistema (solo para admin/agent) */}
          {(isAdmin || isAgent) && (
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Estadísticas del Sistema
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded-3">
                      <i className="bi bi-people fs-2 text-primary mb-2"></i>
                      <h4 className="fw-bold">{stats.totalUsers}</h4>
                      <small className="text-muted">Usuarios</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded-3">
                      <i className="bi bi-ticket-detailed fs-2 text-success mb-2"></i>
                      <h4 className="fw-bold">{stats.totalTickets}</h4>
                      <small className="text-muted">Tickets totales</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded-3">
                      <i className="bi bi-clock fs-2 text-warning mb-2"></i>
                      <h4 className="fw-bold">{stats.avgResponseTime}</h4>
                      <small className="text-muted">Tiempo respuesta</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded-3">
                      <i className="bi bi-emoji-smile fs-2 text-info mb-2"></i>
                      <h4 className="fw-bold">{stats.satisfactionRate}</h4>
                      <small className="text-muted">Satisfacción</small>
                    </div>
                  </div>
                </div>

                {/* Distribución por estado */}
                {Object.keys(stats.ticketsByStatus).length > 0 && (
                  <div className="mt-4">
                    <h6 className="fw-semibold mb-3">
                      <i className="bi bi-pie-chart me-2"></i>
                      Tickets por Estado
                    </h6>
                    <div className="list-group list-group-flush">
                      {Object.entries(stats.ticketsByStatus).map(([status, count]) => (
                        <div key={status} className="list-group-item d-flex justify-content-between align-items-center py-2">
                          <span className="d-flex align-items-center">
                            <span className={`badge ${getStatusBadgeClass(status)} me-2`} style={{ width: '10px', height: '10px' }}></span>
                            {getStatusText(status)}
                          </span>
                          <span className="fw-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enlaces rápidos */}
          <div className="card mt-4 shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-link me-2"></i>
                Enlaces Rápidos
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <a href="/tickets" className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-list-task me-3 text-primary"></i>
                  <div>
                    <div className="fw-semibold">Todos los tickets</div>
                    <small className="text-muted">Ver todos los tickets del sistema</small>
                  </div>
                </a>
                <a href="/tickets?filter=my" className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-person me-3 text-success"></i>
                  <div>
                    <div className="fw-semibold">Mis tickets</div>
                    <small className="text-muted">Tickets que he creado</small>
                  </div>
                </a>
                <a href="/tickets?filter=assigned" className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-person-check me-3 text-warning"></i>
                  <div>
                    <div className="fw-semibold">Asignados a mí</div>
                    <small className="text-muted">Tickets que debo resolver</small>
                  </div>
                </a>
                <a href="/calendar" className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-calendar me-3 text-info"></i>
                  <div>
                    <div className="fw-semibold">Calendario</div>
                    <small className="text-muted">Ver fechas límite</small>
                  </div>
                </a>
                {isAdmin && (
                  <a href="/admin" className="list-group-item list-group-item-action d-flex align-items-center text-danger">
                    <i className="bi bi-shield-lock me-3"></i>
                    <div>
                      <div className="fw-semibold">Administración</div>
                      <small className="text-muted">Panel de administrador</small>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer del dashboard */}
      <div className="mt-5 pt-4 border-top">
        <div className="row">
          <div className="col-md-6">
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Acerca de HelpDesk Pro
            </h6>
            <p className="text-muted small mb-0">
              Sistema de gestión de tickets desarrollado con React y Supabase.
              Versión 1.0 - Panel de control interactivo.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <h6 className="fw-semibold mb-3">
              <i className="bi bi-activity me-2"></i>
              Estado del Sistema
            </h6>
            <div className="d-flex flex-column flex-md-row justify-content-md-end gap-2">
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                Dashboard activo
              </span>
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                {recentTickets.length} tickets cargados
              </span>
              <span className={`badge ${loading ? 'bg-warning' : 'bg-success'}`}>
                <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-check-circle'} me-1`}></i>
                {loading ? 'Actualizando...' : 'Actualizado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;