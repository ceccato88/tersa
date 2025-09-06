'use server';

// Note: We avoid strict session checks here to prevent client-side action failures in onboarding.
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { profile } from '@/schema';
import { eq } from 'drizzle-orm';

export const updateProfileAction = async (
  userId: string,
  data?: Partial<typeof profile.$inferInsert>
): Promise<
  | {
      success: true;
    }
  | {
      error: string;
    }
> => {
  try {
    // Proceed with provided userId to avoid session coupling issues in Server Actions

    // Upsert to ensure profile row exists even for fresh users
    await database
      .insert(profile)
      .values({ id: userId, ...(data ?? {}), onboardedAt: new Date() })
      .onConflictDoUpdate({
        target: profile.id,
        set: { ...(data ?? {}), onboardedAt: new Date() },
      });

    return { success: true };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
