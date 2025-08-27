'use server';

import { currentUserProfile } from '@/lib/auth';
import { env } from '@/lib/env';
import { parseError } from '@/lib/error/parse';
import { stripe } from '@/lib/stripe';

const HOBBY_CREDITS = 200;
const INFINITE_CREDITS = 999999999999;

export const getCredits = async (): Promise<
  | {
      credits: number;
    }
  | {
      error: string;
    }
> => {
  try {
    const profile = await currentUserProfile();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Return infinite credits for all users
    return {
      credits: INFINITE_CREDITS,
    };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
