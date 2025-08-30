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
    
    // Verificar se consegue fazer uma requisição básica
    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from('_health')
      .select('*')
      .limit(1);
    
    if (healthError && healthError.code !== 'PGRST116') {
      console.log(`⚠️  Health check falhou (esperado): ${healthError.message}`);
    } else {
      console.log('✅ Conexão com Anon Key estabelecida!');
    }
    
    // Teste 2: Listar tabelas públicas (se possível)
    console.log('\n🔄 Tentando listar esquema público...');
    const { data: tables, error: tablesError } = await supabaseAnon.rpc('get_schema');
    
    if (tablesError) {
      console.log(`⚠️  Não foi possível listar tabelas: ${tablesError.message}`);
    } else {
      console.log('✅ Esquema acessível!');
      console.log('Tabelas encontradas:', tables);
    }
    
    // Teste 3: Conexão com Service Role Key (se disponível)
    if (supabaseServiceKey) {
      console.log('\n🔄 Testando conexão com Service Role Key...');
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: serviceTest, error: serviceError } = await supabaseService
        .from('_health')
        .select('*')
        .limit(1);
      
      if (serviceError && serviceError.code !== 'PGRST116') {
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