'use server';

import { currentUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { logServerAction } from '@/lib/logger';
import { projects } from '@/schema';
import { and, eq } from 'drizzle-orm';

export const updateProjectAction = async (
  projectId: string,
  data: Partial<typeof projects.$inferInsert>
): Promise<
  | {
      success: true;
    }
  | {
      error: string;
    }
> => {
  return logServerAction('updateProjectAction', async () => {
    try {
      // Verificação de autenticação
      const user = await currentUser();

      if (!user) {
        throw new Error('You need to be logged in to update a project!');
      }

      // Preparação dos dados para atualização
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      // Execução da atualização no banco de dados
      const project = await database
        .update(projects)
        .set(updateData)
        .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

      if (!project) {
        throw new Error('Project not found');
      }

      return { success: true };
    } catch (error) {
      const message = parseError(error);
      return { error: message };
    }
  }, { projectId, data });
};
