import { getSubscribedUser } from '@/lib/auth';
import { parseError } from '@/lib/error/parse';
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit';
import { trackCreditUsage } from '@/lib/stripe';
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

  const { model, input } = await req.json();

  if (typeof model !== 'string') {
    return new Response('Model must be a string', { status: 400 });
  }

  if (!input) {
    return new Response('Input is required', { status: 400 });
  }

  try {
    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Run the Replicate model with streaming
          const stream = await replicate.stream(model, {
            input: input,
          });

          // Stream the response
          for await (const event of stream) {
            if (event.event === 'output') {
              const chunk = new TextEncoder().encode(event.data);
              controller.enqueue(chunk);
            }
          }

          controller.close();

          // Track credit usage (approximate cost)
          await trackCreditUsage({
            action: 'text-generation',
            cost: 0.001, // Approximate cost per request
          });
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