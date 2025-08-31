import type { FileNodeProps } from '@/components/nodes/file';
import type { ImageNodeProps } from '@/components/nodes/image';
import type { TextNodeProps } from '@/components/nodes/text';
import type { Node } from '@xyflow/react';

export const getTextFromTextNodes = (nodes: Node[]) => {
  const messages: string[] = [];

  // Coletar textos originais (mensagens do usuário)
  const sourceTexts = nodes
    .filter((node) => node.type === 'text')
    .map((node) => (node.data as TextNodeProps['data']).text)
    .filter(Boolean);

  // Adicionar textos originais com tag User:
  sourceTexts.forEach(text => {
    messages.push(`User: ${text}`);
  });

  // Coletar instruções do usuário (data.instructions)
  const userInstructions = nodes
    .filter((node) => node.type === 'text')
    .map((node) => (node.data as TextNodeProps['data']).instructions)
    .filter(Boolean);

  // Adicionar instruções com tag User:
  userInstructions.forEach(instruction => {
    messages.push(`User: ${instruction}`);
  });

  // Coletar textos gerados (mensagens do assistente)
  const generatedTexts = nodes
    .filter((node) => node.type === 'text' && node.data.generated)
    .map((node) => (node.data as TextNodeProps['data']).generated?.text)
    .filter(Boolean);

  // Adicionar textos gerados com tag Assistant:
  generatedTexts.forEach(text => {
    messages.push(`Assistant: ${text}`);
  });

  return messages;
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



export const getFilesFromFileNodes = (nodes: Node[]) => {
  const files = nodes
    .filter((node) => node.type === 'file')
    .map((node) => (node.data as FileNodeProps['data']).content)
    .filter(Boolean) as { url: string; type: string; name: string }[];

  return files;
};
