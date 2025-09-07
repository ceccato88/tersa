import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import {
  AIMessage,
  AIMessageContent,
} from '@/components/ui/kibo-ui/ai/message';
import { AIResponse } from '@/components/ui/kibo-ui/ai/response';
import {
  AISource,
  AISources,
  AISourcesContent,
  AISourcesTrigger,
} from '@/components/ui/kibo-ui/ai/source';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removido ModelSelector - usando modelo fixo
// import { ModelSelector } from '@/components/nodes/model-selector';
// import { TEXT_MODELS, getDefaultTextModel } from '@/lib/text-models';
// import { getFirstAvailableModel } from '@/lib/model-filtering';
import { useAnalytics } from '@/hooks/use-analytics';
import { useReasoning } from '@/hooks/use-reasoning';
import { handleError } from '@/lib/error/handle';
import {
  getDescriptionsFromImageNodes,
  getFilesFromFileNodes,
  getImagesFromImageNodes,
  getTextFromTextNodes,
} from '@/lib/xyflow';
import { useGateway } from '@/providers/gateway/client';
import { useProject } from '@/providers/project';
import { ReasoningTunnel } from '@/tunnels/reasoning';
import { getIncomers, useReactFlow } from '@xyflow/react';
import {
  ClockIcon,
  CopyIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
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
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { mutate } from 'swr';
import type { TextNodeProps } from '.';

type TextTransformProps = TextNodeProps & {
  title: string;
};

type StreamingStatus = 'idle' | 'generating' | 'streaming' | 'completed' | 'error';

interface StreamMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  sources?: Array<{ url: string; title?: string }>;
}

export const TextTransform = ({
  data,
  id,
  type,
  title,
}: TextTransformProps) => {
  const { updateNodeData, getNodes, getEdges, addNodes, addEdges } = useReactFlow();
  const project = useProject();
  
  // Modelo fixo: openai/gpt-5-chat
  const modelId = 'openai/gpt-5-chat';
  const selectedModel = {
    id: 'openai/gpt-5-chat',
    label: 'GPT-5 Chat',
    chef: { id: 'fal' },
    price: '$$$'
  };
  
  const analytics = useAnalytics();
  const [reasoning, setReasoning] = useReasoning();
  
  // Estados para streaming manual
  const [status, setStatus] = useState<StreamingStatus>('idle');
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Estado para múltiplas variações
  const [variationCount, setVariationCount] = useState(data.variationCount ?? 1);

  // Calcular aspect ratio dinâmico (similar ao nó de imagem)
  const aspectRatio = useMemo(() => {
    // Usar aspect ratio padrão para texto
    return '16/9';
  }, []);



  const handleGenerate = useCallback(async () => {
    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const images = getImagesFromImageNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);
    const files = getFilesFromFileNodes(incomers);

    if (!data.instructions?.trim()) {
      toast.error('Campo obrigatório', {
        description: 'Por favor, digite suas instruções antes de gerar o texto.'
      });
      return;
    }
    
    if (!textPrompts.length && !data.instructions) {
      handleError('Error generating text', 'No prompts found');
      return;
    }

    // System prompt padrão
    const systemPrompt = `Você é um assistente útil que sintetiza uma resposta ou conteúdo.
O usuário fornecerá uma coleção de dados de fontes diferentes.
Eles também podem fornecer instruções sobre como sintetizar o conteúdo.
Se as instruções forem uma pergunta, então seu objetivo é responder à pergunta com base no contexto fornecido.
Você deve sintetizar o conteúdo com base nas instruções do usuário e no contexto fornecido.
A saída deve ser um resumo conciso do conteúdo, não mais que 1000 palavras.`;

    // Usar apenas o conteúdo atual do prompt (já contém texto dos nós anteriores via transferência automática)
    const content = data.instructions || '';

    // Adicionar descrições de imagens se houver
    const finalContent = imageDescriptions.length 
      ? [content, '--- Descrições de Imagens ---', ...imageDescriptions].join('\n')
      : content;

    analytics.track('canvas', 'node', 'generate', {
      type,
      promptLength: finalContent.length,
      model: modelId,
      instructionsLength: data.instructions?.length ?? 0,
      imageCount: images.length,
      fileCount: files.length,
    });

    // Preparar input para Replicate com formato de messages correto
    const replicateInput: any = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: finalContent }
      ],
      verbosity: 'medium',
      reasoning_effort: 'minimal',
      max_completion_tokens: 4000,
    };

    try {
      setStatus('generating');
      setMessages([]);
      setCurrentMessage('');
      
      // Criar AbortController para cancelamento
      abortControllerRef.current = new AbortController();

      // Gerar múltiplas variações
      const variations: string[] = [];
      
      // Determinar qual endpoint usar baseado no provider do modelo
      const isFalModel = selectedModel?.chef?.id === 'fal';
      const endpoint = isFalModel ? '/api/fal-stream' : '/api/replicate-stream';
      
      for (let i = 0; i < variationCount; i++) {
        // Preparar input baseado no provider
        const requestBody = isFalModel ? {
          model: modelId.replace('fal-ai/', ''), // Remover prefixo fal-ai/
          input: {
            prompt: finalContent,
            system_prompt: systemPrompt,
            reasoning: true,
            priority: 'latency',
            // Adicionar image_url se houver imagens dos nós anteriores
            ...(images.length > 0 && { image_url: images[0].url })
          }
        } : {
          model: modelId,
          input: {
            ...replicateInput,
            // Adicionar image_input se houver imagens dos nós anteriores
            ...(images.length > 0 && { image_input: images.map(img => img.url) })
          },
        };
        
        // Fazer chamada para API via endpoint local
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        let fullText = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
        }
        
        variations.push(fullText);
      }
      
      // A primeira variação fica no nó atual
      const mainVariation = variations[0];
      
      // Finalizar streaming
      const finalMessage: StreamMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: mainVariation,
      };

      setMessages([finalMessage]);
      setStatus('completed');

      // Atualizar dados do nó principal
      updateNodeData(id, {
        generated: {
          text: mainVariation,
        },
        variationCount,
        updatedAt: new Date().toISOString(),
      });
      
      // Criar nós adicionais para as outras variações
      if (variations.length > 1) {
        const currentNode = getNodes().find(node => node.id === id);
        if (currentNode) {
           const newNodes = [];
           const newEdges = [];
           const baseY = currentNode.position.y; // Garantir mesmo Y para todos
          
          for (let i = 1; i < variations.length; i++) {
             const newNodeId = `${id}-variation-${i}`;
             const newNode = {
               id: newNodeId,
               type: 'text',
               position: {
                 x: currentNode.position.x + (i * 420), // 384px (w-sm) + 36px spacing
                 y: baseY, // Usar Y fixo do nó original
               },
               origin: currentNode.origin || [0, 0.5], // Usar mesmo origin do nó original
               data: {
                 generated: {
                   text: variations[i],
                 },
                 model: modelId,
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
          
          toast.success(`${variations.length} variações geradas com sucesso`);
        }
      } else {
        toast.success('Texto gerado com sucesso');
      }
      
      setReasoning((oldReasoning) => ({
        ...oldReasoning,
        isGenerating: false,
      }));

      // Credits removed: no SWR revalidation needed

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus('idle');
        toast.info('Generation cancelled');
      } else {
        setStatus('error');
        handleError('Error generating text', error);
      }
    }
  }, [
    data.instructions,
    getEdges,
    getNodes,
    addNodes,
    addEdges,
    id,
    modelId,
    type,
    analytics.track,
    updateNodeData,
    setReasoning,
    variationCount,
    data,
  ]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
  }, []);

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
    if (!data.instructions && !data.generated?.text) {
      transferPrompt();
    }
  }, [data.instructions, data.generated?.text, transferPrompt]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);


  
  const handleVariationCountChange = useCallback((value: number) => {
    const clampedValue = Math.max(1, value); // Mínimo de 1
    setVariationCount(clampedValue);
    updateNodeData(id, { variationCount: clampedValue });
  }, [id, updateNodeData]);

  const toolbar = useMemo(() => {
    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [];

    // Botões de ação foram movidos para dentro do nó

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
    data.generated?.text,
    data.updatedAt,
    handleGenerate,
    handleVariationCountChange,
    modelId,
    id,
    messages,
    project?.id,
    status,
    handleStop,
    handleCopy,
    variationCount,
  ]);

  const nonUserMessages = messages.filter((message) => message.role !== 'user');

  return (
    <NodeLayout id={id} data={data} title={title} type={type} toolbar={toolbar}>
      {/* Área de conteúdo com tamanho fixo durante geração */}
      {status === 'generating' && (
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
              Gerando texto...
            </p>
          </div>
        </Skeleton>
      )}
      

      
      {status !== 'generating' && !data.generated?.text && !nonUserMessages.length && (
        <div
          className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4 min-h-[300px]"
          style={{ aspectRatio }}
        >
          <p className="text-muted-foreground text-sm">
            Pressione <PlayIcon size={12} className="-translate-y-px inline" />{' '}
            para gerar texto
          </p>
        </div>
      )}
      
      {status !== 'generating' && (data.generated?.text || Boolean(nonUserMessages.length)) && (
        <div className="nowheel h-full max-h-[30rem] flex-1 overflow-auto rounded-t-3xl rounded-b-xl bg-secondary p-6">
          {data.generated?.text && !nonUserMessages.length && (
            <ReactMarkdown>{data.generated.text}</ReactMarkdown>
          )}
          
          {Boolean(nonUserMessages.length) &&
            nonUserMessages.map((message) => (
              <AIMessage
                key={message.id}
                from={message.role === 'assistant' ? 'assistant' : 'user'}
                className="p-0 py-0 [&>div]:max-w-none"
              >
                <div>
                  {Boolean(message.sources?.length) && (
                    <AISources>
                      <AISourcesTrigger count={message.sources?.length || 0} />
                      <AISourcesContent>
                        {message.sources?.map(({ url, title }) => (
                          <AISource
                            key={url}
                            href={url}
                            title={title ?? new URL(url).hostname}
                          />
                        ))}
                      </AISourcesContent>
                    </AISources>
                  )}
                  <AIMessageContent className="bg-transparent p-0 py-0">
                    <AIResponse>{message.content}</AIResponse>
                  </AIMessageContent>
                </div>
              </AIMessage>
            ))}
        </div>
      )}
      <div className="space-y-4 p-4">
        <Textarea
          value={data.instructions ?? ''}
          onChange={handleInstructionsChange}
          placeholder="Digite as instruções (obrigatório)"
          className="shrink-0 resize-none border border-input bg-background px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:ring-ring rounded-md min-h-[100px]"
        />
        
        {/* Apenas controle de quantidade */}
        <div className="space-y-2">
          <Label>Quantidade de variações</Label>
          <Select
            value={variationCount.toString()}
            onValueChange={(value) => handleVariationCountChange(parseInt(value))}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'variação' : 'variações'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Botões Gerar e Copiar lado a lado */}
        <div className="grid grid-cols-2 gap-4">
          {status === 'generating' ? (
            <Button
              className="w-full"
              onClick={handleStop}
              disabled={!project?.id}
              variant="outline"
            >
              <SquareIcon className="mr-2 h-4 w-4" />
              Parar
            </Button>
          ) : messages.length || data.generated?.text ? (
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!project?.id}
            >
              <RotateCcwIcon className="mr-2 h-4 w-4" />
              Regenerar
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!project?.id}
            >
              <PlayIcon className="mr-2 h-4 w-4" />
              Gerar
            </Button>
          )}
          
          <Button
            className="w-full"
            variant="outline"
            disabled={!((messages.length
              ? messages
                  .filter((message) => message.role === 'assistant')
                  .map((message) => message.content)
                  .join('\n')
              : data.generated?.text))}
            onClick={() => handleCopy((messages.length
              ? messages
                  .filter((message) => message.role === 'assistant')
                  .map((message) => message.content)
                  .join('\n')
              : data.generated?.text) ?? '')}
          >
            <CopyIcon className="mr-2 h-4 w-4" />
            Copiar
          </Button>
        </div>
      </div>
      <ReasoningTunnel.In>
        {messages.flatMap((message) => message.content)}
      </ReasoningTunnel.In>
    </NodeLayout>
  );
};
