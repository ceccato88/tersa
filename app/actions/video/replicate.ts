'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { projects } from '@/schema';
import type { Edge, Node, Viewport } from '@xyflow/react';
import { eq } from 'drizzle-orm';

type GenerateVideoReplicateActionProps = {
  modelId: string;
  prompt: string;
  instructions: string;
  nodeId: string;
  projectId: string;
  imageUrl: string | { url: string; type: string };
  seed?: string;
  numOutputs?: number;
  resolution?: string;
  frames_per_second?: number;
};

export const generateVideoReplicateAction = async ({
  modelId,
  prompt,
  instructions,
  nodeId,
  projectId,
  imageUrl,
  seed,
  numOutputs,
  resolution,
  frames_per_second,
}: GenerateVideoReplicateActionProps): Promise<
  | {
      nodeData: object;
    }
  | {
      error: string;
    }
> => {
  try {
    const user = await getSubscribedUser();

    console.log('🚀 Gerando vídeo com Replicate...');
    
    // Extrair URL da imagem se for objeto
    const imageUrlString = typeof imageUrl === 'string' ? imageUrl : imageUrl?.url;
    
    if (!imageUrlString) {
      throw new Error('URL da imagem de entrada é obrigatória');
    }
    
    // Preparar input para o modelo
    const input = {
      prompt: [instructions, prompt].filter(Boolean).join('\n'),
      image: imageUrlString, // Apenas a string da URL
      seed: seed ? parseInt(seed) : Math.floor(Math.random() * 1000000),
      resolution: resolution || '480p',
      frames_per_second: frames_per_second || 16,
      go_fast: false,
      num_frames: 81,
      sample_shift: 5,
      sample_steps: 40,
    };

    console.log('📝 Input para Replicate:', input);

    // Usar SDK corretamente com output.url()
    const Replicate = require('replicate');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('🚀 Executando com SDK do Replicate...');
    const output = await replicate.run(modelId, { input });
    
    console.log('✅ Output do Replicate:', output);
    console.log('✅ Tipo do output:', typeof output);
    
    // Usar o método .url() conforme documentação
    let videoUrl = null;
    
    if (output && typeof output.url === 'function') {
      const urlResult = output.url();
      console.log('🎯 URL extraída via output.url():', urlResult);
      
      // Se é um objeto URL, converter para string
      if (urlResult && typeof urlResult === 'object' && urlResult.href) {
        videoUrl = urlResult.href;
        console.log('✅ URL convertida para string:', videoUrl);
      } else if (typeof urlResult === 'string') {
        videoUrl = urlResult;
        console.log('✅ URL já é string:', videoUrl);
      }
    } else if (typeof output === 'string') {
      videoUrl = output;
      console.log('🎯 URL direta:', videoUrl);
    } else {
      console.error('❌ Output inválido:', output);
      throw new Error('Não foi possível extrair URL do vídeo');
    }
    
    if (!videoUrl || typeof videoUrl !== 'string') {
      console.error('❌ videoUrl final:', videoUrl, typeof videoUrl);
      throw new Error('URL do vídeo não encontrada na resposta do Replicate');
    }

    // Buscar projeto
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
        url: videoUrl, // Usar URL direta do Replicate
        type: 'video/mp4',
      },
      model: modelId,
      instructions: instructions,
      seed: seed,
      numOutputs,
      resolution: resolution,
      frames_per_second: frames_per_second,
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
    console.error('❌ Erro na geração de vídeo:', error);
    const message = parseError(error);
    return { error: message };
  }
};