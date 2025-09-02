// Removido import do Replicate - usando apenas FAL
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
import { getModelSchema, getModelDefaults } from '@/lib/model-schemas';
import { useFilteredModels, getFirstAvailableModel } from '@/lib/model-filtering';
import { providers } from '@/lib/providers';
import { getDescriptionsFromImageNodes, getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow, useNodes } from '@xyflow/react';
import {
  ClockIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
import { mutate } from 'swr';
import type { ImageNodeProps } from '.';
import { ModelSelector } from '../model-selector';

type ImageTransformProps = ImageNodeProps & {
  title: string;
};

const AVAILABLE_MODELS = {
  // Modelos FAL
  'fal-ai/flux-dev': {
    label: 'FLUX.1 [dev] (FAL)',
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
  'fal-ai/flux-schnell': {
    label: 'FLUX Schnell (FAL)',
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
};

const OUTPUT_FORMATS = [
  { value: "webp", label: "WebP" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
];

const OUTPUT_QUALITIES = [
  { value: 80, label: "80 (Good)" },
  { value: 90, label: "90 (High)" },
  { value: 95, label: "95 (Very High)" },
  { value: 100, label: "100 (Maximum)" },
];

const MEGAPIXELS_OPTIONS = [
  { value: 0.25, label: "0.25 MP" },
  { value: 0.5, label: "0.5 MP" },
  { value: 1, label: "1 MP" },
  { value: 2, label: "2 MP" },
];

const getDefaultModel = () => {
  const defaultModel = Object.entries(AVAILABLE_MODELS).find(
    ([_, model]) => model.default
  );

  if (!defaultModel) {
    throw new Error('Nenhum modelo padrão encontrado');
  }

  return defaultModel[0];
};

export const ImageTransform = ({
  data,
  id,
  type,
  title,
}: ImageTransformProps) => {
  const { updateNodeData, getNodes, getEdges, addNodes } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
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
  const hasIncomingImageNodes =
    getImagesFromImageNodes(getIncomers({ id }, getNodes(), getEdges()))
      .length > 0;

  const aspectRatio = data.aspectRatio || '1:1';
  const seed = data.seed || '';
  const numOutputs = data.numOutputs || 1;

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
        aspectRatio: aspectRatio,
        seed: seed ?? null,
        numOutputs: numOutputs,
      });

      // Gerar múltiplas variações
      const variations: any[] = [];
      
      for (let i = 0; i < numOutputs; i++) {
        let response;
        
        // Usar FAL API via route (apenas FAL disponível)
        const falResponse = await fetch('/api/fal-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: data.instructions || '',
            params: {
              model: modelId,
              aspectRatio: aspectRatio,
              seed: seed,
              guidanceScale: data.guidance || 3.5,
              steps: data.numInferenceSteps || 28,
              strength: data.promptStrength || 0.8,
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
          response = {
            nodeData: {
              url: falResult.data.output,
              width: 1024, // Valor padrão, será ajustado quando a imagem carregar
              height: 1024, // Valor padrão, será ajustado quando a imagem carregar
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
        numOutputs,
        updatedAt: new Date().toISOString(),
      });
      
      // Criar nós adicionais para as outras variações
      if (variations.length > 1) {
        const currentNode = getNodes().find(node => node.id === id);
        if (currentNode) {
          const newNodes = [];
          const baseY = currentNode.position.y; // Garantir mesmo Y para todos
          
          for (let i = 1; i < variations.length; i++) {
            const newNodeId = `${id}-variation-${i}`;
            const newNode = {
              id: newNodeId,
              type: 'image',
              position: {
                x: currentNode.position.x + (i * 420), // 384px (w-sm) + 36px spacing
                y: baseY, // Usar Y fixo do nó original
              },
              origin: currentNode.origin || [0, 0.5], // Usar mesmo origin do nó original
              data: {
                ...variations[i],
                model: modelId,
                instructions: data.instructions,
                aspectRatio: aspectRatio,
                updatedAt: new Date().toISOString(),
              },
            };
            
            newNodes.push(newNode);
          }
          
          addNodes(newNodes);
          
          toast.success(`${variations.length} imagens geradas com sucesso`);
        }
      } else {
        toast.success('Imagem gerada com sucesso');
      }

      setTimeout(() => mutate('credits'), 5000);
    } catch (error) {
      handleError('Erro ao gerar imagem', error);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    project?.id,
    aspectRatio,
    seed,
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
  ]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

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
              const format = data.outputFormat || data.output_format || 'png';
              download(data.generated, id, format);
            }}
          >
            <DownloadIcon size={12} />
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
  ]);

  const imageAspectRatio = useMemo(() => {
    if (!aspectRatio) {
      return '1/1';
    }

    const [width, height] = aspectRatio.split(':').map(Number);
    return `${width}/${height}`;
  }, [aspectRatio]);

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {loading && (
        <Skeleton
          className="flex w-full animate-pulse items-center justify-center rounded-b-xl min-h-[300px]"
          style={{ aspectRatio }}
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
          className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4 min-h-[300px]"
          style={{ aspectRatio }}
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
          width={1000}
          height={1000}
          className="w-full rounded-b-xl object-cover"
          priority
          onError={(e) => {
            console.error('Erro ao carregar imagem:', e);
            console.error('URL da imagem com erro:', data.generated.url);
          }}
        />
      )}
      <div className="space-y-4 p-4">
        <Textarea
          value={data.instructions ?? ''}
          onChange={handleInstructionsChange}
          placeholder="Digite as instruções (obrigatório)"
          className="shrink-0 resize-none border border-input bg-background px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:ring-ring rounded-md min-h-[100px]"
        />
        
        {/* Modelo e Aspect Ratio lado a lado */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Modelo</Label>
            <ModelSelector
              value={modelId}
              options={filteredModels}
              id={id}
              className="w-full h-10"
              onChange={(value) => {
                // Ao mudar o modelo, aplicar valores padrão do novo modelo
                const defaults = getModelDefaults(value);
                updateNodeData(id, { model: value, ...defaults });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select
              value={aspectRatio}
              onValueChange={(value) => updateNodeData(id, { aspectRatio: value })}
            >
              <SelectTrigger className="w-full h-10">
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
        </div>
        
        {/* Campos dinâmicos baseados no modelo selecionado */}
        {(() => {
          const modelSchema = getModelSchema(modelId);
          if (!modelSchema) {
            // Fallback para campos básicos se não houver esquema
            return (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seed</Label>
                    <Input
                      type="text"
                      placeholder="Deixe vazio para aleatório"
                      value={seed}
                      onChange={(e) => updateNodeData(id, { seed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Select
                      value={numOutputs.toString()}
                      onValueChange={(value) => updateNodeData(id, { numOutputs: parseInt(value) })}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'geração' : 'gerações'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            );
          }

          // Renderização dinâmica baseada no esquema
          const fieldPairs: Array<[any, any]> = [];
          const fields = modelSchema.fields;
          
          for (let i = 0; i < fields.length; i += 2) {
            fieldPairs.push([fields[i], fields[i + 1] || null]);
          }

          return fieldPairs.map((pair, pairIndex) => (
            <div key={pairIndex} className="grid grid-cols-2 gap-4">
              {pair.map((field, fieldIndex) => {
                if (!field) return <div key={fieldIndex}></div>;
                
                const fieldValue = field.name === 'seed' ? seed : 
                                 field.name === 'numOutputs' ? numOutputs :
                                 data[field.name] ?? field.defaultValue;

                return (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.type === 'input' && (
                      <Input
                        type="text"
                        placeholder={field.placeholder}
                        value={fieldValue || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (field.name === 'seed') {
                            updateNodeData(id, { seed: value });
                          } else {
                            updateNodeData(id, { [field.name]: value });
                          }
                        }}
                      />
                    )}
                    {field.type === 'number' && (
                      <Select
                        value={fieldValue.toString()}
                        onValueChange={(value) => {
                          if (field.name === 'numOutputs') {
                            updateNodeData(id, { numOutputs: parseInt(value) });
                          } else {
                            updateNodeData(id, { [field.name]: parseInt(value) });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.name === 'numOutputs' ? 
                            [1, 2, 3, 4].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'geração' : 'gerações'}
                              </SelectItem>
                            )) : null
                          }
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'select' && (
                      <Select
                        value={String(fieldValue)}
                        onValueChange={(value) => {
                          const parsedValue = isNaN(Number(value)) ? value : Number(value);
                          updateNodeData(id, { [field.name]: parsedValue });
                        }}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field.name}
                          checked={fieldValue || false}
                          onChange={(e) => {
                            updateNodeData(id, { [field.name]: e.target.checked });
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={field.name} className="text-sm">
                          {field.label}
                        </Label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}
        
        {/* Botão Gerar horizontal */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={loading || !project?.id}
        >
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
      </div>
    </NodeLayout>
  );
};
