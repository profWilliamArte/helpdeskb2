// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);

  // Cargar perfil del usuario
  const loadUserProfile = async (userId) => {
    try {
      console.log('🔄 Cargando perfil para:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil no encontrado, crear uno
          console.log('📝 Perfil no encontrado, creando...');
          await createProfile(userId);
          return await loadUserProfile(userId); // Recargar
        }
        console.error('❌ Error cargando perfil:', error.message);
        return null;
      }

      console.log('✅ Perfil cargado:', data.email);
      setProfile(data);
      return data;

    } catch (error) {
      console.error('❌ Error en loadUserProfile:', error);
      return null;
    }
  };

  // Crear perfil si no existe
  const createProfile = async (userId, email = '', fullName = '') => {
    try {
      console.log('➕ Creando perfil para:', email || userId);

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email || userData.user?.email || '',
          full_name: fullName || userData.user?.user_metadata?.full_name || '',
          role: 'user',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ Error creando perfil:', error.message);
        throw error;
      }

      console.log('✅ Perfil creado exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error en createProfile:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('🔐 AuthProvider montado - Iniciando...');

    // 1. Verificar sesión existente
    const checkSession = async () => {
      try {
        setLoading(true);
        console.log('🔄 Verificando sesión...');

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error al verificar sesión:', error.message);
          setAuthError(error.message);
        } else {
          console.log('📋 Sesión:', currentSession ? 'ACTIVA' : 'INACTIVA');
          setSession(currentSession);
          setUser(currentSession?.user || null);

          if (currentSession?.user) {
            await loadUserProfile(currentSession.user.id);
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('❌ Error inesperado en checkSession:', error);
      } finally {
        setLoading(false);
        console.log('✅ Verificación de sesión completada');
      }
    };

    checkSession();

    // 2. Escuchar cambios en autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 Evento de autenticación:', event);
        console.log('👤 Usuario:', newSession?.user?.email);

        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          // Crear/actualizar perfil automáticamente
          const profileData = await loadUserProfile(newSession.user.id);
          if (!profileData && event === 'SIGNED_IN') {
            // Si es registro nuevo, crear perfil
            await createProfile(
              newSession.user.id,
              newSession.user.email,
              newSession.user.user_metadata?.full_name
            );
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
        console.log(`🔄 Estado actualizado: ${newSession ? 'AUTENTICADO' : 'NO AUTENTICADO'}`);
      }
    );

    // 3. Limpiar suscripción
    return () => {
      subscription?.unsubscribe();
      console.log('🧹 AuthProvider desmontado');
    };
  }, []);

  // REGISTRO
  const signUp = async (email, password, fullName) => {
    try {
      setAuthError('');
      setLoading(true);
      console.log('📝 Registrando usuario:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('❌ Error en signUp:', error.message);
        setAuthError(error.message);
        setLoading(false);
        return {
          success: false,
          error: error.message,
          requiresConfirmation: error.message.includes('confirm')
        };
      }

      console.log('✅ Usuario registrado:', data.user?.email);

      // Crear perfil después del registro exitoso
      if (data.user) {
        await createProfile(data.user.id, email, fullName);
      }

      setLoading(false);
      return {
        success: true,
        data,
        error: null,
        message: data.user?.identities?.length === 0
          ? 'Por favor verifica tu email para confirmar la cuenta'
          : 'Registro exitoso'
      };

    } catch (error) {
      console.error('❌ Error catch en signUp:', error);
      setAuthError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // LOGIN
  const signIn = async (email, password) => {
    try {
      setAuthError('');
      setLoading(true);
      console.log('🔐 Iniciando sesión para:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en signIn:', error.message);
        setAuthError(error.message);
        setLoading(false);
        return {
          success: false,
          error: error.message,
          errorType: getErrorType(error.message)
        };
      }

      console.log('✅ Sesión iniciada:', data.user?.email);
      setLoading(false);
      return { success: true, data, error: null };

    } catch (error) {
      console.error('❌ Error catch en signIn:', error);
      setAuthError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // LOGOUT
// LOGOUT - VERSIÓN ALTERNATIVA MÁS ROBUSTA
const signOut = async () => {
  try {
    console.log('🔴 Iniciando proceso de logout...');
    
    // 1. Limpiar estado local primero
    setUser(null);
    setProfile(null);
    setSession(null);
    setAuthError('');
    
    // 2. Intentar cerrar sesión en Supabase
    let supabaseError = null;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        supabaseError = error;
        console.error('❌ Error de Supabase en signOut:', error.message);
      }
    } catch (supabaseErr) {
      supabaseError = supabaseErr;
      console.error('❌ Excepción en signOut de Supabase:', supabaseErr);
    }
    
    // 3. Limpiar localStorage
    try {
      // Limpiar tokens de Supabase
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`🧹 Limpiados ${supabaseKeys.length} items de localStorage`);
    } catch (storageError) {
      console.error('❌ Error limpiando localStorage:', storageError);
    }
    
    // 4. Retornar resultado
    if (supabaseError) {
      return { 
        success: false, 
        error: supabaseError.message || 'Error al cerrar sesión en Supabase' 
      };
    }
    
    console.log('✅ Logout completado exitosamente');
    return { success: true };
    
  } catch (error) {
    console.error('💥 Error inesperado en signOut:', error);
    return { 
      success: false, 
      error: error.message || 'Error inesperado al cerrar sesión' 
    };
  }
};

  // Actualizar perfil
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔄 Actualizando perfil:', updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando perfil:', error.message);
        throw error;
      }

      console.log('✅ Perfil actualizado');
      setProfile(data);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Error en updateProfile:', error);
      return { success: false, error: error.message };
    }
  };

  // Helper para clasificar errores
  const getErrorType = (errorMessage) => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'invalid_credentials';
    } else if (errorMessage.includes('Email not confirmed')) {
      return 'email_not_confirmed';
    } else if (errorMessage.includes('rate limit')) {
      return 'rate_limited';
    } else if (errorMessage.includes('User already registered')) {
      return 'already_registered';
    }
    return 'general_error';
  };

  const value = {
    // Estado
    user,
    profile,
    session,
    loading,
    authError,

    // Métodos de autenticación
    signUp,
    signIn,
    signOut,
    updateProfile,

    // Helpers
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isAgent: profile?.role === 'agent' || profile?.role === 'admin',
    isUser: profile?.role === 'user' || !profile,

    // Información del usuario
    userEmail: user?.email || profile?.email,
    userName: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0],
    userRole: profile?.role || 'user',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};