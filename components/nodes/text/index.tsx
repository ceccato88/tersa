import type { JSONContent } from '@tiptap/core';
import { getIncomers, useReactFlow } from '@xyflow/react';
import { TextPrimitive } from './primitive';
import { TextTransform } from './transform';

export type TextNodeProps = {
  type: string;
  data: {
    generated?: {
      text: string;
    };
    model?: string;
    updatedAt?: string;
    instructions?: string;
    variationCount?: number;

    // Tiptap generated JSON content
    content?: JSONContent;

    // Tiptap text content
    text?: string;
  };
  id: string;
};

export const TextNode = (props: TextNodeProps) => {
  const { getNodes, getEdges } = useReactFlow();
  const incomers = getIncomers(props, getNodes(), getEdges());
  const hasConnections = incomers.length > 0;
  const hasGeneratedContent = Boolean(props.data.generated?.text);

  // Se tem conexões de entrada OU conteúdo gerado, usa TextTransform (com IA)
  // Se não tem conexões nem conteúdo gerado, usa TextPrimitive (editor simples)
  if (hasConnections || hasGeneratedContent) {
    return <TextTransform {...props} title="Texto" />;
  }

  return <TextPrimitive {...props} title="Texto" />;
};
