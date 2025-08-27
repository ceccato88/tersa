import { currentUserProfile } from '@/lib/auth';
import { database } from '@/lib/database';
import { projects } from '@/schema';
import { eq } from 'drizzle-orm';
import { Suspense } from 'react';
import { CreditCounter } from './credits-counter';
import { Menu } from './menu';
import { getCredits } from '@/app/actions/credits/get';

type TopRightProps = {
  id: string;
};

export const TopRight = async ({ id }: TopRightProps) => {
  const profile = await currentUserProfile();
  const project = await database.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!profile || !project) {
    return null;
  }

  // Check if user has infinite credits
  const creditsResponse = await getCredits();
  const hasInfiniteCredits = 'credits' in creditsResponse && creditsResponse.credits === 999999999999;

  return (
    <div className="absolute top-16 right-0 left-0 z-[50] m-4 flex items-center gap-2 sm:top-0 sm:left-auto">
      {profile.subscriptionId && !hasInfiniteCredits ? (
        <div className="flex items-center rounded-full border bg-card/90 p-3 drop-shadow-xs backdrop-blur-sm">
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm">Loading...</p>
            }
          >
            <CreditCounter />
          </Suspense>
        </div>
      ) : null}
      <div className="flex items-center rounded-full border bg-card/90 p-1 drop-shadow-xs backdrop-blur-sm">
        <Menu />
      </div>
    </div>
  );
};
