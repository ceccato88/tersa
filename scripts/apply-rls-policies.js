// Applies RLS and policies for profile and project tables.
// Safe to run multiple times (idempotent via checks).

const { Client } = require('pg');
// Load env vars from .env.local (same as drizzle.config.ts)
try {
  require('dotenv').config({ path: '.env.local' });
} catch {}

async function run() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error('POSTGRES_URL is not set. Aborting.');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    // Enable RLS on profile and project
    await client.query(`alter table if exists profile enable row level security;`);
    await client.query(`alter table if exists project enable row level security;`);

    // Profile policies (owner only)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile' AND policyname = 'profile_select_own'
        ) THEN
          CREATE POLICY "profile_select_own" ON profile FOR SELECT USING (id = auth.uid()::text);
        END IF;
      END$$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile' AND policyname = 'profile_insert_self'
        ) THEN
          CREATE POLICY "profile_insert_self" ON profile FOR INSERT WITH CHECK (id = auth.uid()::text);
        END IF;
      END$$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile' AND policyname = 'profile_update_own'
        ) THEN
          CREATE POLICY "profile_update_own" ON profile FOR UPDATE USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
        END IF;
      END$$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile' AND policyname = 'profile_delete_own'
        ) THEN
          CREATE POLICY "profile_delete_own" ON profile FOR DELETE USING (id = auth.uid()::text);
        END IF;
      END$$;
    `);

    // Project policies (owner full; members read)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project' AND policyname = 'project_select_owner_or_member'
        ) THEN
          CREATE POLICY "project_select_owner_or_member" ON project FOR SELECT USING (
            user_id = auth.uid()::text OR auth.uid()::text = ANY (COALESCE(members, ARRAY[]::text[]))
          );
        END IF;
      END$$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project' AND policyname = 'project_insert_owner'
        ) THEN
          CREATE POLICY "project_insert_owner" ON project FOR INSERT WITH CHECK (user_id = auth.uid()::text);
        END IF;
      END$$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project' AND policyname = 'project_update_owner_only'
        ) THEN
          CREATE POLICY "project_update_owner_only" ON project FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
        END IF;
      END$$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project' AND policyname = 'project_delete_owner_only'
        ) THEN
          CREATE POLICY "project_delete_owner_only" ON project FOR DELETE USING (user_id = auth.uid()::text);
        END IF;
      END$$;
    `);

    console.log('✅ RLS habilitado e políticas aplicadas para profile e project');
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error('❌ Falha ao aplicar políticas RLS:', e);
  process.exit(1);
});
