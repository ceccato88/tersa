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
}

// Modelos de imagem disponíveis
const IMAGE_MODELS = {
  // Modelos Replicate
  'black-forest-labs/flux-dev': {
    id: 'black-forest-labs/flux-dev',
    label: 'FLUX.1 [dev] (Replicate)',
    provider: 'replicate',
    supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
  },
  'black-forest-labs/flux-krea-dev': {
    id: 'black-forest-labs/flux-krea-dev',
    label: 'FLUX Krea Dev (Replicate)',
    provider: 'replicate',
    supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
  },
  'black-forest-labs/flux-1.1-pro': {
    id: 'black-forest-labs/flux-1.1-pro',
    label: 'FLUX 1.1 Pro (Replicate)',
    provider: 'replicate',
    supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
  },
  // Modelos FAL
  'fal-ai/flux-dev': {
    id: 'fal-ai/flux-dev',
    label: 'FLUX.1 [dev] (FAL)',
    provider: 'fal',
    supportedInputs: ['none', 'text-primitive', 'text-transform']
  },
  'fal-ai/flux-schnell': {
    id: 'fal-ai/flux-schnell',
    label: 'FLUX Schnell (FAL)',
    provider: 'fal',
    supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
  }
};

// Modelos de vídeo disponíveis
const VIDEO_MODELS = {
  // Modelos Replicate
  'wan-video/wan-2.2-i2v-a14b': {
    id: 'wan-video/wan-2.2-i2v-a14b',
    label: 'WAN Video I2V (Replicate)',
    provider: 'replicate',
    supportedInputs: ['image-primitive', 'image-transform']
  },
  // Modelos FAL
  'fal-ai/stable-video-diffusion': {
    id: 'fal-ai/stable-video-diffusion',
    label: 'Stable Video Diffusion (FAL)',
    provider: 'fal',
    supportedInputs: ['image-primitive', 'image-transform']
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
  
  Object.entries(availableModels).forEach(([modelId, modelConfig]) => {
    const modelInfo = IMAGE_MODELS[modelId as keyof typeof IMAGE_MODELS];
    
    if (modelInfo && modelInfo.supportedInputs.includes(connectionType)) {
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
  
  Object.entries(availableModels).forEach(([modelId, modelConfig]) => {
    const modelInfo = VIDEO_MODELS[modelId as keyof typeof VIDEO_MODELS];
    
    if (modelInfo && modelInfo.supportedInputs.includes(connectionType)) {
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