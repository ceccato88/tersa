'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { logServerAction } from '@/lib/logger';
import { projects } from '@/schema';
import { eq } from 'drizzle-orm';
import { fal } from '@fal-ai/client';

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

      // Configurar FAL client
      fal.config({
        credentials: process.env.FAL_KEY,
      });

      console.log('🔍 Iniciando descrição de imagem com FAL AI Vision:', {
        imageUrl: url,
        projectId
      });

      // Preparar input para FAL AI Vision
      const falInput = {
        prompt: 'Descreva esta imagem em detalhes em português.',
        image_url: url,
        model: 'openai/gpt-5-chat',
        reasoning: false,
        priority: 'latency',
      };

      console.log('📋 FAL Vision Input:', JSON.stringify(falInput, null, 2));

      // Usar endpoint de visão do FAL AI
      const result = await fal.subscribe('fal-ai/any-llm/vision', {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('✅ Descrição gerada com sucesso:', {
        outputLength: result.data.output?.length ?? 0,
      });

      // Processar resultado
      const description = result.data.output;

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
