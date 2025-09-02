'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Node } from '@/lib/types';
import { generateTextFalAction } from '@/app/actions/text/fal';
import { useNodes } from '@/lib/hooks/use-nodes';

// Modelos disponíveis para FAL AI
const AVAILABLE_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'google/gemini-2.0-flash-exp',
  'google/gemini-1.5-pro',
  'anthropic/claude-3-5-sonnet-20241022',
  'x-ai/grok-beta',
] as const;

type AvailableModel = typeof AVAILABLE_MODELS[number];

interface TextTransformFalProps {
  node: Node;
}

export function TextTransformFal({ node }: TextTransformFalProps) {
  const { updateNode } = useNodes();
  const [instructions, setInstructions] = useState(node.data.instructions || '');
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('openai/gpt-4o-mini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [systemPrompt, setSystemPrompt] = useState(
    'Você é um assistente útil e preciso. Responda de forma clara e concisa.'
  );
  const [reasoning, setReasoning] = useState(false);
  const [priority, setPriority] = useState<'latency' | 'quality'>('latency');

  // Atualizar instruções quando o nó mudar
  useEffect(() => {
    if (node.data.instructions !== instructions) {
      setInstructions(node.data.instructions || '');
    }
  }, [node.data.instructions]);

  // Transferência automática de prompt de nós conectados
  useEffect(() => {
    const { getIncomers, getNodes, getEdges } = useNodes();
    const nodes = getNodes();
    const edges = getEdges();
    const incomers = getIncomers({ id: node.id }, nodes, edges);
    
    // Função para extrair texto de nós conectados
    const getTextFromConnectedNodes = (connectedNodes: Node[]) => {
      return connectedNodes
        .filter((n) => n.type === 'text')
        .map((n) => {
          // Se é um nó primitivo (tem text), usar o text
          if (n.data.text) {
            return n.data.text;
          }
          // Se é um nó transform (tem generated), usar o texto gerado
          else if (n.data.generated?.text) {
            return n.data.generated.text;
          }
          return null;
        })
        .filter(Boolean);
    };
    
    const textPrompts = getTextFromConnectedNodes(incomers);
    
    if (textPrompts.length > 0 && !instructions) {
      // Se há prompts dos nós anteriores e o campo instructions está vazio,
      // transferir automaticamente o primeiro prompt
      const firstPrompt = textPrompts[0];
      setInstructions(firstPrompt);
      updateNode(node.id, {
        data: {
          ...node.data,
          instructions: firstPrompt,
        },
      });
    }
  }, [node.id, node.data, instructions, updateNode, useNodes]);

  const handleInstructionsChange = useCallback((value: string) => {
    setInstructions(value);
    updateNode(node.id, {
      data: {
        ...node.data,
        instructions: value,
      },
    });
  }, [node.id, node.data, updateNode]);

  const generateText = useCallback(async () => {
    if (!instructions.trim()) {
      toast.error('Por favor, insira as instruções primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🚀 Iniciando geração de texto com FAL AI:', {
        model: selectedModel,
        instructionsLength: instructions.length,
        reasoning,
        priority,
      });

      await generateTextFalAction({
        nodeId: node.id,
        instructions,
        modelId: selectedModel,
        systemPrompt,
        reasoning,
        priority,
      });

      toast.success('Texto gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro na geração de texto:', error);
      toast.error('Erro ao gerar texto. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }, [instructions, selectedModel, systemPrompt, reasoning, priority, node.id]);

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Texto copiado!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  }, []);

  const regenerateVariation = useCallback(async (index: number) => {
    if (!instructions.trim()) {
      toast.error('Por favor, insira as instruções primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      await generateTextFalAction({
        nodeId: node.id,
        instructions,
        modelId: selectedModel,
        systemPrompt,
        reasoning,
        priority,
        variationIndex: index,
      });

      toast.success(`Variação ${index + 1} regenerada!`);
    } catch (error) {
      console.error('❌ Erro na regeneração:', error);
      toast.error('Erro ao regenerar variação. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }, [instructions, selectedModel, systemPrompt, reasoning, priority, node.id]);

  const textVariations = node.data.textVariations || [];

  return (
    <div className="space-y-4">
      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Geração de Texto - FAL AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Modelo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Modelo</label>
            <Select value={selectedModel} onValueChange={(value: AvailableModel) => setSelectedModel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">System Prompt</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Defina o comportamento do assistente..."
              rows={2}
            />
          </div>

          {/* Configurações Avançadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={priority} onValueChange={(value: 'latency' | 'quality') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latency">Velocidade</SelectItem>
                  <SelectItem value="quality">Qualidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="reasoning"
                checked={reasoning}
                onChange={(e) => setReasoning(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="reasoning" className="text-sm font-medium">
                Incluir Raciocínio
              </label>
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Instruções</label>
            <Textarea
              value={instructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="Descreva o que você quer que seja gerado..."
              rows={4}
            />
          </div>

          {/* Botão de Geração */}
          <Button
            onClick={generateText}
            disabled={isGenerating || !instructions.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando texto...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Texto
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {textVariations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Textos Gerados</h3>
          {textVariations.map((variation, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Variação {index + 1}</Badge>
                    {variation.model && (
                      <Badge variant="secondary">{variation.model}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateVariation(index)}
                      disabled={isGenerating}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(variation.text, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">
                  {variation.text}
                </div>
                {variation.reasoning && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Raciocínio:</h4>
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {variation.reasoning}
                    </div>
                  </div>
                )}
                {variation.metadata && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Gerado em: {new Date(variation.metadata.createdAt).toLocaleString()}
                    {variation.metadata.duration && (
                      <> • Tempo: {variation.metadata.duration}ms</>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}