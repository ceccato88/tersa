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
  'fal-ai/flux-pro-kontext-text': 'fal-ai/flux-pro/kontext/text-to-image',
  'fal-ai/flux-pro-kontext-max': 'fal-ai/flux-pro/kontext/max/text-to-image',
  'fal-ai/flux-pro/kontext/max': 'fal-ai/flux-pro/kontext/max',
  'fal-ai/flux-pro-v1.1': 'fal-ai/flux-pro/v1.1',
  'fal-ai/flux-pro-v1.1-ultra': 'fal-ai/flux-pro/v1.1-ultra',
  'fal-ai/nano-banana': 'fal-ai/nano-banana',

  'fal-ai/imagen4': 'fal-ai/imagen4/preview',
  'fal-ai/imagen4-ultra': 'fal-ai/imagen4/preview/ultra',
  'fal-ai/ideogram-v3': 'fal-ai/ideogram/v3',
  'fal-ai/recraft-v3': 'fal-ai/recraft/v3/text-to-image',
  'fal-ai/flux-krea': 'fal-ai/flux/krea',
  'fal-ai/nano-banana-edit': 'fal-ai/nano-banana/edit',
  'fal-ai/ideogram/character': 'fal-ai/ideogram/character',
  'fal-ai/recraft/v3/image-to-image': 'fal-ai/recraft/v3/image-to-image',
  'fal-ai/topaz/upscale/image': 'fal-ai/topaz/upscale/image',
  'fal-ai/recraft/upscale/creative': 'fal-ai/recraft/upscale/creative',
  'fal-ai/recraft/upscale/crisp': 'fal-ai/recraft/upscale/crisp',
  'fal-ai/ideogram/upscale': 'fal-ai/ideogram/upscale',
};

export async function generateImageFalAction(
  prompt: string,
  data: Partial<ImageNodeData> & { nodeId?: string; projectId?: string },
  imageNodes?: string[]
) {
  try {
    // DEBUG: Log completo dos dados recebidos
    console.log('🎨 FAL Action Debug - Dados recebidos:', {
      model: data.model,
      prompt: prompt.substring(0, 100),
      allData: data,
      dataKeys: Object.keys(data),
      hasAdvancedParams: !!(data.seed || data.guidance_scale || data.strength || data.style || data.num_inference_steps)
    });

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
    
    // Função helper para converter valores para números
    const parseNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    // Adicionar parâmetros globais apenas se não for Recraft V3, Nano Banana, Nano Banana Edit, Imagen 4, Imagen 4 Ultra, Ideogram V3, Ideogram Character, FLUX1.1 [pro], FLUX1.1 [pro] ultra, FLUX.1 Kontext [max], FLUX.1 Kontext [pro] text, FLUX.1 Krea ou modelos image-to-image específicos
    if (data.model !== 'fal-ai/recraft-v3' && data.model !== 'fal-ai/nano-banana' && data.model !== 'fal-ai/nano-banana-edit' && data.model !== 'fal-ai/imagen4' && data.model !== 'fal-ai/imagen4-ultra' && data.model !== 'fal-ai/ideogram-v3' && data.model !== 'fal-ai/ideogram/character' && data.model !== 'fal-ai/flux-pro-v1.1' && data.model !== 'fal-ai/flux-pro-v1.1-ultra' && data.model !== 'fal-ai/flux-pro-kontext-max' && data.model !== 'fal-ai/flux-pro-kontext-text' && data.model !== 'fal-ai/flux-krea' && data.model !== 'fal-ai/flux-pro-kontext' && data.model !== 'fal-ai/flux-pro/kontext/max' && data.model !== 'fal-ai/recraft/v3/image-to-image' && data.model !== 'fal-ai/topaz/upscale/image' && data.model !== 'fal-ai/recraft/upscale/creative' && data.model !== 'fal-ai/recraft/upscale/crisp' && data.model !== 'fal-ai/ideogram/upscale') {
      input.seed = parseNumber(data.seed);
      
      // Guidance scale específico por modelo
      let defaultGuidanceScale = 3.5;
      input.guidance_scale = parseNumber(data.guidance_scale) || parseNumber(data.guidance) || defaultGuidanceScale;
      
      // Output format específico por modelo  
      let defaultOutputFormat = 'jpeg';
      input.output_format = data.output_format || data.outputFormat || defaultOutputFormat;
    }

    // Configurações específicas por modelo
    if (data.model === 'fal-ai/flux-pro-kontext-max') {
      // FLUX.1 Kontext [max] text-to-image usa todos os parâmetros específicos
      input.aspect_ratio = data.aspect_ratio || '1:1';
      input.seed = parseNumber(data.seed);
      input.guidance_scale = parseNumber(data.guidance_scale) || 3.5;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = parseNumber(data.num_images) || 1;
      input.output_format = data.output_format || 'jpeg';
      input.safety_tolerance = data.safety_tolerance || '2';
      input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
      
      // DEBUG: Log específico para FLUX.1 Kontext [max]
      console.log('🚀 FLUX.1 Kontext [max] Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          aspect_ratio: input.aspect_ratio,
          seed: input.seed,
          guidance_scale: input.guidance_scale,
          sync_mode: input.sync_mode,
          num_images: input.num_images,
          output_format: input.output_format,
          safety_tolerance: input.safety_tolerance,
          enhance_prompt: input.enhance_prompt
        }
      });
    } else if (data.model === 'fal-ai/flux-pro-kontext-text') {
      // FLUX.1 Kontext [pro] text-to-image usa todos os parâmetros específicos
      input.aspect_ratio = data.aspect_ratio || '1:1';
      input.seed = parseNumber(data.seed);
      input.guidance_scale = parseNumber(data.guidance_scale) || 3.5;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = parseNumber(data.num_images) || 1;
      input.output_format = data.output_format || 'jpeg';
      input.safety_tolerance = data.safety_tolerance || '2';
      input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
      
      // DEBUG: Log específico para FLUX.1 Kontext [pro]
      console.log('🚀 FLUX.1 Kontext [pro] Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          aspect_ratio: input.aspect_ratio,
          seed: input.seed,
          guidance_scale: input.guidance_scale,
          sync_mode: input.sync_mode,
          num_images: input.num_images,
          output_format: input.output_format,
          safety_tolerance: input.safety_tolerance,
          enhance_prompt: input.enhance_prompt
        }
      });
    } else if (data.model === 'fal-ai/flux-pro-v1.1-ultra') {
      // FLUX1.1 [pro] ultra usa todos os parâmetros específicos
      input.aspect_ratio = data.aspect_ratio || '16:9';
      input.seed = parseNumber(data.seed);
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = parseNumber(data.num_images) || 1;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
      input.output_format = data.output_format || 'jpeg';
      input.safety_tolerance = data.safety_tolerance || '2';
      input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
      input.raw = data.raw !== undefined ? data.raw : false;
      
      // DEBUG: Log específico para FLUX1.1 [pro] ultra
      console.log('🚀 FLUX1.1 [pro] ultra Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          aspect_ratio: input.aspect_ratio,
          seed: input.seed,
          sync_mode: input.sync_mode,
          num_images: input.num_images,
          enable_safety_checker: input.enable_safety_checker,
          output_format: input.output_format,
          safety_tolerance: input.safety_tolerance,
          enhance_prompt: input.enhance_prompt,
          raw: input.raw
        }
      });
    } else if (data.model === 'fal-ai/flux-pro-kontext') {
      // FLUX.1 Kontext [pro] image-to-image - apenas prompt + image_url + parâmetros opcionais
      input.seed = parseNumber(data.seed);
      input.guidance_scale = parseNumber(data.guidance_scale) || 3.5;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.output_format = data.output_format || 'jpeg';
      input.safety_tolerance = data.safety_tolerance || '2';
      input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
      
      // DEBUG: Log específico para FLUX.1 Kontext [pro]
      console.log('🚀 FLUX.1 Kontext [pro] Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          seed: input.seed,
          guidance_scale: input.guidance_scale,
          sync_mode: input.sync_mode,
          output_format: input.output_format,
          safety_tolerance: input.safety_tolerance,
          enhance_prompt: input.enhance_prompt
        }
      });
    } else if (data.model === 'fal-ai/flux-pro/kontext/max') {
      // FLUX.1 Kontext [max] image-to-image - usa todos os parâmetros específicos
      input.seed = parseNumber(data.seed);
      input.guidance_scale = parseNumber(data.guidance_scale) || 3.5;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.output_format = data.output_format || 'jpeg';
      input.safety_tolerance = data.safety_tolerance || '2';
      input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
      
      // DEBUG: Log específico para FLUX.1 Kontext [max] image-to-image
      console.log('🚀 FLUX.1 Kontext [max] I2I Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          seed: input.seed,
          guidance_scale: input.guidance_scale,
          sync_mode: input.sync_mode,
          output_format: input.output_format,
          safety_tolerance: input.safety_tolerance,
          enhance_prompt: input.enhance_prompt
        }
      });
    } else if (data.model === 'fal-ai/imagen4') {
      // Imagen 4 usa todos os parâmetros específicos
      input.aspect_ratio = data.aspect_ratio || '1:1';
      input.num_images = parseNumber(data.num_images) || 1;
      input.seed = parseNumber(data.seed);
      input.resolution = data.resolution || '1K';
      input.negative_prompt = data.negative_prompt || '';
      
      // DEBUG: Log específico para Imagen 4
      console.log('🚀 Imagen 4 Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          aspect_ratio: input.aspect_ratio,
          num_images: input.num_images,
          seed: input.seed,
          resolution: input.resolution,
          negative_prompt: input.negative_prompt?.substring(0, 30)
        }
      });
    } else if (data.model === 'fal-ai/imagen4-ultra') {
      // Imagen 4 Ultra usa todos os parâmetros específicos (sempre 1 imagem)
      input.aspect_ratio = data.aspect_ratio || '1:1';
      input.num_images = 1; // Sempre 1 para Ultra
      input.seed = parseNumber(data.seed);
      input.resolution = data.resolution || '1K';
      input.negative_prompt = data.negative_prompt || '';
      
      // DEBUG: Log específico para Imagen 4 Ultra
      console.log('🚀 Imagen 4 Ultra Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          aspect_ratio: input.aspect_ratio,
          num_images: input.num_images,
          seed: input.seed,
          resolution: input.resolution,
          negative_prompt: input.negative_prompt?.substring(0, 30)
        }
      });
    } else if (data.model === 'fal-ai/nano-banana') {
      // Nano Banana usa parâmetros específicos (sem tamanho - usa tamanho fixo)
      input.num_images = parseNumber(data.num_images) || 1;
      input.output_format = data.output_format || 'jpeg';
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // DEBUG: Log específico para Nano Banana
      console.log('🚀 Nano Banana Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          num_images: input.num_images,
          output_format: input.output_format,
          sync_mode: input.sync_mode
        }
      });
    } else if (data.model === 'fal-ai/nano-banana-edit') {
      // Nano Banana Edit usa parâmetros específicos
      input.output_format = data.output_format || 'jpeg';
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // DEBUG: Log específico para Nano Banana Edit
      console.log('🍌 Nano Banana Edit Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          output_format: input.output_format,
          sync_mode: input.sync_mode
        }
      });
    } else if (data.model === 'fal-ai/ideogram/character') {
      // Ideogram Character usa todos os parâmetros específicos
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.style = data.style || 'AUTO';
      input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
      input.num_images = parseNumber(data.num_images) || 1;
      input.seed = parseNumber(data.seed);
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.negative_prompt = data.negative_prompt || '';
      
      // DEBUG: Log específico para Ideogram Character
      console.log('🎭 Ideogram Character Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          rendering_speed: input.rendering_speed,
          style: input.style,
          expand_prompt: input.expand_prompt,
          num_images: input.num_images,
          seed: input.seed,
          sync_mode: input.sync_mode,
          negative_prompt: input.negative_prompt?.substring(0, 30)
        }
      });
    } else if (data.model === 'fal-ai/recraft/v3/image-to-image') {
      // Recraft V3 Image-to-Image usa todos os parâmetros específicos
      input.strength = parseNumber(data.strength) !== null ? parseNumber(data.strength) : 0.5;
      input.style = data.style || 'realistic_image';
      input.style_id = (data.style_id && data.style_id.trim() !== '') ? data.style_id : null;
      input.negative_prompt = data.negative_prompt || '';
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // Handle colors array if provided
      if (data.colors && Array.isArray(data.colors)) {
        input.colors = data.colors;
      } else {
        input.colors = [];
      }
      
      // DEBUG: Log específico para Recraft V3 Image-to-Image
      console.log('🎨 Recraft V3 I2I Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          strength: input.strength,
          style: input.style,
          style_id: input.style_id,
          negative_prompt: input.negative_prompt?.substring(0, 30),
          sync_mode: input.sync_mode,
          colors: input.colors
        }
      });
    } else if (data.model === 'fal-ai/topaz/upscale/image') {
      // Topaz Upscale usa todos os parâmetros específicos
      input.model = data.topaz_model || 'Standard V2'; // Usando topaz_model para evitar conflito
      input.upscale_factor = parseNumber(data.upscale_factor) || 2;
      input.crop_to_fill = data.crop_to_fill !== undefined ? data.crop_to_fill : false;
      input.output_format = data.output_format || 'jpeg';
      input.subject_detection = data.subject_detection || 'All';
      input.face_enhancement = data.face_enhancement !== undefined ? data.face_enhancement : true;
      input.face_enhancement_creativity = parseNumber(data.face_enhancement_creativity) || 0;
      input.face_enhancement_strength = parseNumber(data.face_enhancement_strength) || 0.8;
      
      // DEBUG: Log específico para Topaz Upscale
      console.log('🔍 Topaz Upscale Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          model_variant: input.model,
          upscale_factor: input.upscale_factor,
          crop_to_fill: input.crop_to_fill,
          output_format: input.output_format,
          subject_detection: input.subject_detection,
          face_enhancement: input.face_enhancement,
          face_enhancement_creativity: input.face_enhancement_creativity,
          face_enhancement_strength: input.face_enhancement_strength
        }
      });
    } else if (data.model === 'fal-ai/recraft/upscale/creative') {
      // Recraft Creative Upscale usa parâmetros específicos
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
      
      // DEBUG: Log específico para Recraft Creative Upscale
      console.log('🔍 Recraft Creative Upscale Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          sync_mode: input.sync_mode,
          enable_safety_checker: input.enable_safety_checker
        }
      });
    } else if (data.model === 'fal-ai/recraft/upscale/crisp') {
      // Recraft Crisp Upscale usa parâmetros específicos
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
      
      // DEBUG: Log específico para Recraft Crisp Upscale
      console.log('🔍 Recraft Crisp Upscale Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          sync_mode: input.sync_mode,
          enable_safety_checker: input.enable_safety_checker
        }
      });
    } else if (data.model === 'fal-ai/ideogram/upscale') {
      // Ideogram Upscale usa parâmetros específicos
      input.prompt = data.prompt || '';
      input.resemblance = parseNumber(data.resemblance) || 50;
      input.detail = parseNumber(data.detail) || 50;
      input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : false;
      input.seed = parseNumber(data.seed) || null;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // DEBUG: Log específico para Ideogram Upscale
      console.log('🔍 Ideogram Upscale Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          resemblance: input.resemblance,
          detail: input.detail,
          expand_prompt: input.expand_prompt,
          seed: input.seed,
          sync_mode: input.sync_mode
        }
      });
    } else if (data.model === 'fal-ai/flux-pro-v1.1') {
      // FLUX1.1 [pro] usa todos os parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'landscape_4_3'] || 'landscape_4_3';
      input.image_size = imageSize;
      input.seed = parseNumber(data.seed);
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = parseNumber(data.num_images) || 1;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
      input.output_format = data.output_format || 'jpeg';
      input.safety_tolerance = data.safety_tolerance || '2';
      input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
      
      // DEBUG: Log específico para FLUX1.1 [pro]
      console.log('🚀 FLUX1.1 [pro] Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          image_size: input.image_size,
          seed: input.seed,
          sync_mode: input.sync_mode,
          num_images: input.num_images,
          enable_safety_checker: input.enable_safety_checker,
          output_format: input.output_format,
          safety_tolerance: input.safety_tolerance,
          enhance_prompt: input.enhance_prompt
        }
      });
    } else if (data.model === 'fal-ai/ideogram-v3') {
      // Ideogram V3 usa todos os parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.num_images = parseNumber(data.num_images) || 1;
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.style = data.style || 'AUTO';
      input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
      input.seed = parseNumber(data.seed);
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.negative_prompt = data.negative_prompt || '';
      
      // DEBUG: Log específico para Ideogram V3
      console.log('🚀 Ideogram V3 Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          image_size: input.image_size,
          num_images: input.num_images,
          rendering_speed: input.rendering_speed,
          style: input.style,
          expand_prompt: input.expand_prompt,
          seed: input.seed,
          sync_mode: input.sync_mode,
          negative_prompt: input.negative_prompt?.substring(0, 30)
        }
      });
    } else if (data.model === 'fal-ai/recraft-v3') {
      // Recraft V3 usa todos os parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.style = data.style || 'realistic_image';
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
      
      // Style ID personalizado (opcional)
      if (data.style_id && data.style_id.trim() !== '') {
        input.style_id = data.style_id.trim();
      }
      
      // Cores preferenciais (opcional) - converter string para array de objetos RGB
      if (data.colors && data.colors.trim() !== '') {
        const colorsArray = data.colors.split(',')
          .map(color => color.trim())
          .filter(color => color.match(/^#[0-9A-Fa-f]{6}$/))
          .map(color => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return { r, g, b };
          });
        
        if (colorsArray.length > 0) {
          input.colors = colorsArray;
        }
      }
      
      // DEBUG: Log específico para Recraft V3
      console.log('🎨 Recraft V3 Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          image_size: input.image_size,
          style: input.style,
          enable_safety_checker: input.enable_safety_checker,
          style_id: input.style_id,
          colors: input.colors,
          colorsCount: input.colors?.length || 0
        }
      });
    } else if (data.model === 'fal-ai/flux-krea') {
      // FLUX.1 Krea usa todos os parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'landscape_4_3'] || 'landscape_4_3';
      input.image_size = imageSize;
      input.num_inference_steps = parseNumber(data.num_inference_steps) || 28;
      input.seed = parseNumber(data.seed);
      input.guidance_scale = parseNumber(data.guidance_scale) || 4.5;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = parseNumber(data.num_images) || 1;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
      input.output_format = data.output_format || 'jpeg';
      input.acceleration = data.acceleration || 'none';
      
      // DEBUG: Log específico para FLUX.1 Krea
      console.log('🚀 FLUX.1 Krea Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          image_size: input.image_size,
          num_inference_steps: input.num_inference_steps,
          seed: input.seed,
          guidance_scale: input.guidance_scale,
          sync_mode: input.sync_mode,
          num_images: input.num_images,
          enable_safety_checker: input.enable_safety_checker,
          output_format: input.output_format,
          acceleration: input.acceleration
        }
      });
    } else if (data.model === 'fal-ai/flux-dev') {
      // FLUX.1 [dev] text-to-image usa todos os parâmetros da API
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || '1:1'] || 'landscape_4_3';
      input.image_size = imageSize;
      input.num_inference_steps = parseNumber(data.num_inference_steps) || 28;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.num_images = parseNumber(data.num_images) || 1;
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
      input.acceleration = data.acceleration || 'none';
      
      // DEBUG: Log específico para FLUX.1 [dev]
      console.log('🚀 FLUX.1 [dev] Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          image_size: input.image_size,
          num_inference_steps: input.num_inference_steps,
          seed: input.seed,
          guidance_scale: input.guidance_scale,
          sync_mode: input.sync_mode,
          num_images: input.num_images,
          enable_safety_checker: input.enable_safety_checker,
          output_format: input.output_format,
          acceleration: input.acceleration
        }
      });
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
      } else if (data.model === 'fal-ai/ideogram/character') {
        // Ideogram Character usa apenas reference_image_urls (uma imagem)
        input.reference_image_urls = [typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url];
      } else if (data.model === 'fal-ai/recraft/v3/image-to-image') {
        // Recraft V3 Image-to-Image usa image_url (singular)
        input.image_url = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
      } else if (data.model === 'fal-ai/topaz/upscale/image') {
        // Topaz Upscale usa image_url (singular)
        input.image_url = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
      } else if (data.model === 'fal-ai/recraft/upscale/creative') {
        // Recraft Creative Upscale usa image_url (singular)
        input.image_url = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
      } else if (data.model === 'fal-ai/recraft/upscale/crisp') {
        // Recraft Crisp Upscale usa image_url (singular)
        input.image_url = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
      } else {
        // Outros modelos usam image_url (singular)
        const imageUrl = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
        input.image_url = imageUrl;
        
        // Força da transformação apenas para modelos que suportam (exceto modelos que já definem strength)
        if (data.model !== 'fal-ai/flux-pro-kontext' && data.model !== 'fal-ai/flux-pro/kontext/max' && data.model !== 'fal-ai/recraft/v3/image-to-image' && data.model !== 'fal-ai/topaz/upscale/image' && data.model !== 'fal-ai/recraft/upscale/creative' && data.model !== 'fal-ai/recraft/upscale/crisp') {
          input.strength = data.strength || 0.8;
        }
      }
      
      logger.info('🖼️ Usando imagem de referência', {
        imageUrl: typeof imageNodes[0] === 'string' ? imageNodes[0].substring(0, 100) + '...' : 'URL object',
        imageCount: imageNodes.length,
        model: data.model,
      });
    }

    // DEBUG: Log completo do input que será enviado para FAL
    console.log('📡 FAL Input Debug - Final:', {
      model: falModel,
      originalModel: data.model,
      input: input,
      inputKeys: Object.keys(input)
    });

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