import type { VideoNodeData } from '@/components/nodes/video';

// Mapeamento de modelos de vídeo FAL (normalização -> endpoint)
const FAL_VIDEO_MODEL_MAP: Record<string, string> = {
  // T2V
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

export function buildFalVideoInput(
  prompt: string,
  data: Partial<VideoNodeData> & { model?: string },
  images?: string[],
  videos?: string[]
) {
  const modelId = data.model || '';
  const normalizedModel = FAL_VIDEO_MODEL_MAP[modelId] || modelId;

  let input: any = {};

  // Text-to-Video models
  if (modelId === 'fal-ai/luma-ray-2') {
    input = {
      prompt,
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      resolution: (data as any).resolution || '540p',
      duration: (data as any).duration || '5s',
      loop: (data as any).loop ?? false,
    };
  } else if (modelId === 'fal-ai/kling-2.1-master') {
    input = {
      prompt,
      duration: (data as any).duration || '5',
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      negative_prompt: (data as any).negative_prompt || 'blur, distort, and low quality',
      cfg_scale: (data as any).cfg_scale !== undefined ? parseFloat(String((data as any).cfg_scale)) : 0.5,
    };
  } else if (modelId === 'fal-ai/minimax/hailuo-02/pro/text-to-video') {
    input = {
      prompt,
      prompt_optimizer: (data as any).prompt_optimizer ?? true,
    };
  } else if (modelId === 'moonvalley/marey/t2v') {
    input = {
      prompt,
      dimensions: (data as any).dimensions || '1920x1080',
      duration: (data as any).duration || '5s',
      negative_prompt: (data as any).negative_prompt || '',
      seed: (data as any).seed ?? 9,
    };
  } else if (modelId === 'fal-ai/pika/v2.2/text-to-video') {
    input = {
      prompt,
      seed: (data as any).seed ?? null,
      negative_prompt: (data as any).negative_prompt || '',
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      resolution: (data as any).resolution || '720p',
      duration: (data as any).duration ? parseInt(String((data as any).duration), 10) : 5,
    };
  } else if (modelId === 'fal-ai/veo3') {
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
  } else if (modelId === 'fal-ai/wan/v2.2-a14b/text-to-video') {
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
  // Image-to-Video models
  } else if (modelId === 'fal-ai/minimax/hailuo-02/pro/image-to-video') {
    input = {
      prompt,
      image_url: images?.[0],
      prompt_optimizer: (data as any).prompt_optimizer ?? true,
    };
  } else if (modelId === 'moonvalley/marey/i2v') {
    input = {
      prompt,
      image_url: images?.[0],
      dimensions: (data as any).dimensions || '1920x1080',
      duration: (data as any).duration || '5s',
      negative_prompt: (data as any).negative_prompt || '',
      seed: (data as any).seed ?? null,
    };
  } else if (modelId === 'fal-ai/pika/v2.2/image-to-video') {
    input = {
      prompt,
      image_url: images?.[0],
      seed: (data as any).seed ?? null,
      negative_prompt: (data as any).negative_prompt || '',
      resolution: (data as any).resolution || '720p',
      duration: (data as any).duration ? parseInt(String((data as any).duration), 10) : 5,
    };
  } else if (modelId === 'fal-ai/veo3/image-to-video') {
    input = {
      prompt,
      image_url: images?.[0],
      duration: (data as any).duration || '8s',
      generate_audio: (data as any).generate_audio ?? true,
      resolution: (data as any).resolution || '720p',
    };
  } else if (modelId === 'fal-ai/wan/v2.2-a14b/image-to-video') {
    input = {
      prompt,
      image_url: images?.[0],
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
  } else if (modelId === 'fal-ai/luma-dream-machine/ray-2/image-to-video') {
    input = {
      prompt,
      image_url: images?.[0],
      aspect_ratio: (data as any).aspect_ratio || '16:9',
      loop: (data as any).loop ?? false,
      resolution: (data as any).resolution || '540p',
      duration: (data as any).duration || '5s',
    };
  } else if (modelId === 'fal-ai/kling-video/v2.1/master/image-to-video') {
    input = {
      prompt,
      image_url: images?.[0],
      duration: (data as any).duration || '5',
      negative_prompt: (data as any).negative_prompt || 'blur, distort, and low quality',
      cfg_scale: (data as any).cfg_scale !== undefined ? parseFloat(String((data as any).cfg_scale)) : 0.5,
    };
  // Video-to-Video
  } else if (modelId === 'fal-ai/topaz/upscale/video') {
    input = {
      video_url: videos?.[0],
      upscale_factor: (data as any).upscale_factor ?? 2,
      // Sempre incluir target_fps (default null)
      target_fps: (data as any).target_fps ?? null,
    };
    if ((data as any).H264_output !== undefined) {
      input.H264_output = (data as any).H264_output;
    }
  } else {
    // Fallback genérico (ex. modelos futuros t2v)
    input = {
      prompt,
    };
  }

  // Remover campos undefined
  Object.keys(input).forEach((k) => input[k] === undefined && delete input[k]);

  return {
    model: normalizedModel,
    ...input,
  };
}
