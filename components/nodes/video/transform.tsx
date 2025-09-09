import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
import { download } from '@/lib/download';
import { getModelSchema, getModelDefaults } from '@/lib/model-schemas';
import { useFilteredModels, getFirstAvailableModel, isUpscaleModel } from '@/lib/model-filtering';
import { detectPreviousNodeType } from '@/lib/node-connection-detector';
import { providers } from '@/lib/providers';
import { getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow } from '@xyflow/react';
import { ClockIcon, CopyIcon, DownloadIcon, ExternalLinkIcon, Loader2Icon, PlayIcon, RotateCcwIcon, Settings } from 'lucide-react';
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { VideoNodeProps } from '.';
import { ModelSelector } from '../model-selector';
import { AdvancedVideoParamsPopup } from './advanced-params-popup';

type VideoTransformProps = VideoNodeProps & { title: string };

const AVAILABLE_MODELS = {
  'fal-ai/luma-ray-2': { label: 'Luma Ray 2', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/kling-2.1-master': { label: 'Kling 2.1 Master', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/minimax/hailuo-02/pro/text-to-video': { label: 'Hailuo 02 Pro', chef: providers.fal, providers: [providers.fal], default: true },
  'moonvalley/marey/t2v': { label: 'Marey T2V', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/pika/v2.2/text-to-video': { label: 'Pika v2.2', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/veo3': { label: 'Veo 3', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/wan/v2.2-a14b/text-to-video': { label: 'WAN 2.2 A14B', chef: providers.fal, providers: [providers.fal], default: false },
  // Image-to-video
  'fal-ai/minimax/hailuo-02/pro/image-to-video': { label: 'Hailuo 02 Pro', chef: providers.fal, providers: [providers.fal], default: false },
  'moonvalley/marey/i2v': { label: 'Marey', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/pika/v2.2/image-to-video': { label: 'Pika v2.2', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/veo3/image-to-video': { label: 'Veo 3', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/wan/v2.2-a14b/image-to-video': { label: 'WAN 2.2 A14B', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/luma-dream-machine/ray-2/image-to-video': { label: 'Luma Ray 2', chef: providers.fal, providers: [providers.fal], default: false },
  'fal-ai/kling-video/v2.1/master/image-to-video': { label: 'Kling 2.1 Master', chef: providers.fal, providers: [providers.fal], default: false },
  // Video-to-video
  'fal-ai/topaz/upscale/video': { label: 'Topaz Video Upscale', chef: providers.fal, providers: [providers.fal], default: false },
} as const;

const getDefaultModel = () => {
  const def = Object.entries(AVAILABLE_MODELS).find(([, m]) => m.default);
  if (!def) throw new Error('Nenhum modelo padrao encontrado');
  return def[0];
};

export const VideoTransform = ({ data, id, type, title }: VideoTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const project = useProject();
  const analytics = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // Modelo e filtragem por conexões
  const allNodes = getNodes();
  const allEdges = getEdges();
  const currentNode = allNodes.find((n) => n.id === id) || null;
  const filteredModels = useFilteredModels(currentNode, allNodes, allEdges, 'video', AVAILABLE_MODELS as any);
  const defaultModelId = getFirstAvailableModel(filteredModels) || getDefaultModel();
  const modelId = data.model ?? defaultModelId;

  // Determinar aspect ratio a partir dos dados
  const aspectRatio = useMemo(() => {
    const ratio = (data as any).aspect_ratio || '16:9';
    const map: Record<string, string> = { '16:9': '16/9', '9:16': '9/16', '4:3': '4/3', '3:4': '3/4', '21:9': '21/9', '9:21': '9/21' };
    return map[ratio] || '16/9';
  }, [data?.aspect_ratio]);

  // Inicializar modelo
  useEffect(() => {
    if (!data.model && defaultModelId) {
      const defaults = getModelDefaults(defaultModelId);
      updateNodeData(id, { model: defaultModelId, ...defaults });
    }
  }, [data.model, defaultModelId, id, updateNodeData]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    updateNodeData(id, { instructions: e.target.value });
  };

  const transferPrompt = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
    const incomers = getIncomers({ id }, nodes, edges);
    const textPrompts = getTextFromTextNodes(incomers);
    if (textPrompts.length > 0 && !data.instructions) {
      updateNodeData(id, { instructions: textPrompts[0] });
    }
  }, [id, data.instructions, updateNodeData, getNodes, getEdges]);

  useEffect(() => {
    if (!data.instructions && !data.generated?.url) transferPrompt();
  }, [data.instructions, data.generated?.url, transferPrompt]);

  const handleCopy = useCallback(() => {
    if (data.generated?.url) {
      navigator.clipboard.writeText(data.generated.url);
      toast.success('URL do vídeo copiada para a área de transferência');
    }
  }, [data.generated?.url]);

  const handleGenerate = useCallback(async () => {
    if (loading || !project?.id) return;
    
    // Não exigir prompt para modelos de upscale
    if (!data.instructions?.trim() && !isUpscaleModel(modelId)) {
      toast.error('Campo obrigatório', { description: 'Por favor, digite suas instruções antes de gerar o vídeo.' });
      return;
    }
    
    setLoading(true);
    try {
      const incomers = getIncomers({ id }, getNodes(), getEdges());
      const images = getImagesFromImageNodes(incomers).map((i: any) => i.url).filter(Boolean);
      const videos = (incomers as any[])
        .filter((n) => n.type === 'video')
        .map((n) => (n.data?.generated?.url || n.data?.content?.url))
        .filter(Boolean);


      // Para modelos de upscale de vídeo, só precisamos de vídeos
      if (isUpscaleModel(modelId)) {
        if (!videos.length) {
          toast.error('Vídeo obrigatório', { 
            description: 'Modelos de upscale precisam de pelo menos um vídeo conectado.' 
          });
          setLoading(false);
          return;
        }
      }

      analytics.track('canvas', 'node', 'generate', {
        type,
        model: modelId,
        instructionsLength: data.instructions?.length ?? 0,
        imageCount: images.length,
      });

      // Montar params mínimos permitidos por modelo
      const buildParams = () => {
        const d: any = data || {};
        const id = String(modelId);
        // Robust matching for I2V variants that may differ only by provider path
        if (id.includes('luma-dream-machine') && id.includes('image-to-video')) {
          return {
            model: modelId,
            aspect_ratio: d.aspect_ratio || '16:9',
            loop: d.loop ?? false,
            resolution: d.resolution || '540p',
            duration: d.duration || '5s',
          };
        }
        if (id.includes('kling-video') && id.includes('image-to-video')) {
          return {
            model: modelId,
            duration: d.duration || '5',
            negative_prompt: d.negative_prompt || 'blur, distort, and low quality',
            cfg_scale: d.cfg_scale !== undefined ? d.cfg_scale : 0.5,
          };
        }
        switch (modelId) {
          case 'fal-ai/minimax/hailuo-02/pro/text-to-video':
            return { model: modelId, prompt_optimizer: d.prompt_optimizer ?? true };
          case 'moonvalley/marey/t2v':
            return {
              model: modelId,
              dimensions: d.dimensions || '1920x1080',
              duration: d.duration || '5s',
              negative_prompt: d.negative_prompt || '',
              seed: d.seed ?? null,
            };
          case 'fal-ai/pika/v2.2/text-to-video':
            return {
              model: modelId,
              seed: d.seed ?? null,
              negative_prompt: d.negative_prompt || '',
              aspect_ratio: d.aspect_ratio || '16:9',
              resolution: d.resolution || '720p',
              duration: d.duration || '5',
            };
          case 'fal-ai/pika/v2.2/image-to-video':
            return {
              model: modelId,
              seed: d.seed ?? null,
              negative_prompt: d.negative_prompt || '',
              resolution: d.resolution || '720p',
              duration: d.duration || '5',
            };
          case 'fal-ai/veo3/image-to-video':
            return {
              model: modelId,
              duration: d.duration || '8s',
              generate_audio: d.generate_audio ?? true,
              resolution: d.resolution || '720p',
            };
          case 'fal-ai/wan/v2.2-a14b/image-to-video':
            return {
              model: modelId,
              num_frames: d.num_frames ?? 81,
              frames_per_second: d.frames_per_second ?? 16,
              seed: d.seed ?? null,
              resolution: d.resolution || '720p',
              aspect_ratio: d.aspect_ratio || 'auto',
              num_inference_steps: d.num_inference_steps ?? 27,
              enable_safety_checker: d.enable_safety_checker ?? false,
              enable_prompt_expansion: d.enable_prompt_expansion ?? false,
              acceleration: d.acceleration || 'regular',
              guidance_scale: d.guidance_scale ?? 3.5,
              guidance_scale_2: d.guidance_scale_2 ?? 3.5,
              shift: d.shift ?? 5,
              interpolator_model: d.interpolator_model || 'film',
              num_interpolated_frames: d.num_interpolated_frames ?? 1,
              adjust_fps_for_interpolation: d.adjust_fps_for_interpolation ?? true,
              video_quality: d.video_quality || 'high',
              video_write_mode: d.video_write_mode || 'balanced',
            };
          case 'fal-ai/minimax/hailuo-02/pro/image-to-video':
            return {
              model: modelId,
              prompt_optimizer: d.prompt_optimizer ?? true,
            };
          case 'moonvalley/marey/i2v':
            return {
              model: modelId,
              dimensions: d.dimensions || '1920x1080',
              duration: d.duration || '5s',
              negative_prompt: d.negative_prompt || '',
              seed: d.seed ?? null,
            };
          case 'fal-ai/luma-ray-2':
            return {
              model: modelId,
              aspect_ratio: d.aspect_ratio || '16:9',
              resolution: d.resolution || '540p',
              duration: d.duration || '5s',
              loop: d.loop ?? false,
            };
          case 'fal-ai/kling-2.1-master':
            return {
              model: modelId,
              duration: d.duration || '5',
              aspect_ratio: d.aspect_ratio || '16:9',
              negative_prompt: d.negative_prompt || 'blur, distort, and low quality',
              cfg_scale: d.cfg_scale !== undefined ? d.cfg_scale : 0.5,
            };
          case 'fal-ai/veo3':
            return {
              model: modelId,
              aspect_ratio: d.aspect_ratio || '16:9',
              duration: d.duration || '8s',
              negative_prompt: d.negative_prompt || undefined,
              enhance_prompt: d.enhance_prompt ?? true,
              auto_fix: d.auto_fix ?? true,
              resolution: d.resolution || '720p',
              generate_audio: d.generate_audio ?? true,
            };
          case 'fal-ai/wan/v2.2-a14b/text-to-video':
            return {
              model: modelId,
              negative_prompt: d.negative_prompt || '',
              num_frames: d.num_frames ?? 81,
              frames_per_second: d.frames_per_second ?? 16,
              seed: d.seed ?? null,
              resolution: d.resolution || '720p',
              aspect_ratio: d.aspect_ratio || '16:9',
              num_inference_steps: d.num_inference_steps ?? 27,
              enable_safety_checker: d.enable_safety_checker ?? false,
              enable_prompt_expansion: d.enable_prompt_expansion ?? false,
              acceleration: d.acceleration || 'regular',
              guidance_scale: d.guidance_scale ?? 3.5,
              guidance_scale_2: d.guidance_scale_2 ?? 4,
              shift: d.shift ?? 5,
              interpolator_model: d.interpolator_model || 'film',
              num_interpolated_frames: d.num_interpolated_frames ?? 1,
              adjust_fps_for_interpolation: d.adjust_fps_for_interpolation ?? true,
              video_quality: d.video_quality || 'high',
              video_write_mode: d.video_write_mode || 'balanced',
            };
          case 'fal-ai/topaz/upscale/video':
            return {
              model: modelId,
              upscale_factor: d.upscale_factor ?? 2,
              target_fps: d.target_fps || undefined,
              H264_output: d.H264_output ?? false,
            };
          default:
            return { model: modelId };
        }
      };

      const sendParams = buildParams();

      console.log('[fal-video] Request payload', {
        prompt: data.instructions,
        model: modelId,
        params: sendParams,
        images,
        videos,
      });
      const res = await fetch('/api/fal-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.instructions,
          params: sendParams,
          images,
          videos,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Falha ao gerar vídeo: ${res.status} ${t}`);
      }
      const json = await res.json();
      const url = json?.data?.output || json?.data?.video?.url || json?.data?.urls?.[0] || '';
      if (!url) throw new Error('Resposta sem URL de vídeo');

      updateNodeData(id, { generated: { url, type: 'video/mp4' }, updatedAt: new Date().toISOString(), model: modelId });
      toast.success('Vídeo gerado com sucesso');
    } catch (err) {
      toast.error('Erro ao gerar vídeo');
    } finally {
      setLoading(false);
    }
  }, [loading, project?.id, id, type, modelId, data.instructions, analytics, updateNodeData, getNodes, getEdges]);

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>['toolbar']>(() => {
    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [];
    if (data.generated?.url) {
      items.push({
        tooltip: 'Download',
        children: (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => download(data.generated!, id, 'mp4')}>
            <DownloadIcon size={12} />
          </Button>
        ),
      });
      items.push({
        tooltip: 'Copiar URL',
        children: (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCopy}>
            <CopyIcon size={12} />
          </Button>
        ),
      });
      items.push({
        tooltip: 'Abrir em nova janela',
        children: (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (data.generated?.url) window.open(data.generated.url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLinkIcon size={12} />
          </Button>
        ),
      });
    }
    if (data.updatedAt) {
      items.push({
        tooltip: `\u00DAltima atualiza\u00E7\u00E3o: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data.updatedAt))}`,
        children: (
          <Button size="icon" variant="ghost" className="rounded-full">
            <ClockIcon size={12} />
          </Button>
        ),
      });
    }
    return items;
  }, [data.generated?.url, data.updatedAt, handleCopy, id]);

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {loading && (
        <Skeleton className="flex w-full animate-pulse items-center justify-center rounded-b-xl" style={{ aspectRatio }}>
          <div className="flex flex-col items-center gap-2">
            <Loader2Icon size={20} className="animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm animate-pulse">Gerando vídeo...</p>
          </div>
        </Skeleton>
      )}

      {!loading && !data.generated?.url && (
        <div className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4" style={{ aspectRatio }}>
          <p className="text-muted-foreground text-sm">
            Pressione <PlayIcon size={12} className="-translate-y-px inline" /> para criar um vídeo
          </p>
        </div>
      )}

      {!loading && data.generated?.url && (
        <div className="w-full rounded-b-xl overflow-hidden" style={{ aspectRatio }}>
          <video src={data.generated.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        </div>
      )}

      <div className={`space-y-4 p-4 ${loading ? 'opacity-50' : ''}`}>
        {/* Prompt - Oculto para modelos de upscale */}
        {modelId !== 'fal-ai/topaz/upscale/video' && (
          <Textarea
            value={data.instructions ?? ''}
            onChange={handleInstructionsChange}
            placeholder="Digite as instruções (obrigatório)"
            className="shrink-0 resize-none border border-input bg-background px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:ring-ring rounded-md min-h-[100px] max-h-[16rem] overflow-auto"
          />
        )}

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
            {modelId === 'moonvalley/marey/t2v' || modelId === 'moonvalley/marey/i2v' ? (
              <>
                <Label className="text-xs text-muted-foreground">Tamanho</Label>
                <Select value={String((data as any).dimensions || '1920x1080')} onValueChange={(value) => updateNodeData(id, { dimensions: value })}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      getModelSchema(modelId)?.fields.find((f) => f.name === 'dimensions')?.options || []
                    ).map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              modelId === 'fal-ai/minimax/hailuo-02/pro/text-to-video' ||
              modelId === 'fal-ai/minimax/hailuo-02/pro/image-to-video' ||
              modelId === 'fal-ai/kling-video/v2.1/master/image-to-video' ||
              modelId === 'fal-ai/veo3/image-to-video' ||
              modelId === 'fal-ai/pika/v2.2/image-to-video'
            ) ? (
              <>
                <Label className="text-xs text-muted-foreground">Tamanho</Label>
                <Select value={String((data as any).fixed_size || 'fixed')} onValueChange={(value) => updateNodeData(id, { fixed_size: value })}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Não Aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              modelId === 'fal-ai/topaz/upscale/video'
            ) ? (
              <>
                <Label className="text-xs text-muted-foreground">Tamanho</Label>
                <Select value={String((data as any).fixed_size || 'upscale')} onValueChange={(value) => updateNodeData(id, { fixed_size: value })}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upscale">Upscale</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
                <Select value={String((data as any).aspect_ratio || '16:9')} onValueChange={(value) => updateNodeData(id, { aspect_ratio: value })}>
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
              </>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Quantidade</Label>
            <Select value={String(data.numOutputs || 1)} onValueChange={(value) => updateNodeData(id, { numOutputs: parseInt(value) })}>
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

        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleGenerate} disabled={loading || !project?.id}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                {data.generated?.url ? (
                  <>
                    <RotateCcwIcon className="mr-2 h-4 w-4" /> Regenerar
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" /> Gerar
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

      <AdvancedVideoParamsPopup isOpen={showAdvancedParams} onClose={() => setShowAdvancedParams(false)} nodeId={id} data={data} modelId={modelId} />
    </NodeLayout>
  );
};


