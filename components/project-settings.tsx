'use client';

import { deleteProjectAction } from '@/app/actions/project/delete';
import { updateProjectAction } from '@/app/actions/project/update';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { handleError } from '@/lib/error/handle';

import { visionModels } from '@/lib/models/vision';
import { useSubscription } from '@/providers/subscription';
import type { projects } from '@/schema';
import { SettingsIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import { ModelSelector } from './nodes/model-selector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

type ProjectSettingsProps = {
  data: typeof projects.$inferSelect;
};

export const ProjectSettings = ({ data }: ProjectSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(data.name);

  const [visionModel, setVisionModel] = useState(data.visionModel);
  const router = useRouter();
  const { isSubscribed, plan } = useSubscription();

  const handleUpdateProject: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);

      const response = await updateProjectAction(data.id, {
        name,
        visionModel,
      });

      if ('error' in response) {
        throw new Error(response.error);
      }

      toast.success('Projeto atualizado com sucesso');
      setOpen(false);
      router.refresh();
    } catch (error) {
      handleError('Erro ao atualizar o projeto', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const response = await deleteProjectAction(data.id);

      if ('error' in response) {
        throw new Error(response.error);
      }

      toast.success('Projeto excluído com sucesso');
      setOpen(false);
      router.push('/');
    } catch (error) {
      handleError('Erro ao excluir projeto', error);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <SettingsIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações do projeto</DialogTitle>
          <DialogDescription>Atualize os detalhes do seu projeto.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleUpdateProject}
          className="mt-2 grid gap-4"
          aria-disabled={isUpdating}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Meu novo projeto"
              value={name}
              onChange={({ target }) => setName(target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visionModel">Modelo de Visão</Label>
            <ModelSelector
              id="visionModel"
              value={visionModel}
              options={visionModels}
              onChange={setVisionModel}
              disabled={!isSubscribed || plan === 'hobby'}
            />
          </div>
          <Button type="submit" disabled={isUpdating || !name.trim()}>
            Atualizar
          </Button>
        </form>
        <DialogFooter className="-mx-6 mt-4 border-t px-6 pt-4 sm:justify-center">
          <Button
            variant="link"
            onClick={handleDeleteProject}
            className="flex items-center gap-2 text-destructive"
          >
            <TrashIcon size={16} />
            <span>Excluir</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
