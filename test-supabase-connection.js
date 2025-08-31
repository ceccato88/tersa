require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 TESTE DE CONEXÃO SUPABASE');
  console.log('================================');
  
  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const tenantId = process.env.SUPABASE_TENANT_ID;
  
  console.log('📋 Configurações encontradas:');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);
  console.log(`Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);
  console.log(`JWT Secret: ${jwtSecret ? jwtSecret.substring(0, 10) + '...' : 'NÃO ENCONTRADO'}`);
  console.log(`Tenant ID: ${tenantId}`);
  console.log('');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRO: URL ou Anon Key do Supabase não encontrados!');
    return;
  }
  
  try {
    // Teste 1: Conexão com Anon Key
    console.log('🔄 Testando conexão com Anon Key...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar se consegue fazer uma requisição básica usando tabelas reais
    const { data: profileCheck, error: profileError } = await supabaseAnon
      .from('profile')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.log(`⚠️  Teste de tabela 'profile': ${profileError.message}`);
    } else {
      console.log('✅ Conexão com Anon Key estabelecida! Tabela profile acessível.');
    }
    
    // Teste 2: Verificar tabela project
    console.log('\n🔄 Testando acesso à tabela project...');
    const { data: projectsCheck, error: projectsError } = await supabaseAnon
      .from('project')
      .select('id')
      .limit(1);
    
    if (projectsError) {
      console.log(`⚠️  Teste de tabela 'project': ${projectsError.message}`);
    } else {
      console.log('✅ Tabela project acessível!');
      console.log('Projetos encontrados:', projectsCheck?.length || 0);
    }
    
    // Teste 3: Conexão com Service Role Key (se disponível)
    if (supabaseServiceKey) {
      console.log('\n🔄 Testando conexão com Service Role Key...');
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: serviceTest, error: serviceError } = await supabaseService
        .from('profile')
        .select('id')
        .limit(1);
      
      if (serviceError) {
        console.log(`⚠️  Service role test falhou: ${serviceError.message}`);
      } else {
        console.log('✅ Conexão com Service Role Key estabelecida!');
      }
    }
    
    // Teste 4: Verificar autenticação
    console.log('\n🔄 Testando sistema de autenticação...');
    const { data: authData, error: authError } = await supabaseAnon.auth.getSession();
    
    if (authError) {
      console.log(`⚠️  Erro na autenticação: ${authError.message}`);
    } else {
      console.log('✅ Sistema de autenticação acessível!');
      console.log('Sessão atual:', authData.session ? 'Ativa' : 'Nenhuma');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('================================');
    
  } catch (error) {
    console.error('❌ ERRO DURANTE O TESTE:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testSupabaseConnection().catch(console.error);