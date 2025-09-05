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

  'fal-ai/flux-pro-kontext': 'fal-ai/flux-pro/kontext',
  'fal-ai/flux-pro-kontext-text': 'fal-ai/flux-pro/kontext/max/text-to-image',
  'fal-ai/flux-pro-kontext-max': 'fal-ai/flux-pro/kontext/max/text-to-image',
  'fal-ai/flux-pro-v1.1': 'fal-ai/flux-pro/v1.1',
  'fal-ai/flux-pro-v1.1-ultra': 'fal-ai/flux-pro/v1.1-ultra',
  'fal-ai/nano-banana': 'fal-ai/nano-banana',

  'fal-ai/imagen4': 'fal-ai/imagen4/preview',
  'fal-ai/imagen4-ultra': 'fal-ai/imagen4/preview/ultra',
  'fal-ai/ideogram-v3': 'fal-ai/ideogram/v3',
  'fal-ai/seedream-3.0': 'fal-ai/bytedance/seedream/v3/text-to-image',
  'fal-ai/luma-photon': 'fal-ai/luma-photon',
  'fal-ai/recraft-v3': 'fal-ai/recraft/v3/text-to-image',
  'fal-ai/flux-krea': 'fal-ai/flux/krea',
  'fal-ai/qwen-image': 'fal-ai/qwen-image',
  'fal-ai/nano-banana-edit': 'fal-ai/nano-banana/edit',
};

export async function generateImageFalAction(
  prompt: string,
  data: Partial<ImageNodeData> & { nodeId?: string; projectId?: string },
  imageNodes?: string[]
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
    
    // Preparar input para FAL baseado no modelo
    const input: any = {
      prompt,
    }
    
    // Adicionar parâmetros globais apenas se não for Luma Photon, Recraft V3 ou Nano Banana Edit
    if (data.model !== 'fal-ai/luma-photon' && data.model !== 'fal-ai/recraft-v3' && data.model !== 'fal-ai/nano-banana-edit') {
      input.seed = data.seed ? parseInt(data.seed.toString()) : null;
      
      // Guidance scale específico por modelo
      let defaultGuidanceScale = 3.5;
      if (data.model === 'fal-ai/flux-krea') defaultGuidanceScale = 4.5;
      if (data.model === 'fal-ai/qwen-image') defaultGuidanceScale = 2.5;
      input.guidance_scale = data.guidance_scale || data.guidance || defaultGuidanceScale;
      
      // Output format específico por modelo  
      let defaultOutputFormat = 'jpeg';
      if (data.model === 'fal-ai/qwen-image') defaultOutputFormat = 'png';
      input.output_format = data.output_format || data.outputFormat || defaultOutputFormat;
    }

    // Configurações específicas por modelo
    if (data.model === 'fal-ai/flux-pro-kontext-max' || data.model === 'fal-ai/flux-pro-kontext-text' || data.model === 'fal-ai/flux-pro-v1.1-ultra') {
      // FLUX.1 Kontext [max], FLUX.1 Kontext [pro] text e FLUX1.1 [pro] ultra usam aspect_ratio
      input.aspect_ratio = data.aspect_ratio || (data.model === 'fal-ai/flux-pro-v1.1-ultra' ? '16:9' : '1:1');
      
      // FLUX1.1 [pro] ultra tem parâmetro raw
      if (data.model === 'fal-ai/flux-pro-v1.1-ultra') {
        input.raw = data.raw || false;
      }
    } else if (data.model === 'fal-ai/flux-pro-kontext') {
      // FLUX.1 Kontext [pro] é image-to-image - não precisa de parâmetros de tamanho
      // Apenas prompt + image_url + parâmetros opcionais
    } else if (data.model === 'fal-ai/imagen4' || data.model === 'fal-ai/imagen4-ultra') {
      // Imagen 4 e Imagen 4 Ultra usam aspect_ratio e resolution
      input.aspect_ratio = data.aspect_ratio || '1:1';
      input.resolution = data.resolution || '1K';
    } else if (data.model === 'fal-ai/luma-photon') {
      // Luma Photon usa apenas aspect_ratio
      input.aspect_ratio = data.aspect_ratio || '1:1';
    } else if (data.model === 'fal-ai/nano-banana') {
      // Nano Banana não precisa de aspect_ratio nem image_size - usa tamanho fixo
      // Não adiciona nenhum parâmetro de tamanho
    } else if (data.model === 'fal-ai/nano-banana-edit') {
      // Nano Banana Edit usa apenas prompt, image_urls e output_format
      input.output_format = data.output_format || data.outputFormat || 'jpeg';

    } else if (data.model === 'fal-ai/ideogram-v3') {
      // Ideogram 3 usa image_size e parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.style = data.style || 'AUTO';
    } else if (data.model === 'fal-ai/seedream-3.0') {
      // Seedream 3.0 usa image_size e guidance_scale específico
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.guidance_scale = data.guidance_scale || 2.5;
    } else if (data.model === 'fal-ai/recraft-v3') {
      // Recraft V3 usa image_size e style
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.style = data.style || 'realistic_image';
    } else {
      // Outros modelos FLUX usam image_size
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || '1:1'] || 'square_hd';
      input.image_size = imageSize;
      input.num_inference_steps = data.num_inference_steps || data.numInferenceSteps || 28;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = data.num_images || data.numOutputs || 1;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
      input.acceleration = data.acceleration || 'none';
    }

    // Se há imagens de entrada (image-to-image)
    if (imageNodes && imageNodes.length > 0) {
      // Para image-to-image, usar o modelo apropriado
      // Nota: Verificar se o modelo suporta image-to-image
      if (data.model === 'fal-ai/nano-banana-edit') {
        // Nano Banana Edit usa image_urls (plural) - extrair apenas as URLs
        input.image_urls = imageNodes.map((node: any) => 
          typeof node === 'string' ? node : node.url
        );
      } else {
        // Outros modelos usam image_url (singular)
        const imageUrl = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
        input.image_url = imageUrl;
        
        // Força da transformação apenas para modelos que suportam
        if (data.model !== 'fal-ai/flux-pro-kontext') {
          input.strength = data.strength || 0.8;
        }
      }
      
      logger.info('🖼️ Usando imagem de referência', {
        imageUrl: typeof imageNodes[0] === 'string' ? imageNodes[0].substring(0, 100) + '...' : 'URL object',
        imageCount: imageNodes.length,
        model: data.model,
      });
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
      imageCount: result.data.images?.length || (result.data.image ? 1 : 0),
      seed: result.data.seed,
    });

    // Obter a URL da primeira imagem (diferentes estruturas de resposta)
    let primaryImageUrl: string | undefined;
    
    if (result.data.images && result.data.images.length > 0) {
      // Estrutura padrão: result.data.images[0].url (FLUX, etc.)
      primaryImageUrl = result.data.images[0].url;
    } else if (result.data.image?.url) {
      // Estrutura alternativa: result.data.image.url (Wan, Imagen, etc.)
      primaryImageUrl = result.data.image.url;
    }
    
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

    throw error;
  }
}