#!/usr/bin/env node

/**
 * Script para testar a conexão com o Supabase Storage
 * Verifica se os buckets existem e se a autenticação está funcionando
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const BUCKETS_TO_TEST = ['files', 'screenshots', 'avatars'];

async function testConnection() {
  console.log('🔍 TESTE DE CONEXÃO COM SUPABASE STORAGE');
  console.log('========================================');
  console.log(`🌐 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`🔑 Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'NÃO CONFIGURADA'}`);
  console.log('');

  // Testar listagem de buckets
  console.log('📋 Testando listagem de buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets:', error.message);
      return false;
    }
    
    console.log('✅ Buckets encontrados:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    console.log('');
    
    // Verificar se os buckets necessários existem
    const existingBuckets = buckets.map(b => b.name);
    const missingBuckets = BUCKETS_TO_TEST.filter(bucket => !existingBuckets.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.log('⚠️  Buckets faltando:');
      missingBuckets.forEach(bucket => {
        console.log(`   - ${bucket}`);
      });
      console.log('');
    }
    
    // Testar acesso a cada bucket necessário
    for (const bucketName of BUCKETS_TO_TEST) {
      if (existingBuckets.includes(bucketName)) {
        console.log(`🔍 Testando acesso ao bucket: ${bucketName}`);
        
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        if (listError) {
          console.log(`   ❌ Erro: ${listError.message}`);
        } else {
          console.log(`   ✅ Acesso OK (${files ? files.length : 0} arquivos encontrados)`);
        }
      } else {
        console.log(`🔍 Bucket ${bucketName}: ❌ NÃO EXISTE`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

async function main() {
  const success = await testConnection();
  
  console.log('');
  console.log('📋 RESULTADO:');
  console.log('=============');
  
  if (success) {
    console.log('✅ Conexão com Supabase Storage funcionando!');
    console.log('💡 Agora você pode executar o script de limpeza.');
  } else {
    console.log('❌ Problemas na conexão com Supabase Storage.');
    console.log('💡 Verifique as configurações no arquivo .env.local');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testConnection };