import { generateVideoFalAction } from '@/app/actions/video/fal';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, images } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateVideoFalAction(prompt, params, images);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('FAL Video API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}