'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { trackCreditUsage } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { projects } from '@/schema';
import type { Edge, Node, Viewport } from '@xyflow/react';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import Replicate from 'replicate';

type GenerateImageReplicateActionProps = {
  modelId: string;
  prompt: string;
  instructions?: string;
  nodeId: string;
  projectId: string;
  aspectRatio?: string;
  seed?: number;
  numOutputs?: number;
  imageInputs?: string[];
  guidance?: number;
  megapixels?: number;
  outputFormat?: string;
  outputQuality?: number;
  promptStrength?: number;
  numInferenceSteps?: number;
  disableSafetyChecker?: boolean;
  goFast?: boolean;
  image?: string;
};

export const generateImageReplicateAction = async ({
  modelId,
  prompt,
  instructions,
  nodeId,
  projectId,
  aspectRatio = '1:1',
  seed,
  numOutputs = 1,
  imageInputs,
  guidance = 3.5,
  megapixels = 1,
  outputFormat = 'webp',
  outputQuality = 80,
  promptStrength = 0.8,
  numInferenceSteps = 28,
  disableSafetyChecker = false,
  goFast = true,
  image,
}: GenerateImageReplicateActionProps): Promise<
  | {
      nodeData: object;
    }
  | {
      error: string;
    }
> => {
  try {
    const client = await createClient();
    const user = await getSubscribedUser();

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not found');
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Construir o prompt final
    const finalPrompt = instructions
      ? `${instructions}. ${prompt}`
      : prompt;

    console.log('🎨 Gerando imagem com Replicate:', {
      model: modelId,
      prompt: finalPrompt,
      aspectRatio,
      seed,
      numOutputs,
    });

    // Preparar input para o modelo
    const input: any = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio,
      guidance: guidance,
      num_outputs: numOutputs,
      output_format: outputFormat,
      output_quality: outputQuality,
      megapixels: megapixels.toString(),
      prompt_strength: promptStrength,
      num_inference_steps: numInferenceSteps,
      disable_safety_checker: disableSafetyChecker,
      go_fast: goFast,
      ...(seed && { seed: parseInt(seed.toString(), 10) }),
    };

    // Adicionar imagem se fornecida
    if (image) {
      input.image = image;
    } else if (imageInputs && imageInputs.length > 0) {
      // imageInputs contém objetos {url: string, type: string}, mas o Replicate espera apenas a URL
      input.image = imageInputs[0].url;
    }

    // Executar o modelo Replicate e aguardar conclusão
    const prediction = await replicate.predictions.create({
      model: modelId,
      input,
    });

    console.log('🔄 Predição criada:', prediction.id);

    // Aguardar a conclusão da predição
    const completedPrediction = await replicate.wait(prediction);

    console.log('📸 Resposta do Replicate:', completedPrediction.output);

    // Extrair URLs das imagens
    let imageUrls: string[] = [];
    const output = completedPrediction.output;
    
    // O Replicate retorna um array com URLs de imagem
    if (Array.isArray(output)) {
      // Filtrar apenas strings válidas (URLs)
      imageUrls = output.filter(item => typeof item === 'string' && item.trim().length > 0);
    } else if (typeof output === 'string') {
      imageUrls = [output];
    } else if (output && typeof output === 'object') {
      // Verificar se tem propriedade 'output'
      if ('output' in output) {
        const outputData = (output as any).output;
        if (Array.isArray(outputData)) {
          imageUrls = outputData.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
        } else if (typeof outputData === 'string') {
          imageUrls = [outputData];
        }
      }
    }

    if (!imageUrls.length) {
      console.error('Resposta do Replicate:', JSON.stringify(output, null, 2));
      console.error('Status da predição:', completedPrediction.status);
      if (completedPrediction.error) {
        console.error('Erro da predição:', completedPrediction.error);
        throw new Error(`Erro na predição: ${completedPrediction.error}`);
      }
      throw new Error('Nenhuma URL de imagem encontrada na resposta');
    }

    console.log('🔗 URLs extraídas:', imageUrls);

    // Usar a primeira imagem para o nó atual
    const primaryImageUrl = imageUrls[0];

    // Fazer download da imagem e salvar no Supabase
    const imageResponse = await fetch(primaryImageUrl);
    if (!imageResponse.ok) {
      throw new Error('Falha ao fazer download da imagem');
    }

    const imageBlob = await imageResponse.blob();
    const fileExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const imageName = `${nanoid()}.${fileExtension}`;
    const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;

    const uploadResult = await client.storage
      .from('files')
      .upload(`${user.id}/${imageName}`, imageBlob, {
        contentType: mimeType,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const { data: downloadUrl } = client.storage
      .from('files')
      .getPublicUrl(uploadResult.data.path);

    // Créditos infinitos - não rastrear uso
    console.log('💳 Créditos infinitos - pulando rastreamento do Stripe');

    // Buscar o projeto atual
    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const content = project.content as {
      nodes: Node[];
      edges: Edge[];
      viewport: Viewport;
    };

    const existingNode = content.nodes.find((n) => n.id === nodeId);

    if (!existingNode) {
      throw new Error('Nó não encontrado');
    }

    // Criar dados do nó atualizado
    const newData = {
      ...(existingNode.data ?? {}),
      updatedAt: new Date().toISOString(),
      generated: {
        url: downloadUrl.publicUrl,
        type: mimeType,
      },
    };

    // Atualizar o nó no banco de dados
    const updatedNodes = content.nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: newData,
        };
      }
      return node;
    });

    await database
      .update(projects)
      .set({ content: { ...content, nodes: updatedNodes } })
      .where(eq(projects.id, projectId));

    console.log('✅ Nó atualizado com sucesso:', newData);

    return {
      nodeData: newData,
    };
  } catch (error) {
    console.error('❌ Erro na geração de imagem:', error);
    const message = parseError(error);
    return { error: message };
  }
};