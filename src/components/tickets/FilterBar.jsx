// src/components/tickets/FilterBar.jsx
import React, { useState, useEffect } from 'react';
import ticketService from '../../services/ticketService';

const FilterBar = ({ filters, onFilterChange, onClearFilters, loading = false }) => {
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados locales para los inputs
  const [localFilters, setLocalFilters] = useState(filters);

  // Cargar categorías y usuarios
  useEffect(() => {
    loadFilterData();
  }, []);

  // Sincronizar con filtros externos
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const loadFilterData = async () => {
    try {
      setLoadingData(true);
      
      const [categoriesResult, usersResult] = await Promise.all([
        ticketService.getCategories(),
        ticketService.getUsers()
      ]);
      
      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (usersResult.data) setUsers(usersResult.data);
      
    } catch (error) {
      console.error('Error cargando datos de filtros:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (name, value) => {
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearAll = () => {
    const clearedFilters = {
      status: '',
      priority: '',
      assigned_to: '',
      category_id: '',
      search: ''
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  return (
    <div className="filter-bar">
      <div className="row g-3">
        {/* Búsqueda por texto */}
        <div className="col-md-12 mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar en títulos y descripciones..."
              value={localFilters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
            <button 
              className="btn btn-primary"
              onClick={handleApplyFilters}
              disabled={loading || loadingData}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <i className="bi bi-funnel me-1"></i>
              )}
              Aplicar
            </button>
          </div>
        </div>

        {/* Filtros en fila */}
        <div className="col-md-12">
          <div className="row g-2">
            {/* Estado */}
            <div className="col-sm-6 col-md-3">
              <label className="form-label small fw-semibold">
                <i className="bi bi-circle-fill me-1"></i>
                Estado
              </label>
              <select 
                className="form-select form-select-sm"
                value={localFilters.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>

            {/* Prioridad */}
            <div className="col-sm-6 col-md-3">
              <label className="form-label small fw-semibold">
                <i className="bi bi-arrow-up me-1"></i>
                Prioridad
              </label>
              <select 
                className="form-select form-select-sm"
                value={localFilters.priority || ''}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <option value="">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {/* Categoría */}
            <div className="col-sm-6 col-md-3">
              <label className="form-label small fw-semibold">
                <i className="bi bi-tag me-1"></i>
                Categoría
              </label>
              <select 
                className="form-select form-select-sm"
                value={localFilters.category_id || ''}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                disabled={loadingData}
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignado a */}
            <div className="col-sm-6 col-md-3">
              <label className="form-label small fw-semibold">
                <i className="bi bi-person-check me-1"></i>
                Asignado a
              </label>
              <select 
                className="form-select form-select-sm"
                value={localFilters.assigned_to || ''}
                onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                disabled={loadingData}
              >
                <option value="">Todos</option>
                <option value="unassigned">Sin asignar</option>
                <option value="me">Asignados a mí</option>
                <optgroup label="Usuarios">
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
            <div>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleClearAll}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar filtros
              </button>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-funnel me-1"></i>
                    Aplicar filtros
                  </>
                )}
              </button>
              
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                <i className="bi bi-search me-1"></i>
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;