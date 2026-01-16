// src/components/tickets/TicketFormModal.jsx
import React, { useState, useEffect } from 'react';
import TicketForm from './TicketForm';
import ticketService from '../../services/ticketService';

const TicketFormModal = ({ 
  show, 
  onClose, 
  ticketId = null,
  initialData = null,
  onSuccess 
}) => {
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (show) {
      loadFormData();
    }
  }, [show]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      
      const [categoriesResult, usersResult] = await Promise.all([
        ticketService.getCategories(),
        ticketService.getUsers()
      ]);
      
      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (usersResult.data) setUsers(usersResult.data);
      
    } catch (error) {
      console.error('Error cargando datos del formulario:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSuccess = (ticketData) => {
    if (onSuccess) {
      onSuccess(ticketData);
    }
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {loadingData ? (
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3">Cargando formulario...</p>
            </div>
          ) : (
            <TicketForm
              ticketId={ticketId}
              categories={categories}
              users={users}
              onClose={onClose}
              onSuccess={handleSuccess}
              initialData={initialData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketFormModal;