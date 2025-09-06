import { generateImageFalAction } from '@/app/actions/image/fal';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, imageNodes } = body;
    
    // Debug log para entender o que está sendo enviado
    console.log('🔍 FAL Image API Debug:', {
      model: params?.model,
      hasPrompt: !!prompt,
      promptLength: prompt?.length,
      hasParams: !!params,
      hasImageNodes: !!imageNodes,
      imageNodesLength: imageNodes?.length
    });
    
    // Verificar se é modelo de upscale (não precisa obrigatoriamente de prompt)
    const upscaleModels = [
      'fal-ai/topaz/upscale/image',
      'fal-ai/recraft/upscale/creative', 
      'fal-ai/recraft/upscale/crisp',
      'fal-ai/ideogram/upscale'
    ];
    
    const isUpscaleModel = upscaleModels.includes(params?.model);
    
    if (!prompt && !isUpscaleModel) {
      console.log('❌ Prompt obrigatório para modelo não-upscale:', params?.model);
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