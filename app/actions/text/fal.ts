'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { createClient } from '@/lib/supabase/server';
import { projects } from '@/schema';
import type { Edge, Node, Viewport } from '@xyflow/react';
import { eq } from 'drizzle-orm';
import { fal } from '@fal-ai/client';
import { getUserFalToken } from '@/app/actions/profile/update-fal-token';

type GenerateTextFalActionProps = {
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  nodeId: string;
  projectId: string;
  reasoning?: boolean;
  priority?: 'throughput' | 'latency';
};

export const generateTextFalAction = async ({
  modelId,
  prompt,
  systemPrompt,
  nodeId,
  projectId,
  reasoning = false,
  priority = 'latency',
}: GenerateTextFalActionProps): Promise<
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

    // Exigir token do usuário (sem fallback para FAL_KEY)
    const userToken = user ? await getUserFalToken(user.id) : null;
    if (!userToken) {
      return { error: 'Token FAL não configurado. Vá ao seu perfil e salve seu token FAL para usar os modelos.' };
    }
    fal.config({ credentials: userToken });
    console.log('🔑 Token FAL para ação texto: usuário');

    console.log('🤖 Gerando texto com FAL AI:', {
      model: modelId,
      promptLength: prompt.length,
      systemPromptLength: systemPrompt?.length ?? 0,
      reasoning,
      priority,
    });

    // Preparar input para FAL AI
    const input: any = {
      prompt,
      model: modelId,
      reasoning,
      priority,
    };

    if (systemPrompt) {
      input.system_prompt = systemPrompt;
    }

    // Fazer chamada para FAL AI
    const result = await fal.subscribe('fal-ai/any-llm/enterprise', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('📝 FAL AI Progress:', update.logs?.map((log) => log.message).join('\n'));
        }
      },
    });

    console.log('✅ Texto gerado com sucesso:', {
      outputLength: result.data.output?.length ?? 0,
      hasReasoning: !!result.data.reasoning,
    });

    // Buscar projeto no banco de dados
    const [project] = await database
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

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
        text: result.data.output,
        reasoning: result.data.reasoning,
        model: modelId,
        provider: 'fal',
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
    console.error('❌ Erro na geração de texto:', error);
    const message = parseError(error);
    return { error: message };
  }
};
