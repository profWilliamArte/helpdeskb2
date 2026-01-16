import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Faltan variables de entorno de Supabase');
  console.log('URL:', supabaseUrl || 'NO DEFINIDA');
  console.log('KEY:', supabaseAnonKey ? 'PRESENTE' : 'NO DEFINIDA');
  console.log('Recuerda crear un archivo .env.local con:');
  console.log('VITE_SUPABASE_URL=tu_url');
  console.log('VITE_SUPABASE_ANON_KEY=tu_key');
}

// Crear cliente con opciones optimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'helpdesk-supabase-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'helpdesk-system@1.0.0',
    },
  },
});

// Función de prueba de conexión
export const testConnection = async () => {
  try {
    console.log('🔄 Probando conexión con Supabase...');
    
    // Test 1: Verificar autenticación
    const { data: authData } = await supabase.auth.getSession();
    console.log('🔐 Estado auth:', authData.session ? 'Conectado' : 'No autenticado');
    
    // Test 2: Verificar base de datos
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error en conexión DB:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    console.log('📊 Total perfiles en DB:', data?.[0]?.count || 0);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Error de conexión a Supabase:', error.message);
    return { success: false, error: error.message };
  }
};

export default supabase;