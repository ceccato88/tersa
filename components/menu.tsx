'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/providers/subscription';
import { ArrowUpRightIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type MouseEventHandler, useState } from 'react';
import { Profile } from './profile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

export const Menu = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const user = useUser();
  const { isSubscribed } = useSubscription();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleOpenProfile: MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDropdownOpen(false);

    // shadcn/ui issue: dropdown animation causes profile modal to close immediately after opening
    setTimeout(() => {
      setProfileOpen(true);
    }, 200);
  };

  if (!user) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <Loader2 className="animate-spin" size={16} />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.user_metadata.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground uppercase">
                {(user.user_metadata.name ?? user.email ?? user.id)
                  ?.split(' ')
                  .map((name: string) => name.at(0))
                  .join('')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          collisionPadding={8}
          sideOffset={16}
          className="w-52"
        >
          <DropdownMenuLabel>
            <Avatar>
              <AvatarImage src={user.user_metadata.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground uppercase">
                {(user.user_metadata.name ?? user.email ?? user.id)
                  ?.split(' ')
                  .map((name: string) => name.at(0))
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 truncate">
              {user.user_metadata.name ?? user.email ?? user.id}
            </p>
            {user.user_metadata.name && user.email && (
              <p className="truncate font-normal text-muted-foreground text-xs">
                {user.email}
              </p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenProfile}>
            Perfil
          </DropdownMenuItem>


          <DropdownMenuItem onClick={logout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Profile open={profileOpen} setOpen={setProfileOpen} />
    </>
  );
};
