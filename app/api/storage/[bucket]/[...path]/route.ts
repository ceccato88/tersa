import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscribedUser } from '@/lib/auth';

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bucket: string; path: string[] }> }
) {
  try {
    const user = await getSubscribedUser();
    const { bucket, path } = await context.params;
    const pathSegments = Array.isArray(path) ? path : [path];
    const filePath = pathSegments.join('/');

    // Segurança adicional: garantir que o caminho começa com o id do usuário
    if (!filePath || !filePath.startsWith(`${user.id}/`)) {
      return new Response('Forbidden', { status: 403 });
    }

    const supabase = await createClient();
    // Gerar URL assinada curta e repassar Range para permitir streaming
    const { data: signed, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60);
    if (error || !signed?.signedUrl) {
      return new Response('Not found', { status: 404 });
    }

    const range = req.headers.get('range') || undefined;

    const upstream = await fetch(signed.signedUrl, {
      headers: range ? { Range: range } : undefined,
    });

    // Encaminhar cabeçalhos importantes
    const headers = new Headers();
    const copyHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'etag', 'last-modified'];
    for (const h of copyHeaders) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('Content-Disposition', 'inline');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
