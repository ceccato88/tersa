import { useNodeConnections } from '@xyflow/react';
import { ImagePrimitive } from './primitive';
import { ImageTransform } from './transform';

export type ImageNodeProps = {
  type: string;
  data: {
    content?: {
      url: string;
      type: string;
    };
    generated?: {
      url: string;
      type: string;
    };
    size?: string;
    width?: number;
    height?: number;
    updatedAt?: string;
    model?: string;
    description?: string;
    instructions?: string;
  };
  id: string;
};

export const ImageNode = (props: ImageNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: 'target',
  });
  const hasConnections = connections.length > 0;
  const hasGeneratedContent = Boolean(props.data.generated?.url);

  // Se tem conexões de entrada OU conteúdo gerado, usa ImageTransform (com IA)
  // Se não tem conexões nem conteúdo gerado, usa ImagePrimitive (editor simples)
  if (hasConnections || hasGeneratedContent) {
    return <ImageTransform {...props} title="Imagem" />;
  }

  return <ImagePrimitive {...props} title="Imagem" />;
};
