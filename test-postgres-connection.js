const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testPostgresConnection() {
  console.log('🔍 TESTE DE CONEXÃO POSTGRESQL');
  console.log('================================');
  
  // Configuração manual dos parâmetros (como no pgAdmin)
   const client = new Client({
     host: '216.238.105.79',
     port: 6543,
     database: 'postgres',
     user: 'postgres.your-tenant-id',
     password: 'Fu9qWO9KRBTHJJolCqXY',
     ssl: false,
     connectionTimeoutMillis: 10000,
     query_timeout: 10000,
     statement_timeout: 10000
   });
  
  console.log('🔧 Usando configuração manual (como pgAdmin)');
  console.log('📋 Configurações de conexão:');
  console.log('Host: 216.238.105.79');
  console.log('Port: 6543');
  console.log('Database: postgres');
  console.log('User: postgres.your-tenant-id');
  console.log('Password: ****');
  
  try {
    console.log('\n🔄 Tentando conectar...');
    await client.connect();
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
    
    // Teste básico de query
    console.log('\n🧪 Executando teste de query...');
    const result = await client.query('SELECT version(), current_database(), current_user, now() as current_time');
    
    console.log('\n📊 INFORMAÇÕES DO BANCO:');
    console.log(`Versão: ${result.rows[0].version}`);
    console.log(`Database: ${result.rows[0].current_database}`);
    console.log(`Usuário: ${result.rows[0].current_user}`);
    console.log(`Hora atual: ${result.rows[0].current_time}`);
    
    // Teste de listagem de tabelas
    console.log('\n📋 Listando tabelas disponíveis...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('Tabelas encontradas:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('Nenhuma tabela encontrada no schema public.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DE CONEXÃO:');
    console.error(`Tipo: ${error.name}`);
    console.error(`Mensagem: ${error.message}`);
    
    if (error.code) {
      console.error(`Código: ${error.code}`);
    }
    console.error(`Stack: ${error.stack}`);
    
    // Tentativa adicional com configuração alternativa
     console.log('\n🔄 Tentando com configuração alternativa...');
     const clientAlt = new Client({
        host: '216.238.105.79',
        port: 6543,
        database: 'postgres',
        user: 'postgres.your-tenant-id',
        password: 'Fu9qWO9KRBTHJJolCqXY',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      });
     
     try {
       await clientAlt.connect();
       console.log('✅ CONEXÃO ALTERNATIVA ESTABELECIDA!');
       
       const result = await clientAlt.query('SELECT version()');
       console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
       
       await clientAlt.end();
     } catch (altError) {
       console.log('❌ ERRO TAMBÉM NA CONFIGURAÇÃO ALTERNATIVA:', altError.message);
     }
    
    // Diagnósticos adicionais
    console.log('\n🔧 DIAGNÓSTICOS:');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('- Verifique se o servidor PostgreSQL está rodando');
      console.log('- Confirme o endereço IP e porta');
      console.log('- Verifique configurações de firewall');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('- Verifique usuário e senha');
      console.log('- Confirme se o usuário tem permissões adequadas');
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('- Verifique se o banco de dados existe');
      console.log('- Confirme o nome do banco na string de conexão');
    }
    
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Conexão fechada.');
    } catch (closeError) {
      console.error('Erro ao fechar conexão:', closeError.message);
    }
  }
}

// Executar o teste
testPostgresConnection()
  .then(() => {
    console.log('\n✨ Teste concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro inesperado:', error);
    process.exit(1);
  });