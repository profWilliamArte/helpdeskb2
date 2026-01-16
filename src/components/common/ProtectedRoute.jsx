import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Por ahora, siempre permitir acceso
  // En la siguiente etapa implementaremos autenticación real
  const isAuthenticated = true; // Temporal
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;