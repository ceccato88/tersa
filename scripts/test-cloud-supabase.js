#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase na nuvem (VPS)
 * Especificamente para configuração em produção
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Configurações da nuvem
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const postgresUrl = process.env.POSTGRES_URL;

async function testCloudSupabase() {
  console.log('🔍 TESTE DE CONEXÃO SUPABASE NUVEM (VPS)');
  console.log('==========================================');
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);
  console.log(`🗄️  PostgreSQL: ${postgresUrl ? 'Configurado' : 'NÃO CONFIGURADO'}`);
  console.log('');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Configurações do Supabase não encontradas!');
    return false;
  }

  // Teste 1: Conexão direta com PostgreSQL
  console.log('🔄 Testando conexão PostgreSQL direta...');
  try {
    const pgClient = new Client({ connectionString: postgresUrl });
    await pgClient.connect();
    
    // Verificar se os buckets existem na tabela storage.buckets
    const { rows } = await pgClient.query('SELECT id, name, public FROM storage.buckets ORDER BY name');
    
    console.log('✅ Conexão PostgreSQL estabelecida!');
    console.log('📦 Buckets encontrados:');
    rows.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    
    await pgClient.end();
  } catch (error) {
    console.error('❌ Erro na conexão PostgreSQL:', error.message);
    return false;
  }

  // Teste 2: Cliente Supabase com Service Role
  console.log('\n🔄 Testando cliente Supabase...');
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Testar listagem de buckets via API
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets via API:', error.message);
      
      // Se for erro de JWT, vamos tentar com configuração alternativa
      if (error.message.includes('signature') || error.message.includes('JWT')) {
        console.log('⚠️  Problema com JWT detectado. Tentando configuração alternativa...');
        
        // Tentar sem configurações de auth
        const supabaseAlt = createClient(supabaseUrl, supabaseServiceKey);
        const { data: bucketsAlt, error: errorAlt } = await supabaseAlt.storage.listBuckets();
        
        if (errorAlt) {
          console.error('❌ Erro persistente:', errorAlt.message);
          return false;
        } else {
          console.log('✅ Conexão alternativa funcionou!');
          console.log('📦 Buckets via API:');
          bucketsAlt.forEach(bucket => {
            console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
          });
        }
      } else {
        return false;
      }
    } else {
      console.log('✅ API do Supabase funcionando!');
      console.log('📦 Buckets via API:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erro no cliente Supabase:', error.message);
    return false;
  }
}

// Teste 3: Verificar arquivos em buckets específicos
async function testBucketAccess() {
  console.log('\n🔄 Testando acesso aos buckets...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const bucketsToTest = ['files', 'screenshots', 'avatars'];
  
  for (const bucketName of bucketsToTest) {
    try {
      console.log(`\n📁 Testando bucket: ${bucketName}`);
      
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 5 });
      
      if (error) {
        console.log(`❌ Erro no bucket ${bucketName}: ${error.message}`);
      } else {
        console.log(`✅ Bucket ${bucketName} acessível (${files.length} arquivos encontrados)`);
        if (files.length > 0) {
          console.log('   Primeiros arquivos:');
          files.slice(0, 3).forEach(file => {
            console.log(`   - ${file.name} (${file.metadata?.size || 'tamanho desconhecido'})`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar bucket ${bucketName}: ${error.message}`);
    }
  }
}

async function main() {
  const success = await testCloudSupabase();
  
  if (success) {
    await testBucketAccess();
  }
  
  console.log('\n📋 RESULTADO FINAL:');
  console.log('===================');
  
  if (success) {
    console.log('✅ Conexão com Supabase na nuvem funcionando!');
    console.log('💡 O script de limpeza deve funcionar agora.');
  } else {
    console.log('❌ Problemas na conexão com Supabase na nuvem.');
    console.log('💡 Verifique:');
    console.log('   - Se o serviço Supabase está rodando na VPS');
    console.log('   - Se as chaves JWT estão corretas');
    console.log('   - Se o IP/porta estão acessíveis');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCloudSupabase, testBucketAccess };