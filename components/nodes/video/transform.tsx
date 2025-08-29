import { generateVideoReplicateAction } from '@/app/actions/video/replicate';
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
} from 'lucide-react';
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useMemo,
  useState,
  useRef,
} from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import type { VideoNodeProps } from '.';
import { ModelSelector } from '../model-selector';

type VideoTransformProps = VideoNodeProps & {
  title: string;
};

const AVAILABLE_MODELS = {
  'wan-video/wan-2.2-i2v-a14b': {
    label: 'WAN Video I2V',
    chef: providers.replicate,
    icon: WanIcon,
    providers: [{
      ...providers.replicate,
      icon: WanIcon,
    }],
    default: true,
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
  const { updateNodeData, getNodes, getEdges, addNodes } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const project = useProject();
  const modelId = data.model ?? getDefaultModel();
  const analytics = useAnalytics();
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
      
      if (!imageNodes.length) {
        toast.error('Imagem obrigatória', {
          description: 'Por favor, conecte uma imagem de entrada para gerar o vídeo.'
        });
        return;
      }

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

      // Preparar input para o modelo
      const modelDefaults = getModelDefaults(modelId);
      const input = {
        prompt: [data.instructions, ...textNodes].join('\n'),
        image: imageNodes[0], // Primeira imagem conectada
        seed: seed || null,
        resolution: resolution,
        frames_per_second: framesPerSecond,
        ...modelDefaults, // Adiciona campos ocultos
      };

      // Usar a action diretamente como na imagem
      console.log('🔄 Chamando generateVideoReplicateAction...');
      const result = await generateVideoReplicateAction({
        modelId,
        prompt: textNodes.join('\n'),
        instructions: data.instructions || '',
        nodeId: id,
        projectId: project.id,
        imageUrl: imageNodes[0], // URL da imagem de entrada
        seed: seed,
        numOutputs,
        resolution: resolution,
        frames_per_second: framesPerSecond,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Atualizar o nó com os dados retornados da action
      console.log('💾 Atualizando nó com dados da action:', result.nodeData);
      updateNodeData(id, result.nodeData);
      
      console.log('✅ Vídeo salvo e nó atualizado com sucesso');
      toast.success('Vídeo gerado com sucesso');

      setTimeout(() => mutate('credits'), 5000);
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

  // Calcular aspect ratio baseado na resolução
  const aspectRatio = useMemo(() => {
    if (resolution === '720p') {
      return '16/9'; // 1280x720
    }
    return '16/9'; // 832x480 para 480p também é aproximadamente 16:9
  }, [resolution]);

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
              Gerando vídeo...
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
            criar um vídeo
          </p>
        </div>
      )}
      {!loading && data.generated?.url && (
        <video
          src={data.generated.url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full rounded-b-xl"
          onError={(e) => {
            console.error('Erro ao carregar vídeo:', e);
            console.error('URL do vídeo com erro:', data.generated.url);
          }}
          onLoadedData={() => {
            console.log('Vídeo carregado com sucesso:', data.generated.url);
          }}
        />
      )}
      <div className={`space-y-4 p-4 ${loading ? 'opacity-50' : ''}`}>
        <Textarea
          value={data.instructions ?? ''}
          onChange={handleInstructionsChange}
          placeholder="Digite as instruções (obrigatório)"
          className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        />
        
        {/* Modelo */}
        <div className="space-y-2">
          <Label>Modelo</Label>
          <ModelSelector
            value={modelId}
            options={AVAILABLE_MODELS}
            id={id}
            className="w-full"
            onChange={(value) => {
              // Ao mudar o modelo, aplicar valores padrão do novo modelo
              const defaults = getModelDefaults(value);
              updateNodeData(id, { model: value, ...defaults });
            }}
          />
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
                      <SelectTrigger className="w-full">
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
                                 field.name === 'resolution' ? resolution :
                                 field.name === 'frames_per_second' ? framesPerSecond :
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
                          } else if (field.name === 'frames_per_second') {
                            updateNodeData(id, { frames_per_second: parseInt(value) });
                          } else {
                            updateNodeData(id, { [field.name]: parseInt(value) });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.name === 'numOutputs' ? 
                            [1, 2, 3, 4].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'geração' : 'gerações'}
                              </SelectItem>
                            )) : 
                            field.name === 'frames_per_second' ?
                            [5, 8, 12, 16, 20, 24].map((fps) => (
                              <SelectItem key={fps} value={fps.toString()}>
                                {fps} FPS
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
                          if (field.name === 'resolution') {
                            updateNodeData(id, { resolution: value });
                          } else {
                            const parsedValue = isNaN(Number(value)) ? value : Number(value);
                            updateNodeData(id, { [field.name]: parsedValue });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
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
