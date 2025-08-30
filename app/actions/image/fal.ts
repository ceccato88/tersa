import { fal } from '@fal-ai/client';
import { handleError } from '@/lib/error/handle';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import type { ImageNodeData } from '@/components/nodes/image';
import { getSubscribedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// Configurar a chave da API FAL
fal.config({
  credentials: env.FAL_KEY,
});

// Mapeamento de aspect ratios do Tersa para FAL
const ASPECT_RATIO_MAP: Record<string, string> = {
  'square_hd': 'square_hd',
  'square': 'square',
  'portrait_4_3': 'portrait_4_3',
  'portrait_16_9': 'portrait_16_9',
  'landscape_4_3': 'landscape_4_3',
  'landscape_16_9': 'landscape_16_9',
  // Fallbacks para compatibilidade
  '1:1': 'square_hd',
  '4:3': 'landscape_4_3',
  '3:4': 'portrait_4_3',
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
};

// Mapeamento de modelos FAL
const FAL_MODEL_MAP: Record<string, string> = {
  'fal-ai/flux-dev': 'fal-ai/flux/dev',
  'fal-ai/flux-schnell': 'fal-ai/flux/schnell',
};

export async function generateImageFalAction(
  prompt: string,
  data: Partial<ImageNodeData> & { nodeId?: string; projectId?: string },
  images?: string[]
) {
  try {
    logger.info('🎨 Iniciando geração de imagem via FAL', {
      model: data.model,
      prompt: prompt.substring(0, 100),
      aspectRatio: data.aspectRatio,
      seed: data.seed,
    });

    // Verificar se a chave da API está configurada
    if (!env.FAL_KEY) {
      throw new Error('FAL_KEY não está configurada nas variáveis de ambiente');
    }

    // Mapear o modelo
    const falModel = FAL_MODEL_MAP[data.model || 'fal-ai/flux-dev'] || 'fal-ai/flux/dev';
    
    // Mapear aspect ratio
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || '1:1'] || 'square_hd';

    // Preparar input para FAL com todos os parâmetros do schema FLUX.1 [dev]
    const input: any = {
      prompt,
      image_size: imageSize,
      num_inference_steps: data.num_inference_steps || data.numInferenceSteps || 28,
      seed: data.seed ? parseInt(data.seed.toString()) : null,
      guidance_scale: data.guidance_scale || data.guidance || 3.5,
      sync_mode: data.sync_mode !== undefined ? data.sync_mode : false,
      num_images: data.num_images || data.numOutputs || 1,
      enable_safety_checker: data.enable_safety_checker !== undefined ? data.enable_safety_checker : true,
      output_format: data.output_format || data.outputFormat || 'jpeg',
      acceleration: data.acceleration || 'none',
    }

    // Se há imagens de entrada (image-to-image)
    if (images && images.length > 0) {
      // Para image-to-image, usar o modelo apropriado
      // Nota: Verificar se o modelo suporta image-to-image
      input.image_url = images[0];
      input.strength = data.strength || 0.8; // Força da transformação
    }

    logger.info('📡 Enviando requisição para FAL', {
      model: falModel,
      input: {
        ...input,
        prompt: input.prompt.substring(0, 100),
      },
    });

    // Fazer a requisição para FAL
    const result = await fal.subscribe(falModel, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          logger.info('🔄 FAL em progresso', {
            status: update.status,
            logs: update.logs?.map(log => log.message).join(', '),
          });
        }
      },
    });

    logger.info('✅ Imagem gerada com sucesso via FAL', {
      requestId: result.requestId,
      imageCount: result.data.images?.length || 0,
      seed: result.data.seed,
    });

    // Obter a URL da primeira imagem
    const primaryImageUrl = result.data.images?.[0]?.url;
    if (!primaryImageUrl) {
      throw new Error('Nenhuma URL de imagem encontrada na resposta da FAL');
    }

    logger.info('🔗 Fazendo download da imagem da FAL:', primaryImageUrl);
    
    // Download da imagem da FAL
    const imageResponse = await fetch(primaryImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erro ao fazer download da imagem: ${imageResponse.statusText}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();

    // Upload para Supabase Storage
    const client = await createClient();
    const user = await getSubscribedUser();
    const outputFormat = input.output_format || 'jpeg';
    const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
    const fileName = `${user.id}/${nanoid()}.${outputFormat}`;
    
    const uploadResult = await client.storage
      .from('files')
      .upload(fileName, imageArrayBuffer, {
        contentType: mimeType,
      });

    if (uploadResult.error) {
      throw new Error(`Erro no upload para Supabase: ${uploadResult.error.message}`);
    }

    // Obter URL pública do Supabase
    const { data: supabaseUrl } = client.storage
      .from('files')
      .getPublicUrl(uploadResult.data.path);

    logger.info('✅ Imagem salva no Supabase Storage:', supabaseUrl.publicUrl);

    // Retornar no formato esperado pelo Tersa
    return {
      id: result.requestId,
      status: 'succeeded',
      output: supabaseUrl.publicUrl, // Usar URL do Supabase Storage
      urls: [supabaseUrl.publicUrl],
      seed: result.data.seed,
      prompt: result.data.prompt || prompt,
      model: data.model,
      provider: 'fal',
      metadata: {
        timings: result.data.timings,
        has_nsfw_concepts: result.data.has_nsfw_concepts,
        guidance_scale: input.guidance_scale,
        num_inference_steps: input.num_inference_steps,
        image_size: input.image_size,
        supabase_url: supabaseUrl.publicUrl,
        original_fal_url: primaryImageUrl,
      },
    };
  } catch (error) {
    logger.error('❌ Erro na geração de imagem via FAL', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      model: data.model,
      prompt: prompt.substring(0, 100),
    });

    handleError('❌ Erro na geração de imagem via FAL', error);

    throw error;
  }
}