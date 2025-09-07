import type { ImageNodeProps } from '@/components/nodes/image';
import type { TextNodeProps } from '@/components/nodes/text';
import type { Node } from '@xyflow/react';

export const getTextFromTextNodes = (nodes: Node[]) => {
  const texts: string[] = [];

  nodes.forEach(node => {
    if (node.type === 'text') {
      const nodeData = node.data as TextNodeProps['data'];
      
      // Se é um nó primitivo (tem text), usar o text
      if (nodeData.text) {
        texts.push(nodeData.text);
      }
      // Se é um nó transform (tem generated), usar o texto gerado
      else if (nodeData.generated?.text) {
        texts.push(nodeData.generated.text);
      }
    }
  });

  return texts;
};



export const getDescriptionsFromImageNodes = (nodes: Node[]) => {
  const imageNodes = nodes.filter((node) => node.type === 'image');
  
  const descriptions: string[] = [];
  
  imageNodes.forEach((node) => {
    const nodeData = node.data as ImageNodeProps['data'];
    
    // Se tem description (nó primitivo), usar ela
    if (nodeData.description) {
      descriptions.push(nodeData.description);
    }
    // Se não tem description mas tem imagem generated (nó transform), criar uma descrição básica
    else if (nodeData.generated?.url) {
      descriptions.push(`Imagem gerada disponível em: ${nodeData.generated.url}`);
    }
    // Se não tem description mas tem content (nó primitivo sem description), criar uma descrição básica  
    else if (nodeData.content?.url) {
      descriptions.push(`Imagem carregada disponível em: ${nodeData.content.url}`);
    }
  });
  
  return descriptions;
};

export const getImagesFromImageNodes = (nodes: Node[]) => {
  const sourceImages = nodes
    .filter((node) => node.type === 'image')
    .map((node) => (node.data as ImageNodeProps['data']).content)
    .filter(Boolean) as { url: string; type: string }[];

  const generatedImages = nodes
    .filter((node) => node.type === 'image')
    .map((node) => (node.data as ImageNodeProps['data']).generated)
    .filter(Boolean) as { url: string; type: string }[];

  return [...sourceImages, ...generatedImages];
};

export const isValidSourceTarget = (source: Node, target: Node) => {
  // Prevent drop nodes from being sources
  if (source.type === 'drop') {
    return false;
  }

  // File nodes can only connect to text, image, and video nodes
  if (source.type === 'file' && !['text', 'image', 'video'].includes(target.type)) {
    return false;
  }



  // File nodes don't accept any input
  if (target.type === 'file') {
    return false;
  }

  return true;
};



// File nodes removidos: funções relacionadas a arquivos não são mais necessárias
