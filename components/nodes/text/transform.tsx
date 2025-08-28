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
import { useAnalytics } from '@/hooks/use-analytics';
import { useReasoning } from '@/hooks/use-reasoning';
import { handleError } from '@/lib/error/handle';
import {
  getDescriptionsFromImageNodes,
  getFilesFromFileNodes,
  getImagesFromImageNodes,
  getTextFromTextNodes,
  getTranscriptionFromAudioNodes,
  getTweetContentFromTweetNodes,
} from '@/lib/xyflow';
import { useGateway } from '@/providers/gateway/client';
import { useProject } from '@/providers/project';
import { ReasoningTunnel } from '@/tunnels/reasoning';
import { getIncomers, useReactFlow } from '@xyflow/react';
import {
  ClockIcon,
  CopyIcon,
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

// Modelos disponíveis - todos usando Replicate API
const AVAILABLE_MODELS = {
  'openai/gpt-5': {
    name: 'GPT-5',
    provider: 'replicate',
    default: true,
  },
  'openai/gpt-5-mini': {
    name: 'GPT-5 Mini',
    provider: 'replicate',
  },
  'anthropic/claude-4-sonnet': {
    name: 'Claude 4 Sonnet',
    provider: 'replicate',
  },
};

type StreamingStatus = 'idle' | 'generating' | 'streaming' | 'completed' | 'error';

interface StreamMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  sources?: Array<{ url: string; title?: string }>;
}

const getDefaultModel = () => {
  const defaultModel = Object.entries(AVAILABLE_MODELS).find(
    ([_, model]) => model.default
  );
  return defaultModel ? defaultModel[0] : 'openai/gpt-5';
};

export const TextTransform = ({
  data,
  id,
  type,
  title,
}: TextTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const project = useProject();
  const modelId = data.model ?? getDefaultModel();
  const analytics = useAnalytics();
  const [reasoning, setReasoning] = useReasoning();
  
  // Estados para streaming manual
  const [status, setStatus] = useState<StreamingStatus>('idle');
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const audioPrompts = getTranscriptionFromAudioNodes(incomers);
    const images = getImagesFromImageNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);
    const tweetContent = getTweetContentFromTweetNodes(incomers);
    const files = getFilesFromFileNodes(incomers);

    if (!textPrompts.length && !audioPrompts.length && !data.instructions) {
      handleError('Error generating text', 'No prompts found');
      return;
    }

    // System prompt padrão
    const systemPrompt = `Você é um assistente útil que sintetiza uma resposta ou conteúdo.
O usuário fornecerá uma coleção de dados de fontes diferentes.
Eles também podem fornecer instruções sobre como sintetizar o conteúdo.
Se as instruções forem uma pergunta, então seu objetivo é responder à pergunta com base no contexto fornecido.
Você deve sintetizar o conteúdo com base nas instruções do usuário e no contexto fornecido.
A saída deve ser um resumo conciso do conteúdo, não mais que 100 palavras.`;

    // Preparar prompt principal com mensagem atual e mensagens anteriores
    const content: string[] = [];

    // Adicionar mensagem atual (instruções do usuário)
    if (data.instructions) {
      content.push('--- Mensagem Atual ---', data.instructions);
    }

    // Adicionar mensagens anteriores
    if (textPrompts.length) {
      content.push('--- Mensagens Anteriores ---', ...textPrompts);
    }

    if (audioPrompts.length) {
      content.push('--- Prompts de Áudio ---', ...audioPrompts);
    }

    if (imageDescriptions.length) {
      content.push('--- Descrições de Imagens ---', ...imageDescriptions);
    }

    if (tweetContent.length) {
      content.push('--- Conteúdo de Tweets ---', ...tweetContent);
    }

    analytics.track('canvas', 'node', 'generate', {
      type,
      promptLength: content.join('\n').length,
      model: modelId,
      instructionsLength: data.instructions?.length ?? 0,
      imageCount: images.length,
      fileCount: files.length,
    });

    // Preparar input para Replicate com system prompt separado
    const replicateInput: any = {
      prompt: content.join('\n'),
      system_prompt: systemPrompt,
      verbosity: 'medium',
      reasoning_effort: 'minimal',
      max_completion_tokens: 4000,
    };

    // Adicionar imagens se houver
    if (images.length > 0) {
      replicateInput.image_input = images.map(img => img.url);
    }

    try {
      setStatus('generating');
      setMessages([]);
      setCurrentMessage('');
      
      // Criar AbortController para cancelamento
      abortControllerRef.current = new AbortController();

      // Fazer chamada para API do Replicate via endpoint local
      const response = await fetch('/api/replicate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          input: replicateInput,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      setStatus('streaming');
      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setCurrentMessage(fullText);
      }

      // Finalizar streaming
      const finalMessage: StreamMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullText,
      };

      setMessages([finalMessage]);
      setStatus('completed');

      // Atualizar dados do nó
      updateNodeData(id, {
        generated: {
          text: fullText,
        },
        updatedAt: new Date().toISOString(),
      });

      setReasoning((oldReasoning) => ({
        ...oldReasoning,
        isGenerating: false,
      }));

      toast.success('Text generated successfully');
      setTimeout(() => mutate('credits'), 5000);

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
    id,
    modelId,
    type,
    analytics.track,
    updateNodeData,
    setReasoning,
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

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  const handleModelChange = useCallback((value: string) => {
    updateNodeData(id, { model: value });
  }, [id, updateNodeData]);

  const toolbar = useMemo(() => {
    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [];

    // Seletor de modelo customizado
    items.push({
      children: (
        <Select value={modelId} onValueChange={handleModelChange}>
          <SelectTrigger className="w-[160px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
              <SelectItem key={key} value={key}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    });

    if (status === 'generating' || status === 'streaming') {
      items.push({
        tooltip: 'Parar',
        children: (
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleStop}
            disabled={!project?.id}
          >
            <SquareIcon size={12} />
          </Button>
        ),
      });
    } else if (messages.length || data.generated?.text) {
      const text = messages.length
        ? messages
            .filter((message) => message.role === 'assistant')
            .map((message) => message.content)
            .join('\n')
        : data.generated?.text;

      items.push({
        tooltip: 'Regenerar',
        children: (
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleGenerate}
            disabled={!project?.id}
          >
            <RotateCcwIcon size={12} />
          </Button>
        ),
      });
      items.push({
        tooltip: 'Copiar',
        children: (
          <Button
            size="icon"
            className="rounded-full"
            disabled={!text}
            onClick={() => handleCopy(text ?? '')}
            variant="ghost"
          >
            <CopyIcon size={12} />
          </Button>
        ),
      });
    } else {
      items.push({
        tooltip: 'Gerar',
        children: (
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleGenerate}
            disabled={!project?.id}
          >
            <PlayIcon size={12} />
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
    data.generated?.text,
    data.updatedAt,
    handleGenerate,
    handleModelChange,
    modelId,
    id,
    messages,
    project?.id,
    status,
    handleStop,
    handleCopy,
  ]);

  const nonUserMessages = messages.filter((message) => message.role !== 'user');

  return (
    <NodeLayout id={id} data={data} title={title} type={type} toolbar={toolbar}>
      <div className="nowheel h-full max-h-[30rem] flex-1 overflow-auto rounded-t-3xl rounded-b-xl bg-secondary p-4">
        {status === 'generating' && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-60 animate-pulse rounded-lg" />
            <Skeleton className="h-4 w-40 animate-pulse rounded-lg" />
            <Skeleton className="h-4 w-50 animate-pulse rounded-lg" />
          </div>
        )}
        
        {status === 'streaming' && currentMessage && (
          <AIMessage from="assistant" className="p-0 [&>div]:max-w-none">
            <AIMessageContent className="bg-transparent p-0">
              <AIResponse>{currentMessage}</AIResponse>
            </AIMessageContent>
          </AIMessage>
        )}
        
        {data.generated?.text &&
          !nonUserMessages.length &&
          status !== 'generating' &&
          status !== 'streaming' && (
            <ReactMarkdown>{data.generated.text}</ReactMarkdown>
          )}
          
        {!data.generated?.text &&
          !nonUserMessages.length &&
          status !== 'generating' &&
          status !== 'streaming' && (
            <div className="flex aspect-video w-full items-center justify-center bg-secondary">
              <p className="text-muted-foreground text-sm">
                Pressione <PlayIcon size={12} className="-translate-y-px inline" />{' '}
                para gerar texto
              </p>
            </div>
          )}
          
        {Boolean(nonUserMessages.length) &&
          status !== 'generating' &&
          status !== 'streaming' &&
          nonUserMessages.map((message) => (
            <AIMessage
              key={message.id}
              from={message.role === 'assistant' ? 'assistant' : 'user'}
              className="p-0 [&>div]:max-w-none"
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
                <AIMessageContent className="bg-transparent p-0">
                  <AIResponse>{message.content}</AIResponse>
                </AIMessageContent>
              </div>
            </AIMessage>
          ))}
      </div>
      <Textarea
        value={data.instructions ?? ''}
        onChange={handleInstructionsChange}
        placeholder="Mensagem Atual"
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
      />
      <ReasoningTunnel.In>
        {messages.flatMap((message) => message.content)}
      </ReasoningTunnel.In>
    </NodeLayout>
  );
};
