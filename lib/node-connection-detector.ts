// Utilitário para detectar tipos de nós conectados anteriormente
import { getIncomers, type Node, type Edge } from '@xyflow/react';

export type NodeConnectionType = 
  | 'none' // Nenhuma conexão - primeiro da cadeia
  | 'text-primitive' // Nó de entrada de texto básico
  | 'text-transform' // Nó que processa texto com IA
  | 'image-primitive' // Nó de entrada de imagem básico
  | 'image-transform' // Nó que processa imagem com IA
  | 'video-primitive' // Nó de entrada de vídeo básico
  | 'video-transform'; // Nó que processa vídeo com IA

/**
 * Detecta o tipo de nó conectado anteriormente na cadeia
 * @param currentNode - O nó atual
 * @param allNodes - Todos os nós do fluxo
 * @param allEdges - Todas as conexões do fluxo
 * @returns O tipo de conexão anterior
 */
export const detectPreviousNodeType = (
  currentNode: Node,
  allNodes: Node[],
  allEdges: Edge[]
): NodeConnectionType => {
  // Obter nós conectados anteriormente
  const incomers = getIncomers(currentNode, allNodes, allEdges);
  
  // Se não há conexões, é o primeiro da cadeia
  if (incomers.length === 0) {
    return 'none';
  }
  
  // Pegar o último nó conectado (mais recente)
  const previousNode = incomers[incomers.length - 1];
  
  // Detectar tipo baseado no tipo do nó e se tem conteúdo gerado
  switch (previousNode.type) {
    case 'text':
      // Verificar se é primitivo ou transform baseado no conteúdo gerado
      const hasTextGenerated = Boolean(previousNode.data?.generated?.text);
      return hasTextGenerated ? 'text-transform' : 'text-primitive';
      
    case 'image':
      // Verificar se é primitivo ou transform baseado no conteúdo gerado
      const hasImageGenerated = Boolean(previousNode.data?.generated?.url);
      return hasImageGenerated ? 'image-transform' : 'image-primitive';
      
    case 'video':
      // Verificar se é primitivo ou transform baseado no conteúdo gerado
      const hasVideoGenerated = Boolean(previousNode.data?.generated?.url);
      return hasVideoGenerated ? 'video-transform' : 'video-primitive';
      
    default:
      // Para outros tipos de nós, considerar como 'none'
      return 'none';
  }
};

/**
 * Verifica se um nó é do tipo primitivo (sem IA)
 * @param node - O nó a ser verificado
 * @returns true se for primitivo, false se for transform
 */
export const isNodePrimitive = (node: Node): boolean => {
  switch (node.type) {
    case 'text':
      return !Boolean(node.data?.generated?.text);
    case 'image':
      return !Boolean(node.data?.generated?.url);
    case 'video':
      return !Boolean(node.data?.generated?.url);
    default:
      return true;
  }
};

/**
 * Verifica se um nó é do tipo transform (com IA)
 * @param node - O nó a ser verificado
 * @returns true se for transform, false se for primitivo
 */
export const isNodeTransform = (node: Node): boolean => {
  return !isNodePrimitive(node);
};