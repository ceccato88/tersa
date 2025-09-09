import { generateVideoFalAction } from '@/app/actions/video/fal';
import { NextRequest, NextResponse } from 'next/server';
import { appendMockLog } from '@/lib/mock-log';
import { buildFalVideoInput } from '@/lib/fal-video-input-builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, images, videos } = body || {};

    const modelId: string | undefined = params?.model;
    const isI2V = Boolean(modelId?.includes('/image-to-video') || (Array.isArray(images) && images.length > 0));
    const isV2V = Boolean(modelId === 'fal-ai/topaz/upscale/video' || (Array.isArray(videos) && videos.length > 0));

    console.log('[fal-video] Incoming request', {
      promptPreview: typeof prompt === 'string' ? prompt.slice(0, 120) : null,
      model: modelId,
      inputType: isV2V ? 'video-to-video' : (isI2V ? 'image-to-video' : 'text-to-video'),
      imagesCount: Array.isArray(images) ? images.length : 0,
      videosCount: Array.isArray(videos) ? videos.length : 0,
      videosPreview: Array.isArray(videos) ? videos.slice(0, 2) : null,
      params,
    });

    // TEST_LOG_ONLY: retornar mock e registrar entrada
    if (process.env.TEST_LOG_ONLY === 'true') {
      const filteredParams = buildFalVideoInput(prompt || '', params || {}, images, videos);
      const payload = { route: '/api/fal-video', prompt, originalParams: params, filteredParams, images, videos };
      try {
        console.log('[TEST_LOG_ONLY]\n' + JSON.stringify(payload, null, 2));
      } catch {
        console.log('[TEST_LOG_ONLY]', payload);
      }
      await appendMockLog(payload).catch(() => {});
      return NextResponse.json({
        success: true,
        data: {
          output: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          prompt: prompt || null,
          model: modelId || 'mock/video-model',
        },
      });
    }

    // Para produção, exigir prompt apenas quando for text-to-video
    if (!prompt && !isI2V && !isV2V) {
      return NextResponse.json(
        { error: 'Prompt is required for text-to-video' },
        { status: 400 }
      );
    }

    const result = await generateVideoFalAction(prompt || '', params, images, videos);
    console.log('[fal-video] Generation result', {
      model: modelId,
      output: result?.output,
      urlsCount: Array.isArray(result?.urls) ? result.urls.length : 0,
      requestId: result?.requestId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('FAL Video API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
