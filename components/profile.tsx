import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { handleError } from '@/lib/error/handle';
import { createClient } from '@/lib/supabase/client';
import { uploadFile } from '@/lib/upload';
import type { UserAttributes } from '@supabase/supabase-js';
import { EyeIcon, EyeOffIcon, KeyIcon, Loader2Icon, TrashIcon } from 'lucide-react';
import Image from 'next/image';
import { type FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from './ui/kibo-ui/dropzone';
import { Label } from './ui/label';
import { updateFalTokenAction, getFalTokenAction, deleteFalTokenAction } from '@/app/actions/profile/update-fal-token';

type ProfileProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const Profile = ({ open, setOpen }: ProfileProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [password, setPassword] = useState('');
  
  // Estados para o token FAL
  const [falToken, setFalToken] = useState('');
  const [currentFalToken, setCurrentFalToken] = useState('');
  const [showFalToken, setShowFalToken] = useState(false);
  const [isFalTokenUpdating, setIsFalTokenUpdating] = useState(false);
  const [hasFalToken, setHasFalToken] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const client = createClient();
      const { data } = await client.auth.getUser();

      if (!data.user) {
        return;
      }

      if (data.user.user_metadata.name) {
        setName(data.user.user_metadata.name);
      }

      if (data.user.email) {
        setEmail(data.user.email);
      }

      if (data.user.user_metadata.avatar) {
        const raw = data.user.user_metadata.avatar as string;
        const m = raw.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
        if (m) {
          const [, bucket, rest] = m;
          setImage(`/api/storage/${bucket}/${rest}`);
        } else {
          setImage(raw);
        }
      }

      // Carregar token FAL
      const falTokenResult = await getFalTokenAction();
      if (falTokenResult.token) {
        setCurrentFalToken(falTokenResult.token);
        setHasFalToken(falTokenResult.hasToken || false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdateUser: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const client = createClient();

      const attributes: UserAttributes = {
        data: {},
      };

      if (name.trim()) {
        attributes.data = {
          ...attributes.data,
          name,
        };
      }

      if (email.trim()) {
        attributes.email = email;
      }

      if (password.trim()) {
        attributes.password = password;
      }

      const response = await client.auth.updateUser(attributes);

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('Perfil atualizado com sucesso');
      setOpen(false);
    } catch (error) {
      handleError('Erro ao atualizar perfil', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDrop = async (files: File[]) => {
    if (isUpdating) {
      return;
    }

    try {
      if (!files.length) {
        throw new Error('Nenhum arquivo selecionado');
      }

      setIsUpdating(true);

      const { url } = await uploadFile(files[0], 'avatars');
      const client = createClient();

      const response = await client.auth.updateUser({
        data: {
          avatar: url,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('Avatar atualizado com sucesso');
      setImage(url);
    } catch (error) {
      handleError('Erro ao atualizar avatar', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Funções para gerenciar token FAL
  const handleUpdateFalToken = async () => {
    if (!falToken.trim() || isFalTokenUpdating) {
      return;
    }

    setIsFalTokenUpdating(true);

    try {
      const result = await updateFalTokenAction(falToken);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Token FAL salvo com sucesso');
      setFalToken('');
      
      // Recarregar token mascarado
      const falTokenResult = await getFalTokenAction();
      if (falTokenResult.token) {
        setCurrentFalToken(falTokenResult.token);
        setHasFalToken(falTokenResult.hasToken || false);
      }
    } catch (error) {
      handleError('Erro ao salvar token FAL', error);
    } finally {
      setIsFalTokenUpdating(false);
    }
  };

  const handleDeleteFalToken = async () => {
    if (isFalTokenUpdating) {
      return;
    }

    setIsFalTokenUpdating(true);

    try {
      const result = await deleteFalTokenAction();
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Token FAL removido com sucesso');
      setCurrentFalToken('');
      setHasFalToken(false);
    } catch (error) {
      handleError('Erro ao remover token FAL', error);
    } finally {
      setIsFalTokenUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações de perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Coluna Esquerda: Avatar + Dados básicos */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Dropzone
                maxSize={1024 * 1024 * 10}
                minSize={1024}
                maxFiles={1}
                multiple={false}
                accept={{ 'image/*': [] }}
                onDrop={handleDrop}
                src={[new File([], image)]}
                onError={console.error}
                className="relative aspect-square h-36 w-auto"
              >
                <DropzoneEmptyState />
                <DropzoneContent>
                  {image && (
                    <Image
                      src={image}
                      alt="Image preview"
                      className="absolute top-0 left-0 h-full w-full object-cover"
                      unoptimized
                      width={100}
                      height={100}
                    />
                  )}
                  {isUpdating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <Loader2Icon size={24} className="animate-spin" />
                    </div>
                  )}
                </DropzoneContent>
              </Dropzone>
            </div>

            <form onSubmit={handleUpdateUser} className="grid gap-4" aria-disabled={isUpdating}>
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                  className="text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="joao@silva.com"
                  value={email}
                  type="email"
                  onChange={({ target }) => setEmail(target.value)}
                  className="text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  type="password"
                  onChange={({ target }) => setPassword(target.value)}
                  className="text-foreground"
                />
              </div>
              <Button type="submit" disabled={isUpdating || !name.trim() || !email.trim()}>
                Atualizar
              </Button>
            </form>
          </div>

          {/* Coluna Direita: Token FAL */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyIcon size={16} />
              <h3 className="font-medium">Token FAL API</h3>
            </div>

            {hasFalToken && (
              <div className="p-3 bg-secondary rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Token atual:</p>
                    <code className="text-sm font-mono break-all">{currentFalToken}</code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteFalToken}
                    disabled={isFalTokenUpdating}
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon size={14} />
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="fal-token">{hasFalToken ? 'Atualizar Token FAL' : 'Token FAL'}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="fal-token"
                    placeholder="12345678-1234-1234-1234-123456789abc:abcdef1234567890abcdef1234567890"
                    value={falToken}
                    type={showFalToken ? 'text' : 'password'}
                    onChange={({ target }) => setFalToken(target.value)}
                    className="text-foreground pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowFalToken(!showFalToken)}
                  >
                    {showFalToken ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                  </Button>
                </div>
                <Button onClick={handleUpdateFalToken} disabled={isFalTokenUpdating || !falToken.trim()}>
                  {isFalTokenUpdating ? <Loader2Icon size={14} className="animate-spin" /> : 'Salvar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obrigatório para gerar com FAL. Salve aqui seu token pessoal.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
