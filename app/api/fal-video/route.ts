import { generateVideoFalAction } from '@/app/actions/video/fal';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, images } = body;
    console.log('[fal-video] Incoming request', {
      promptPreview: typeof prompt === 'string' ? prompt.slice(0, 120) : null,
      model: params?.model,
      imagesCount: Array.isArray(images) ? images.length : 0,
      params,
    });
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateVideoFalAction(prompt, params, images);
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
