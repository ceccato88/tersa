import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

// Cliente específico para uploads usando IP original para evitar CORS e limites
export const createUploadClient = () => {
  // Usar IP original para uploads para evitar problemas de CORS e limite de tamanho
  const uploadUrl = env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL;
  
  return createBrowserClient(
    uploadUrl,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};