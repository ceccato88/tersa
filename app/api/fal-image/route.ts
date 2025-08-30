import { generateImageFalAction } from '@/app/actions/image/fal';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, imageNodes } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateImageFalAction(prompt, params, imageNodes);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('FAL Image API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}