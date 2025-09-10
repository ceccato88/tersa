import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const maxDuration = 180;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bucket: string; path: string[] }> }
) {
  try {
    const { bucket, path } = await context.params;
    const pathSegments = Array.isArray(path) ? path : [path];
    const filePath = pathSegments.join('/');

    // Verificar se o path tem formato válido (UUID do usuário/arquivo)
    const uuidRegex = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\//;
    if (!uuidRegex.test(filePath)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Extrair o UUID do usuário do path
    const userIdFromPath = filePath.split('/')[0];

    // Tentar autenticação normal primeiro
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Se tem usuário logado, verificar se é o dono do arquivo
    if (user && user.id === userIdFromPath) {
      // Usuário autenticado e é dono - usar service key para garantir acesso
      const adminClient = createServiceClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: signed, error } = await adminClient.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
        
      if (error || !signed?.signedUrl) {
        return new Response('Not found', { status: 404 });
      }

      return await fetchFile(signed.signedUrl, req);
    }

    // Se não tem usuário ou não é o dono, verificar se é componente Next.js Image
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    
    // Permitir APENAS para componente Next.js Image (user-agent: 'node')
    const isNextJsImage = userAgent === 'node';
    
    if (!isNextJsImage) {
      console.log('🚫 Blocked access:', { userAgent, referer });
      return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('✅ Allowing Next.js Image access:', { userAgent });

    // Para componente Image da aplicação, usar service key
    const adminClient = createServiceClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: signed, error } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);
      
    if (error || !signed?.signedUrl) {
      return new Response('Not found', { status: 404 });
    }

    return await fetchFile(signed.signedUrl, req);

  } catch (error) {
    console.error('Storage API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function fetchFile(signedUrl: string, req: NextRequest) {
  const range = req.headers.get('range') || undefined;

  const upstream = await fetch(signedUrl, {
    headers: range ? { Range: range } : undefined,
    signal: AbortSignal.timeout(60000),
  });

  const headers = new Headers();
  const copyHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'etag', 'last-modified'];
  
  for (const h of copyHeaders) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  
  headers.set('Cache-Control', 'private, max-age=86400');
  headers.set('Content-Disposition', 'inline');

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}