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
  'fal-ai/flux-pro-kontext': 'fal-ai/flux-pro/kontext',
  'fal-ai/flux-pro/kontext/max': 'fal-ai/flux-pro/kontext/max',
  'fal-ai/flux-pro-v1.1': 'fal-ai/flux-pro/v1.1',
  'fal-ai/flux-pro-v1.1-ultra': 'fal-ai/flux-pro/v1.1-ultra',
  'fal-ai/nano-banana': 'fal-ai/nano-banana',

  'fal-ai/imagen4': 'fal-ai/imagen4/preview',
  'fal-ai/imagen4-ultra': 'fal-ai/imagen4/preview/ultra',
  'fal-ai/ideogram-v3': 'fal-ai/ideogram/v3',
  'fal-ai/recraft-v3': 'fal-ai/recraft/v3/text-to-image',
  'fal-ai/flux-krea': 'fal-ai/flux/krea',
  'fal-ai/luma-photon': 'fal-ai/luma-photon',
  'fal-ai/nano-banana/edit': 'fal-ai/nano-banana/edit',
  'fal-ai/ideogram/character': 'fal-ai/ideogram/character',
  'fal-ai/ideogram/v3/reframe': 'fal-ai/ideogram/v3/reframe',
  'fal-ai/ideogram/v3/remix': 'fal-ai/ideogram/v3/remix',
  'fal-ai/topaz/upscale/image': 'fal-ai/topaz/upscale/image',
  'fal-ai/recraft/upscale/creative': 'fal-ai/recraft/upscale/creative',
  'fal-ai/recraft/upscale/crisp': 'fal-ai/recraft/upscale/crisp',
  'fal-ai/ideogram/v3/replace-background': 'fal-ai/ideogram/v3/replace-background',
};

// Função para verificar se um erro pode ser tentado novamente
function isRetriableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  const isTimeoutError = message.includes('timeout') || 
                        message.includes('socket') || 
                        message.includes('fetch failed') ||
                        message.includes('network') ||
                        message.includes('connection');
  
  // Verificar se tem cause com código específico de socket
  const hasCause = 'cause' in error && error.cause;
  if (hasCause && typeof error.cause === 'object' && error.cause !== null) {
    const cause = error.cause as any;
    if (cause.code === 'UND_ERR_SOCKET' || 
        cause.code === 'ECONNRESET' || 
        cause.code === 'ETIMEDOUT') {
      return true;
    }
  }
  
  return isTimeoutError;
}

export async function generateImageFalAction(
  prompt: string,
  data: Partial<ImageNodeData> & { nodeId?: string; projectId?: string },
  imageNodes?: string[]
) {
  try {
    // DEBUG: Log completo dos dados recebidos (removido para produção)
    // console.log('🎨 FAL Action Debug - Dados recebidos:', {
    //   model: data.model,
    //   prompt: prompt.substring(0, 100),
    //   allData: data,
    //   dataKeys: Object.keys(data),
    //   hasAdvancedParams: !!(data.seed || data.guidance_scale || data.strength || data.style || data.num_inference_steps)
    // });

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
    const falModel = FAL_MODEL_MAP[data.model || 'fal-ai/flux-pro-kontext'] || 'fal-ai/flux-pro/kontext';
    
    // Preparar input para FAL baseado no modelo
    const isUpscaleModelType = ['fal-ai/topaz/upscale/image', 'fal-ai/recraft/upscale/creative', 'fal-ai/recraft/upscale/crisp'].includes(data.model || '');
    
    const input: any = isUpscaleModelType ? {} : {
      prompt,
    };
    
    // Função helper para converter valores para números
    const parseNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    // Adicionar parâmetros globais apenas se não for Recraft V3, Nano Banana, Nano Banana Edit, Imagen 4, Imagen 4 Ultra, Ideogram 3.0, Ideogram Character, FLUX1.1 [pro], FLUX1.1 [pro] ultra, FLUX.1 Kontext [max], FLUX.1 Kontext [pro] text, FLUX.1 Krea ou modelos image-to-image específicos
    if (data.model !== 'fal-ai/recraft-v3' && data.model !== 'fal-ai/nano-banana' && data.model !== 'fal-ai/nano-banana/edit' && data.model !== 'fal-ai/imagen4' && data.model !== 'fal-ai/imagen4-ultra' && data.model !== 'fal-ai/ideogram-v3' && data.model !== 'fal-ai/ideogram/character' && data.model !== 'fal-ai/flux-pro-v1.1' && data.model !== 'fal-ai/flux-pro-v1.1-ultra' && data.model !== 'fal-ai/flux-krea' && data.model !== 'fal-ai/flux-pro-kontext' && data.model !== 'fal-ai/flux-pro/kontext/max' && data.model !== 'fal-ai/luma-photon' && data.model !== 'fal-ai/ideogram/v3/reframe' && data.model !== 'fal-ai/ideogram/v3/remix' && data.model !== 'fal-ai/ideogram/v3/replace-background' && data.model !== 'fal-ai/topaz/upscale/image' && data.model !== 'fal-ai/recraft/upscale/creative' && data.model !== 'fal-ai/recraft/upscale/crisp') {
      input.seed = parseNumber(data.seed);
      
      // Guidance scale específico por modelo
      let defaultGuidanceScale = 3.5;
      input.guidance_scale = parseNumber(data.guidance_scale) || parseNumber(data.guidance) || defaultGuidanceScale;
      
      // Output format específico por modelo  
      let defaultOutputFormat = 'jpeg';
      input.output_format = data.output_format || data.outputFormat || defaultOutputFormat;
    }

    // Configurações específicas por modelo
    if (data.model === 'fal-ai/flux-pro-v1.1-ultra') {
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
    } else if (data.model === 'fal-ai/luma-photon') {
      // Luma Photon usa apenas prompt + aspect_ratio
      // Converter image_size para aspect_ratio válido do Luma Photon
      let lumaAspectRatio = data.aspect_ratio || '1:1';
      
      // Se não tem aspect_ratio específico, mapear do aspectRatio genérico
      if (!data.aspect_ratio && (data as any).aspectRatio) {
        const genericAspectRatio = (data as any).aspectRatio;
        // Mapear landscape_4_3 -> 4:3, etc.
        const aspectMap: Record<string, string> = {
          'landscape_4_3': '4:3',
          'landscape_16_9': '16:9', 
          'portrait_4_3': '3:4',
          'portrait_16_9': '9:16',
          'square': '1:1',
          'square_hd': '1:1'
        };
        lumaAspectRatio = aspectMap[genericAspectRatio] || genericAspectRatio;
      }
      
      input.aspect_ratio = lumaAspectRatio;
      
      // DEBUG: Log específico para Luma Photon
      console.log('📸 Luma Photon Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        receivedAspectRatio: data.aspect_ratio,
        receivedAspectRatioCamel: (data as any).aspectRatio,
        receivedImageSize: (data as any).image_size,
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          aspect_ratio: input.aspect_ratio
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
    } else if (data.model === 'fal-ai/nano-banana/edit') {
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
    } else if (data.model === 'fal-ai/ideogram/v3/reframe') {
      // Ideogram 3.0 Reframe usa parâmetros específicos (sem prompt)
      input.image_size = data.image_size || data.aspectRatio || 'square_hd';
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.seed = parseNumber(data.seed);
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // Remover prompt para Ideogram Reframe (funciona sem prompt)
      delete input.prompt;
      
      // DEBUG: Log específico para Ideogram 3.0 Reframe
      console.log('🖼️ Ideogram 3.0 Reframe Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          image_size: input.image_size,
          rendering_speed: input.rendering_speed,
          seed: input.seed,
          sync_mode: input.sync_mode,
          hasPrompt: 'prompt' in input
        }
      });
    } else if (data.model === 'fal-ai/ideogram/v3/remix') {
      // Ideogram 3.0 Remix usa parâmetros específicos
      input.strength = parseNumber(data.strength) !== null ? parseNumber(data.strength) : 0.8;
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.style = data.style || 'AUTO';
      input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
      input.seed = parseNumber(data.seed);
      input.negative_prompt = data.negative_prompt || '';
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // Paleta de cores personalizada (mesma lógica do Ideogram texto para imagem)
      if (data.color_palette_type === 'preset' && data.color_palette_preset) {
        input.color_palette = {
          name: data.color_palette_preset
        };
      } else if (data.color_palette_type === 'custom' && (data.color_r !== undefined || data.color_g !== undefined || data.color_b !== undefined)) {
        // Usar valores padrão se não definidos
        const r = data.color_r !== undefined && data.color_r !== null ? Number(data.color_r) : 190;
        const g = data.color_g !== undefined && data.color_g !== null ? Number(data.color_g) : 29;
        const b = data.color_b !== undefined && data.color_b !== null ? Number(data.color_b) : 29;
        
        // Validar limites RGB (0-255)
        const validR = Math.max(0, Math.min(255, r));
        const validG = Math.max(0, Math.min(255, g));
        const validB = Math.max(0, Math.min(255, b));
        
        input.color_palette = {
          members: [{
            rgb: {
              r: validR,
              g: validG,
              b: validB
            }
          }]
        };
      }
      
      // DEBUG: Log específico para Ideogram 3.0 Remix (removido para produção)
      // console.log('🎨 Ideogram 3.0 Remix Debug - Parâmetros completos:', {
      //   model: data.model,
      //   receivedData: Object.keys(data),
      //   finalInput: {
      //     prompt: input.prompt?.substring(0, 50),
      //     strength: input.strength,
      //     rendering_speed: input.rendering_speed,
      //     style: input.style,
      //     expand_prompt: input.expand_prompt,
      //     seed: input.seed,
      //     negative_prompt: input.negative_prompt?.substring(0, 30),
      //     color_palette: input.color_palette,
      //     sync_mode: input.sync_mode
      //   }
      // });
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
    } else if (data.model === 'fal-ai/ideogram/v3/replace-background') {
      // Ideogram 3.0 Replace Background usa parâmetros específicos
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.style = data.style || 'AUTO';
      input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
      input.seed = parseNumber(data.seed) || null;
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      
      // Configuração de paleta de cores baseada no tipo
      if (data.color_palette_type === 'preset' && data.color_palette_preset) {
        input.color_palette = {
          name: data.color_palette_preset
        };
      } else if (data.color_palette_type === 'custom') {
        const r = parseNumber(data.color_r) || 190;
        const g = parseNumber(data.color_g) || 29;
        const b = parseNumber(data.color_b) || 29;
        
        input.color_palette = {
          members: [
            {
              color: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
              weight: 1
            }
          ]
        };
      }
      // Se color_palette_type for 'none' ou não definido, não enviamos color_palette
      
      // DEBUG: Log específico para Ideogram Replace Background
      console.log('🎨 Ideogram Replace Background Debug - Parâmetros completos:', {
        model: data.model,
        receivedData: Object.keys(data),
        finalInput: {
          prompt: input.prompt?.substring(0, 50),
          rendering_speed: input.rendering_speed,
          style: input.style,
          expand_prompt: input.expand_prompt,
          seed: input.seed,
          sync_mode: input.sync_mode,
          color_palette: input.color_palette
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
      // Ideogram 3.0 usa todos os parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.num_images = 1; // Sempre 1 imagem, não aparece na interface
      input.rendering_speed = data.rendering_speed || 'BALANCED';
      input.style = data.style || 'AUTO';
      input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
      input.seed = parseNumber(data.seed);
      input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
      input.negative_prompt = data.negative_prompt || '';
      
      // Parâmetros avançados - Color Palette (preset ou personalizada)
      if (data.color_palette_type === 'preset' && data.color_palette_preset && data.color_palette_preset !== null && data.color_palette_preset !== 'none' && String(data.color_palette_preset).trim() !== '') {
        input.color_palette = {
          name: data.color_palette_preset
        };
      } else if (data.color_palette_type === 'custom' && (data.color_r !== undefined || data.color_g !== undefined || data.color_b !== undefined)) {
        // Usar valores padrão se não definidos
        const r = data.color_r !== undefined && data.color_r !== null ? Number(data.color_r) : 190;
        const g = data.color_g !== undefined && data.color_g !== null ? Number(data.color_g) : 29;
        const b = data.color_b !== undefined && data.color_b !== null ? Number(data.color_b) : 29;
        
        // Validar limites RGB (0-255)
        const validR = Math.max(0, Math.min(255, r));
        const validG = Math.max(0, Math.min(255, g));
        const validB = Math.max(0, Math.min(255, b));
        
        input.color_palette = {
          members: [{
            rgb: {
              r: validR,
              g: validG,
              b: validB
            }
          }]
        };
      }
      
      // DEBUG: Log específico para Ideogram 3.0
      console.log('🚀 Ideogram 3.0 Debug - Parâmetros completos:', {
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
          negative_prompt: input.negative_prompt?.substring(0, 30),
          color_palette: input.color_palette
        }
      });
    } else if (data.model === 'fal-ai/recraft-v3') {
      // Recraft V3 usa todos os parâmetros específicos
      const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
      input.image_size = imageSize;
      input.style = data.style || 'realistic_image';
      input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
      
      // Cores preferenciais personalizadas (tanto text-to-image quanto image-to-image)
      if (data.colors_type === 'custom' && (data.colors_r !== undefined || data.colors_g !== undefined || data.colors_b !== undefined)) {
        // Usar valores padrão se não definidos
        const r = data.colors_r !== undefined && data.colors_r !== null ? Number(data.colors_r) : 120;
        const g = data.colors_g !== undefined && data.colors_g !== null ? Number(data.colors_g) : 47;
        const b = data.colors_b !== undefined && data.colors_b !== null ? Number(data.colors_b) : 85;
        
        // Validar limites RGB (0-255)
        const validR = Math.max(0, Math.min(255, r));
        const validG = Math.max(0, Math.min(255, g));
        const validB = Math.max(0, Math.min(255, b));
        
        input.colors = [{
          r: validR,
          g: validG,
          b: validB
        }];
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
      if (data.model === 'fal-ai/nano-banana/edit') {
        // Nano Banana Edit usa image_urls (plural) - extrair apenas as URLs
        input.image_urls = imageNodes.map((node: any) => 
          typeof node === 'string' ? node : node.url
        );
      } else if (data.model === 'fal-ai/ideogram/character') {
        // Ideogram Character usa apenas reference_image_urls (uma imagem)
        input.reference_image_urls = [typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url];
      } else if (data.model === 'fal-ai/ideogram/v3/reframe') {
        // Ideogram 3.0 Reframe usa image_url (singular)
        input.image_url = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
      } else if (data.model === 'fal-ai/ideogram/v3/remix') {
        // Ideogram 3.0 Remix usa image_url (singular)
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
        if (data.model !== 'fal-ai/flux-pro-kontext' && data.model !== 'fal-ai/flux-pro/kontext/max' && data.model !== 'fal-ai/ideogram/v3/reframe' && data.model !== 'fal-ai/ideogram/v3/remix' && data.model !== 'fal-ai/ideogram/v3/replace-background' && data.model !== 'fal-ai/topaz/upscale/image' && data.model !== 'fal-ai/recraft/upscale/creative' && data.model !== 'fal-ai/recraft/upscale/crisp') {
          input.strength = data.strength || 0.8;
        }
      }
      
      logger.info('🖼️ Usando imagem de referência', {
        imageUrl: typeof imageNodes[0] === 'string' ? imageNodes[0].substring(0, 100) + '...' : 'URL object',
        imageCount: imageNodes.length,
        model: data.model,
      });
    }

    // DEBUG: Log completo do input que será enviado para FAL (removido para produção)
    // console.log('📡 FAL Input Debug - Final:', {
    //   model: falModel,
    //   originalModel: data.model,
    //   input: input,
    //   inputKeys: Object.keys(input)
    // });

    logger.info('📡 Enviando requisição para FAL', {
      model: falModel,
      input: {
        ...input,
        prompt: input.prompt ? input.prompt.substring(0, 100) : '[sem prompt]',
      },
    });

    // Fazer a requisição para FAL com retry logic
    let result;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        logger.info(`🔄 Tentativa ${attempts}/${maxAttempts} para FAL`, {
          model: falModel,
          attempt: attempts
        });
        
        result = await fal.subscribe(falModel, {
          input,
          logs: true,
          timeout: 120000, // 2 minutos de timeout
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              logger.info('🔄 FAL em progresso', {
                status: update.status,
                attempt: attempts,
                logs: update.logs?.map(log => log.message).join(', '),
              });
            }
          },
        });
        
        // Se chegou aqui, a requisição foi bem-sucedida
        break;
        
      } catch (error) {
        logger.error(`❌ Erro na tentativa ${attempts}/${maxAttempts}:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          model: falModel,
          attempt: attempts
        });
        
        // Se é a última tentativa ou não é um erro de timeout/socket, re-throw
        if (attempts >= maxAttempts || !isRetriableError(error)) {
          throw error;
        }
        
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

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
    
    // Download da imagem da FAL com retry logic
    let imageArrayBuffer;
    let downloadAttempts = 0;
    const maxDownloadAttempts = 3;
    
    while (downloadAttempts < maxDownloadAttempts) {
      try {
        downloadAttempts++;
        logger.info(`🔄 Tentativa de download ${downloadAttempts}/${maxDownloadAttempts}`);
        
        // Fetch com timeout personalizado para downloads grandes (modelos de upscale)
        const controller = new AbortController();
        const isUpscaleModel = data.model?.includes('upscale');
        const timeoutDuration = isUpscaleModel ? 120000 : 60000; // 2 min para upscale, 1 min para outros
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
        
        logger.info(`⏱️ Usando timeout de ${timeoutDuration/1000}s para download`, {
          model: data.model,
          isUpscale: isUpscaleModel
        });
        
        const imageResponse = await fetch(primaryImageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!imageResponse.ok) {
          throw new Error(`Erro ao fazer download da imagem: ${imageResponse.statusText}`);
        }
        
        imageArrayBuffer = await imageResponse.arrayBuffer();
        logger.info('✅ Download da imagem concluído com sucesso', {
          size: imageArrayBuffer.byteLength,
          attempt: downloadAttempts
        });
        break; // Sucesso, sair do loop
        
      } catch (error) {
        logger.error(`❌ Erro no download - tentativa ${downloadAttempts}/${maxDownloadAttempts}:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          url: primaryImageUrl.substring(0, 100) + '...',
          attempt: downloadAttempts
        });
        
        // Se é a última tentativa ou não é um erro retriável, re-throw
        if (downloadAttempts >= maxDownloadAttempts || !isRetriableError(error)) {
          throw new Error(`Falha no download da imagem após ${downloadAttempts} tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

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
