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

    // FAL API Key (não obrigatória; agora exigimos token do usuário)
    FAL_KEY: z.string().optional(),
    
    // Encryption key for user secrets
    ENCRYPTION_KEY: z.string().min(1),
    
    // Test mode: when 'true', log inputs and return mock responses (no external API calls)
    TEST_LOG_ONLY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),

    // Supabase Integration
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_UPLOAD_URL: z.string().url().min(1),
    NEXT_PUBLIC_SUPABASE_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_HOSTNAME: z.string().min(1),
  },
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_UPLOAD_URL: process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL,
    NEXT_PUBLIC_SUPABASE_DOMAIN: process.env.NEXT_PUBLIC_SUPABASE_DOMAIN,
    NEXT_PUBLIC_SUPABASE_HOSTNAME: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RESEND_TOKEN: process.env.RESEND_TOKEN,
    RESEND_EMAIL: process.env.RESEND_EMAIL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_AUTH_HOOK_SECRET: process.env.SUPABASE_AUTH_HOOK_SECRET,
    FAL_KEY: process.env.FAL_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    TEST_LOG_ONLY: process.env.TEST_LOG_ONLY,
  },
});
