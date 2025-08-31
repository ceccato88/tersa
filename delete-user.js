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

// Função para criar/atualizar a função de exclusão de usuário
const createDeleteUserFunction = `
CREATE OR REPLACE FUNCTION delete_user_complete(user_email TEXT)
RETURNS TABLE(
  deleted_auth_user_id UUID,
  deleted_profile_id UUID,
  deleted_email TEXT,
  deletion_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  auth_user_id UUID;
  profile_id UUID;
  user_email_found TEXT;
BEGIN
  -- Buscar o usuário na tabela auth.users
  SELECT id, email INTO auth_user_id, user_email_found
  FROM auth.users
  WHERE email = user_email;
  
  -- Verificar se o usuário existe
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
  
  -- Buscar o perfil na tabela public.profile
  SELECT id INTO profile_id
  FROM public.profile
  WHERE id = auth_user_id::text;
  
  -- Excluir da tabela public.profile primeiro (devido à foreign key)
  IF profile_id IS NOT NULL THEN
    DELETE FROM public.profile WHERE id = auth_user_id::text;
    RAISE NOTICE 'Perfil excluído: %', profile_id;
  ELSE
    RAISE NOTICE 'Nenhum perfil encontrado para o usuário %', user_email;
  END IF;
  
  -- Excluir da tabela auth.users
  DELETE FROM auth.users WHERE id = auth_user_id;
  RAISE NOTICE 'Usuário excluído da auth.users: %', auth_user_id;
  
  -- Retornar informações da exclusão
  RETURN QUERY SELECT 
    auth_user_id as deleted_auth_user_id,
    profile_id as deleted_profile_id,
    user_email_found as deleted_email,
    NOW() as deletion_timestamp;
END;
$$ LANGUAGE plpgsql;
`;

// Função para excluir usuário
async function deleteUser(email) {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Criar/atualizar a função de exclusão
    console.log('🔧 Criando/atualizando função de exclusão...');
    await client.query(createDeleteUserFunction);
    console.log('✅ Função de exclusão criada/atualizada!');
    
    // Verificar se o usuário existe antes de excluir
    console.log(`🔍 Verificando se o usuário ${email} existe...`);
    const checkUser = await client.query(
      'SELECT u.id, u.email, u.created_at, p.id as profile_id FROM auth.users u LEFT JOIN public.profile p ON u.id::text = p.id WHERE u.email = $1',
      [email]
    );
    
    if (checkUser.rows.length === 0) {
      console.log(`❌ Usuário ${email} não encontrado.`);
      return;
    }
    
    const userData = checkUser.rows[0];
    console.log('📋 Dados do usuário encontrado:');
    console.log(`  - ID: ${userData.id}`);
    console.log(`  - Email: ${userData.email}`);
    console.log(`  - Criado em: ${userData.created_at}`);
    console.log(`  - Profile ID: ${userData.profile_id || 'Não encontrado'}`);
    
    // Confirmar exclusão
    console.log('\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
    console.log('⚠️  O usuário será excluído permanentemente das tabelas auth.users e public.profile.');
    
    // Executar a exclusão
    console.log('\n🗑️  Executando exclusão...');
    const deleteResult = await client.query(
      'SELECT * FROM delete_user_complete($1)',
      [email]
    );
    
    if (deleteResult.rows.length > 0) {
      const result = deleteResult.rows[0];
      console.log('\n✅ USUÁRIO EXCLUÍDO COM SUCESSO!');
      console.log('📋 Detalhes da exclusão:');
      console.log(`  - Auth User ID excluído: ${result.deleted_auth_user_id}`);
      console.log(`  - Profile ID excluído: ${result.deleted_profile_id || 'N/A'}`);
      console.log(`  - Email: ${result.deleted_email}`);
      console.log(`  - Timestamp da exclusão: ${result.deletion_timestamp}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERRO AO EXCLUIR USUÁRIO:');
    console.error(`Tipo: ${error.name}`);
    console.error(`Mensagem: ${error.message}`);
    
    if (error.message.includes('não encontrado')) {
      console.error('\n💡 Sugestões:');
      console.error('- Verifique se o email está correto');
      console.error('- Use o comando "list" para ver usuários disponíveis');
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

// Função para listar usuários (para referência antes da exclusão)
async function listUsers() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    console.log('\n📋 LISTANDO TODOS OS USUÁRIOS:');
    console.log('================================');
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        p.id as profile_id,
        p.customer_id,
        p.product_id
      FROM auth.users u
      LEFT JOIN public.profile p ON u.id::text = p.id
      ORDER BY u.created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('Nenhum usuário encontrado.');
      return;
    }
    
    console.log(`\nTotal de usuários: ${result.rows.length}\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Criado em: ${user.created_at}`);
      console.log(`   - Último login: ${user.last_sign_in_at || 'Nunca'}`);
      console.log(`   - Profile ID: ${user.profile_id || 'Não encontrado'}`);
      console.log(`   - Customer ID: ${user.customer_id || 'N/A'}`);
      console.log(`   - Product ID: ${user.product_id || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ ERRO AO LISTAR USUÁRIOS:');
    console.error(`Mensagem: ${error.message}`);
  } finally {
    try {
      await client.end();
      console.log('🔌 Conexão fechada.');
    } catch (closeError) {
      console.error('Erro ao fechar conexão:', closeError.message);
    }
  }
}

// Função para verificar usuário específico
async function verifyUser(email) {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    console.log(`\n🔍 VERIFICANDO USUÁRIO: ${email}`);
    console.log('================================');
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        p.id as profile_id,
        p.customer_id,
        p.product_id
      FROM auth.users u
      LEFT JOIN public.profile p ON u.id::text = p.id
      WHERE u.email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Usuário ${email} não encontrado.`);
      return;
    }
    
    const user = result.rows[0];
    console.log('\n📋 DADOS DO USUÁRIO:');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Criado em: ${user.created_at}`);
    console.log(`Último login: ${user.last_sign_in_at || 'Nunca'}`);
    console.log(`Email confirmado: ${user.email_confirmed_at || 'Não confirmado'}`);
    console.log(`Profile ID: ${user.profile_id || 'Não encontrado'}`);
    console.log(`Customer ID: ${user.customer_id || 'N/A'}`);
    console.log(`Product ID: ${user.product_id || 'N/A'}`);
    
  } catch (error) {
    console.error('\n❌ ERRO AO VERIFICAR USUÁRIO:');
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

// Função para exibir ajuda
function showHelp() {
  console.log('\n🗑️  SCRIPT DE EXCLUSÃO DE USUÁRIOS');
  console.log('===================================');
  console.log('\nUso:');
  console.log('  node delete-user.js <comando> [argumentos]');
  console.log('\nComandos disponíveis:');
  console.log('  delete <email>    - Excluir usuário pelo email');
  console.log('  list              - Listar todos os usuários');
  console.log('  verify <email>    - Verificar dados de um usuário específico');
  console.log('  help              - Exibir esta ajuda');
  console.log('\nExemplos:');
  console.log('  node delete-user.js delete admin@tersa.com');
  console.log('  node delete-user.js list');
  console.log('  node delete-user.js verify admin@tersa.com');
  console.log('\n⚠️  ATENÇÃO: A exclusão é IRREVERSÍVEL!');
  console.log('⚠️  Sempre verifique os dados antes de excluir!');
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];

if (!command) {
  showHelp();
  process.exit(1);
}

switch (command.toLowerCase()) {
  case 'delete':
    if (!email) {
      console.error('❌ Email é obrigatório para exclusão.');
      console.error('Uso: node delete-user.js delete <email>');
      process.exit(1);
    }
    deleteUser(email)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('💥 Erro inesperado:', error);
        process.exit(1);
      });
    break;
    
  case 'list':
    listUsers()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('💥 Erro inesperado:', error);
        process.exit(1);
      });
    break;
    
  case 'verify':
    if (!email) {
      console.error('❌ Email é obrigatório para verificação.');
      console.error('Uso: node delete-user.js verify <email>');
      process.exit(1);
    }
    verifyUser(email)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('💥 Erro inesperado:', error);
        process.exit(1);
      });
    break;
    
  case 'help':
    showHelp();
    process.exit(0);
    break;
    
  default:
    console.error(`❌ Comando desconhecido: ${command}`);
    showHelp();
    process.exit(1);
}