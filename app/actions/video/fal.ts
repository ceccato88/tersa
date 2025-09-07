import { fal } from '@fal-ai/client';
import { handleError } from '@/lib/error/handle';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import type { VideoNodeData } from '@/components/nodes/video';

// Configurar a chave da API FAL
fal.config({
  credentials: env.FAL_KEY,
});

// Mapeamento de modelos de vídeo FAL
const FAL_VIDEO_MODEL_MAP: Record<string, string> = {
  'fal-ai/luma-ray-2': 'fal-ai/luma-dream-machine/ray-2',
  'fal-ai/kling-2.1-master': 'fal-ai/kling-video/v2.1/master/text-to-video',
};

// Mapeamento de aspect ratios para vídeo
const VIDEO_ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> = {
  '1:1': { width: 512, height: 512 },
  '4:3': { width: 640, height: 480 },
  '3:4': { width: 480, height: 640 },
  '16:9': { width: 854, height: 480 },
  '9:16': { width: 480, height: 854 },
};

export async function generateVideoFalAction(
  prompt: string,
  data: Partial<VideoNodeData>,
  images?: string[]
) {
  try {
    logger.info('🎬 Iniciando geração de vídeo via FAL', {
      model: data.model,
      prompt: prompt.substring(0, 100),
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      fps: data.fps,
    });

    // Verificar se a chave da API está configurada
    if (!env.FAL_KEY) {
      throw new Error('FAL_KEY não está configurada nas variáveis de ambiente');
    }

    // Mapear o modelo
    const falModel = FAL_VIDEO_MODEL_MAP[data.model || 'fal-ai/luma-ray-2'] || 'fal-ai/luma-dream-machine/ray-2';
    
    // Mapear dimensões do vídeo
    const dimensions = VIDEO_ASPECT_RATIO_MAP[data.aspectRatio || '16:9'] || { width: 854, height: 480 };

  // Preparar input para FAL
  let input: any;
  if (data.model === 'fal-ai/luma-ray-2') {
    // Luma Ray 2 usa parâmetros text-to-video específicos
    input = {
      prompt,
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      resolution: (data as any).resolution || '540p',
      duration: (data as any).duration || '5s',
      loop: (data as any).loop || false,
    };
  } else if (data.model === 'fal-ai/kling-2.1-master') {
    input = {
      prompt,
      duration: (data as any).duration || '5',
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      negative_prompt: (data as any).negative_prompt || 'blur, distort, and low quality',
      cfg_scale: (data as any).cfg_scale !== undefined ? parseFloat((data as any).cfg_scale as any) : 0.5,
    };
  } else {
    input = {
      prompt,
      width: dimensions.width,
      height: dimensions.height,
        num_frames: Math.floor((data.duration || 3) * (data.fps || 24)), // Calcular frames baseado na duração e FPS
        fps: data.fps || 24,
        motion_bucket_id: data.motionStrength || 127, // Força do movimento (0-255)
        cond_aug: 0.02, // Augmentação condicional
        seed: data.seed,
      };
    }

    // Se há imagens de entrada (image-to-video)
  if (images && images.length > 0 && !['fal-ai/luma-ray-2', 'fal-ai/kling-2.1-master'].includes(String(data.model))) {
    input.image_url = images[0];
  }

    // Remover propriedades undefined
    Object.keys(input).forEach(key => {
      if (input[key] === undefined) {
        delete input[key];
      }
    });

    logger.info('📡 Enviando requisição para FAL (vídeo)', {
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
          logger.info('🔄 FAL vídeo em progresso', {
            status: update.status,
            logs: update.logs?.map(log => log.message).join(', '),
          });
        }
      },
    });

    logger.info('✅ Vídeo gerado com sucesso via FAL', {
      requestId: result.requestId,
      videoUrl: result.data.video?.url || 'N/A',
      seed: result.data.seed,
    });

    // Retornar no formato esperado pelo Tersa
    return {
      id: result.requestId,
      status: 'succeeded',
      output: result.data.video?.url || result.data.videos?.[0]?.url || '',
      urls: result.data.videos?.map(video => video.url) || [result.data.video?.url].filter(Boolean),
      seed: result.data.seed,
      prompt: result.data.prompt || prompt,
      model: data.model,
      provider: 'fal',
      metadata: {
        timings: result.data.timings,
        fps: input.fps,
        num_frames: input.num_frames,
        width: input.width,
        height: input.height,
        motion_bucket_id: input.motion_bucket_id,
      },
    };
  } catch (error) {
    logger.error('❌ Erro na geração de vídeo via FAL', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      model: data.model,
      prompt: prompt.substring(0, 100),
    });

    throw error;
  }
}
