import { useNodeConnections } from '@xyflow/react';
import { ImagePrimitive } from './primitive';
import { ImageTransform } from './transform';
import { HybridImageTransform } from './hybrid-transform';

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
    aspectRatio?: string;
    seed?: string;
    // Campos FAL FLUX.1 [dev]
    num_images?: number;
    num_inference_steps?: number;
    guidance_scale?: number;
    sync_mode?: boolean;
    enable_safety_checker?: boolean;
    output_format?: string;
    acceleration?: string;
    // Campos legados para compatibilidade
    numOutputs?: number;
    numInferenceSteps?: number;
    guidance?: number;
    outputFormat?: string;
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

  // Se tem conexões de entrada OU conteúdo gerado, usa HybridImageTransform (com IA)
  // Se não tem conexões nem conteúdo gerado, usa ImagePrimitive (editor simples)
  if (hasConnections || hasGeneratedContent) {
    return <HybridImageTransform {...props} title="Imagem" />;
  }

  return <ImagePrimitive {...props} title="Imagem" />;
};
