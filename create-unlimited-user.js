require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// Configuração da conexão PostgreSQL
const client = new Client({
  host: '[IP_DO_SEU_SERVIDOR]',
  port: 6543,
  database: 'postgres',
  user: 'postgres.your-tenant-id',
  password: 'Fu9qWO9KRBTHJJolCqXY',
  ssl: false,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000
});

// SQL para criar a função de usuário ilimitado
const createUserFunction = `
CREATE OR REPLACE FUNCTION create_unlimited_user(
  user_email TEXT,
  user_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"email_verified": true}',
    NULL,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
     DEFAULT,
     '',
     0,
     NULL,
     '',
     NULL,
     FALSE,
     NULL,
     FALSE
  )
  RETURNING id INTO new_user_id;

  -- Criar perfil do usuário com créditos ilimitados
  INSERT INTO public.profile (
    id,
    customer_id,
    subscription_id,
    product_id
  ) VALUES (
    new_user_id::text,
    'unlimited_' || new_user_id::TEXT,
    'unlimited_sub_' || new_user_id::TEXT,
    'unlimited_product'
  );

  -- Retornar informações do usuário criado
  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'message', 'Usuário criado com créditos ilimitados'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao criar usuário'
    );
END;
$$;
`;

// Função para criar usuário ilimitado
async function createUnlimitedUser(email, password) {
  console.log('🔍 CRIAÇÃO DE USUÁRIO COM CRÉDITOS ILIMITADOS');
  console.log('==============================================');
  
  try {
    // Conectar ao banco
    console.log('🔄 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Criar a função se não existir
    console.log('🔄 Criando/atualizando função create_unlimited_user...');
    await client.query(createUserFunction);
    console.log('✅ Função criada/atualizada com sucesso!');
    
    // Executar a função para criar o usuário
    console.log(`🔄 Criando usuário: ${email}`);
    const result = await client.query(
      'SELECT create_unlimited_user($1, $2) as result',
      [email, password]
    );
    
    const userResult = result.rows[0].result;
    
    if (userResult.success) {
      console.log('✅ USUÁRIO CRIADO COM SUCESSO!');
      console.log('📋 Detalhes:');
      console.log(`   ID: ${userResult.user_id}`);
      console.log(`   Email: ${userResult.email}`);
      console.log(`   Mensagem: ${userResult.message}`);
      
      // Verificar se o usuário foi criado corretamente
      console.log('\n🔄 Verificando usuário criado...');
      const verifyResult = await client.query(`
        SELECT u.id, u.email, u.created_at, p.customer_id, p.product_id
        FROM auth.users u
        LEFT JOIN public.profile p ON u.id::TEXT = p.id::TEXT
        WHERE u.email = $1
        ORDER BY u.created_at DESC
        LIMIT 1
      `, [email]);
      
      if (verifyResult.rows.length > 0) {
        const user = verifyResult.rows[0];
        console.log('✅ Verificação concluída:');
        console.log(`   Auth ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Criado em: ${user.created_at}`);
        console.log(`   Customer ID: ${user.customer_id}`);
        console.log(`   Product ID: ${user.product_id}`);
      }
      
    } else {
      console.error('❌ ERRO AO CRIAR USUÁRIO:');
      console.error(`   Erro: ${userResult.error}`);
      console.error(`   Mensagem: ${userResult.message}`);
    }
    
  } catch (error) {
    console.error('❌ ERRO DURANTE A EXECUÇÃO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

// Função para listar usuários ilimitados
async function listUnlimitedUsers() {
  console.log('\n📋 LISTANDO USUÁRIOS COM CRÉDITOS ILIMITADOS');
  console.log('=============================================');
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT u.id, u.email, u.created_at, p.customer_id, p.product_id
      FROM auth.users u
      LEFT JOIN public.profile p ON u.id::TEXT = p.id::TEXT
      WHERE p.product_id = 'unlimited_product'
      ORDER BY u.created_at DESC
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Encontrados ${result.rows.length} usuário(s) com créditos ilimitados:`);
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Criado: ${user.created_at}`);
        console.log(`   Customer ID: ${user.customer_id}`);
      });
    } else {
      console.log('ℹ️  Nenhum usuário com créditos ilimitados encontrado.');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 USO DO SCRIPT:');
    console.log('================');
    console.log('Criar usuário:');
    console.log('  node create-unlimited-user.js create email@exemplo.com senha123');
    console.log('');
    console.log('Listar usuários:');
    console.log('  node create-unlimited-user.js list');
    console.log('');
    console.log('Exemplo:');
    console.log('  node create-unlimited-user.js create admin@tersa.com minhasenha123');
    return;
  }
  
  const command = args[0];
  
  if (command === 'create') {
    if (args.length < 3) {
      console.error('❌ Erro: Email e senha são obrigatórios!');
      console.log('Uso: node create-unlimited-user.js create email@exemplo.com senha123');
      return;
    }
    
    const email = args[1];
    const password = args[2];
    
    if (!email.includes('@')) {
      console.error('❌ Erro: Email inválido!');
      return;
    }
    
    if (password.length < 6) {
      console.error('❌ Erro: Senha deve ter pelo menos 6 caracteres!');
      return;
    }
    
    await createUnlimitedUser(email, password);
    
  } else if (command === 'list') {
    await listUnlimitedUsers();
    
  } else {
    console.error('❌ Comando inválido! Use "create" ou "list"');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createUnlimitedUser, listUnlimitedUsers };