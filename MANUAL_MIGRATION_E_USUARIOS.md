# Manual de Procedimentos - Migrations e Criação de Usuários

## 📋 Visão Geral

Este manual documenta os procedimentos para:
1. Executar migrations do banco de dados usando Drizzle
2. Criar usuários com créditos ilimitados no sistema
3. Configurar buckets do Supabase Storage

## 🔧 Pré-requisitos

### Ambiente Necessário
- **WSL (Windows Subsystem for Linux)** - OBRIGATÓRIO
- Node.js e pnpm instalados
- Acesso ao banco PostgreSQL
- Projeto configurado com Drizzle ORM

### Arquivos Necessários
- `package.json` com scripts de migration
- `create-unlimited-user.js` (script personalizado)
- `setup-supabase-storage.js` (script de configuração de storage)
- Configuração de banco em `lib/database.ts`
- Arquivo `supabase/seed.sql` com configurações de storage

## 🗄️ Parte 1: Executando Migrations

### 1.1 Verificar Scripts Disponíveis

Primeiro, verifique se os scripts estão configurados no `package.json`:

```json
{
  "scripts": {
    "migrate": "npx drizzle-kit push",
    "generate": "npx drizzle-kit generate"
  }
}
```

### 1.2 Executar Migrations

**⚠️ IMPORTANTE: Sempre use WSL para executar comandos**

```bash
# Navegar para o diretório do projeto
wsl cd /mnt/c/ai/tersa

# Executar migrations
wsl pnpm migrate
```

### 1.3 Verificar Resultado

Após executar, você deve ver uma saída similar a:

```
✓ Pulling schema from database...
✓ Changes applied successfully!
```

### 1.4 Validar Schema

Para verificar se as tabelas foram criadas corretamente:

```bash
wsl node check-auth-schema.js
```

Este comando deve mostrar:
- Tabela `auth.users` com todas as colunas
- Tabela `public.profile` com todas as colunas

## 🗄️ Parte 2: Configurando Supabase Storage

### 2.1 Problema: Tela Branca com Imagens do Supabase

**Sintoma:** Após configurar os buckets e gerar imagens, a aplicação apresenta tela branca com erro no console:

```
Uncaught Error: Invalid src prop (http://216.238.105.79:8000/storage/v1/object/public/files/...) on `next/image`, hostname "216.238.105.79" is not configured under images in your `next.config.js`
```

**Causa:** O Next.js bloqueia imagens de hostnames não configurados por segurança.

**Solução:** Adicionar o IP da VPS na configuração de imagens do Next.js.

#### 2.1.1 Correção Manual

1. **Criar backup do next.config.ts:**
```bash
wsl cp next.config.ts next.config.ts.backup
```

2. **Editar next.config.ts e adicionar o IP da VPS:**
```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    // ... outras configurações ...
    
    // Supabase storage, custom IP
    {
      protocol: 'http',
      hostname: '216.238.105.79', // Substitua pelo IP da sua VPS
    },
    
    // ... outras configurações ...
  ],
},
```

3. **Reiniciar o servidor:**
```bash
wsl pnpm dev
```

#### 2.1.2 Correção Automatizada

Para facilitar futuras instalações, use o script automatizado:

```bash
# Verificar IP atual
wsl node scripts/update-vps-ip.js --check

# Atualizar para novo IP
wsl node scripts/update-vps-ip.js 192.168.1.100

# Reiniciar servidor
wsl pnpm dev
```

**Comandos disponíveis:**
- `--check` ou `-c`: Verifica IP atual sem alterar
- `--help` ou `-h`: Mostra ajuda completa

### 2.2 Visão Geral dos Buckets

O sistema utiliza três buckets principais:

#### `avatars`
- **Propósito**: Imagens de perfil dos usuários
- **Tipos permitidos**: JPEG, PNG, WebP, GIF
- **Tamanho máximo**: 50MB
- **Acesso**: Público para leitura, usuários gerenciam apenas seus arquivos

#### `files` 
- **Propósito**: Arquivos gerais dos projetos (imagens e vídeos gerados)
- **Tipos permitidos**: Imagens, documentos, vídeos, áudios
- **Tamanho máximo**: 50MB
- **Acesso**: Público para leitura, usuários gerenciam apenas seus arquivos

#### `screenshots`
- **Propósito**: Capturas de tela do sistema
- **Tipos permitidos**: JPEG, PNG, WebP
- **Tamanho máximo**: 50MB
- **Acesso**: Público para leitura, usuários gerenciam apenas seus arquivos

### 2.2 Script de Configuração

O script `setup-supabase-storage.js` automatiza:
- Verificação de buckets existentes
- Criação de buckets necessários
- Configuração de políticas de segurança (RLS)
- Validação da configuração final

### 2.3 Comandos Disponíveis

#### Configuração Completa
```bash
wsl node scripts/setup-supabase-storage.js
```

#### Apenas Verificar Configuração
```bash
wsl node scripts/setup-supabase-storage.js --check-only
```

#### Forçar Recriação dos Buckets
```bash
wsl node scripts/setup-supabase-storage.js --force-recreate
```

### 2.4 Resultado Esperado

Após executar o script, você deve ver:

```
🚀 CONFIGURAÇÃO DO SUPABASE STORAGE
=====================================

🔗 Verificando conexão com Supabase...
✅ Conexão estabelecida. Buckets existentes: 0

📄 Aplicando seed.sql...
✅ Seed.sql aplicado com sucesso

📦 CRIANDO BUCKETS NECESSÁRIOS...
📦 Criando bucket 'avatars'...
✅ Bucket 'avatars' criado com sucesso
🔒 Configurando políticas RLS para 'avatars'...
✅ Políticas RLS configuradas para 'avatars'

📦 Criando bucket 'files'...
✅ Bucket 'files' criado com sucesso
🔒 Configurando políticas RLS para 'files'...
✅ Políticas RLS configuradas para 'files'

📦 Criando bucket 'screenshots'...
✅ Bucket 'screenshots' criado com sucesso
🔒 Configurando políticas RLS para 'screenshots'...
✅ Políticas RLS configuradas para 'screenshots'

🔍 VALIDANDO CONFIGURAÇÃO...
✅ Bucket 'avatars' encontrado
✅ Bucket 'files' encontrado
✅ Bucket 'screenshots' encontrado

🧪 Testando upload básico...
✅ Teste de upload bem-sucedido

🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
```

### 2.5 Troubleshooting

#### Erro "Bucket not found"
Se você receber este erro durante geração de imagens/vídeos:

```bash
# Execute a configuração do storage
wsl node scripts/setup-supabase-storage.js
```

#### Erro de Permissão
Se houver problemas de permissão:

```bash
# Verifique se as políticas RLS foram aplicadas
wsl node scripts/setup-supabase-storage.js --check-only
```

#### Recriar Buckets Completamente
Se houver problemas persistentes:

```bash
# Force a recriação de todos os buckets
wsl node scripts/setup-supabase-storage.js --force-recreate
```

## 👤 Parte 3: Criando Usuários com Créditos Ilimitados

### 3.1 Script de Criação

O script `create-unlimited-user.js` permite:
- Criar usuários com créditos ilimitados
- Listar usuários existentes
- Verificar usuários criados

### 3.2 Comandos Disponíveis

#### Criar Novo Usuário
```bash
wsl node create-unlimited-user.js create <email> <senha>
```

**Exemplo:**
```bash
wsl node create-unlimited-user.js create admin@tersa.com senha123456
```

#### Listar Usuários com Créditos Ilimitados
```bash
wsl node create-unlimited-user.js list
```

#### Verificar Usuário Específico
```bash
wsl node create-unlimited-user.js verify <email>
```

**Exemplo:**
```bash
wsl node create-unlimited-user.js verify admin@tersa.com
```

#### Excluir Usuário
```bash
wsl node delete-user.js delete <email>
```

**Exemplo:**
```bash
wsl node delete-user.js delete admin@tersa.com
```

**⚠️ ATENÇÃO: A exclusão é IRREVERSÍVEL!**

### 2.3 Script de Exclusão de Usuários

O script `delete-user.js` permite excluir usuários de forma segura das tabelas `auth.users` e `public.profile`.

#### Comandos Disponíveis

**Listar Usuários (antes de excluir):**
```bash
wsl node delete-user.js list
```

**Verificar Usuário Específico:**
```bash
wsl node delete-user.js verify <email>
```

**Excluir Usuário:**
```bash
wsl node delete-user.js delete <email>
```

**Ajuda:**
```bash
wsl node delete-user.js help
```

#### Processo de Exclusão

O script executa as seguintes operações:
1. **Verificação:** Confirma se o usuário existe
2. **Exibição:** Mostra dados do usuário antes da exclusão
3. **Exclusão do Profile:** Remove da tabela `public.profile` primeiro
4. **Exclusão do Auth:** Remove da tabela `auth.users`
5. **Confirmação:** Retorna detalhes da exclusão realizada

#### Saída Esperada (Exclusão)

```
🔗 Conectando ao PostgreSQL...
✅ Conectado com sucesso!
🔧 Criando/atualizando função de exclusão...
✅ Função de exclusão criada/atualizada!
🔍 Verificando se o usuário admin@tersa.com existe...
📋 Dados do usuário encontrado:
  - ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - Email: admin@tersa.com
  - Criado em: 2024-01-XX XX:XX:XX
  - Profile ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!
⚠️  O usuário será excluído permanentemente das tabelas auth.users e public.profile.

🗑️  Executando exclusão...

✅ USUÁRIO EXCLUÍDO COM SUCESSO!
📋 Detalhes da exclusão:
  - Auth User ID excluído: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - Profile ID excluído: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - Email: admin@tersa.com
  - Timestamp da exclusão: 2024-01-XX XX:XX:XX

🔌 Conexão fechada.
```

### 2.4 Saída Esperada (Criação)

Ao criar um usuário com sucesso:

```
✅ Usuário criado com sucesso!
Detalhes:
- ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Email: admin@tersa.com
- Criado em: 2024-01-XX XX:XX:XX
- Customer ID: cus_xxxxxxxxxx
- Product ID: prod_xxxxxxxxx
```

## 🔍 Parte 3: Verificação e Troubleshooting

### 3.1 Verificar Conexão com Banco

Antes de executar qualquer operação, é fundamental testar a conexão com o PostgreSQL:

```bash
wsl node test-postgres-connection.js
```

#### Script de Teste de Conexão

O script `test-postgres-connection.js` realiza os seguintes testes:

**Configurações de Conexão:**
- Host: `216.238.105.79`
- Port: `6543`
- Database: `postgres`
- User: `postgres.your-tenant-id`
- Password: `Fu9qWO9KRBTHJJolCqXY`
- SSL: `false` (com fallback para SSL habilitado)

**Testes Executados:**
1. **Teste de Conectividade:** Verifica se consegue estabelecer conexão
2. **Informações do Banco:** Obtém versão, database atual, usuário e hora
3. **Listagem de Tabelas:** Lista todas as tabelas no schema `public`
4. **Configuração Alternativa:** Tenta conexão com SSL em caso de falha
5. **Diagnósticos:** Fornece sugestões baseadas no tipo de erro

**Saída Esperada (Sucesso):**
```
🔍 TESTE DE CONEXÃO POSTGRESQL
================================
🔧 Usando configuração manual (como pgAdmin)
📋 Configurações de conexão:
Host: 216.238.105.79
Port: 6543
Database: postgres
User: postgres.your-tenant-id
Password: ****

🔄 Tentando conectar...
✅ CONEXÃO ESTABELECIDA COM SUCESSO!

🧪 Executando teste de query...

📊 INFORMAÇÕES DO BANCO:
Versão: PostgreSQL 15.x...
Database: postgres
Usuário: postgres.your-tenant-id
Hora atual: 2024-01-XX XX:XX:XX

📋 Listando tabelas disponíveis...
Tabelas encontradas:
  - auth.users
  - public.profile
  - [outras tabelas]

🔌 Conexão fechada.
✨ Teste concluído.
```

**Diagnósticos Automáticos:**
O script identifica automaticamente problemas comuns:
- Problemas de conectividade (ENOTFOUND, ECONNREFUSED)
- Falhas de autenticação
- Banco de dados inexistente
- Problemas de SSL/TLS

#### Teste de Conexão Supabase

Para projetos que usam Supabase, você também pode testar a conexão através do arquivo de configuração do projeto:

**Verificar Configuração Supabase:**
```bash
# Verificar se as variáveis de ambiente estão configuradas
wsl cat .env.local | grep SUPABASE
```

**Variáveis Esperadas:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Teste via Supabase Client:**
O projeto usa a configuração do Supabase através do arquivo `lib/database.ts` que conecta usando a `POSTGRES_URL`. Esta URL deve apontar para o mesmo banco PostgreSQL testado acima.

**Verificar Configuração do Database:**
```bash
wsl cat lib/database.ts | grep -A 5 -B 5 POSTGRES_URL
```

### 3.2 Problemas Comuns

#### Erro: "column does not exist"
**Solução:** Execute as migrations primeiro
```bash
wsl pnpm migrate
```

#### Erro: "non-default value"
**Solução:** O script já está configurado para usar valores DEFAULT apropriados

#### Erro: "duplicate column"
**Solução:** Verifique se o script está atualizado (versão corrigida)

### 3.3 Validação Final

Após criar usuários, sempre execute:

```bash
# Listar todos os usuários com créditos ilimitados
wsl node create-unlimited-user.js list

# Verificar usuário específico
wsl node create-unlimited-user.js verify <email>
```

## 🛠️ Parte 4: Scripts Auxiliares

### 4.1 Script de Atualização do IP da VPS

**Arquivo:** `scripts/update-vps-ip.js`

**Propósito:** Automatizar a atualização do IP da VPS no `next.config.ts` quando a infraestrutura muda.

#### 4.1.1 Comandos Disponíveis

```bash
# Verificar IP atual configurado
wsl node scripts/update-vps-ip.js --check

# Atualizar para novo IP
wsl node scripts/update-vps-ip.js <novo-ip>

# Mostrar ajuda
wsl node scripts/update-vps-ip.js --help
```

#### 4.1.2 Exemplo de Uso

```bash
# Cenário: VPS mudou de 216.238.105.79 para 192.168.1.100

# 1. Verificar IP atual
wsl node scripts/update-vps-ip.js --check
# Output: IP configurado: 216.238.105.79

# 2. Atualizar para novo IP
wsl node scripts/update-vps-ip.js 192.168.1.100
# Output: ✅ IP atualizado para: 192.168.1.100

# 3. Reiniciar servidor
wsl pnpm dev
```

#### 4.1.3 Recursos do Script

- ✅ **Backup automático:** Cria `next.config.ts.backup` antes da primeira alteração
- ✅ **Validação de IP:** Verifica formato antes de aplicar
- ✅ **Detecção automática:** Encontra e substitui o IP da VPS automaticamente
- ✅ **Feedback detalhado:** Mostra status e próximos passos
- ✅ **Segurança:** Mantém backup para rollback se necessário

#### 4.1.4 Quando Usar

- 🔄 **Nova instalação:** IP da VPS diferente
- 🏗️ **Mudança de infraestrutura:** Migração de servidor
- 🔧 **Troubleshooting:** Corrigir problemas de imagem
- 📦 **Deploy:** Configuração de ambiente de produção

---

## 📝 Parte 5: Procedimento Completo Passo a Passo

### 5.1 Primeira Execução (Setup Inicial)

```bash
# 1. Navegar para o projeto
wsl cd /mnt/c/ai/tersa

# 2. TESTAR CONEXÃO COM BANCO (OBRIGATÓRIO)
wsl node test-postgres-connection.js

# 3. Instalar dependências (se necessário)
wsl pnpm install

# 4. Executar migrations
wsl pnpm migrate

# 5. Verificar schema
wsl node check-auth-schema.js

# 6. Criar primeiro usuário admin
wsl node create-unlimited-user.js create admin@tersa.com senha123456

# 7. Verificar criação
wsl node create-unlimited-user.js list
```

### 5.2 Criação de Usuários Subsequentes

```bash
# 1. Navegar para o projeto
wsl cd /mnt/c/ai/tersa

# 2. Criar usuário
wsl node create-unlimited-user.js create <email> <senha>

# 3. Verificar
wsl node create-unlimited-user.js verify <email>
```

### 5.3 Exclusão de Usuários

```bash
# 1. Navegar para o projeto
wsl cd /mnt/c/ai/tersa

# 2. Listar usuários existentes (recomendado)
wsl node delete-user.js list

# 3. Verificar dados do usuário antes de excluir
wsl node delete-user.js verify <email>

# 4. Excluir usuário (IRREVERSÍVEL)
wsl node delete-user.js delete <email>

# 5. Confirmar exclusão listando usuários novamente
wsl node delete-user.js list
```

### 5.4 Teste Completo do Sistema de Exclusão

**⚠️ IMPORTANTE: Execute este teste para validar o funcionamento completo**

```bash
# 1. Navegar para o projeto
wsl cd /mnt/c/ai/tersa

# 2. Verificar estado inicial (deve estar vazio ou com usuários conhecidos)
wsl node delete-user.js list

# 3. Criar usuário de teste
wsl node create-unlimited-user.js create teste@tersa.com senha123

# 4. Confirmar criação do usuário
wsl node delete-user.js list

# 5. Verificar dados detalhados do usuário
wsl node delete-user.js verify teste@tersa.com

# 6. Excluir usuário de teste
wsl node delete-user.js delete teste@tersa.com

# 7. Confirmar exclusão (deve retornar "Nenhum usuário encontrado")
wsl node delete-user.js list

# 8. Testar comando de ajuda
wsl node delete-user.js help
```

#### Resultado Esperado do Teste

✅ **Teste bem-sucedido deve mostrar:**
- Listagem inicial (vazia ou com usuários existentes)
- Criação do usuário `teste@tersa.com` com sucesso
- Listagem mostrando o novo usuário com todos os dados
- Verificação detalhada do usuário
- Exclusão com avisos de segurança e confirmação
- Listagem final vazia ("Nenhum usuário encontrado")
- Comando help funcionando corretamente

❌ **Se algum passo falhar:**
- Verifique a conexão com PostgreSQL
- Confirme que a dependência `pg` está instalada: `wsl pnpm install pg`
- Execute `wsl node test-postgres-connection.js` para validar conexão
- Verifique se não há erros de schema com `wsl node check-database-structure.js`

## ⚠️ Considerações Importantes

### Segurança
- **NUNCA** exponha credenciais do banco em logs
- Use senhas fortes para usuários administrativos
- Mantenha backups regulares do banco de dados

### Performance
- Execute migrations em horários de baixo tráfego
- Monitore o desempenho após aplicar migrations

### Backup
- **SEMPRE** faça backup antes de executar migrations
- Teste em ambiente de desenvolvimento primeiro

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs de erro
2. Confirme que WSL está sendo usado
3. Valide a conexão com o banco
4. Execute verificações de schema

## 📋 Checklist de Verificação

### Setup Inicial
- [ ] WSL configurado e funcionando
- [ ] **Conexão PostgreSQL testada** (`test-postgres-connection.js`)
- [ ] Configuração Supabase verificada (se aplicável)
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Migrations executadas (`pnpm migrate`)
- [ ] Schema validado (`check-auth-schema.js`)

### Gerenciamento de Usuários
- [ ] Usuário criado com sucesso (`create-unlimited-user.js`)
- [ ] Usuário listado corretamente
- [ ] Verificação de usuário realizada
- [ ] **Scripts de exclusão testados** (`delete-user.js`)
- [ ] **Teste completo do sistema de exclusão executado** (seção 5.4)
- [ ] Dependência `pg` instalada (`wsl pnpm install pg`)
- [ ] Backup de dados críticos realizado (antes de exclusões)

### Configuração de Imagens
- [ ] IP da VPS adicionado ao `next.config.ts`
- [ ] Servidor reiniciado após alteração
- [ ] Imagens do Supabase carregando sem erro
- [ ] Sem tela branca na geração de imagens

### Validação Final
- [ ] Todos os scripts funcionando corretamente
- [ ] Documentação atualizada
- [ ] Procedimentos de segurança seguidos

---

**Última atualização:** Agosto 2025
**Versão:** 1.1
**Ambiente:** WSL + PostgreSQL + Drizzle ORM