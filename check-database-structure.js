const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Configuração de conexão PostgreSQL
const dbConfig = {
  host: '[IP_DO_SEU_SERVIDOR]',
  port: 6543,
  database: 'postgres',
  user: 'postgres.your-tenant-id',
  password: 'Fu9qWO9KRBTHJJolCqXY',
  ssl: false,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
  statement_timeout: 10000
};

async function checkDatabaseStructure() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Verificar schemas disponíveis
    console.log('\n📋 SCHEMAS DISPONÍVEIS:');
    console.log('========================');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    
    schemas.rows.forEach(schema => {
      console.log(`- ${schema.schema_name}`);
    });
    
    // Verificar tabelas no schema auth
    console.log('\n📋 TABELAS NO SCHEMA AUTH:');
    console.log('===========================');
    const authTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'auth'
      ORDER BY table_name
    `);
    
    if (authTables.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada no schema auth');
    } else {
      authTables.rows.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    // Verificar tabelas no schema public
    console.log('\n📋 TABELAS NO SCHEMA PUBLIC:');
    console.log('=============================');
    const publicTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    publicTables.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Verificar estrutura da tabela profile
    console.log('\n📋 ESTRUTURA DA TABELA PROFILE:');
    console.log('================================');
    const profileColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profile'
      ORDER BY ordinal_position
    `);
    
    if (profileColumns.rows.length === 0) {
      console.log('❌ Tabela profile não encontrada');
    } else {
      profileColumns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:');
    console.error(`Mensagem: ${error.message}`);
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Conexão fechada.');
    } catch (closeError) {
      console.error('Erro ao fechar conexão:', closeError.message);
    }
  }
}

checkDatabaseStructure();