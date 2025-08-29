import { getSubscribedUser } from '@/lib/auth';
import { parseError } from '@/lib/error/parse';
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit';
// import { trackCreditUsage } from '@/lib/stripe'; // Desativado - créditos infinitos
import Replicate from 'replicate';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Create a rate limiter for the replicate video stream API
const rateLimiter = createRateLimiter({
  limiter: slidingWindow(5, '1 m'), // Menos requests para vídeo
  prefix: 'api-replicate-video-stream',
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const POST = async (req: Request) => {
  try {
    await getSubscribedUser();
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 401 });
  }

  // Apply rate limiting
  if (process.env.NODE_ENV === 'production') {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success, limit, reset, remaining } = await rateLimiter.limit(ip);

    if (!success) {
      return new Response('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  let model, input;
  try {
    const body = await req.json();
    model = body.model;
    input = body.input;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return new Response('Invalid JSON in request body', { status: 400 });
  }

  if (typeof model !== 'string') {
    return new Response('Model must be a string', { status: 400 });
  }

  if (!input) {
    return new Response('Input is required', { status: 400 });
  }

  // Ajustar input baseado no modelo específico de vídeo
  let adjustedInput = { ...input };
  
  if (model === 'wan-video/wan-2.2-i2v-a14b') {
    // WAN Video I2V usa schema específico
    adjustedInput = {
      prompt: input.prompt || '',
      image: typeof input.image === 'string' ? input.image : (input.image?.url || ''), // Garantir que seja string
      seed: input.seed ? parseInt(input.seed) : Math.floor(Math.random() * 1000000), // Garantir que seja integer
      go_fast: input.go_fast || false,
      num_frames: input.num_frames || 81,
      resolution: input.resolution || '480p',
      sample_shift: input.sample_shift || 5,
      sample_steps: input.sample_steps || 40,
      frames_per_second: input.frames_per_second || 16,
    };
  }

  try {
    // Usar replicate.run() em vez de stream para vídeos
    console.log('🚀 Executando modelo de vídeo:', model);
    console.log('📝 Input:', adjustedInput);
    
    const output = await replicate.run(model, {
      input: adjustedInput,
    });

    console.log('✅ Resultado do Replicate (tipo):', typeof output);
    console.log('✅ Resultado do Replicate (conteúdo):', output);

    let finalResult = output;

    // Se output é um ReadableStream, ler o conteúdo
    if (output && typeof output === 'object' && output.readable !== undefined) {
      console.log('📖 Lendo ReadableStream do resultado...');
      try {
        const reader = output.getReader();
        const chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const decoder = new TextDecoder();
        const content = decoder.decode(new Uint8Array(chunks.flat()));
        console.log('📄 Conteúdo lido do stream:', content);
        
        // Tentar parsear como JSON
        try {
          const parsed = JSON.parse(content);
          finalResult = parsed;
        } catch {
          // Se não for JSON, usar como string
          finalResult = content;
        }
      } catch (error) {
        console.error('❌ Erro ao ler ReadableStream:', error);
        finalResult = null;
      }
    }

    console.log('🎯 Resultado final:', finalResult);

    // Criar stream com o resultado
    const stream = new ReadableStream({
      start(controller) {
        try {
          const jsonData = JSON.stringify({ output: finalResult });
          console.log('📤 Enviando resultado:', jsonData);
          const chunk = new TextEncoder().encode(`data: ${jsonData}\n\n`);
          controller.enqueue(chunk);
          controller.close();
        } catch (error) {
          console.error('❌ Erro ao enviar resultado:', error);
          controller.error(error);
        }
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
    console.error('Error in replicate-video-stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
};