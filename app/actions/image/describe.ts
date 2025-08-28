'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { logServerAction } from '@/lib/logger';
import { visionModels } from '@/lib/models/vision';
import { projects } from '@/schema';
import { eq } from 'drizzle-orm';

export const describeAction = async (
  url: string,
  projectId: string
): Promise<
  | {
      description: string;
    }
  | {
      error: string;
    }
> => {
  return logServerAction('describeAction', async () => {
    try {
      // Autenticação do usuário
      await getSubscribedUser();

      // Busca do projeto
      const project = await database.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Validação do modelo de visão
      const visionModel = visionModels[project.visionModel];

      if (!visionModel) {
        throw new Error('Vision model not found');
      }

      // Processamento da URL da imagem
      let parsedUrl = url;

      if (process.env.NODE_ENV !== 'production') {
        const response = await fetch(url);
        const blob = await response.blob();
        parsedUrl = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
      }

      // Chamada direta ao Replicate
      const Replicate = require('replicate');
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // Configuração do input baseado no modelo
      const replicateInput: any = {
        prompt: 'Descreva esta imagem em detalhes.',
        max_tokens: 1024,
      };

      // GPT modelos usam image_input como array
      if (visionModel.replicateModel.includes('openai/gpt')) {
        replicateInput.image_input = [parsedUrl];
      } else {
        // Claude modelos usam image como string
        replicateInput.image = parsedUrl;
      }

      // Chamada direta ao modelo do Replicate
      const output = await replicate.run(visionModel.replicateModel, {
        input: replicateInput,
      });

      // Processamento da resposta
      const description = Array.isArray(output) ? output.join('') : output;

      if (!description || typeof description !== 'string') {
        throw new Error('No description found');
      }

      return {
        description,
      };
    } catch (error) {
      const message = parseError(error);
      return { error: message };
    }
  }, { url, projectId });
};
