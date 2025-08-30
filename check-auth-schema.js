require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// Configuração da conexão PostgreSQL
const client = new Client({
  host: '216.238.105.79',
  port: 6543,
  database: 'postgres',
  user: 'postgres.your-tenant-id',
  password: 'Fu9qWO9KRBTHJJolCqXY',
  ssl: false,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000
});

async function checkAuthSchema() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA AUTH.USERS');
  console.log('============================================');
  
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL!');
    
    // Verificar se o schema auth existe
    console.log('\n🔄 Verificando schema auth...');
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'auth'
    `);
    
    if (schemaResult.rows.length === 0) {
      console.log('❌ Schema "auth" não encontrado!');
      
      // Listar todos os schemas disponíveis
      console.log('\n📋 Schemas disponíveis:');
      const allSchemas = await client.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
      `);
      
      allSchemas.rows.forEach(row => {
        console.log(`   - ${row.schema_name}`);
      });
      
      return;
    }
    
    console.log('✅ Schema "auth" encontrado!');
    
    // Verificar se a tabela users existe no schema auth
    console.log('\n🔄 Verificando tabela auth.users...');
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'users'
    `);
    
    if (tableResult.rows.length === 0) {
      console.log('❌ Tabela "auth.users" não encontrada!');
      
      // Listar tabelas no schema auth
      console.log('\n📋 Tabelas no schema auth:');
      const authTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'auth'
        ORDER BY table_name
      `);
      
      if (authTables.rows.length === 0) {
        console.log('   (Nenhuma tabela encontrada no schema auth)');
      } else {
        authTables.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      }
      
      return;
    }
    
    console.log('✅ Tabela "auth.users" encontrada!');
    
    // Verificar estrutura da tabela auth.users
    console.log('\n🔄 Analisando estrutura da tabela auth.users...');
    const columnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Colunas da tabela auth.users:');
    columnsResult.rows.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable}`);
    });
    
    // Verificar se existe tabela profile
    console.log('\n🔄 Verificando tabela public.profile...');
    const profileResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profile'
    `);
    
    if (profileResult.rows.length === 0) {
      console.log('❌ Tabela "public.profile" não encontrada!');
      
      // Listar tabelas no schema public
      console.log('\n📋 Tabelas no schema public:');
      const publicTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      publicTables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('✅ Tabela "public.profile" encontrada!');
      
      // Verificar estrutura da tabela profile
      const profileColumns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profile'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Colunas da tabela public.profile:');
      profileColumns.rows.forEach((col, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable}`);
      });
    }
    
    console.log('\n🎉 ANÁLISE CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

// Executar a verificação
checkAuthSchema().catch(console.error);