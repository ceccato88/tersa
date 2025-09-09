// Migrates public Supabase Storage URLs to private proxy URLs in project.content
// Example: https://<supabase>/storage/v1/object/public/files/userId/abc.jpg -> /api/storage/files/userId/abc.jpg

const { Client } = require('pg');
const path = require('path');
try { require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }); } catch {}

function runRegexMigrations(text) {
  // Replace any domain: /storage/v1/object/public/<bucket>/<rest>
  const reAny = /https?:\/\/[^\s"')]+\/storage\/v1\/object\/public\/([^/]+)\/([^"'\s)]+)/g;
  return text.replace(reAny, (_m, bucket, rest) => `/api/storage/${bucket}/${rest}`);
}

async function run() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error('POSTGRES_URL is not set. Aborting.');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const likes = [
      '%/storage/v1/object/public/files/%',
      '%/storage/v1/object/public/avatars/%',
      '%/storage/v1/object/public/screenshots/%',
    ];
    const res = await client.query(
      `select id, content::text as content_text from project where content::text ilike any($1::text[])`,
      [likes]
    );

    let updated = 0;
    for (const row of res.rows) {
      const original = row.content_text;
      const replaced = runRegexMigrations(original);
      if (replaced !== original) {
        await client.query(
          `update project set content = $1::jsonb where id = $2`,
          [replaced, row.id]
        );
        updated++;
      }
    }
    console.log(`✅ Migração concluída. Projetos atualizados: ${updated}`);
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error('❌ Falha na migração de URLs de storage:', e);
  process.exit(1);
});

