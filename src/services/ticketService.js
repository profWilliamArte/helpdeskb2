// src/services/ticketService.js
import { supabase } from './supabase';

/**
 * 🎫 SERVICIO DE TICKETS - VERSIÓN BOOTSTRAP OPTIMIZADA
 * 
 * Características:
 * - Manejo mejorado de errores
 * - Validación de datos
 * - Cache básico
 * - Funciones auxiliares para UI
 * - Compatible con componentes Bootstrap
 */

// Cache simple para categorías y usuarios (evita múltiples peticiones)
let categoriesCache = null;
let usersCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// ============================================
// 🎫 FUNCIONES PRINCIPALES DE TICKETS
// ============================================

/**
 * Obtener todos los tickets con filtros avanzados
 */
export const getTickets = async (filters = {}, options = {}) => {
    try {
        console.log('🎫 Obteniendo tickets con filtros:', filters);

        let query = supabase
            .from('tickets')
            .select(`
        *,
        categories (*),
        creator:profiles!tickets_created_by_fkey (
          id, email, full_name, role, avatar_url
        ),
        assignee:profiles!tickets_assigned_to_fkey (
          id, email, full_name, role, avatar_url
        ),
        comments (count)
      `, { count: 'exact' });

        // Aplicar filtros dinámicos
        applyFilters(query, filters);

        // Ordenamiento
        if (options.sortBy) {
            query = query.order(options.sortBy, {
                ascending: options.sortAsc !== false
            });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Paginación
        if (options.page && options.pageSize) {
            const from = (options.page - 1) * options.pageSize;
            const to = from + options.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('❌ Error obteniendo tickets:', error);
            throw new Error(`Error al obtener tickets: ${error.message}`);
        }

        console.log(`✅ Tickets obtenidos: ${data?.length || 0}`);
        return {
            data: data || [],
            count: count || 0,
            error: null
        };

    } catch (error) {
        console.error('💥 Error en getTickets:', error);
        return {
            data: [],
            count: 0,
            error: error.message || 'Error desconocido'
        };
    }
};

/**
 * Obtener un ticket por ID con toda la información
 */
export const getTicketById = async (id) => {
    try {
        if (!id) {
            throw new Error('ID de ticket requerido');
        }

        console.log(`🎫 Obteniendo ticket ${id}...`);

        const { data, error } = await supabase
            .from('tickets')
            .select(`
        *,
        categories (*),
        creator:profiles!tickets_created_by_fkey (
          id, email, full_name, role, avatar_url
        ),
        assignee:profiles!tickets_assigned_to_fkey (
          id, email, full_name, role, avatar_url
        ),
        comments (
          id,
          content,
          is_internal,
          created_at,
          user:profiles!comments_user_id_fkey (
            id, email, full_name, role, avatar_url
          )
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Ticket no encontrado');
            }
            throw error;
        }

        console.log(`✅ Ticket ${id} obtenido`);
        return { data, error: null };

    } catch (error) {
        console.error(`💥 Error obteniendo ticket ${id}:`, error);
        return {
            data: null,
            error: error.message || 'Error al obtener ticket'
        };
    }
};

/**
 * Crear nuevo ticket con validación
 */
export const createTicket = async (ticketData) => {
    try {
        console.log('📝 Creando nuevo ticket...', ticketData);

        // Validación básica
        if (!ticketData.title || !ticketData.title.trim()) {
            throw new Error('El título es requerido');
        }

        if (!ticketData.description || !ticketData.description.trim()) {
            throw new Error('La descripción es requerida');
        }

        if (!ticketData.created_by) {
            throw new Error('ID de creador requerido');
        }

        // Limpiar y formatear datos
        const cleanData = {
            title: ticketData.title.trim(),
            description: ticketData.description.trim(),
            status: ticketData.status || 'open',
            priority: ticketData.priority || 'medium',
            created_by: ticketData.created_by,
            assigned_to: ticketData.assigned_to || null,
            category_id: ticketData.category_id || null,
            module: ticketData.module || 'support',
            due_date: ticketData.due_date || null,
            purchase_details: ticketData.purchase_details || {},
            error_details: ticketData.error_details || {}
        };

        // Insertar ticket
        const { data, error } = await supabase
            .from('tickets')
            .insert([cleanData])
            .select(`
        *,
        categories (*),
        creator:profiles!tickets_created_by_fkey (id, email, full_name)
      `)
            .single();

        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw new Error(`Error al crear ticket: ${error.message}`);
        }

        // Registrar en historial
        await addToHistory(data.id, cleanData.created_by, 'ticket_created', null, 'Nuevo ticket creado');

        console.log('✅ Ticket creado exitosamente:', data.id);
        return { data, error: null };

    } catch (error) {
        console.error('💥 Error creando ticket:', error);
        return {
            data: null,
            error: error.message || 'Error al crear ticket'
        };
    }
};

/**
 * Actualizar ticket con seguimiento de cambios
 */
// ticketService.js - FUNCIÓN updateTicket CORREGIDA
export const updateTicket = async (id, updates, userId) => {
  try {
    if (!id || !userId) {
      throw new Error('ID de ticket y usuario requeridos');
    }

    console.log(`🔄 Actualizando ticket ${id}...`, updates);

    // Obtener ticket actual para comparar
    const { data: oldTicket, error: fetchError } = await getTicketById(id);
    
    if (fetchError || !oldTicket) {
      console.error('❌ Error obteniendo ticket para actualizar:', fetchError);
      throw new Error('Ticket no encontrado');
    }

    // Limpiar datos
    const cleanUpdates = {
      ...updates,
      assigned_to: updates.assigned_to || null,
      category_id: updates.category_id || null,
      due_date: updates.due_date || null,
      updated_at: new Date().toISOString()
    };

    // Actualizar ticket
    const { data, error } = await supabase
      .from('tickets')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando ticket:', error);
      throw new Error(`Error al actualizar ticket: ${error.message}`);
    }

    // Registrar cambios en historial
    await trackChanges(id, userId, oldTicket, cleanUpdates);

    console.log(`✅ Ticket ${id} actualizado`);
    return { data, error: null };

  } catch (error) {
    console.error(`💥 Error actualizando ticket ${id}:`, error);
    return { 
      data: null, 
      error: error.message || 'Error al actualizar ticket' 
    };
  }
};

/**
 * Eliminar ticket (solo admin/creador)
 */
export const deleteTicket = async (id, userId) => {
    try {
        if (!id || !userId) {
            throw new Error('ID de ticket y usuario requeridos');
        }

        console.log(`🗑️ Eliminando ticket ${id}...`);

        // Verificar permisos (en una app real aquí validarías roles)
        const { data: ticket } = await getTicketById(id);
        if (!ticket.data) {
            throw new Error('Ticket no encontrado');
        }

        // Eliminar ticket
        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Error eliminando ticket:', error);
            throw new Error(`Error al eliminar ticket: ${error.message}`);
        }

        // Registrar en historial
        await addToHistory(id, userId, 'ticket_deleted', 'Ticket activo', 'Ticket eliminado');

        console.log(`✅ Ticket ${id} eliminado`);
        return { success: true, error: null };

    } catch (error) {
        console.error(`💥 Error eliminando ticket ${id}:`, error);
        return {
            success: false,
            error: error.message || 'Error al eliminar ticket'
        };
    }
};

// ============================================
// 📁 FUNCIONES PARA DATOS MAESTROS (CON CACHE)
// ============================================

/**
 * Obtener categorías con cache
 */
export const getCategories = async (forceRefresh = false) => {
    try {
        const now = Date.now();

        // Usar cache si está disponible y no está expirado
        if (!forceRefresh && categoriesCache && cacheTimestamp &&
            (now - cacheTimestamp < CACHE_DURATION)) {
            console.log('📁 Usando categorías en cache');
            return { data: categoriesCache, error: null };
        }

        console.log('📁 Obteniendo categorías de la base de datos...');

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw new Error(`Error al obtener categorías: ${error.message}`);
        }

        // Actualizar cache
        categoriesCache = data || [];
        cacheTimestamp = now;

        console.log(`✅ ${categoriesCache.length} categorías obtenidas`);
        return { data: categoriesCache, error: null };

    } catch (error) {
        console.error('💥 Error en getCategories:', error);
        return {
            data: categoriesCache || [],
            error: error.message || 'Error al obtener categorías'
        };
    }
};

/**
 * Obtener usuarios para asignación con cache
 */
export const getUsers = async (forceRefresh = false) => {
    try {
        const now = Date.now();

        // Usar cache si está disponible
        if (!forceRefresh && usersCache && cacheTimestamp &&
            (now - cacheTimestamp < CACHE_DURATION)) {
            console.log('👥 Usando usuarios en cache');
            return { data: usersCache, error: null };
        }

        console.log('👥 Obteniendo usuarios de la base de datos...');

        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, avatar_url')
            .order('full_name');

        if (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }

        // Actualizar cache
        usersCache = data || [];
        cacheTimestamp = now;

        console.log(`✅ ${usersCache.length} usuarios obtenidos`);
        return { data: usersCache, error: null };

    } catch (error) {
        console.error('💥 Error en getUsers:', error);
        return {
            data: usersCache || [],
            error: error.message || 'Error al obtener usuarios'
        };
    }
};

// ============================================
// 💬 FUNCIONES PARA COMENTARIOS
// ============================================

/**
 * Añadir comentario a un ticket
 */
export const addComment = async (commentData) => {
    try {
        console.log('💬 Añadiendo comentario...', commentData);

        // Validación
        if (!commentData.ticket_id || !commentData.user_id || !commentData.content) {
            throw new Error('Datos de comentario incompletos');
        }

        const cleanData = {
            ticket_id: commentData.ticket_id,
            user_id: commentData.user_id,
            content: commentData.content.trim(),
            is_internal: commentData.is_internal || false
        };

        const { data, error } = await supabase
            .from('comments')
            .insert([cleanData])
            .select(`
        *,
        user:profiles!comments_user_id_fkey (
          id, email, full_name, role, avatar_url
        )
      `)
            .single();

        if (error) {
            console.error('❌ Error añadiendo comentario:', error);
            throw new Error(`Error al añadir comentario: ${error.message}`);
        }

        // Registrar en historial
        await addToHistory(
            commentData.ticket_id,
            commentData.user_id,
            'comment_added',
            null,
            `Comentario agregado: ${cleanData.content.substring(0, 50)}...`
        );

        console.log('✅ Comentario añadido:', data.id);
        return { data, error: null };

    } catch (error) {
        console.error('💥 Error añadiendo comentario:', error);
        return {
            data: null,
            error: error.message || 'Error al añadir comentario'
        };
    }
};

/**
 * Obtener comentarios de un ticket
 */
export const getComments = async (ticketId) => {
    try {
        if (!ticketId) {
            throw new Error('ID de ticket requerido');
        }

        console.log(`💬 Obteniendo comentarios del ticket ${ticketId}...`);

        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        user:profiles!comments_user_id_fkey (
          id, email, full_name, role, avatar_url
        )
      `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Error obteniendo comentarios:', error);
            throw new Error(`Error al obtener comentarios: ${error.message}`);
        }

        console.log(`✅ ${data?.length || 0} comentarios obtenidos`);
        return { data: data || [], error: null };

    } catch (error) {
        console.error('💥 Error obteniendo comentarios:', error);
        return {
            data: [],
            error: error.message || 'Error al obtener comentarios'
        };
    }
};

// ============================================
// 📊 FUNCIONES PARA ESTADÍSTICAS Y REPORTES
// ============================================

/**
 * Obtener estadísticas de tickets
 */
export const getTicketStats = async (userId) => {
    try {
        console.log(`📊 Obteniendo estadísticas para usuario ${userId}...`);

        const [
            totalCreated,
            totalAssigned,
            openTickets,
            inProgressTickets,
            resolvedTickets
        ] = await Promise.all([
            // Total tickets creados por el usuario
            supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', userId),

            // Tickets asignados al usuario
            supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', userId),

            // Tickets abiertos del usuario
            supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
                .eq('status', 'open'),

            // Tickets en progreso del usuario
            supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
                .eq('status', 'in_progress'),

            // Tickets resueltos del usuario
            supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
                .eq('status', 'resolved')
        ]);

        // Verificar errores
        const errors = [totalCreated.error, totalAssigned.error, openTickets.error,
        inProgressTickets.error, resolvedTickets.error].filter(Boolean);

        if (errors.length > 0) {
            throw new Error(errors[0].message);
        }

        const stats = {
            totalCreated: totalCreated.count || 0,
            totalAssigned: totalAssigned.count || 0,
            openTickets: openTickets.count || 0,
            inProgressTickets: inProgressTickets.count || 0,
            resolvedTickets: resolvedTickets.count || 0
        };

        console.log('📊 Estadísticas obtenidas:', stats);
        return { data: stats, error: null };

    } catch (error) {
        console.error('💥 Error obteniendo estadísticas:', error);
        return {
            data: null,
            error: error.message || 'Error al obtener estadísticas'
        };
    }
};

/**
 * Obtener estadísticas del sistema (para admin)
 */
export const getSystemStats = async () => {
    try {
        console.log('📈 Obteniendo estadísticas del sistema...');

        const [
            totalUsers,
            totalTickets,
            ticketsByStatus,
            ticketsByPriority
        ] = await Promise.all([
            // Total usuarios
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true }),

            // Total tickets
            supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true }),

            // Tickets por estado
            supabase
                .from('tickets')
                .select('status', { count: 'exact' }),

            // Tickets por prioridad
            supabase
                .from('tickets')
                .select('priority', { count: 'exact' })
        ]);

        const errors = [totalUsers.error, totalTickets.error,
        ticketsByStatus.error, ticketsByPriority.error].filter(Boolean);

        if (errors.length > 0) {
            throw new Error(errors[0].message);
        }

        // Procesar datos
        const statusCounts = {};
        const priorityCounts = {};

        (ticketsByStatus.data || []).forEach(item => {
            statusCounts[item.status] = item.count;
        });

        (ticketsByPriority.data || []).forEach(item => {
            priorityCounts[item.priority] = item.count;
        });

        const stats = {
            totalUsers: totalUsers.count || 0,
            totalTickets: totalTickets.count || 0,
            ticketsByStatus: statusCounts,
            ticketsByPriority: priorityCounts,
            avgResponseTime: '24h', // Esto sería calculado en una app real
            satisfactionRate: '92%'
        };

        console.log('📈 Estadísticas del sistema obtenidas');
        return { data: stats, error: null };

    } catch (error) {
        console.error('💥 Error obteniendo estadísticas del sistema:', error);
        return {
            data: null,
            error: error.message || 'Error al obtener estadísticas del sistema'
        };
    }
};

// ============================================
// 🛠️ FUNCIONES AUXILIARES
// ============================================

/**
 * Aplicar filtros a una consulta
 */
const applyFilters = (query, filters) => {
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
        } else {
            query = query.eq('status', filters.status);
        }
    }

    if (filters.priority) {
        if (Array.isArray(filters.priority)) {
            query = query.in('priority', filters.priority);
        } else {
            query = query.eq('priority', filters.priority);
        }
    }

    if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
    }

    if (filters.assigned_to) {
        if (filters.assigned_to === 'me') {
            query = query.not('assigned_to', 'is', null);
        } else if (filters.assigned_to === 'unassigned') {
            query = query.is('assigned_to', null);
        } else {
            query = query.eq('assigned_to', filters.assigned_to);
        }
    }

    if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
    }

    if (filters.module) {
        query = query.eq('module', filters.module);
    }

    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.startDate && filters.endDate) {
        query = query.gte('created_at', filters.startDate)
            .lte('created_at', filters.endDate);
    }

    return query;
};

/**
 * Seguimiento de cambios para historial
 */
const trackChanges = async (ticketId, userId, oldData, newData) => {
    try {
        const changes = [];

        // Campos a monitorear
        const fieldsToTrack = [
            'status', 'priority', 'assigned_to', 'category_id',
            'due_date', 'title', 'description'
        ];

        for (const field of fieldsToTrack) {
            const oldValue = oldData[field];
            const newValue = newData[field];

            // Comparar valores
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field,
                    oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
                    newValue: newValue !== null && newValue !== undefined ? String(newValue) : null
                });
            }
        }

        // Registrar cambios en historial
        if (changes.length > 0) {
            for (const change of changes) {
                await addToHistory(ticketId, userId, change.field, change.oldValue, change.newValue);
            }
        }

    } catch (error) {
        console.error('Error en trackChanges:', error);
    }
};

/**
 * Agregar entrada al historial
 */
const addToHistory = async (ticketId, userId, field, oldValue, newValue) => {
    try {
        await supabase
            .from('ticket_history')
            .insert([{
                ticket_id: ticketId,
                changed_by: userId,
                field_changed: field,
                old_value: oldValue,
                new_value: newValue,
                change_date: new Date().toISOString()
            }]);

        console.log(`📝 Historial registrado: ${field} cambiado`);

    } catch (error) {
        console.error('Error registrando en historial:', error);
    }
};

/**
 * Obtener historial de un ticket
 */
export const getTicketHistory = async (ticketId) => {
    try {
        const { data, error } = await supabase
            .from('ticket_history')
            .select(`
        *,
        changed_by:profiles!ticket_history_changed_by_fkey (
          id, email, full_name
        )
      `)
            .eq('ticket_id', ticketId)
            .order('change_date', { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };

    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return { data: [], error };
    }
};

// ============================================
// 🎨 FUNCIONES PARA UI (BOOTSTRAP)
// ============================================

/**
 * Obtener clase CSS para badge de prioridad (Bootstrap)
 */
export const getPriorityBadgeClass = (priority) => {
    const classes = {
        low: 'bg-success',
        medium: 'bg-warning',
        high: 'bg-danger',
        urgent: 'bg-dark'
    };
    return classes[priority] || 'bg-secondary';
};

/**
 * Obtener icono para prioridad (Bootstrap Icons)
 */
export const getPriorityIcon = (priority) => {
    const icons = {
        low: 'bi-arrow-down',
        medium: 'bi-dash',
        high: 'bi-arrow-up',
        urgent: 'bi-exclamation-triangle'
    };
    return icons[priority] || 'bi-question-circle';
};

/**
 * Obtener clase CSS para badge de estado (Bootstrap)
 */
export const getStatusBadgeClass = (status) => {
    const classes = {
        open: 'bg-primary',
        in_progress: 'bg-warning',
        resolved: 'bg-success',
        closed: 'bg-secondary'
    };
    return classes[status] || 'bg-info';
};

/**
 * Obtener icono para estado (Bootstrap Icons)
 */
export const getStatusIcon = (status) => {
    const icons = {
        open: 'bi-circle',
        in_progress: 'bi-arrow-clockwise',
        resolved: 'bi-check-circle',
        closed: 'bi-lock'
    };
    return icons[status] || 'bi-question-circle';
};

/**
 * Formatear fecha para UI
 */
export const formatDateForUI = (dateString) => {
    if (!dateString) return 'No establecida';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Obtener texto descriptivo para prioridad
 */
export const getPriorityText = (priority) => {
    const texts = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return texts[priority] || 'No especificada';
};

/**
 * Obtener texto descriptivo para estado
 */
export const getStatusText = (status) => {
    const texts = {
        open: 'Abierto',
        in_progress: 'En progreso',
        resolved: 'Resuelto',
        closed: 'Cerrado'
    };
    return texts[status] || 'Desconocido';
};

/**
 * Generar ID legible para ticket
 */
export const generateTicketId = (uuid) => {
    if (!uuid) return 'TKT-XXXX';
    return `TKT-${uuid.substring(0, 8).toUpperCase()}`;
};

// ============================================
// 🎯 EXPORTAR TODO EL SERVICIO
// ============================================

export default {
    // Funciones principales
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,

    // Datos maestros
    getCategories,
    getUsers,

    // Comentarios
    addComment,
    getComments,

    // Estadísticas
    getTicketStats,
    getSystemStats,

    // Historial
    getTicketHistory,

    // Funciones UI (Bootstrap)
    getPriorityBadgeClass,
    getPriorityIcon,
    getStatusBadgeClass,
    getStatusIcon,
    formatDateForUI,
    getPriorityText,
    getStatusText,
    generateTicketId
};