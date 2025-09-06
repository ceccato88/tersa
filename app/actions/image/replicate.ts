'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
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

    // Preparar input para o modelo - converter valores para tipos corretos conforme API Flux Dev
    const input: any = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio, // string
      guidance: typeof guidance === 'string' ? parseFloat(guidance) : guidance, // number
      num_outputs: typeof numOutputs === 'string' ? parseInt(numOutputs, 10) : numOutputs, // integer
      output_format: outputFormat, // string
      output_quality: typeof outputQuality === 'string' ? parseInt(outputQuality, 10) : outputQuality, // integer
      megapixels: megapixels.toString(), // string (API espera string)
      prompt_strength: typeof promptStrength === 'string' ? parseFloat(promptStrength) : promptStrength, // number
      num_inference_steps: typeof numInferenceSteps === 'string' ? parseInt(numInferenceSteps, 10) : numInferenceSteps, // integer
      disable_safety_checker: Boolean(disableSafetyChecker), // boolean
      go_fast: Boolean(goFast), // boolean
      ...(seed && { seed: parseInt(seed.toString(), 10) }), // integer
    };

    // Adicionar imagem se fornecida - usar parâmetro correto baseado no modelo
    const imageUrl = image || (imageInputs && imageInputs.length > 0 ? imageInputs[0].url : null);
    
    if (imageUrl) {
      // Flux Pro 1.1 usa image_prompt, outros modelos usam image
      if (modelId === 'black-forest-labs/flux-1.1-pro') {
        input.image_prompt = imageUrl;
      } else {
        input.image = imageUrl;
      }
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
    
    console.log('🔗 Fazendo download da imagem do Replicate:', primaryImageUrl);
    const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;

    // Download da imagem do Replicate
    const imageResponse = await fetch(primaryImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erro ao fazer download da imagem: ${imageResponse.statusText}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();

    // Upload para Supabase Storage
    const fileName = `${user.id}/${nanoid()}.${outputFormat}`;
    const uploadResult = await client.storage
      .from('files')
      .upload(fileName, imageArrayBuffer, {
        contentType: mimeType,
      });

    if (uploadResult.error) {
      throw new Error(`Erro no upload para Supabase: ${uploadResult.error.message}`);
    }

    // Obter URL pública do Supabase
    const { data: supabaseUrl } = client.storage
      .from('files')
      .getPublicUrl(uploadResult.data.path);

    console.log('✅ Imagem salva no Supabase Storage:', supabaseUrl.publicUrl);

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
        url: supabaseUrl.publicUrl, // Usar URL do Supabase Storage
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
