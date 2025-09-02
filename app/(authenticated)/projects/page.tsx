import { createProjectAction } from '@/app/actions/project/create';
import { currentUser, currentUserProfile } from '@/lib/auth';
import { database } from '@/lib/database';
import { projects } from '@/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'WOW',
  description: 'Crie e compartilhe fluxos de trabalho com IA',
};

export const maxDuration = 800; // 13 minutes

const Projects = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const profile = await currentUserProfile();

  if (!profile?.onboardedAt) {
    return redirect('/welcome');
  }

  let project = await database.query.projects.findFirst({
    where: eq(projects.userId, profile.id),
  });

  if (!project) {
    const newProject = await createProjectAction('Projeto Sem Título');

    if ('error' in newProject) {
      throw new Error(newProject.error);
    }

    const newFetchedProject = await database.query.projects.findFirst({
      where: eq(projects.id, newProject.id),
    });

    if (!newFetchedProject) {
      throw new Error('Falha ao criar projeto');
    }

    project = newFetchedProject;
  }

  redirect(`/projects/${project.id}`);
};

export default Projects;
