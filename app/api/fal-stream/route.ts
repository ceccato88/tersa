import { getSubscribedUser } from '@/lib/auth';
import { parseError } from '@/lib/error/parse';
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit';
import { fal } from '@fal-ai/client';
import { appendMockLog } from '@/lib/mock-log';
import { NextRequest } from 'next/server';
import { getUserFalToken } from '@/app/actions/profile/update-fal-token';

export const maxDuration = 300;

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


    if (!model || !input) {
      console.log('❌ Missing model or input');
      return new Response('Missing model or input', { status: 400 });
    }

    // Test mode: log inputs and return a mock stream without calling external API
    if (process.env.TEST_LOG_ONLY === 'true') {
      const payload = { route: '/api/fal-stream', model, input };
      try {
        console.log('[TEST_LOG_ONLY]\n' + JSON.stringify(payload, null, 2));
      } catch {
        console.log('[TEST_LOG_ONLY]', payload);
      }
      appendMockLog(payload).catch(() => {});

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('[MOCK] Texto gerado (stream)\n'));
          if (input?.prompt) {
            controller.enqueue(encoder.encode(`Prompt: ${input.prompt}\n`));
          }
          if (input?.image_url) {
            controller.enqueue(encoder.encode(`Imagem: ${input.image_url}\n`));
          }
          controller.enqueue(encoder.encode('\n--- Reasoning ---\n'));
          controller.enqueue(encoder.encode('Execução em modo de teste (sem chamar API externa).'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Exigir token do usuário (sem fallback para FAL_KEY)
    const userToken = await getUserFalToken(user.id);
    if (!userToken) {
      return new Response('Token FAL não configurado. Acesse seu perfil e salve seu token FAL para continuar.', { status: 400 });
    }
    fal.config({ credentials: userToken });
    console.log('🔑 Token FAL para texto: usuário');

    console.log('🤖 Iniciando geração de texto com FAL AI:', {
      model,
      promptLength: input.prompt?.length ?? 0,
      systemPromptLength: input.system_prompt?.length ?? 0,
    });

    // Preparar input para FAL AI
    const falInput: any = {
      prompt: input.prompt || '',
      // Use o modelo solicitado (fallback apenas se ausente)
      model: model || 'openai/gpt-4o-mini',
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
