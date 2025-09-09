import type { ImageNodeData } from '@/components/nodes/image';

// Mapeamento de aspect ratios do wow para FAL
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
  'fal-ai/flux-pro/v1.1': 'fal-ai/flux-pro/v1.1',
  'fal-ai/flux-pro/v1.1-ultra': 'fal-ai/flux-pro/v1.1-ultra',
  'fal-ai/nano-banana': 'fal-ai/nano-banana',
  'fal-ai/imagen4/preview': 'fal-ai/imagen4/preview',
  'fal-ai/imagen4/preview/ultra': 'fal-ai/imagen4/preview/ultra',
  'fal-ai/ideogram/v3': 'fal-ai/ideogram/v3',
  'fal-ai/recraft/v3': 'fal-ai/recraft/v3/text-to-image',
  'fal-ai/flux/krea': 'fal-ai/flux/krea',
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

export function buildFalInput(
  prompt: string,
  data: Partial<ImageNodeData> & { nodeId?: string; projectId?: string },
  imageNodes?: string[]
) {
  // Modelos que não aceitam 'prompt' na API
  const MODELS_WITHOUT_PROMPT = new Set<string>([
    'fal-ai/recraft/upscale/creative',
    'fal-ai/recraft/upscale/crisp',
    'fal-ai/topaz/upscale/image',
    'fal-ai/ideogram/v3/reframe',
  ]);

  const input: any = {};
  if (!MODELS_WITHOUT_PROMPT.has(data.model || '')) {
    input.prompt = prompt;
  }

  // Mapear o modelo para o endpoint correto da FAL
  const falModelId = FAL_MODEL_MAP[data.model!] || data.model;

  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  // Todos os modelos agora têm configurações específicas abaixo

  // Configurações específicas por modelo
  if (data.model === 'fal-ai/flux-pro/v1.1-ultra') {
    // FLUX Pro Ultra - TODOS os parâmetros conforme documentação
    input.aspect_ratio = data.aspect_ratio || '16:9';
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.num_images = parseNumber(data.num_images) || 1;
    input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
    input.output_format = data.output_format || 'jpeg';
    input.safety_tolerance = data.safety_tolerance || '2';
    input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
    input.raw = data.raw !== undefined ? data.raw : false;
  } else if (data.model === 'fal-ai/luma-photon') {
    // Luma Photon - parâmetros conforme documentação: apenas prompt + aspect_ratio
    let lumaAspectRatio = data.aspect_ratio || '1:1';
    
    if (!data.aspect_ratio && (data as any).aspectRatio) {
      const genericAspectRatio = (data as any).aspectRatio;
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
  } else if (data.model === 'fal-ai/nano-banana') {
    // Nano Banana - TODOS os parâmetros conforme documentação
    input.num_images = parseNumber(data.num_images) || 1;
    input.output_format = data.output_format || 'jpeg';
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
  } else if (data.model === 'fal-ai/ideogram/v3') {
    // Ideogram V3 - TODOS os parâmetros conforme documentação
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
    input.image_size = imageSize;
    input.rendering_speed = data.rendering_speed || 'BALANCED';
    input.style = data.style || 'AUTO';
    input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
    input.num_images = parseNumber(data.num_images) || 1;
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.negative_prompt = data.negative_prompt || '';
    // Color palette para Ideogram V3 (preset ou personalizada)
    if ((data as any).color_palette_type === 'preset' && (data as any).color_palette_preset && String((data as any).color_palette_preset).trim() !== '' && (data as any).color_palette_preset !== 'none') {
      input.color_palette = {
        name: (data as any).color_palette_preset
      };
    } else if ((data as any).color_palette_type === 'custom' && ((data as any).color_r !== undefined || (data as any).color_g !== undefined || (data as any).color_b !== undefined)) {
      const r = (data as any).color_r !== undefined && (data as any).color_r !== null ? Number((data as any).color_r) : 190;
      const g = (data as any).color_g !== undefined && (data as any).color_g !== null ? Number((data as any).color_g) : 29;
      const b = (data as any).color_b !== undefined && (data as any).color_b !== null ? Number((data as any).color_b) : 29;
      const validR = Math.max(0, Math.min(255, r));
      const validG = Math.max(0, Math.min(255, g));
      const validB = Math.max(0, Math.min(255, b));
      input.color_palette = {
        members: [{
          rgb: { r: validR, g: validG, b: validB }
        }]
      };
    }
    if (data.style_codes) input.style_codes = data.style_codes;
    if (data.image_urls) input.image_urls = data.image_urls; // Style references
  } else if (data.model === 'fal-ai/imagen4/preview') {
    // Imagen4 - TODOS os parâmetros conforme documentação
    input.negative_prompt = data.negative_prompt || '';
    input.aspect_ratio = data.aspect_ratio || '1:1';
    input.num_images = parseNumber(data.num_images) || 1;
    input.seed = parseNumber(data.seed) || null;
    input.resolution = data.resolution || '1K';
  } else if (data.model === 'fal-ai/imagen4/preview/ultra') {
    // Imagen4 Ultra - TODOS os parâmetros conforme documentação  
    input.negative_prompt = data.negative_prompt || '';
    input.aspect_ratio = data.aspect_ratio || '1:1';
    input.num_images = parseNumber(data.num_images) || 1;
    input.seed = parseNumber(data.seed) || null;
    input.resolution = data.resolution || '1K';
  } else if (data.model === 'fal-ai/recraft/v3') {
    // Recraft V3 - TODOS os parâmetros conforme documentação
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
    input.image_size = imageSize;
    input.style = data.style || 'realistic_image';
    input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
    // style_id não será utilizado
    
    // Cores para Recraft V3: sempre enviar
    if (data.colors_type === 'custom' && (data.colors_r !== undefined || data.colors_g !== undefined || data.colors_b !== undefined)) {
      const r = data.colors_r !== undefined && data.colors_r !== null ? Number(data.colors_r) : 120;
      const g = data.colors_g !== undefined && data.colors_g !== null ? Number(data.colors_g) : 47;
      const b = data.colors_b !== undefined && data.colors_b !== null ? Number(data.colors_b) : 85;
      
      const validR = Math.max(0, Math.min(255, r));
      const validG = Math.max(0, Math.min(255, g));
      const validB = Math.max(0, Math.min(255, b));
      
      input.colors = [{
        r: validR,
        g: validG,
        b: validB
      }];
    } else {
      input.colors = [];
    }
  } else if (data.model === 'fal-ai/flux/krea') {
    // FLUX Krea - TODOS os parâmetros conforme documentação
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'landscape_4_3'] || 'landscape_4_3';
    input.image_size = imageSize;
    input.num_inference_steps = parseNumber(data.num_inference_steps) || 28;
    input.seed = parseNumber(data.seed) || null;
    input.guidance_scale = parseNumber(data.guidance_scale) || 4.5;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.num_images = parseNumber(data.num_images) || 1;
    input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
    input.output_format = data.output_format || 'jpeg';
    input.acceleration = data.acceleration || 'none';
  } else if (data.model === 'fal-ai/flux-pro/v1.1') {
    // FLUX Pro v1.1 - TODOS os parâmetros conforme documentação
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'landscape_4_3'] || 'landscape_4_3';
    input.image_size = imageSize;
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.num_images = parseNumber(data.num_images) || 1;
    input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : true;
    input.output_format = data.output_format || 'jpeg';
    input.safety_tolerance = data.safety_tolerance || '2';
    input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
  } else if (data.model === 'fal-ai/flux-pro/kontext/max') {
    // FLUX Kontext Max - TODOS os parâmetros conforme documentação
    input.seed = parseNumber(data.seed) || null;
    input.guidance_scale = parseNumber(data.guidance_scale) || 3.5;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.num_images = parseNumber(data.num_images) || 1;
    input.output_format = data.output_format || 'jpeg';
    input.safety_tolerance = data.safety_tolerance || '2';
    input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
    if (data.aspect_ratio) input.aspect_ratio = data.aspect_ratio;
  } else if (data.model === 'fal-ai/flux-pro-kontext' || data.model === 'fal-ai/flux-pro/kontext') {
    // FLUX Kontext Pro - TODOS os parâmetros conforme documentação  
    input.seed = parseNumber(data.seed) || null;
    input.guidance_scale = parseNumber(data.guidance_scale) || 3.5;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.num_images = parseNumber(data.num_images) || 1;
    input.output_format = data.output_format || 'jpeg';
    input.safety_tolerance = data.safety_tolerance || '2';
    input.enhance_prompt = data.enhance_prompt !== undefined ? data.enhance_prompt : false;
    if (data.aspect_ratio) input.aspect_ratio = data.aspect_ratio;
  } else if (data.model === 'fal-ai/ideogram/character') {
    // Ideogram Character - TODOS os parâmetros conforme documentação
    input.rendering_speed = data.rendering_speed || 'BALANCED';
    input.style = data.style || 'AUTO';
    input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
    input.num_images = parseNumber(data.num_images) || 1;
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
    input.image_size = imageSize;
    input.negative_prompt = data.negative_prompt || '';
    // Color palette para Character
    if ((data as any).color_palette_type === 'preset' && (data as any).color_palette_preset && String((data as any).color_palette_preset).trim() !== '' && (data as any).color_palette_preset !== 'none') {
      input.color_palette = { name: (data as any).color_palette_preset };
    } else if ((data as any).color_palette_type === 'custom' && ((data as any).color_r !== undefined || (data as any).color_g !== undefined || (data as any).color_b !== undefined)) {
      const r = (data as any).color_r !== undefined && (data as any).color_r !== null ? Number((data as any).color_r) : 190;
      const g = (data as any).color_g !== undefined && (data as any).color_g !== null ? Number((data as any).color_g) : 29;
      const b = (data as any).color_b !== undefined && (data as any).color_b !== null ? Number((data as any).color_b) : 29;
      const validR = Math.max(0, Math.min(255, r));
      const validG = Math.max(0, Math.min(255, g));
      const validB = Math.max(0, Math.min(255, b));
      input.color_palette = {
        members: [{ rgb: { r: validR, g: validG, b: validB } }]
      };
    }
    if (data.style_codes) input.style_codes = data.style_codes;
    if (data.image_urls) input.image_urls = data.image_urls; // Style references
  } else if (data.model === 'fal-ai/ideogram/v3/reframe') {
    // Ideogram Reframe - TODOS os parâmetros conforme documentação
    input.rendering_speed = data.rendering_speed || 'BALANCED';
    input.num_images = parseNumber(data.num_images) || 1;
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    // Não enviar prompt neste modelo
    if (input.prompt) delete input.prompt;
    // Color palette para Reframe
    if ((data as any).color_palette_type === 'preset' && (data as any).color_palette_preset && String((data as any).color_palette_preset).trim() !== '' && (data as any).color_palette_preset !== 'none') {
      input.color_palette = { name: (data as any).color_palette_preset };
    } else if ((data as any).color_palette_type === 'custom' && ((data as any).color_r !== undefined || (data as any).color_g !== undefined || (data as any).color_b !== undefined)) {
      const r = (data as any).color_r !== undefined && (data as any).color_r !== null ? Number((data as any).color_r) : 190;
      const g = (data as any).color_g !== undefined && (data as any).color_g !== null ? Number((data as any).color_g) : 29;
      const b = (data as any).color_b !== undefined && (data as any).color_b !== null ? Number((data as any).color_b) : 29;
      const validR = Math.max(0, Math.min(255, r));
      const validG = Math.max(0, Math.min(255, g));
      const validB = Math.max(0, Math.min(255, b));
      input.color_palette = { members: [{ rgb: { r: validR, g: validG, b: validB } }] };
    }
    if (data.style_codes) input.style_codes = data.style_codes;
    if (data.style) input.style = data.style;
    if (data.image_urls) input.image_urls = data.image_urls; // Style references
  } else if (data.model === 'fal-ai/ideogram/v3/remix') {
    // Ideogram Remix - TODOS os parâmetros conforme documentação
    input.rendering_speed = data.rendering_speed || 'BALANCED';
    input.style = data.style || 'AUTO';
    input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
    input.num_images = parseNumber(data.num_images) || 1;
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.strength = parseNumber(data.strength) || 0.8;
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
    input.image_size = imageSize;
    input.negative_prompt = data.negative_prompt || '';
    // Color palette para Remix
    if ((data as any).color_palette_type === 'preset' && (data as any).color_palette_preset && String((data as any).color_palette_preset).trim() !== '' && (data as any).color_palette_preset !== 'none') {
      input.color_palette = { name: (data as any).color_palette_preset };
    } else if ((data as any).color_palette_type === 'custom' && ((data as any).color_r !== undefined || (data as any).color_g !== undefined || (data as any).color_b !== undefined)) {
      const r = (data as any).color_r !== undefined && (data as any).color_r !== null ? Number((data as any).color_r) : 190;
      const g = (data as any).color_g !== undefined && (data as any).color_g !== null ? Number((data as any).color_g) : 29;
      const b = (data as any).color_b !== undefined && (data as any).color_b !== null ? Number((data as any).color_b) : 29;
      const validR = Math.max(0, Math.min(255, r));
      const validG = Math.max(0, Math.min(255, g));
      const validB = Math.max(0, Math.min(255, b));
      input.color_palette = { members: [{ rgb: { r: validR, g: validG, b: validB } }] };
    }
    if (data.style_codes) input.style_codes = data.style_codes;
    if (data.image_urls) input.image_urls = data.image_urls; // Style references
  } else if (data.model === 'fal-ai/ideogram/v3/replace-background') {
    // Ideogram Replace Background - TODOS os parâmetros conforme documentação
    input.rendering_speed = data.rendering_speed || 'BALANCED';
    input.style = data.style || 'AUTO';
    input.expand_prompt = data.expand_prompt !== undefined ? data.expand_prompt : true;
    input.seed = parseNumber(data.seed) || null;
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    // Color palette para Replace Background
    if ((data as any).color_palette_type === 'preset' && (data as any).color_palette_preset && String((data as any).color_palette_preset).trim() !== '' && (data as any).color_palette_preset !== 'none') {
      input.color_palette = { name: (data as any).color_palette_preset };
    } else if ((data as any).color_palette_type === 'custom' && ((data as any).color_r !== undefined || (data as any).color_g !== undefined || (data as any).color_b !== undefined)) {
      const r = (data as any).color_r !== undefined && (data as any).color_r !== null ? Number((data as any).color_r) : 190;
      const g = (data as any).color_g !== undefined && (data as any).color_g !== null ? Number((data as any).color_g) : 29;
      const b = (data as any).color_b !== undefined && (data as any).color_b !== null ? Number((data as any).color_b) : 29;
      const validR = Math.max(0, Math.min(255, r));
      const validG = Math.max(0, Math.min(255, g));
      const validB = Math.max(0, Math.min(255, b));
      input.color_palette = { members: [{ rgb: { r: validR, g: validG, b: validB } }] };
    }
  } else if (data.model === 'fal-ai/nano-banana/edit') {
    // Nano Banana Edit - TODOS os parâmetros conforme documentação
    input.num_images = parseNumber(data.num_images) || 1;
    input.output_format = data.output_format || 'jpeg';
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
  } else if (data.model === 'fal-ai/recraft/upscale/creative') {
    // Recraft Creative Upscale - TODOS os parâmetros conforme documentação
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
  } else if (data.model === 'fal-ai/recraft/upscale/crisp') {
    // Recraft Crisp Upscale - TODOS os parâmetros conforme documentação  
    input.sync_mode = data.sync_mode !== undefined ? data.sync_mode : false;
    input.enable_safety_checker = data.enable_safety_checker !== undefined ? data.enable_safety_checker : false;
  } else if (data.model === 'fal-ai/topaz/upscale/image') {
    // Topaz Upscale - TODOS os parâmetros conforme documentação
    // ATENÇÃO: Topaz usa 'model' como parâmetro interno, diferente do model ID da FAL
    input.topaz_internal_model = data.topaz_model || 'Standard V2';
    input.upscale_factor = parseNumber(data.upscale_factor) || 2;
    input.crop_to_fill = data.crop_to_fill !== undefined ? data.crop_to_fill : false;
    input.output_format = data.output_format || 'jpeg';
    input.subject_detection = data.subject_detection || 'All';
    input.face_enhancement = data.face_enhancement !== undefined ? data.face_enhancement : true;
    input.face_enhancement_creativity = parseNumber(data.face_enhancement_creativity) || 0;
    input.face_enhancement_strength = parseNumber(data.face_enhancement_strength) || 0.8;
  }

  // Adicionar image URLs para modelos image-to-image
  if (imageNodes && imageNodes.length > 0) {
    if (data.model === 'fal-ai/nano-banana/edit') {
      input.image_urls = imageNodes.map((node: any) => 
        typeof node === 'string' ? node : node.url
      );
    } else if (data.model === 'fal-ai/ideogram/character') {
      // Ideogram Character usa reference_image_urls (array)
      input.reference_image_urls = imageNodes.map((node: any) => 
        typeof node === 'string' ? node : node.url
      );
    } else {
      input.image_url = typeof imageNodes[0] === 'string' ? imageNodes[0] : imageNodes[0].url;
    }
  }

  // Adicionar parâmetros específicos do modelo Ideogram Reframe
  if (data.model === 'fal-ai/ideogram/v3/reframe') {
    // Reframe requer image_size obrigatório
    const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
    input.image_size = imageSize;
  }

  // Para o Topaz, precisamos tratar o parâmetro 'model' interno separadamente
  if (data.model === 'fal-ai/topaz/upscale/image') {
    const { topaz_internal_model, ...restInput } = input;
    return {
      model: topaz_internal_model, // Usar o model interno do Topaz
      ...restInput
    };
  }

  return {
    model: falModelId,
    ...input
  };
}
