import { profile } from '@/schema';
import { eq } from 'drizzle-orm';
import { database } from './database';
import { env } from './env';
import { createClient } from './supabase/server';

export const currentUser = async () => {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  return user;
};

export const currentUserProfile = async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error('User not found');
  }

  const userProfiles = await database
    .select()
    .from(profile)
    .where(eq(profile.id, user.id));
  let userProfile = userProfiles.at(0);

  if (!userProfile && user.email) {
    try {
      const response = await database
        .insert(profile)
        .values({ id: user.id })
        .returning();

      if (response.length) {
        userProfile = response[0];
      }
    } catch (error: any) {
      // If profile already exists (duplicate key error), fetch it
      if (error?.code === '23505') {
        const existingProfiles = await database
          .select()
          .from(profile)
          .where(eq(profile.id, user.id));
        userProfile = existingProfiles.at(0);
      } else {
        throw error;
      }
    }
  }

  return userProfile;
};

// All logged-in users can use all features; no Stripe/credits gating
export const getSubscribedUser = async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error('Create an account to use AI features.');
  }

  // Ensure profile exists (created on-demand by currentUserProfile)
  await currentUserProfile();
  return user;
};
