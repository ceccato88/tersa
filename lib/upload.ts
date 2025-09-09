import { nanoid } from 'nanoid';
import { env } from './env';
import { createClient } from './supabase/client';
import { createUploadClient } from './supabase/upload-client';

export const uploadFile = async (
  file: File,
  bucket: 'avatars' | 'files' | 'screenshots',
  filename?: string
) => {
  // Usar cliente normal para autenticação
  const authClient = createClient();
  const { data } = await authClient.auth.getUser();
  const extension = file.name.split('.').pop();

  if (!data?.user) {
    throw new Error('You need to be logged in to upload a file!');
  }

  const name = filename ?? `${nanoid()}.${extension}`;

  // Usar cliente específico para upload (IP original) para evitar CORS e limites
  const uploadClient = createUploadClient();
  const blob = await uploadClient.storage
    .from(bucket)
    .upload(`${data.user.id}/${name}`, file, {
      contentType: file.type,
      upsert: bucket === 'screenshots',
    });

  if (blob.error) {
    throw new Error(blob.error.message);
  }

  // Construir URL via proxy (sem expirar, privado)
  const proxyUrl = new URL(`/api/storage/${bucket}/${blob.data.path}`,
    env.NEXT_PUBLIC_APP_URL
  ).toString();

  return {
    url: proxyUrl,
    type: file.type,
  };
};
