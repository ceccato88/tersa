import { vercel } from '@t3-oss/env-core/presets-zod';
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  extends: [vercel()],
  server: {
    UPSTASH_REDIS_REST_URL: z.string().url().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    RESEND_TOKEN: z.string().min(1).startsWith('re_'),
    RESEND_EMAIL: z.string().email().min(1),

    SUPABASE_AUTH_HOOK_SECRET: z.string().min(1).startsWith('v1,whsec_'),

    // Supabase Integration
    POSTGRES_URL: z.string().url().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // AI Keys (FAL only)
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    HUME_API_KEY: z.string().min(1).optional(),
    LMNT_API_KEY: z.string().min(1).optional(),

    // Other Models
    MINIMAX_GROUP_ID: z.string().min(1),
    MINIMAX_API_KEY: z.string().min(1),
    RUNWAYML_API_SECRET: z.string().min(1).startsWith('key_'),
    LUMA_API_KEY: z.string().min(1).startsWith('luma-'),
    BF_API_KEY: z.string().min(1),
    FAL_KEY: z.string().min(1).optional(),
    // Test mode: when 'true', log inputs and return mock responses (no external API calls)
    TEST_LOG_ONLY: z.string().optional(),

    // Vercel AI Gateway
    
  },
  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().min(1).optional(),

    // Supabase Integration
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_UPLOAD_URL: z.string().url().min(1),
    NEXT_PUBLIC_SUPABASE_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_HOSTNAME: z.string().min(1),
  },
  runtimeEnv: {
    
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    POSTGRES_URL: process.env.POSTGRES_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_UPLOAD_URL: process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL,
    NEXT_PUBLIC_SUPABASE_DOMAIN: process.env.NEXT_PUBLIC_SUPABASE_DOMAIN,
    NEXT_PUBLIC_SUPABASE_HOSTNAME: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    MINIMAX_GROUP_ID: process.env.MINIMAX_GROUP_ID,
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RESEND_TOKEN: process.env.RESEND_TOKEN,
    RESEND_EMAIL: process.env.RESEND_EMAIL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_AUTH_HOOK_SECRET: process.env.SUPABASE_AUTH_HOOK_SECRET,
    RUNWAYML_API_SECRET: process.env.RUNWAYML_API_SECRET,
    LUMA_API_KEY: process.env.LUMA_API_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    HUME_API_KEY: process.env.HUME_API_KEY,
    LMNT_API_KEY: process.env.LMNT_API_KEY,
    BF_API_KEY: process.env.BF_API_KEY,
    FAL_KEY: process.env.FAL_KEY,
    TEST_LOG_ONLY: process.env.TEST_LOG_ONLY,
    
  },
});
