import { getSubscribedUser } from '@/lib/auth';
import { parseError } from '@/lib/error/parse';
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit';
import { fal } from '@fal-ai/client';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

// Rate limiter para FAL AI stream
const rateLimiter = createRateLimiter({
  limiter: slidingWindow(10, '1 m'),
  prefix: 'api-fal-stream',
});

export const POST = async (req: NextRequest) => {
  // Verificar autenticação
  const user = await getSubscribedUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = await rateLimiter.limit(user.id);
  if (!rateLimitResult.success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  try {
    const body = await req.json();
    const { model, input } = body;

    console.log('🔍 DEBUG - Request body:', JSON.stringify(body, null, 2));

    if (!model || !input) {
      console.log('❌ Missing model or input');
      return new Response('Missing model or input', { status: 400 });
    }

    // Configurar FAL client
    fal.config({
      credentials: process.env.FAL_KEY,
    });

    console.log('🤖 Iniciando geração de texto com FAL AI:', {
      model,
      promptLength: input.prompt?.length ?? 0,
      systemPromptLength: input.system_prompt?.length ?? 0,
    });

    // Preparar input para FAL AI
    const falInput: any = {
      prompt: input.prompt || '',
      model: 'openai/gpt-5-chat', // Modelo fixo conforme solicitado
      reasoning: input.reasoning || false,
      priority: input.priority || 'latency',
    };

    if (input.system_prompt) {
      falInput.system_prompt = input.system_prompt;
    }

    // Incluir image_url se fornecido (agora HTTPS funciona!)
    if (input.image_url) {
      falInput.image_url = input.image_url;
      console.log('📸 Imagem incluída para processamento direto:', input.image_url);
    }

    console.log('📋 FAL Input sendo enviado:', JSON.stringify(falInput, null, 2));

    // Usar endpoint correto baseado se tem imagem ou não
    const modelEndpoint = input.image_url ? 'fal-ai/any-llm/vision' : 'fal-ai/any-llm/enterprise';
    
    console.log('🎯 Usando endpoint:', modelEndpoint, 'tem image_url:', !!input.image_url);
    
    const result = await fal.subscribe(modelEndpoint, {
      input: falInput,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('✅ Texto gerado com sucesso:', {
      outputLength: result.data.output?.length ?? 0,
      hasReasoning: !!result.data.reasoning,
    });

    // Retornar o resultado como stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Enviar o texto gerado
        if (result.data.output) {
          controller.enqueue(encoder.encode(result.data.output));
        }
        
        // Se houver reasoning, adicionar como seção separada
        if (result.data.reasoning) {
          controller.enqueue(encoder.encode('\n\n--- Reasoning ---\n'));
          controller.enqueue(encoder.encode(result.data.reasoning));
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ Erro na geração de texto FAL AI:', error);
    const message = parseError(error);
    return new Response(message, { status: 500 });
  }
};

export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}