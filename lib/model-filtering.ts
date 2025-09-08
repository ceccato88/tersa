// Sistema de filtragem de modelos baseado no tipo de conexão anterior
import { detectPreviousNodeType, type NodeConnectionType } from './node-connection-detector';
import { type Node, type Edge } from '@xyflow/react';

// Tipos de modelos disponíveis
export interface FilteredModel {
  id: string;
  label: string;
  chef: any;
  providers: any[];
  aspectRatios?: Array<{ label: string; value: string }>;
  icon?: any;
  default?: boolean;
  maxImages?: number;
}

// Modelos de imagem disponíveis (apenas FAL)
const IMAGE_MODELS = {
  'fal-ai/flux-pro-kontext': {
    id: 'fal-ai/flux-pro-kontext',
    label: 'FLUX.1 Kontext [pro]',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/flux-pro/kontext/max': {
    id: 'fal-ai/flux-pro/kontext/max',
    label: 'FLUX.1 Kontext [max]',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/flux-pro-v1.1': {
    id: 'fal-ai/flux-pro-v1.1',
    label: 'FLUX1.1 [pro]',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/flux-pro-v1.1-ultra': {
    id: 'fal-ai/flux-pro-v1.1-ultra',
    label: 'FLUX1.1 [pro] ultra',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/nano-banana': {
    id: 'fal-ai/nano-banana',
    label: 'Nano Banana',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },

  'fal-ai/imagen4': {
    id: 'fal-ai/imagen4',
    label: 'Imagen 4',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/imagen4-ultra': {
    id: 'fal-ai/imagen4-ultra',
    label: 'Imagen 4 Ultra',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/ideogram-v3': {
    id: 'fal-ai/ideogram-v3',
    label: 'Ideogram 3.0',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/recraft-v3': {
    id: 'fal-ai/recraft-v3',
    label: 'Recraft V3',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/flux-krea': {
    id: 'fal-ai/flux-krea',
    label: 'FLUX.1 Krea',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/luma-photon': {
    id: 'fal-ai/luma-photon',
    label: 'Luma Photon',
    provider: 'fal',
    supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto
  },
  'fal-ai/nano-banana/edit': {
    id: 'fal-ai/nano-banana/edit',
    label: 'Nano Banana Edit',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: Infinity // Aceita múltiplas imagens
  },
  'fal-ai/ideogram/character': {
    id: 'fal-ai/ideogram/character',
    label: 'Ideogram 3.0 Character',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem de referência
  },
  'fal-ai/recraft/v3/image-to-image': {
    id: 'fal-ai/recraft/v3/image-to-image',
    label: 'Recraft V3',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/ideogram/v3/reframe': {
    id: 'fal-ai/ideogram/v3/reframe',
    label: 'Ideogram 3.0 Reframe',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/ideogram/v3/remix': {
    id: 'fal-ai/ideogram/v3/remix',
    label: 'Ideogram 3.0 Remix',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/topaz/upscale/image': {
    id: 'fal-ai/topaz/upscale/image',
    label: 'Topaz Upscale',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/recraft/upscale/creative': {
    id: 'fal-ai/recraft/upscale/creative',
    label: 'Recraft Creative Upscale',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/recraft/upscale/crisp': {
    id: 'fal-ai/recraft/upscale/crisp',
    label: 'Recraft Crisp Upscale',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  },
  'fal-ai/ideogram/upscale': {
    id: 'fal-ai/ideogram/upscale',
    label: 'Ideogram 3.0 Upscale',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform'], // Apenas imagem
    maxImages: 1 // Aceita apenas uma imagem
  }
};

// Modelos de vídeo disponíveis
const VIDEO_MODELS = {
  // Modelos Replicate
  'wan-video/wan-2.2-i2v-a14b': {
    id: 'wan-video/wan-2.2-i2v-a14b',
    label: 'WAN Video I2V (Replicate)',
    provider: 'replicate',
    supportedInputs: [
      'text-primitive',
      'text-transform',
      'image-primitive',
      'image-transform',
      'video-primitive',
      'video-transform'
    ]
  },
  'fal-ai/luma-ray-2': {
    id: 'fal-ai/luma-ray-2',
    label: 'Luma Ray 2',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  'fal-ai/kling-2.1-master': {
    id: 'fal-ai/kling-2.1-master',
    label: 'Kling 2.1 Master',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  'fal-ai/minimax/hailuo-02/pro/text-to-video': {
    id: 'fal-ai/minimax/hailuo-02/pro/text-to-video',
    label: 'Hailuo 02 Pro',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  'moonvalley/marey/t2v': {
    id: 'moonvalley/marey/t2v',
    label: 'Marey T2V',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  'fal-ai/pika/v2.2/text-to-video': {
    id: 'fal-ai/pika/v2.2/text-to-video',
    label: 'Pika v2.2',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  'fal-ai/veo3': {
    id: 'fal-ai/veo3',
    label: 'Veo 3',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  'fal-ai/wan/v2.2-a14b/text-to-video': {
    id: 'fal-ai/wan/v2.2-a14b/text-to-video',
    label: 'WAN 2.2 A14B',
    provider: 'fal',
    supportedInputs: [
      'text-primitive',
      'text-transform'
    ]
  },
  // Image-to-Video models (require image input)
  'fal-ai/minimax/hailuo-02/pro/image-to-video': {
    id: 'fal-ai/minimax/hailuo-02/pro/image-to-video',
    label: 'Hailuo 02 Pro (I2V)',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  'moonvalley/marey/i2v': {
    id: 'moonvalley/marey/i2v',
    label: 'Marey I2V',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  'fal-ai/pika/v2.2/image-to-video': {
    id: 'fal-ai/pika/v2.2/image-to-video',
    label: 'Pika v2.2 (I2V)',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  'fal-ai/veo3/image-to-video': {
    id: 'fal-ai/veo3/image-to-video',
    label: 'Veo 3 (I2V)',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  'fal-ai/wan/v2.2-a14b/image-to-video': {
    id: 'fal-ai/wan/v2.2-a14b/image-to-video',
    label: 'WAN 2.2 A14B (I2V)',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  'fal-ai/luma-dream-machine/ray-2/image-to-video': {
    id: 'fal-ai/luma-dream-machine/ray-2/image-to-video',
    label: 'Luma Ray 2 (I2V)',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  'fal-ai/kling-video/v2.1/master/image-to-video': {
    id: 'fal-ai/kling-video/v2.1/master/image-to-video',
    label: 'Kling 2.1 Master (I2V)',
    provider: 'fal',
    supportedInputs: [
      'image-primitive',
      'image-transform'
    ]
  },
  // Video-to-Video models (require video input)
  'fal-ai/topaz/upscale/video': {
    id: 'fal-ai/topaz/upscale/video',
    label: 'Topaz Video Upscale',
    provider: 'fal',
    supportedInputs: [
      'video-primitive',
      'video-transform'
    ]
  }
  
  // Futuros modelos text-to-video serão adicionados aqui
  // 'future-text-to-video-model': {
  //   id: 'future-text-to-video-model',
  //   label: 'Text to Video Model',
  //   supportedInputs: ['none', 'text-primitive', 'text-transform']
  // }
};

/**
 * Filtra modelos de imagem baseado no tipo de conexão anterior
 * @param connectionType - Tipo de conexão detectada
 * @param availableModels - Modelos disponíveis no componente
 * @returns Modelos filtrados
 */
export const filterImageModels = (
  connectionType: NodeConnectionType,
  availableModels: Record<string, any>
): Record<string, any> => {
  const filteredModels: Record<string, any> = {};
  // Quando não há conexões anteriores, tratar como 'text-primitive'
  // para exibir modelos text-to-image por padrão.
  const effectiveType = connectionType === 'none' ? 'text-primitive' : connectionType;
  
  Object.entries(availableModels).forEach(([modelId, modelConfig]) => {
    const modelInfo = IMAGE_MODELS[modelId as keyof typeof IMAGE_MODELS];
    
    if (modelInfo && modelInfo.supportedInputs.includes(effectiveType)) {
      filteredModels[modelId] = {
        ...modelConfig,
        provider: modelInfo.provider,
        label: modelInfo.label
      };
    }
  });
  
  return filteredModels;
};

/**
 * Filtra modelos de vídeo baseado no tipo de conexão anterior
 * @param connectionType - Tipo de conexão detectada
 * @param availableModels - Modelos disponíveis no componente
 * @returns Modelos filtrados
 */
export const filterVideoModels = (
  connectionType: NodeConnectionType,
  availableModels: Record<string, any>
): Record<string, any> => {
  const filteredModels: Record<string, any> = {};
  // Quando não há conexões anteriores, tratar como 'text-primitive'
  const effectiveType = connectionType === 'none' ? 'text-primitive' : connectionType;
  
  Object.entries(availableModels).forEach(([modelId, modelConfig]) => {
    const modelInfo = VIDEO_MODELS[modelId as keyof typeof VIDEO_MODELS];
    
    if (modelInfo && modelInfo.supportedInputs.includes(effectiveType)) {
      filteredModels[modelId] = {
        ...modelConfig,
        provider: modelInfo.provider,
        label: modelInfo.label
      };
    }
  });
  
  return filteredModels;
};

/**
 * Hook para obter modelos filtrados baseado no nó atual
 * @param currentNode - Nó atual
 * @param allNodes - Todos os nós
 * @param allEdges - Todas as conexões
 * @param nodeType - Tipo do nó ('image' ou 'video')
 * @param availableModels - Modelos disponíveis
 * @returns Modelos filtrados
 */
export const useFilteredModels = (
  currentNode: Node | null,
  allNodes: Node[],
  allEdges: Edge[],
  nodeType: 'image' | 'video',
  availableModels: Record<string, any>
): Record<string, any> => {
  if (!currentNode) {
    return availableModels;
  }
  
  const connectionType = detectPreviousNodeType(currentNode, allNodes, allEdges);
  
  switch (nodeType) {
    case 'image':
      return filterImageModels(connectionType, availableModels);
    case 'video':
      return filterVideoModels(connectionType, availableModels);
    default:
      return availableModels;
  }
};

/**
 * Obtém o primeiro modelo disponível após filtragem
 * @param filteredModels - Modelos filtrados
 * @returns ID do primeiro modelo ou null se nenhum disponível
 */
export const getFirstAvailableModel = (filteredModels: Record<string, any>): string | null => {
  const modelIds = Object.keys(filteredModels);
  
  if (modelIds.length === 0) {
    return null;
  }
  
  // Procurar por modelo padrão primeiro
  const defaultModel = Object.entries(filteredModels).find(
    ([_, model]) => model.default
  );
  
  if (defaultModel) {
    return defaultModel[0];
  }
  
  // Se não há modelo padrão, retornar o primeiro
  return modelIds[0];
};

/**
 * Verifica se há modelos disponíveis para o tipo de conexão
 * @param connectionType - Tipo de conexão
 * @param nodeType - Tipo do nó
 * @returns true se há modelos disponíveis
 */
export const hasAvailableModels = (
  connectionType: NodeConnectionType,
  nodeType: 'image' | 'video'
): boolean => {
  switch (nodeType) {
    case 'image':
      return Object.values(IMAGE_MODELS).some(
        model => model.supportedInputs.includes(connectionType)
      );
    case 'video':
      return Object.values(VIDEO_MODELS).some(
        model => model.supportedInputs.includes(connectionType)
      );
    default:
      return false;
  }
};

/**
 * Obtém o número máximo de imagens que um modelo aceita
 * @param modelId - ID do modelo
 * @param nodeType - Tipo do nó ('image' ou 'video')
 * @returns Número máximo de imagens ou undefined se não especificado
 */
export const getModelMaxImages = (
  modelId: string,
  nodeType: 'image' | 'video' = 'image'
): number | undefined => {
  switch (nodeType) {
    case 'image':
      return IMAGE_MODELS[modelId as keyof typeof IMAGE_MODELS]?.maxImages;
    case 'video':
      return VIDEO_MODELS[modelId as keyof typeof VIDEO_MODELS]?.maxImages;
    default:
      return undefined;
  }
};

/**
 * Verifica se um modelo é de upscale (não precisa de prompt)
 * @param modelId - ID do modelo
 * @returns true se for modelo de upscale, false caso contrário
 */
export const isUpscaleModel = (modelId: string): boolean => {
  const upscaleModels = [
    'fal-ai/topaz/upscale/image',
    'fal-ai/topaz/upscale/video',
    'fal-ai/recraft/upscale/creative',
    'fal-ai/recraft/upscale/crisp',
    'fal-ai/ideogram/upscale'
  ];
  
  return upscaleModels.includes(modelId);
};
