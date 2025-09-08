import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
import { handleError } from '@/lib/error/handle';
import { getDescriptionsFromImageNodes, getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow } from '@xyflow/react';
import { ClockIcon, CopyIcon, Loader2Icon, PlayIcon, RotateCcwIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { TextNodeProps } from '.';

type TextTransformProps = TextNodeProps & {
  title: string;
};

export const TextTransform = ({ data, id, type, title }: TextTransformProps) => {
  const { updateNodeData, getNodes, getEdges, addNodes, addEdges } = useReactFlow();
  const project = useProject();
  const analytics = useAnalytics();
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [variationCount, setVariationCount] = useState<number>(data.variationCount ?? 1);
  const modelId = 'openai/gpt-5-chat';

  // Transfere prompt automaticamente de nós conectados se instructions estiver vazio
  useEffect(() => {
    const nodes = getNodes();
    const edges = getEdges();
    const incomers = getIncomers({ id }, nodes, edges);
    const textPrompts = getTextFromTextNodes(incomers);

    if (textPrompts.length > 0 && !data.instructions) {
      updateNodeData(id, { instructions: textPrompts[0] });
    }
  }, [id, getNodes, getEdges, data.instructions, updateNodeData]);

  // Garantir que o nó registre o modelo usado
  useEffect(() => {
    if (data.model !== modelId) {
      updateNodeData(id, { model: modelId });
    }
  }, [data.model, id, modelId, updateNodeData]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      updateNodeData(id, { instructions: event.target.value });
    },
    [id, updateNodeData]
  );

  const handleCopy = useCallback(() => {
    if (data.generated?.text) {
      navigator.clipboard.writeText(data.generated.text);
      toast.success('Texto copiado para a área de transferência');
    }
  }, [data.generated?.text]);

  const handleVariationCountChange = useCallback((value: string) => {
    const n = Math.max(1, parseInt(value, 10) || 1);
    setVariationCount(n);
    updateNodeData(id, { variationCount: n });
  }, [id, updateNodeData]);

  const handleGenerate = useCallback(async () => {
    if (loading || !project?.id) return;

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const images = getImagesFromImageNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);

    if (!data.instructions?.trim() && textPrompts.length === 0) {
      toast.error('Campo obrigatório', {
        description: 'Digite suas instruções ou conecte um nó de texto.',
      });
      return;
    }

    const systemPrompt = '';
    const userContentBase = data.instructions || textPrompts[0] || '';
    const finalContent = imageDescriptions.length
      ? [userContentBase, '--- Descrições de Imagens ---', ...imageDescriptions].join('\n')
      : userContentBase;

    analytics.track('canvas', 'node', 'generate', {
      type,
      model: modelId,
      instructionsLength: data.instructions?.length ?? 0,
      imageCount: images.length,
      variations: variationCount,
    });

    try {
      setLoading(true);
      const results: string[] = [];

      for (let i = 0; i < Math.max(1, variationCount); i++) {
        abortControllerRef.current = new AbortController();
        const endpoint = '/api/fal-stream';
        const requestBody = {
          model: modelId,
          input: {
            prompt: finalContent,
            system_prompt: systemPrompt,
            reasoning: true,
            priority: 'latency',
            ...(images.length > 0 && { image_url: images[0].url }),
          },
        } as const;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        let fullText = '';
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
        }

        results.push(fullText);
        if (i === 0) {
          updateNodeData(id, {
            generated: { text: fullText },
            updatedAt: new Date().toISOString(),
            variationCount,
            model: modelId,
          });
        }
      }

      if (results.length > 1) {
        const currentNode = getNodes().find((n) => n.id === id);
        if (currentNode) {
          const newNodes: any[] = [];
          const newEdges: any[] = [];
          const baseY = currentNode.position.y;

          for (let i = 1; i < results.length; i++) {
            const newNodeId = `${id}-variation-${i}-${Date.now()}`;
            newNodes.push({
              id: newNodeId,
              type: 'text',
              position: {
                x: currentNode.position.x + i * 420,
                y: baseY,
              },
              origin: currentNode.origin || [0, 0.5],
              data: {
                generated: { text: results[i] },
                model: modelId,
                instructions: data.instructions,
                updatedAt: new Date().toISOString(),
              },
            });

            const edges = getEdges();
            const incomingEdges = edges.filter((e) => e.target === id);
            incomingEdges.forEach((edge) => {
              newEdges.push({
                id: `${edge.id}-variation-${i}-${Date.now()}`,
                source: edge.source,
                target: newNodeId,
                type: edge.type || 'animated',
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
              });
            });
          }

          if (newNodes.length) addNodes(newNodes);
          if (newEdges.length) addEdges(newEdges);
          toast.success(`${results.length} variações geradas com sucesso`);
        }
      } else {
        toast.success('Texto gerado com sucesso');
      }
    } catch (error) {
      handleError('Erro ao gerar texto', error);
    } finally {
      setLoading(false);
    }
  }, [loading, project?.id, id, data.instructions, getNodes, getEdges, analytics, type, variationCount, updateNodeData]);

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>['toolbar']>(() => {
    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [];

    if (data.generated?.text) {
      items.push({
        tooltip: 'Copiar',
        children: (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCopy}>
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
  }, [data.generated?.text, data.updatedAt, handleCopy]);

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {loading && (
        <Skeleton className="flex w-full animate-pulse items-center justify-center rounded-b-xl min-h-[240px]">
          <div className="flex flex-col items-center gap-2 p-4">
            <Loader2Icon size={20} className="animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm animate-pulse">Gerando...</p>
          </div>
        </Skeleton>
      )}

      {!loading && !data.generated?.text && (
        <div className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4 min-h-[240px]">
          <p className="text-muted-foreground text-sm">
            Pressione <PlayIcon size={12} className="-translate-y-px inline" /> para gerar texto
          </p>
        </div>
      )}

      {!loading && data.generated?.text && (
        <div className="nowheel h-full max-h-[30rem] flex-1 overflow-auto rounded-t-3xl rounded-b-xl bg-secondary p-6 mr-3">
          <ReactMarkdown>{data.generated.text}</ReactMarkdown>
        </div>
      )}

      <div className="space-y-3 p-4">
        <Textarea
          value={data.instructions ?? ''}
          onChange={handleInstructionsChange}
          placeholder="Digite as instruções (obrigatório)"
          className="shrink-0 resize-none border border-input bg-background px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:ring-ring rounded-md min-h-[100px] max-h-[16rem] overflow-auto"
        />

        <div className="space-y-1">
          <Label>Quantidade de variações</Label>
          <Select value={String(variationCount)} onValueChange={handleVariationCountChange}>
            <SelectTrigger className="w-full h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={String(num)}>
                  {num} {num === 1 ? 'variação' : 'variações'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleGenerate} disabled={loading || !project?.id}>
          {loading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              {data.generated?.text ? (
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
