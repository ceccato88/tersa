import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
import { download } from '@/lib/download';
import { handleError } from '@/lib/error/handle';
import { WanIcon } from '@/lib/icons';
import { getModelSchema, getModelDefaults } from '@/lib/model-schemas';
import { useFilteredModels, getFirstAvailableModel, hasAvailableModels } from '@/lib/model-filtering';
import { detectPreviousNodeType } from '@/lib/node-connection-detector';
import { providers } from '@/lib/providers';
import { getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow } from '@xyflow/react';
import {
  ClockIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  StopCircleIcon,
  CopyIcon,
  Settings,
} from 'lucide-react';
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import type { VideoNodeProps } from '.';
import { ModelSelector } from '../model-selector';
import { AdvancedVideoParamsPopup } from './advanced-params-popup';

type VideoTransformProps = VideoNodeProps & {
  title: string;
};

const AVAILABLE_MODELS = {
  'fal-ai/luma-ray-2': {
    label: 'Luma Ray 2',
    chef: providers.fal,
    providers: [providers.fal],
    default: true,
  },
  'fal-ai/kling-2.1-master': {
    label: 'Kling 2.1 Master',
    chef: providers.fal,
    providers: [providers.fal],
    default: false,
  },
};

const getDefaultModel = () => {
  const defaultModel = Object.entries(AVAILABLE_MODELS).find(
    ([_, model]) => model.default
  );

  if (!defaultModel) {
    throw new Error('Nenhum modelo padrão encontrado');
  }

  return defaultModel[0];
};

export const VideoTransform = ({
  data,
  id,
  type,
  title,
}: VideoTransformProps) => {
  const { updateNodeData, getNodes, getEdges, addNodes, addEdges } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const project = useProject();
  const analytics = useAnalytics();
  
  // Obter nó atual e aplicar filtragem de modelos
  const allNodes = getNodes();
  const allEdges = getEdges();
  const currentNode = allNodes.find(node => node.id === id);
  const filteredModels = useFilteredModels(currentNode || null, allNodes, allEdges, 'video', AVAILABLE_MODELS);
  
  // Detectar tipo de conexão para verificar se há modelos disponíveis
  const connectionType = currentNode ? detectPreviousNodeType(currentNode, allNodes, allEdges) : 'none';
  const hasModels = hasAvailableModels(connectionType, 'video');
  
  // Usar modelo filtrado ou padrão
  const defaultModelId = getFirstAvailableModel(filteredModels) || getDefaultModel();
  const modelId = data.model ?? defaultModelId;

  // Definir modelo inicial automaticamente se não estiver definido
  useEffect(() => {
    if (!data.model && defaultModelId) {
      console.log('🎯 Definindo modelo inicial (vídeo):', defaultModelId);
      const defaults = getModelDefaults(defaultModelId);
      updateNodeData(id, { model: defaultModelId, ...defaults });
    }
  }, [data.model, defaultModelId, id, updateNodeData]);

  const seed = data.seed || '';
  const numOutputs = data.numOutputs || 1;
  const resolution = data.resolution || '480p';
  const framesPerSecond = data.frames_per_second || 16;

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
          description: 'Por favor, digite suas instruções antes de gerar o vídeo.'
        });
        return;
      }
      
      // Imagem não é obrigatória para todos os modelos; se houver, será usada.

      setLoading(true);
      const controller = new AbortController();
      setAbortController(controller);

      analytics.track('canvas', 'node', 'generate', {
        type,
        textPromptsLength: textNodes.length,
        imagePromptsLength: imageNodes.length,
        model: modelId,
        instructionsLength: data.instructions?.length ?? 0,
        seed: seed ?? null,
        numOutputs: numOutputs,
        resolution: resolution,
        framesPerSecond: framesPerSecond,
      });

      // Gerar múltiplas variações
      const variations: any[] = [];
      
      // Preparar seedString fora do loop para usar depois
      const seedString = String(seed || '').trim();
      
      // Determinar qual action usar baseado no provider do modelo
      const selectedModel = AVAILABLE_MODELS[modelId];
      const isFalModel = selectedModel?.chef?.id === 'fal';
      
      for (let i = 0; i < numOutputs; i++) {
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

        // Preparar input para o modelo
        const modelDefaults = getModelDefaults(modelId);
        const input = {
          prompt: data.instructions || '',
          image: imageNodes[0], // Primeira imagem conectada (opcional)
          seed: currentSeed,
          resolution: resolution,
          frames_per_second: framesPerSecond,
          ...modelDefaults, // Adiciona campos ocultos
        };
      
        let result;
      
      if (isFalModel) {
        console.log('🔄 Chamando FAL Video API...');
        const falResponse = await fetch('/api/fal-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: data.instructions || '',
            params: (
              modelId === 'fal-ai/luma-ray-2'
                ? {
                    model: modelId,
                    aspect_ratio: data.aspect_ratio || '16:9',
                    resolution: data.resolution || '540p',
                    duration: data.duration || '5s',
                    loop: data.loop || false,
                  }
                : modelId === 'fal-ai/kling-2.1-master'
                ? {
                    model: modelId,
                    duration: data.duration || '5',
                    aspect_ratio: data.aspect_ratio || '16:9',
                    negative_prompt: data.negative_prompt || 'blur, distort, and low quality',
                    cfg_scale: data.cfg_scale ?? 0.5,
                  }
                : {
                    model: modelId,
                    imageUrl: imageNodes[0], // opcional
                    ...(currentSeed !== null && { seed: currentSeed }),
                    fps: framesPerSecond,
                    duration: 3,
                    motionStrength: 0.8,
                  }
            ),
            images: imageNodes.length > 0 ? imageNodes : undefined
          })
        });
        
        if (!falResponse.ok) {
          throw new Error('Failed to generate video with FAL');
        }
        
        const falResult = await falResponse.json();
        result = falResult.data;
      } else {
        console.log('🔄 Chamando generateVideoReplicateAction...');
        result = await generateVideoReplicateAction({
          modelId,
          prompt: data.instructions || '',
          instructions: data.instructions || '',
          nodeId: id,
          projectId: project.id,
          imageUrl: imageNodes[0], // URL da imagem de entrada (opcional)
          seed: currentSeed,
          numOutputs,
          resolution: resolution,
          frames_per_second: framesPerSecond,
        });
      }

        if (result.error) {
          throw new Error(result.error);
        }
        // Normalizar para nodeData esperado
        if (isFalModel) {
          variations.push({ generated: { url: result.output } });
        } else {
          variations.push(result.nodeData);
        }
      }
      
      // A primeira variação fica no nó atual
      const mainVariation = variations[0];
      updateNodeData(id, {
        ...mainVariation,
        // Preservar o seed original do usuário (não sobrescrever com o da API)
        seed: seed, // Manter o seed original (vazio ou definido pelo usuário)
        numOutputs,
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
              type: 'video',
              position: {
                x: currentNode.position.x + (i * 420), // 384px + 36px spacing
                y: baseY, // Usar Y fixo do nó original
              },
              origin: currentNode.origin || [0, 0.5], // Usar mesmo origin do nó original
              data: {
                ...variations[i],
                model: modelId,
                seed: i === 0 ? seedString : (seedString !== '' && seedString !== 'null' && seedString !== 'undefined' ? Math.floor(Math.random() * 1000000).toString() : ''),
                instructions: data.instructions,
                numOutputs: 1,
                resolution: resolution,
                frames_per_second: framesPerSecond,
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
          
          toast.success(`${variations.length} vídeos gerados com sucesso`);
        }
      } else {
        toast.success('Vídeo gerado com sucesso');
      }

      // Credits removed: no SWR revalidation needed
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('Geração de vídeo cancelada');
      } else {
        handleError('Erro ao gerar vídeo', error);
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, [
    loading,
    project?.id,
    id,
    analytics,
    type,
    data.instructions,
    numOutputs,
    getEdges,
    modelId,
    getNodes,
    addNodes,
    updateNodeData,
    seed,
    resolution,
    framesPerSecond,
  ]);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      toast.info('Geração de vídeo cancelada');
    }
  }, [abortController]);

  const handleCopy = useCallback(() => {
    if (data.generated?.url) {
      navigator.clipboard.writeText(data.generated.url);
      toast.success('URL do vídeo copiada para a área de transferência');
    }
  }, [data.generated?.url]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

  // Transferência automática de prompt de nós conectados
  // Usando useCallback para evitar loop infinito durante cascata de updates
  const transferPrompt = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
    const incomers = getIncomers({ id }, nodes, edges);
    const textPrompts = getTextFromTextNodes(incomers);
    
    if (textPrompts.length > 0 && !data.instructions) {
      // Se há prompts dos nós anteriores e o campo instructions está vazio,
      // transferir automaticamente o primeiro prompt
      updateNodeData(id, { instructions: textPrompts[0] });
    }
  }, [id, data.instructions, updateNodeData, getNodes, getEdges]);

  // Executar transferência apenas quando instructions muda de definido para undefined
  // Isso evita loops infinitos durante deletion de nós
  useEffect(() => {
    // Só executar se instructions está explicitamente undefined/empty e não durante cascatas
    if (!data.instructions && !data.generated?.url) {
      transferPrompt();
    }
  }, [data.instructions, data.generated?.url, transferPrompt]);

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>['toolbar']>(() => {
    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [];

    if (data.generated?.url) {
      items.push({
        tooltip: 'Download',
        children: (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => download(data.generated, id, 'mp4')}
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
    handleCopy,
    id,
  ]);

  // Calcular aspect ratio baseado na seleção do modelo (Luma Ray 2 usa aspect_ratio)
  const aspectRatio = useMemo(() => {
    const ratio = (data as any).aspect_ratio || '16:9';
    const map: Record<string, string> = {
      '16:9': '16/9',
      '9:16': '9/16',
      '4:3': '4/3',
      '3:4': '3/4',
      '21:9': '21/9',
      '9:21': '9/21',
    };
    return map[ratio] || '16/9';
  }, [data?.aspect_ratio]);

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {loading && (
        <Skeleton
          className="flex w-full animate-pulse items-center justify-center rounded-b-xl"
          style={{ aspectRatio }}
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2Icon
              size={20}
              className="animate-spin text-muted-foreground"
            />
            <p className="text-muted-foreground text-sm animate-pulse">
              Gerando vídeo...
            </p>
          </div>
        </Skeleton>
      )}
      {!loading && !data.generated?.url && (
        <div
          className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4"
          style={{ aspectRatio }}
        >
          <p className="text-muted-foreground text-sm">
            Pressione <PlayIcon size={12} className="-translate-y-px inline" /> para
            criar um vídeo
          </p>
        </div>
      )}
      {!loading && data.generated?.url && (
        <div className="w-full rounded-b-xl overflow-hidden" style={{ aspectRatio }}>
          <video
            src={data.generated.url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Erro ao carregar vídeo:', e);
              console.error('URL do vídeo com erro:', data.generated.url);
            }}
            onLoadedData={() => {
              console.log('Vídeo carregado com sucesso:', data.generated.url);
            }}
          />
        </div>
      )}
      <div className={`space-y-4 p-4 ${loading ? 'opacity-50' : ''}`}>
        <Textarea
          value={data.instructions ?? ''}
          onChange={handleInstructionsChange}
          placeholder="Digite as instruções (obrigatório)"
          className="shrink-0 resize-none border border-input bg-background px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:ring-ring rounded-md min-h-[100px]"
        />
        
        {/* Frente do nó: Modelo, Aspect Ratio, Quantidade */}
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
            <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
            <Select
              value={String(data.aspect_ratio || '16:9')}
              onValueChange={(value) => updateNodeData(id, { aspect_ratio: value })}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(getModelSchema(modelId)?.aspectRatios || []).map((ratio) => (
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
              value={String(numOutputs)}
              onValueChange={(value) => updateNodeData(id, { numOutputs: parseInt(value) })}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Botão Gerar horizontal */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleGenerate} disabled={loading || !project?.id}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                {data.generated?.url ? (
                  <>
                    <RotateCcwIcon className="mr-2 h-4 w-4" />
                    Regenerar
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Gerar
                  </>
                )}
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="h-10 px-2" onClick={() => setShowAdvancedParams(true)}>
            <Settings size={14} />
          </Button>
        </div>
      </div>
      <AdvancedVideoParamsPopup
        isOpen={showAdvancedParams}
        onClose={() => setShowAdvancedParams(false)}
        nodeId={id}
        data={data}
        modelId={modelId}
      />
    </NodeLayout>
  );
};
