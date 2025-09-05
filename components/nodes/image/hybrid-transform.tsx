import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
import { download } from '@/lib/download';
import { getModelSchema, getModelDefaults } from '@/lib/model-schemas';
import { useFilteredModels, getFirstAvailableModel } from '@/lib/model-filtering';
import { providers } from '@/lib/providers';
import { getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow, useNodes } from '@xyflow/react';
import {
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { ImageNodeProps } from '.';
import { ModelSelector } from '../model-selector';
import { AdvancedParamsPopup } from './advanced-params-popup';

type HybridImageTransformProps = ImageNodeProps & {
  title: string;
};

const AVAILABLE_MODELS = {
  'fal-ai/flux-dev': {
    label: 'FLUX.1 [dev]',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square 1:1', value: 'square' },
      { label: 'Square 1:1 HD', value: 'square_hd' },
      { label: '4:3', value: 'landscape_4_3' },
      { label: '3:4', value: 'portrait_4_3' },
      { label: '16:9', value: 'landscape_16_9' },
      { label: '9:16', value: 'portrait_16_9' },
    ],
    default: true,
  },
  'fal-ai/flux-pro-kontext': {
    label: 'FLUX.1 Kontext [pro]',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
      { label: '4:3', value: '4:3' },
      { label: '3:2', value: '3:2' },
      { label: '1:1', value: '1:1' },
      { label: '2:3', value: '2:3' },
      { label: '3:4', value: '3:4' },
      { label: '9:16', value: '9:16' },
      { label: '9:21', value: '9:21' },
    ],
    default: false,
  },
  'fal-ai/flux-pro-kontext-max': {
    label: 'FLUX.1 Kontext [max]',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
      { label: '4:3', value: '4:3' },
      { label: '3:2', value: '3:2' },
      { label: '1:1', value: '1:1' },
      { label: '2:3', value: '2:3' },
      { label: '3:4', value: '3:4' },
      { label: '9:16', value: '9:16' },
      { label: '9:21', value: '9:21' },
    ],
    default: false,
  },
  'fal-ai/flux-pro-v1.1': {
    label: 'FLUX1.1 [pro]',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    default: false,
  },
  'fal-ai/flux-pro-v1.1-ultra': {
    label: 'FLUX1.1 [pro] ultra',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
      { label: '4:3', value: '4:3' },
      { label: '3:2', value: '3:2' },
      { label: '1:1', value: '1:1' },
      { label: '2:3', value: '2:3' },
      { label: '3:4', value: '3:4' },
      { label: '9:16', value: '9:16' },
      { label: '9:21', value: '9:21' },
    ],
    default: false,
  },
  'fal-ai/flux-schnell': {
    label: 'FLUX Schnell',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square 1:1', value: 'square' },
      { label: 'Square 1:1 HD', value: 'square_hd' },
      { label: '4:3', value: 'landscape_4_3' },
      { label: '3:4', value: 'portrait_4_3' },
      { label: '16:9', value: 'landscape_16_9' },
      { label: '9:16', value: 'portrait_16_9' },
    ],
    default: false,
  },
  'fal-ai/nano-banana': {
    label: 'Nano Banana',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Tamanho único', value: 'fixed' },
    ],
    default: false,
  },
  'fal-ai/wan-2.2-text-to-image': {
    label: 'Wan 2.2',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    default: false,
  },
  'fal-ai/imagen4': {
    label: 'Imagen 4',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '3:4', value: '3:4' },
      { label: '4:3', value: '4:3' },
    ],
    default: false,
  },
  'fal-ai/imagen4-ultra': {
    label: 'Imagen 4 Ultra',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '3:4', value: '3:4' },
      { label: '4:3', value: '4:3' },
    ],
    default: false,
  },
  'fal-ai/ideogram-v3': {
    label: 'Ideogram 3',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    default: false,
  },
  'fal-ai/seedream-3.0': {
    label: 'Seedream 3.0',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    default: false,
  },
  'fal-ai/luma-photon': {
    label: 'Luma Photon',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '1:1', value: '1:1' },
      { label: '4:3', value: '4:3' },
      { label: '3:4', value: '3:4' },
      { label: '21:9', value: '21:9' },
      { label: '9:21', value: '9:21' },
    ],
    default: false,
  },
  'fal-ai/recraft-v3': {
    label: 'Recraft V3',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    default: false,
  },
  'fal-ai/flux-krea': {
    label: 'FLUX.1 Krea',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    default: false,
  },
};

const getDefaultModel = () => {
  const defaultModel = Object.entries(AVAILABLE_MODELS).find(
    ([_, model]) => model.default
  );
  return defaultModel?.[0] || 'black-forest-labs/flux-dev';
};

export const HybridImageTransform = ({
  data,
  id,
  type,
  title,
}: HybridImageTransformProps) => {
  const { updateNodeData, getNodes, getEdges, addNodes, addEdges } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const project = useProject();
  const analytics = useAnalytics();
  
  // Obter nó atual e aplicar filtragem de modelos
  const allNodes = getNodes();
  const allEdges = getEdges();
  const currentNode = allNodes.find(node => node.id === id);
  const filteredModels = useFilteredModels(currentNode || null, allNodes, allEdges, 'image', AVAILABLE_MODELS);
  
  // Usar modelo filtrado ou padrão
  const defaultModelId = getFirstAvailableModel(filteredModels) || getDefaultModel();
  const modelId = data.model ?? defaultModelId;
  // Apenas modelos FAL são suportados
  const seed = data.seed || '';
  
  // Calcular aspectRatio baseado no modelo
  const imageAspectRatio = useMemo(() => {
    if (modelId === 'fal-ai/nano-banana') {
      // Nano Banana tem tamanho fixo (1:1)
      return '1';
    } else if (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') {
      // FLUX.1 Kontext [pro], [max], FLUX1.1 [pro] ultra, Imagen 4, Imagen 4 Ultra e Luma Photon usam aspect_ratio diretamente
      const aspectRatio = data.aspect_ratio || (modelId === 'fal-ai/flux-pro-v1.1-ultra' ? '16:9' : '1:1');
      return aspectRatio.replace(':', '/');
    } else {
      // Outros modelos usam image_size
      const imageSize = data.image_size || 'landscape_4_3';
      const aspectRatioMap: Record<string, string> = {
        'square': '1',
        'square_hd': '1',
        'landscape_4_3': '4/3',
        'portrait_4_3': '3/4',
        'landscape_16_9': '16/9',
        'portrait_16_9': '9/16',
      };
      return aspectRatioMap[imageSize] || '4/3';
    }
  }, [modelId, data.image_size, data.aspect_ratio]);
  
  // Usar num_images para controlar quantas gerações fazer (cria novos nós)
  const quantity = data.num_images || 1;

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      updateNodeData(id, { instructions: event.target.value });
    },
    [id, updateNodeData]
  );

  const handleCopy = useCallback(() => {
    if (data.generated?.url) {
      navigator.clipboard.writeText(data.generated.url);
      toast.success('URL da imagem copiada para a área de transferência');
    }
  }, [data.generated?.url]);

  // Transferência automática de prompt de nós conectados
  useEffect(() => {
    const nodes = getNodes();
    const edges = getEdges();
    const incomers = getIncomers({ id }, nodes, edges);
    const textPrompts = getTextFromTextNodes(incomers);
    
    if (textPrompts.length > 0 && !data.instructions) {
      // Se há prompts dos nós anteriores e o campo instructions está vazio,
      // transferir automaticamente o primeiro prompt
      updateNodeData(id, { instructions: textPrompts[0] });
    }
  }, [id, getNodes, getEdges, data.instructions, updateNodeData]);

  const handleGenerate = useCallback(async () => {
    if (loading || !project?.id) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textNodes = getTextFromTextNodes(incomers);
    const imageNodes = getImagesFromImageNodes(incomers);

    try {
      if (!data.instructions?.trim()) {
        toast.error('Campo obrigatório', {
          description: 'Por favor, digite suas instruções antes de gerar a imagem.'
        });
        return;
      }
      
      if (!textNodes.length && !imageNodes.length && !data.instructions) {
        throw new Error('Nenhum prompt fornecido');
      }

      setLoading(true);

      analytics.track('canvas', 'node', 'generate', {
        type,
        textPromptsLength: textNodes.length,
        imagePromptsLength: imageNodes.length,
        model: modelId,
        instructionsLength: data.instructions?.length ?? 0,
        aspectRatio: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? (data.aspect_ratio || (modelId === 'fal-ai/flux-pro-v1.1-ultra' ? '16:9' : '1:1')) : (data.image_size || 'landscape_4_3'),
        seed: seed ?? null,
        quantity: quantity,
      });

      // Gerar múltiplas variações
      const variations: any[] = [];
      
      // Preparar seedString fora do loop para usar depois
      const seedString = String(seed || '').trim();
      
      for (let i = 0; i < quantity; i++) {
        // Lógica de seed para variações:
        // - Se não há seed definido (vazio) = sempre null para todos
        // - Se há seed definido E é a primeira variação (i = 0) = usar o seed definido
        // - Se há seed definido E são variações adicionais (i > 0) = gerar seed aleatório
        let currentSeed;
        
        if (!seedString || seedString === '' || seedString === 'null' || seedString === 'undefined') {
          currentSeed = null; // Sem seed = sempre null para todos
        } else if (i === 0) {
          currentSeed = seedString; // Primeira variação = seed definido
        } else {
          currentSeed = Math.floor(Math.random() * 1000000).toString(); // Variações = seed aleatório
        }
        
        let response;
        
        // Usar FAL API (apenas FAL disponível)
          // Usar FAL API via route
          const falResponse = await fetch('/api/fal-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: data.instructions || '',
              params: {
                model: modelId,
                aspectRatio: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? undefined : (data.image_size || 'landscape_4_3'),
                aspect_ratio: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? (data.aspect_ratio || (modelId === 'fal-ai/flux-pro-v1.1-ultra' ? '16:9' : '1:1')) : undefined,
                image_size: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? undefined : (data.image_size || 'landscape_4_3'),
                ...(currentSeed !== null && { seed: currentSeed }),
                guidance: data.guidance_scale || data.guidance || 3.5,
                numInferenceSteps: data.num_inference_steps || data.numInferenceSteps || 28,
                outputFormat: data.output_format || data.outputFormat || 'jpeg',
                enableSafetyChecker: data.enable_safety_checker !== false,
                raw: (modelId === 'fal-ai/flux-pro-v1.1-ultra') ? (data.raw || false) : undefined,
                numOutputs: 1
              },
              imageNodes: imageNodes.length > 0 ? imageNodes : undefined
            })
          });
          
          if (!falResponse.ok) {
            throw new Error('Failed to generate image with FAL');
          }
          
          const falResult = await falResponse.json();
          
          // Transformar resposta FAL para o formato esperado pelo nó
          if (falResult.success && falResult.data && falResult.data.output) {
            const outputFormat = data.output_format || data.outputFormat || 'jpeg';
            
            // Calcular dimensões baseadas no aspect ratio selecionado
            let width = 1024;
            let height = 1024;
            
            // Usar o mesmo cálculo de aspect ratio que é usado no preview
            const previewAspectRatio = imageAspectRatio; // Este já está no formato "16/9"
            
            if (previewAspectRatio && previewAspectRatio.includes('/')) {
              const [w, h] = previewAspectRatio.split('/').map(Number);
              const aspectValue = w / h;
              if (aspectValue > 1) {
                // Landscape - manter largura fixa
                width = 1024;
                height = Math.round(1024 / aspectValue);
              } else if (aspectValue < 1) {
                // Portrait - manter altura fixa  
                height = 1024;
                width = Math.round(1024 * aspectValue);
              }
              // Se aspectValue === 1, mantém 1024x1024 (quadrado)
            }
            
            response = {
              nodeData: {
                generated: {
                  url: falResult.data.output,
                  type: `image/${outputFormat}`
                },
                width: width,
                height: height,
                contentType: 'image/jpeg',
                seed: falResult.data.seed,
                prompt: falResult.data.prompt,
                provider: 'fal',
                model: falResult.data.model
              }
            };
          } else {
            throw new Error('Nenhuma imagem foi gerada pela API FAL');
          }

        if ('error' in response) {
          throw new Error(response.error);
        }

        variations.push(response.nodeData);
      }
      
      // A primeira variação fica no nó atual
      const mainVariation = variations[0];
      updateNodeData(id, {
        ...mainVariation,
        // Preservar o seed original do usuário (não sobrescrever com o da API)
        seed: seed, // Manter o seed original (vazio ou definido pelo usuário)
        num_images: quantity, // Manter quantidade para referência
        updatedAt: new Date().toISOString(),
      });
      
      // Criar nós adicionais para as outras variações
      if (variations.length > 1) {
        const currentNode = getNodes().find(node => node.id === id);
        if (currentNode) {
          const newNodes = [];
          const newEdges = [];
          const baseY = currentNode.position.y;
          
          for (let i = 1; i < variations.length; i++) {
            const newNodeId = `${id}-variation-${i}`;
            const newNode = {
              id: newNodeId,
              type: 'image',
              position: {
                x: currentNode.position.x + (i * 420), // 384px (w-96) + 36px spacing
                y: baseY, // Usar Y fixo do nó original
              },
              origin: currentNode.origin || [0, 0.5], // Usar mesmo origin do nó original
              data: {
                ...variations[i],
                model: modelId,
                aspectRatio: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? undefined : (data.image_size || 'landscape_4_3'),
                aspect_ratio: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? (data.aspect_ratio || (modelId === 'fal-ai/flux-pro-v1.1-ultra' ? '16:9' : '1:1')) : undefined,
                image_size: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') ? undefined : (data.image_size || 'landscape_4_3'),
                seed: i === 0 ? (seedString !== '' && seedString !== 'null' && seedString !== 'undefined' ? seedString : '') : (seedString !== '' && seedString !== 'null' && seedString !== 'undefined' ? Math.floor(Math.random() * 1000000).toString() : ''),
                raw: (modelId === 'fal-ai/flux-pro-v1.1-ultra') ? (data.raw || false) : undefined,
                instructions: data.instructions,
                updatedAt: new Date().toISOString(),
              },
            };
            newNodes.push(newNode);
            
            // Criar conexões para os mesmos nós que estão conectados ao nó original
            const edges = getEdges();
            const incomingEdges = edges.filter(edge => edge.target === id);
            
            incomingEdges.forEach(edge => {
              newEdges.push({
                id: `${edge.id}-variation-${i}`,
                source: edge.source,
                target: newNodeId,
                type: edge.type || 'animated',
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
              });
            });
          }
          
          if (newNodes.length > 0) {
            addNodes(newNodes);
          }
          
          if (newEdges.length > 0) {
            addEdges(newEdges);
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  }, [loading, project?.id, id, data, modelId, seed, quantity, type, analytics, updateNodeData, getNodes, getEdges]);

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>['toolbar']>(() => {
    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [];

    if (data.generated) {
      items.push({
        tooltip: 'Download',
        children: (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => {
              // Usar o formato correto baseado nos dados do nó
              const format = data.output_format || data.outputFormat || 'png';
              download(data.generated, id, format);
            }}
          >
            <DownloadIcon size={12} />
          </Button>
        ),
      });

      items.push({
        tooltip: 'Copiar URL',
        children: (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleCopy}
          >
            <CopyIcon size={12} />
          </Button>
        ),
      });
    }

    if (data.updatedAt) {
      items.push({
        tooltip: `Última atualização: ${new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(data.updatedAt))}`,
        children: (
          <Button size="icon" variant="ghost" className="rounded-full">
            <ClockIcon size={12} />
          </Button>
        ),
      });
    }

    return items;
  }, [
    data.generated,
    data.updatedAt,
    id,
  ]);

  return (
    <NodeLayout
      id={id}
      title={title}
      type={type}
      selected={false}
      className="w-96"
      toolbar={toolbar}
    >
      {/* Imagem */}
      {loading && (
        <Skeleton
          className="flex w-full animate-pulse items-center justify-center rounded-b-xl"
          style={{ aspectRatio: imageAspectRatio }}
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2Icon
              size={20}
              className="animate-spin text-muted-foreground"
            />
            <p className="text-muted-foreground text-sm animate-pulse">
              Gerando imagem...
            </p>
          </div>
        </Skeleton>
      )}
      {!loading && !data.generated?.url && (
        <div
          className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4"
          style={{ aspectRatio: imageAspectRatio }}
        >
          <p className="text-muted-foreground text-sm">
            Pressione <PlayIcon size={12} className="-translate-y-px inline" /> para
            criar uma imagem
          </p>
        </div>
      )}
      {!loading && data.generated?.url && (
        <Image
          src={data.generated.url}
          alt="Imagem gerada"
          width={data.width || 1024}
          height={data.height || 1024}
          className="w-full rounded-b-xl object-cover"
          priority
          onError={(e) => {
            console.error('Erro ao carregar imagem:', e);
            console.error('URL da imagem com erro:', data.generated.url);
          }}
        />
      )}
      
      {/* Controles Compactos */}
      <div className="space-y-3 p-4">
        {/* Prompt */}
        <div className="space-y-1">
          <Textarea
            value={data.instructions ?? ''}
            onChange={handleInstructionsChange}
            placeholder="Digite as instruções (obrigatório)"
            className="shrink-0 resize-none border border-input bg-background px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:ring-ring rounded-md min-h-[100px]"
          />
        </div>
        
        {/* Modelo, Image Size e Quantidade */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Modelo</Label>
            <ModelSelector
              value={modelId}
              options={filteredModels}
              id={id}
              className="w-full h-8 text-xs"
              onChange={(value) => {
                const defaults = getModelDefaults(value);
                updateNodeData(id, { model: value, ...defaults });
              }}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tamanho</Label>
            <Select
              value={
                modelId === 'fal-ai/nano-banana'
                  ? (data.fixed_size || 'fixed')
                  : (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon')
                    ? (data.aspect_ratio || (modelId === 'fal-ai/flux-pro-v1.1-ultra' ? '16:9' : '1:1'))
                    : (data.image_size || 'landscape_4_3')
              }
              onValueChange={(value) => {
                if (modelId === 'fal-ai/nano-banana') {
                  updateNodeData(id, { fixed_size: value });
                } else if (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/luma-photon') {
                  updateNodeData(id, { aspect_ratio: value });
                } else {
                  updateNodeData(id, { image_size: value });
                }
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS[modelId]?.aspectRatios?.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Quantidade</Label>
            <Select
              value={String(data.num_images || 1)}
              onValueChange={(value) => {
                const numValue = parseInt(value, 10);
                updateNodeData(id, { num_images: numValue });
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Botões */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8 text-xs"
            onClick={handleGenerate}
            disabled={loading || !project?.id}
          >
            {loading ? (
              <>
                <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                {data.generated?.url ? (
                  <>
                    <RotateCcwIcon className="mr-1 h-3 w-3" />
                    Regenerar
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-1 h-3 w-3" />
                    Gerar
                  </>
                )}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => setShowAdvancedParams(true)}
          >
            <Settings size={14} />
          </Button>
        </div>
      </div>
      
      {/* Popup de Parâmetros Avançados */}
      <AdvancedParamsPopup
        isOpen={showAdvancedParams}
        onClose={() => setShowAdvancedParams(false)}
        nodeId={id}
        data={data}
        modelId={modelId}
      />
    </NodeLayout>
  );
};