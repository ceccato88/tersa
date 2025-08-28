import type { JSONContent } from '@tiptap/core';
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
  // Sempre usa TextTransform (versão com IA) independente das conexões
  return <TextTransform {...props} title="Texto" />;
};
