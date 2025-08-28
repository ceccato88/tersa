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

  // Se tem conexões de entrada, usa TextTransform (com IA)
  // Se não tem conexões, usa TextPrimitive (editor simples)
  if (hasConnections) {
    return <TextTransform {...props} title="Texto" />;
  }

  return <TextPrimitive {...props} title="Texto" />;
};
