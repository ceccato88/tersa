import { createClient } from '@supabase/supabase-js'
import { Database } from '../schema'
import { config } from 'dotenv'
import { join } from 'path'

// Carregar variáveis de ambiente do .env.local
config({ path: join(process.cwd(), '.env.local') })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL não encontrada no .env.local')
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local')
}

// Cliente com privilégios de admin
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface CreateUnlimitedUserParams {
  email: string
  password: string
  fullName?: string
}

interface CreateUserResult {
  success: boolean
  user?: any
  profile?: any
  error?: string
}

/**
 * Cria um usuário "unlimited" com perfil personalizado
 * Usa a Supabase Auth API para garantir compatibilidade e segurança
 */
export async function createUnlimitedUser({
  email,
  password,
  fullName = 'Unlimited User'
}: CreateUnlimitedUserParams): Promise<CreateUserResult> {
  try {
    console.log(`🚀 Criando usuário unlimited: ${email}`)

    // 1. Criar usuário usando Auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name: fullName,
        email_verified: true
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message)
      return {
        success: false,
        error: `Erro na autenticação: ${authError.message}`
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Usuário não foi criado'
      }
    }

    console.log(`✅ Usuário criado com ID: ${authData.user.id}`)

    // 2. Criar perfil na tabela public.profile
    const profileData = {
      id: authData.user.id, // UUID do usuário
      customer_id: `unlimited_${authData.user.id}`,
      subscription_id: `unlimited_sub_${authData.user.id}`,
      product_id: 'unlimited_product',
      onboarded_at: new Date()
    }

    const { data: profileResult, error: profileError } = await supabase
      .from('profile')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message)
      
      // Tentar limpar o usuário criado se o perfil falhou
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return {
        success: false,
        error: `Erro ao criar perfil: ${profileError.message}`
      }
    }

    console.log('✅ Perfil criado com sucesso')

    return {
      success: true,
      user: authData.user,
      profile: profileResult
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return {
      success: false,
      error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

/**
 * Script para execução via linha de comando
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('❌ Uso: node create-unlimited-user.js <email> <password> [nome_completo]')
    console.log('📝 Exemplo: node create-unlimited-user.js user@example.com senha123 "João Silva"')
    process.exit(1)
  }

  const [email, password, fullName] = args

  console.log('🔧 CRIAÇÃO DE USUÁRIO UNLIMITED')
  console.log('================================')
  console.log(`📧 Email: ${email}`)
  console.log(`👤 Nome: ${fullName || 'Unlimited User'}`)
  console.log('================================')

  const result = await createUnlimitedUser({
    email,
    password,
    fullName
  })

  if (result.success) {
    console.log('\n🎉 USUÁRIO CRIADO COM SUCESSO!')
    console.log('================================')
    console.log(`👤 ID: ${result.user?.id}`)
    console.log(`📧 Email: ${result.user?.email}`)
    console.log(`🆔 Customer ID: ${result.profile?.customer_id}`)
    console.log(`📋 Product ID: ${result.profile?.product_id}`)
    console.log('================================')
    console.log('\n✅ O usuário pode fazer login normalmente!')
  } else {
    console.log('\n❌ FALHA NA CRIAÇÃO DO USUÁRIO')
    console.log('================================')
    console.log(`🚨 Erro: ${result.error}`)
    console.log('================================')
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}