import { fal } from '@fal-ai/client';
import { handleError } from '@/lib/error/handle';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import type { VideoNodeData } from '@/components/nodes/video';
import { getSubscribedUser } from '@/lib/auth';
import { getUserFalToken } from '@/app/actions/profile/update-fal-token';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// Configurar a chave da API FAL obrigando token do usuário
const configureFalToken = async (userId?: string) => {
  if (!userId) {
    throw new Error('Você precisa estar autenticado para usar os modelos FAL.');
  }
  const userToken = await getUserFalToken(userId);
  if (!userToken) {
    throw new Error('Token FAL não configurado. Acesse seu perfil e salve seu token FAL para continuar.');
  }
  fal.config({ credentials: userToken });
  logger.info('🔑 Usando token FAL do usuário para vídeo');
  return userToken;
};

// Mapeamento de modelos de vídeo FAL
const FAL_VIDEO_MODEL_MAP: Record<string, string> = {
  'fal-ai/luma-ray-2': 'fal-ai/luma-dream-machine/ray-2',
  'fal-ai/kling-2.1-master': 'fal-ai/kling-video/v2.1/master/text-to-video',
  'fal-ai/minimax/hailuo-02/pro/text-to-video': 'fal-ai/minimax/hailuo-02/pro/text-to-video',
  'moonvalley/marey/t2v': 'moonvalley/marey/t2v',
  'fal-ai/pika/v2.2/text-to-video': 'fal-ai/pika/v2.2/text-to-video',
  'fal-ai/veo3': 'fal-ai/veo3',
  'fal-ai/wan/v2.2-a14b/text-to-video': 'fal-ai/wan/v2.2-a14b/text-to-video',
  // I2V
  'fal-ai/minimax/hailuo-02/pro/image-to-video': 'fal-ai/minimax/hailuo-02/pro/image-to-video',
  'moonvalley/marey/i2v': 'moonvalley/marey/i2v',
  'fal-ai/pika/v2.2/image-to-video': 'fal-ai/pika/v2.2/image-to-video',
  'fal-ai/veo3/image-to-video': 'fal-ai/veo3/image-to-video',
  'fal-ai/wan/v2.2-a14b/image-to-video': 'fal-ai/wan/v2.2-a14b/image-to-video',
  'fal-ai/luma-dream-machine/ray-2/image-to-video': 'fal-ai/luma-dream-machine/ray-2/image-to-video',
  'fal-ai/kling-video/v2.1/master/image-to-video': 'fal-ai/kling-video/v2.1/master/image-to-video',
  // V2V
  'fal-ai/topaz/upscale/video': 'fal-ai/topaz/upscale/video',
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
  images?: string[],
  videos?: string[]
) {
  try {
    // Obter usuário atual para configurar token personalizado
    const user = await getSubscribedUser();
    await configureFalToken(user?.id);

    logger.info('🎬 Iniciando geração de vídeo via FAL', {
      model: data.model,
      prompt: prompt.substring(0, 100),
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      fps: data.fps,
      userId: user?.id || 'sistema',
    });

    // Sem fallback para FAL_KEY: exigimos token do usuário (feito acima)

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
  } else if (data.model === 'fal-ai/minimax/hailuo-02/pro/text-to-video') {
    input = {
      prompt,
      prompt_optimizer: (data as any).prompt_optimizer ?? true,
    };
  } else if (data.model === 'moonvalley/marey/t2v') {
    input = {
      prompt,
      dimensions: (data as any).dimensions || '1920x1080',
      duration: (data as any).duration || '5s',
      negative_prompt: (data as any).negative_prompt || '',
      seed: (data as any).seed ?? null,
    };
  } else if (data.model === 'fal-ai/pika/v2.2/text-to-video') {
    input = {
      prompt,
      seed: (data as any).seed ?? null,
      negative_prompt: (data as any).negative_prompt || '',
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      resolution: (data as any).resolution || '720p',
      duration: (data as any).duration ? parseInt(String((data as any).duration), 10) : 5,
    };
  } else if (data.model === 'fal-ai/veo3') {
    input = {
      prompt,
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      duration: (data as any).duration || '8s',
      negative_prompt: (data as any).negative_prompt || undefined,
      enhance_prompt: (data as any).enhance_prompt ?? true,
      auto_fix: (data as any).auto_fix ?? true,
      resolution: (data as any).resolution || '720p',
      generate_audio: (data as any).generate_audio ?? true,
    };
  } else if (data.model === 'fal-ai/wan/v2.2-a14b/text-to-video') {
    input = {
      prompt,
      negative_prompt: (data as any).negative_prompt || '',
      num_frames: (data as any).num_frames ?? 81,
      frames_per_second: (data as any).frames_per_second ?? 16,
      seed: (data as any).seed ?? null,
      resolution: (data as any).resolution || '720p',
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      num_inference_steps: (data as any).num_inference_steps ?? 27,
      enable_safety_checker: (data as any).enable_safety_checker ?? false,
      enable_prompt_expansion: (data as any).enable_prompt_expansion ?? false,
      acceleration: (data as any).acceleration || 'regular',
      guidance_scale: (data as any).guidance_scale ?? 3.5,
      guidance_scale_2: (data as any).guidance_scale_2 ?? 4,
      shift: (data as any).shift ?? 5,
      interpolator_model: (data as any).interpolator_model || 'film',
      num_interpolated_frames: (data as any).num_interpolated_frames ?? 1,
      adjust_fps_for_interpolation: (data as any).adjust_fps_for_interpolation ?? true,
      video_quality: (data as any).video_quality || 'high',
      video_write_mode: (data as any).video_write_mode || 'balanced',
    };
  } else if (data.model === 'fal-ai/minimax/hailuo-02/pro/image-to-video') {
    if (!images?.length) throw new Error('image_url is required for Hailuo');
    input = {
      prompt,
      image_url: images[0],
      prompt_optimizer: (data as any).prompt_optimizer ?? true,
    };
  } else if (data.model === 'moonvalley/marey/i2v') {
    if (!images?.length) throw new Error('image_url is required for Marey');
    input = {
      prompt,
      image_url: images[0],
      dimensions: (data as any).dimensions || '1920x1080',
      duration: (data as any).duration || '5s',
      negative_prompt: (data as any).negative_prompt || '',
      seed: (data as any).seed ?? null,
    };
  } else if (data.model === 'fal-ai/pika/v2.2/image-to-video') {
    if (!images?.length) throw new Error('image_url is required for Pika');
    input = {
      prompt,
      image_url: images[0],
      seed: (data as any).seed ?? null,
      negative_prompt: (data as any).negative_prompt || '',
      resolution: (data as any).resolution || '720p',
      duration: (data as any).duration ? parseInt(String((data as any).duration), 10) : 5,
    };
  } else if (data.model === 'fal-ai/veo3/image-to-video') {
    if (!images?.length) throw new Error('image_url is required for Veo3');
    input = {
      prompt,
      image_url: images[0],
      duration: (data as any).duration || '8s',
      generate_audio: (data as any).generate_audio ?? true,
      resolution: (data as any).resolution || '720p',
    };
  } else if (data.model === 'fal-ai/wan/v2.2-a14b/image-to-video') {
    if (!images?.length) throw new Error('image_url is required for WAN');
    input = {
      prompt,
      image_url: images[0],
      num_frames: (data as any).num_frames ?? 81,
      frames_per_second: (data as any).frames_per_second ?? 16,
      seed: (data as any).seed ?? null,
      resolution: (data as any).resolution || '720p',
      aspect_ratio: (data as any).aspect_ratio || 'auto',
      num_inference_steps: (data as any).num_inference_steps ?? 27,
      enable_safety_checker: (data as any).enable_safety_checker ?? false,
      enable_prompt_expansion: (data as any).enable_prompt_expansion ?? false,
      acceleration: (data as any).acceleration || 'regular',
      guidance_scale: (data as any).guidance_scale ?? 3.5,
      guidance_scale_2: (data as any).guidance_scale_2 ?? 3.5,
      shift: (data as any).shift ?? 5,
      interpolator_model: (data as any).interpolator_model || 'film',
      num_interpolated_frames: (data as any).num_interpolated_frames ?? 1,
      adjust_fps_for_interpolation: (data as any).adjust_fps_for_interpolation ?? true,
      video_quality: (data as any).video_quality || 'high',
      video_write_mode: (data as any).video_write_mode || 'balanced',
    };
  } else if (data.model === 'fal-ai/luma-dream-machine/ray-2/image-to-video') {
    if (!images?.length) throw new Error('image_url is required for Luma Ray 2');
    input = {
      prompt,
      image_url: images[0],
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      loop: (data as any).loop ?? false,
      resolution: (data as any).resolution || '540p',
      duration: (data as any).duration || '5s',
    };
  } else if (data.model === 'fal-ai/kling-video/v2.1/master/image-to-video') {
    if (!images?.length) throw new Error('image_url is required for Kling');
    input = {
      prompt,
      image_url: images[0],
      duration: (data as any).duration || '5',
      negative_prompt: (data as any).negative_prompt || 'blur, distort, and low quality',
      cfg_scale: (data as any).cfg_scale !== undefined ? parseFloat(String((data as any).cfg_scale)) : 0.5,
    };
  } else if (data.model === 'fal-ai/topaz/upscale/video') {
    if (!videos?.length) throw new Error('video_url is required for Topaz Video Upscale');
    input = {
      video_url: videos[0],
      upscale_factor: (data as any).upscale_factor ?? 2,
      // Sempre incluir target_fps (default null)
      target_fps: (data as any).target_fps ?? null,
    };
    
    // Adicionar H264_output se especificado
    if ((data as any).H264_output !== undefined) {
      input.H264_output = (data as any).H264_output;
    }
    
    // Topaz não usa prompt - não adicionar prompt ao input
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
        prompt: input.prompt ? input.prompt.substring(0, 100) : 'N/A',
      },
    });

    // Fazer a requisição para FAL
    const result = await fal.subscribe(falModel, {
      input,
      logs: true,
      timeout: 300000, // 5 minutos de timeout
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

    // Determinar URL de vídeo principal
    let primaryVideoUrl: string | undefined = result.data.video?.url || result.data.videos?.[0]?.url;
    if (!primaryVideoUrl) {
      throw new Error('Nenhuma URL de vídeo encontrada na resposta da FAL');
    }

    // Download do vídeo com retry básico
    let videoArrayBuffer: ArrayBuffer | undefined;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300000); // 5 min
        const resp = await fetch(primaryVideoUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'video/*',
            'Cache-Control': 'no-cache',
          },
        });
        clearTimeout(timeout);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ao baixar vídeo`);
        videoArrayBuffer = await resp.arrayBuffer();
        break;
      } catch (e) {
        if (attempt === maxAttempts) throw e;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!videoArrayBuffer) throw new Error('Falha ao baixar vídeo');

    // Upload para Supabase Storage (bucket privado via proxy)
    const supabase = await createClient();
    const ext = (String(result.data.video?.url || '').endsWith('.webm') || (data as any).format === 'webm') ? 'webm' : 'mp4';
    const mimeType = ext === 'webm' ? 'video/webm' : 'video/mp4';
    const fileName = `${user!.id}/${nanoid()}.${ext}`;
    const upload = await supabase.storage.from('files').upload(fileName, videoArrayBuffer, { contentType: mimeType });
    if (upload.error) throw new Error(`Erro no upload de vídeo: ${upload.error.message}`);

    const proxyUrl = `/api/storage/files/${upload.data.path}`;

    // Retornar no formato esperado
    return {
      id: result.requestId,
      status: 'succeeded',
      output: proxyUrl,
      urls: [proxyUrl],
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
        original_fal_url: primaryVideoUrl,
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
