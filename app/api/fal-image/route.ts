import { generateImageFalAction } from '@/app/actions/image/fal';
import { NextRequest, NextResponse } from 'next/server';
import { appendMockLog } from '@/lib/mock-log';

// Configurar timeout da rota para 5 minutos (modelos de upscale podem demorar mais)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, params, imageNodes } = body;
    
    // Log resumido apenas quando não estiver em modo de teste,
    // para evitar logs duplicados com o bloco [TEST_LOG_ONLY]
    if (process.env.TEST_LOG_ONLY !== 'true') {
      console.log('[fal-image] Incoming request', {
        promptPreview: typeof prompt === 'string' ? prompt.slice(0, 120) : null,
        model: params?.model,
        imageNodesCount: Array.isArray(imageNodes) ? imageNodes.length : 0,
        imageUrls: imageNodes ? imageNodes.slice(0, 2).map(n => n.url) : null, // Mostrar até 2 URLs para debug
        params,
      });
    }
    
    // Verificar se é modelo que não precisa obrigatoriamente de prompt
    const modelsWithoutMandatoryPrompt = [
      'fal-ai/topaz/upscale/image',
      'fal-ai/recraft/upscale/creative', 
      'fal-ai/recraft/upscale/crisp',
      'fal-ai/ideogram/v3/reframe'
    ];
    
    const isUpscaleModel = modelsWithoutMandatoryPrompt.includes(params?.model);
    
    if (!prompt && !isUpscaleModel) {
      console.log('❌ Prompt obrigatório para modelo:', params?.model);
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Test mode: log inputs and return mock image URL without calling external API
    if (process.env.TEST_LOG_ONLY === 'true') {
      const payload = { route: '/api/fal-image', prompt, params, imageNodes };
      console.log('[TEST_LOG_ONLY]', payload);
      appendMockLog(payload).catch(() => {});
      return NextResponse.json({
        success: true,
        data: {
          output: 'https://via.placeholder.com/1024x1024.png?text=MOCK',
          prompt,
          model: params?.model || 'mock/image-model',
          seed: 0,
        },
      });
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
    
