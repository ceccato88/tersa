import { generateVideoFalAction } from '@/app/actions/video/fal';
import { NextRequest, NextResponse } from 'next/server';
import { appendMockLog } from '@/lib/mock-log';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, images, videos } = body;
    console.log('[fal-video] Incoming request', {
      promptPreview: typeof prompt === 'string' ? prompt.slice(0, 120) : null,
      model: params?.model,
      imagesCount: Array.isArray(images) ? images.length : 0,
      videosCount: Array.isArray(videos) ? videos.length : 0,
      videos: videos ? videos.slice(0, 2) : null, // Mostrar até 2 URLs para debug
      params,
    });
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateVideoFalAction(prompt, params, images, videos);
    console.log('[fal-video] Generation result', {
      model: params?.model,
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
    // Test mode: log inputs and return mock video URL without calling external API
    if (process.env.TEST_LOG_ONLY === 'true') {
      const payload = { route: '/api/fal-video', prompt, params, images, videos };
      console.log('[TEST_LOG_ONLY]', payload);
      appendMockLog(payload).catch(() => {});
      return NextResponse.json({
        success: true,
        data: {
          output: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          prompt,
          model: params?.model || 'mock/video-model',
        },
      });
    }
