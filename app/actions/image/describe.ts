'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { logServerAction } from '@/lib/logger';
import { projects } from '@/schema';
import { eq } from 'drizzle-orm';
import { fal } from '@fal-ai/client';
import { getUserFalToken } from '@/app/actions/profile/update-fal-token';

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
      const user = await getSubscribedUser();

      // Busca do projeto
      const project = await database.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Exigir token do usuário (sem fallback para FAL_KEY)
      const userToken = user ? await getUserFalToken(user.id) : null;
      if (!userToken) {
        return { error: 'Token FAL não configurado. Vá ao seu perfil e salve seu token FAL para usar a descrição de imagens.' };
      }
      fal.config({ credentials: userToken });
      console.log('🔑 Token FAL para describe: usuário');

      console.log('🔍 Iniciando descrição de imagem com FAL AI Vision:', {
        imageUrl: url,
        projectId
      });

      // Preparar input para FAL AI Vision com GPT-5 Chat
      const falInput = {
        prompt: 'Descreva esta imagem em detalhes em português.',
        image_url: url,
        model: 'openai/gpt-5-chat', // Modelo FAL GPT-5 Chat para análise de visão
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
