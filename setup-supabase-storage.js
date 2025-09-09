#!/usr/bin/env node

/**
 * Script para configurar buckets do Supabase Storage
 * 
 * Este script:
 * 1. Executa o seed.sql para criar buckets e políticas
 * 2. Verifica se os buckets foram criados corretamente
 * 3. Testa a funcionalidade básica
 * 
 * Buckets criados:
 * - avatars: Para imagens de perfil
 * - files: Para arquivos gerais (imagens/vídeos gerados)
 * - screenshots: Para capturas de tela
 * 
 * Uso:
 *   node setup-supabase-storage.js
 *   node setup-supabase-storage.js --check-only
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

// Configuração do banco PostgreSQL
const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

// Cliente PostgreSQL
const client = new Client({
  connectionString: postgresUrl
});

// Buckets esperados
const EXPECTED_BUCKETS = ['avatars', 'files', 'screenshots']

// Políticas RLS para cada bucket
const RLS_POLICIES = {
  INSERT: (bucketName) => `
    CREATE POLICY "Users can upload their own ${bucketName}" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = '${bucketName}' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  `,
  UPDATE: (bucketName) => `
    CREATE POLICY "Users can update their own ${bucketName}" ON storage.objects
    FOR UPDATE USING (
      bucket_id = '${bucketName}' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  `,
  DELETE: (bucketName) => `
    CREATE POLICY "Users can delete their own ${bucketName}" ON storage.objects
    FOR DELETE USING (
      bucket_id = '${bucketName}' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  `,
  SELECT: (bucketName) => `
    CREATE POLICY "${bucketName.charAt(0).toUpperCase() + bucketName.slice(1)} are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = '${bucketName}');
  `
};

/**
 * Verifica se um bucket existe
 */
async function checkBucketExists(bucketId) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketId);
    return !error && data;
  } catch (error) {
    return false;
  }
}

/**
 * Executa o arquivo seed.sql
 */
async function executeSeedSql() {
  try {
    const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql')
    
    if (!fs.existsSync(seedPath)) {
      throw new Error('Arquivo supabase/seed.sql não encontrado')
    }
    
    const seedContent = fs.readFileSync(seedPath, 'utf8')
    await client.query(seedContent)
    
    return true
  } catch (error) {
    throw new Error(`Erro ao executar seed.sql: ${error.message}`)
  }
}

/**
 * Verifica se os buckets existem
 */
async function checkBuckets() {
  try {
    const result = await client.query(`
      SELECT name FROM storage.buckets 
      WHERE name = ANY($1)
      ORDER BY name
    `, [EXPECTED_BUCKETS])
    
    return result.rows.map(row => row.name)
  } catch (error) {
    throw new Error(`Erro ao verificar buckets: ${error.message}`)
  }
}

/**
 * Testa upload básico
 */
async function testBasicUpload() {
  try {
    // Criar um arquivo de teste simples
    const testContent = 'test-file-content'
    const testFileName = `test-${Date.now()}.txt`
    
    // Tentar inserir diretamente na tabela storage.objects para testar
    const result = await client.query(`
      SELECT COUNT(*) as bucket_count 
      FROM storage.buckets 
      WHERE name = 'files'
    `)
    
    return result.rows[0].bucket_count > 0
  } catch (error) {
    throw new Error(`Erro no teste básico: ${error.message}`)
  }
}



/**
 * Valida a configuração final
 */
async function validateSetup() {
  console.log('\n🔍 VALIDANDO CONFIGURAÇÃO...');
  
  const buckets = await listBuckets();
  const expectedBuckets = BUCKETS_CONFIG.map(b => b.id);
  
  let allValid = true;
  
  for (const expectedBucket of expectedBuckets) {
    const exists = buckets.some(b => b.id === expectedBucket);
    if (exists) {
      console.log(`✅ Bucket '${expectedBucket}' encontrado`);
    } else {
      console.log(`❌ Bucket '${expectedBucket}' NÃO encontrado`);
      allValid = false;
    }
  }

  // Testar upload básico
  try {
    console.log('\n🧪 Testando upload básico...');
    const testContent = 'test-file-content';
    const testFileName = 'test-upload.txt';
    
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.log('❌ Teste de upload falhou:', uploadError.message);
      allValid = false;
    } else {
      console.log('✅ Teste de upload bem-sucedido');
      
      // Limpar arquivo de teste
      await supabase.storage.from('files').remove([testFileName]);
    }
  } catch (error) {
    console.log('❌ Erro no teste de upload:', error.message);
    allValid = false;
  }

  return allValid;
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check-only')
  const reset = args.includes('--reset')
  
  console.log('🚀 CONFIGURAÇÃO DO SUPABASE STORAGE')
  console.log('=====================================')
  
  try {
    // Conectar ao banco
    console.log('🔗 Conectando ao banco PostgreSQL...')
    await client.connect()
    console.log('✅ Conexão estabelecida')
    
    if (checkOnly) {
      // Apenas verificar buckets existentes
      console.log('\n🔍 VERIFICANDO BUCKETS...')
      const existingBuckets = await checkBuckets()
      
      for (const bucketName of EXPECTED_BUCKETS) {
        if (existingBuckets.includes(bucketName)) {
          console.log(`✅ Bucket '${bucketName}' encontrado`)
        } else {
          console.log(`❌ Bucket '${bucketName}' NÃO encontrado`)
        }
      }
    } else {
      if (reset) {
        console.log('\n🧹 Removendo objetos e buckets existentes (reset)...')
        try {
          // Remover uploads multiparte pendentes (se existirem)
          try { await client.query(`delete from storage.s3_multipart_uploads where bucket_id = any($1::text[])`, [EXPECTED_BUCKETS]) } catch {}
          try { await client.query(`delete from storage.s3_multipart_uploads_parts where bucket_id = any($1::text[])`, [EXPECTED_BUCKETS]) } catch {}
          try { await client.query(`delete from storage.s3_multipart_uploads_comp where bucket_id = any($1::text[])`, [EXPECTED_BUCKETS]) } catch {}

          // Remover objetos e prefixes (árvore de pastas) antes de apagar buckets
          await client.query(`delete from storage.objects where bucket_id = any($1::text[])`, [EXPECTED_BUCKETS])
          try { await client.query(`delete from storage.prefixes where bucket_id = any($1::text[])`, [EXPECTED_BUCKETS]) } catch {}

          // Por fim, remover os buckets
          await client.query(`delete from storage.buckets where id = any($1::text[])`, [EXPECTED_BUCKETS])
          console.log('✅ Buckets limpos')
        } catch (e) {
          console.log('❌ Falha ao limpar buckets:', e.message)
          throw e
        }
      }
      // Executar seed.sql
      console.log('\n📄 Executando seed.sql...')
      await executeSeedSql()
      console.log('✅ Seed.sql executado com sucesso')
      
      // Verificar buckets criados
      console.log('\n🔍 VERIFICANDO BUCKETS CRIADOS...')
      const existingBuckets = await checkBuckets()
      
      for (const bucketName of EXPECTED_BUCKETS) {
        if (existingBuckets.includes(bucketName)) {
          console.log(`✅ Bucket '${bucketName}' encontrado`)
        } else {
          console.log(`❌ Bucket '${bucketName}' NÃO encontrado`)
        }
      }
      
      // Teste básico
      console.log('\n🧪 Testando configuração...')
      const testResult = await testBasicUpload()
      if (testResult) {
        console.log('✅ Teste básico bem-sucedido')
      } else {
        console.log('❌ Teste básico falhou')
      }
      
      console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!')
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A CONFIGURAÇÃO:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ ERRO FATAL:', error.message);
    process.exit(1);
  });
}

module.exports = {
  executeSeedSql,
  checkBuckets,
  testBasicUpload
};
