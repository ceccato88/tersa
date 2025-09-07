import { generateImageFalAction } from '@/app/actions/image/fal';
import { NextRequest, NextResponse } from 'next/server';

// Configurar timeout da rota para 5 minutos (modelos de upscale podem demorar mais)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, imageNodes } = body;
    
    console.log('[fal-image] Incoming request', {
      promptPreview: typeof prompt === 'string' ? prompt.slice(0, 120) : null,
      model: params?.model,
      imageNodesCount: Array.isArray(imageNodes) ? imageNodes.length : 0,
      imageUrls: imageNodes ? imageNodes.slice(0, 2).map(n => n.url) : null, // Mostrar até 2 URLs para debug
      params,
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