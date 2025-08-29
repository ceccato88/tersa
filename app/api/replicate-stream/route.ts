import { getSubscribedUser } from '@/lib/auth';
import { parseError } from '@/lib/error/parse';
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit';
// import { trackCreditUsage } from '@/lib/stripe'; // Desativado - créditos infinitos
import Replicate from 'replicate';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Create a rate limiter for the replicate stream API
const rateLimiter = createRateLimiter({
  limiter: slidingWindow(10, '1 m'),
  prefix: 'api-replicate-stream',
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

  // Detectar se é um modelo de imagem
  const isImageModel = model.includes('flux') || model.includes('stable-diffusion') || model.includes('midjourney') || model.includes('dall-e');
  
  // Ajustar input baseado no modelo específico
  let adjustedInput = { ...input };
  
  if (model.includes('claude')) {
    // Claude 4 usa schema diferente
    adjustedInput = {
      prompt: input.prompt || '',
      system_prompt: input.system_prompt || '',
      max_tokens: input.max_completion_tokens || 8192,
      extended_thinking: false,
      max_image_resolution: 0.5,
      thinking_budget_tokens: 1024,
    };
    
    // Claude usa 'image' ao invés de 'image_input'
    if (input.image_input && input.image_input.length > 0) {
      adjustedInput.image = input.image_input[0]; // Claude aceita apenas uma imagem
    }
  } else if (model.includes('gpt')) {
    // GPT-5 e GPT-5 Mini usam schema com messages
    adjustedInput = {
      messages: input.messages || [
        { role: 'system', content: input.system_prompt || '' },
        { role: 'user', content: input.prompt || '' }
      ],
      verbosity: input.verbosity || 'medium',
      reasoning_effort: input.reasoning_effort || 'minimal',
      max_completion_tokens: input.max_completion_tokens || 4000,
    };
    
    // GPT usa 'image_input' para imagens
    if (input.image_input && input.image_input.length > 0) {
      adjustedInput.image_input = input.image_input;
    }
    
    // Se não há messages mas há prompt, criar structure de messages
    if (!input.messages && input.prompt) {
      adjustedInput.messages = [
        ...(input.system_prompt ? [{ role: 'system', content: input.system_prompt }] : []),
        { role: 'user', content: input.prompt }
      ];
    }
  } else if (model.includes('llava') || model.includes('vision') || input.image) {
    // Modelos de visão específicos (LLaVA, etc.) usam schema mais simples
    adjustedInput = {
      prompt: input.prompt || '',
      image: input.image,
      max_tokens: input.max_tokens || 500,
    };
  }

  try {
    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Run the Replicate model with streaming
          const stream = await replicate.stream(model, {
            input: adjustedInput,
          });

          // Stream the response
          for await (const event of stream) {
            if (event.event === 'output') {
              if (isImageModel) {
                // Para modelos de imagem, enviar o JSON completo
                const jsonData = JSON.stringify({ output: event.data });
                const chunk = new TextEncoder().encode(`data: ${jsonData}\n\n`);
                controller.enqueue(chunk);
              } else {
                // Para modelos de texto, enviar apenas o texto
                const chunk = new TextEncoder().encode(event.data);
                controller.enqueue(chunk);
              }
            }
          }

          controller.close();

          // Stripe tracking desativado - usuário tem créditos infinitos
          console.log('Stripe tracking pulado - créditos infinitos');
        } catch (error) {
          console.error('Replicate streaming error:', error);
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
    console.error('Error in replicate-stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
};