# Configuração Completa: Supabase Self-Hosting com HTTPS e Domínio Personalizado

## 📋 Índice

1. [Pré-requisitos: Instalação Docker](#pré-requisitos-instalação-docker)
2. [Informações Gerais](#informações-gerais)
3. [Arquitetura do Supabase](#arquitetura-do-supabase)
4. [Configuração DNS](#configuração-dns)
5. [Configuração do Servidor](#configuração-do-servidor)
6. [Configuração Nginx](#configuração-nginx)
7. [Configuração SSL com Let's Encrypt](#configuração-ssl-com-lets-encrypt)
8. [Configuração do Supabase Self-Hosted](#configuração-do-supabase-self-hosted)
9. [Configurações Avançadas](#configurações-avançadas)
10. [Configuração da Aplicação Next.js](#configuração-da-aplicação-nextjs)
11. [Testes e Verificações](#testes-e-verificações)
12. [Solução de Problemas](#solução-de-problemas)
13. [Manutenção e Atualizações](#manutenção-e-atualizações)
14. [Segurança](#segurança)

---

## 🐳 Pré-requisitos: Instalação Docker

**⚠️ IMPORTANTE:** Antes de configurar o Supabase, você DEVE instalar o Docker e Docker Compose no servidor.

### Passo 1: Conectar ao Servidor

```bash
# Conectar via SSH
ssh root@[IP_DO_SEU_SERVIDOR]
```

### Passo 2: Atualizar Sistema

```bash
# Atualizar pacotes do sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git nano ufw
```

### Passo 3: Instalar Docker

```bash
# Remover versões antigas do Docker (se existirem)
apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependências para HTTPS
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Atualizar índice de pacotes
apt update

# Instalar Docker Engine
apt install -y docker-ce docker-ce-cli containerd.io
```

### Passo 4: Instalar Docker Compose

```bash
# Baixar Docker Compose (versão mais recente)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
chmod +x /usr/local/bin/docker-compose

# Criar link simbólico (opcional, para compatibilidade)
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

### Passo 5: Verificar Instalação

```bash
# Verificar versão do Docker
docker --version

# Verificar versão do Docker Compose
docker-compose --version

# Testar Docker
docker run hello-world

# Verificar status do serviço Docker
systemctl status docker
```

### Passo 6: Configurar Docker para Iniciar Automaticamente

```bash
# Habilitar Docker para iniciar com o sistema
systemctl enable docker
systemctl enable containerd

# Verificar se está habilitado
systemctl is-enabled docker
```

### Passo 7: Configurar Usuário Docker (Opcional)

```bash
# Criar grupo docker (se não existir)
groupadd docker

# Adicionar usuário atual ao grupo docker
usermod -aG docker $USER

# Aplicar mudanças de grupo (ou fazer logout/login)
newgrp docker
```

### ✅ Verificação Final

**Comandos para verificar se tudo está funcionando:**

```bash
# Verificar versões instaladas
echo "=== VERSÕES INSTALADAS ==="
docker --version
docker-compose --version

# Verificar serviços
echo "=== STATUS DOS SERVIÇOS ==="
systemctl is-active docker
systemctl is-enabled docker

# Testar funcionamento
echo "=== TESTE DE FUNCIONAMENTO ==="
docker run --rm hello-world

# Verificar containers em execução
echo "=== CONTAINERS ATIVOS ==="
docker ps
```

**✅ Sinais de sucesso:**
- Docker version 20.x.x ou superior
- Docker Compose version 2.x.x ou superior
- Serviço docker ativo e habilitado
- Teste hello-world executado com sucesso

**🚨 Se houver problemas:**
```bash
# Reiniciar serviço Docker
systemctl restart docker

# Verificar logs de erro
journalctl -u docker.service

# Verificar status detalhado
systemctl status docker -l
```

---

## 🔧 Informações Gerais

### Dados do Servidor
```
IP do Servidor: [IP_DO_SEU_SERVIDOR]
Usuário SSH: root
Porta Supabase: 8000
Domínio: [SEU_DOMINIO]
Porta HTTP: 80
Porta HTTPS: 443
```

### Credenciais Supabase
```
Painel: https://[SEU_DOMINIO]
Usuário: supabase
Senha: 8Rt10fNWfsbYR0bo

PostgreSQL:
Usuário: postgres
Senha: Fu9qWO9KRBTHJJolCqXY
Porta: 5432

JWT Secret: 8UfvlMR0206Ee2Iwq7EFLdS2PcpN0dRi
```

---

## 🏗️ Arquitetura do Supabase

### Visão Geral

O Supabase é uma combinação de ferramentas open source, cada uma especificamente escolhida para estar pronta para Enterprise.

**Princípios:**
- Se as ferramentas e comunidades já existem, com licença MIT, Apache 2 ou equivalente open license, usamos e apoiamos essa ferramenta
- Se a ferramenta não existe, construímos e disponibilizamos como open source

### Componentes da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Kong API Gateway                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
   │GoTrue  │   │PostgREST│   │Realtime│
   │(Auth)  │   │ (API)  │   │(WebSock│
   └────────┘   └────────┘   └────────┘
        │             │             │
   ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
   │Storage │   │pg_meta │   │Functions│
   │(Files) │   │(Admin) │   │(Edge)  │
   └────────┘   └────────┘   └────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │   + Supavisor  │
              │  (Connection   │
              │    Pooler)     │
              └────────────────┘
```

### Descrição dos Componentes

#### 🚪 **Kong** - API Gateway
- Gateway de API nativo da nuvem
- Gerencia roteamento, autenticação e rate limiting
- Ponto de entrada único para todos os serviços

#### 🔐 **GoTrue** - Autenticação
- API baseada em JWT para gerenciar usuários
- Emite e valida tokens JWT
- Suporte a OAuth, magic links, etc.

#### 🔌 **PostgREST** - API REST
- Transforma seu banco Postgres diretamente em uma API RESTful
- Geração automática de endpoints baseados no schema
- Suporte a filtros, ordenação e paginação

#### ⚡ **Realtime** - WebSockets
- Servidor Elixir para escutar mudanças no Postgres
- Converte inserts, updates e deletes em JSON
- Transmite via WebSockets para clientes autorizados

#### 📁 **Storage** - Gerenciamento de Arquivos
- Interface RESTful para gerenciar arquivos no S3
- Usa Postgres para gerenciar permissões
- Suporte a upload, download e transformações

#### 🛠️ **postgres-meta** - Administração
- API RESTful para gerenciar seu Postgres
- Permite buscar tabelas, adicionar roles, executar queries
- Interface de administração do banco

#### ⚙️ **Functions** - Edge Functions
- Execução de código serverless
- Baseado em Deno runtime
- Ideal para lógica de negócio customizada

#### 🗄️ **PostgreSQL** - Banco de Dados
- Sistema de banco objeto-relacional
- Mais de 30 anos de desenvolvimento ativo
- Reputação sólida em confiabilidade e performance

#### 🔄 **Supavisor** - Connection Pooler
- Pooler de conexões escalável para Postgres
- Gerenciamento eficiente de conexões de banco
- Reduz overhead de conexões

### Configurações Necessárias

Para o sistema funcionar de forma coesa, alguns serviços requerem configuração adicional no banco Postgres:

- **APIs e Auth:** Requerem várias roles padrão
- **Extensões:** pgjwt e outras extensões do Postgres
- **Schemas:** Schemas específicos para cada serviço

Todos os scripts de migração padrão estão disponíveis no [repositório de scripts](https://github.com/supabase/postgres) e são montados em `/docker-entrypoint-initdb.d` para execução automática.

---

## 🌐 Configuração DNS

### Passo 1: Acessar Painel DNS

1. Acesse o painel do seu provedor de DNS (onde você registrou o domínio)
2. Localize a seção de "DNS Management" ou "Zona DNS"

### Passo 2: Configurar Registro A

```
Tipo: A
Nome: @ (ou deixe em branco para domínio raiz)
Valor: [IP_DO_SEU_SERVIDOR]
TTL: 300 (ou mínimo disponível)
```

### Passo 3: Configurar Subdomínios (Opcional)

Se quiser usar subdomínios como `api.[SEU_DOMINIO]`:

```
Tipo: A
Nome: api
Valor: [IP_DO_SEU_SERVIDOR]
TTL: 300
```

### Passo 4: Verificar Propagação DNS

```bash
# Verificar se DNS está funcionando
nslookup [SEU_DOMINIO]

# Alternativa mais detalhada
dig [SEU_DOMINIO]

# Verificar de diferentes locais
# Use: https://dnschecker.org/#A/[SEU_DOMINIO]
```

**⏰ Tempo de propagação:** Entre 5 minutos a 48 horas (geralmente 15-30 minutos)

---

## 🖥️ Configuração do Servidor

### Passo 1: Conectar ao Servidor

```bash
ssh root@[IP_DO_SEU_SERVIDOR]
```

### Passo 2: Atualizar Sistema

```bash
# Atualizar repositórios
apt update && apt upgrade -y

# Instalar dependências básicas
apt install curl wget git nano htop -y
```

### Passo 3: Instalar Nginx e Certbot

```bash
# Instalar nginx
apt install nginx -y

# Instalar certbot para SSL
apt install certbot python3-certbot-nginx -y

# Verificar se nginx está rodando
systemctl status nginx
systemctl enable nginx
```

---

## 🔧 Configuração Nginx

### Passo 1: Remover Configuração Padrão

```bash
# Remover site padrão
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default
```

### Passo 2: Configurar nginx.conf Global

**IMPORTANTE:** Primeiro, configure o arquivo principal do Nginx para resolver erro 413:

```bash
# Editar configuração global do nginx
nano /etc/nginx/nginx.conf
```

**Adicionar no bloco `http {}`:**

```nginx
http {
    # ... outras configurações existentes ...
    
    # Configuração global para uploads grandes (resolve erro 413)
    client_max_body_size 100M;
    client_body_buffer_size 16k;
    client_body_timeout 60s;
    
    # ... resto das configurações ...
}
```

### Passo 3: Criar Configuração do Supabase

```bash
# Criar arquivo de configuração
nano /etc/nginx/sites-available/supabase
```

**Conteúdo do arquivo:**

```nginx
server {
    listen 80;
    server_name [SEU_DOMINIO];
    
    # Configuração global para uploads grandes
    client_max_body_size 100M;
    
    # Configurações de proxy
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Headers CORS (incluindo para respostas de erro)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range' always;
        
        # Configurações para WebSocket (Supabase Realtime)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Configurações para uploads grandes
        proxy_request_buffering off;
        proxy_max_temp_file_size 0;
    }
    
    # Configuração específica para storage (uploads grandes)
    location /storage/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers CORS específicos para storage
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
        
        # Permitir uploads grandes
        client_max_body_size 100M;
        proxy_request_buffering off;
        proxy_max_temp_file_size 0;
        
        # Timeouts específicos para uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Tratar requisições OPTIONS (preflight CORS)
    location ~* \.(OPTIONS)$ {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain charset=UTF-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }
}
```

### Passo 4: Ativar Configuração

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Se não houver erros, reiniciar nginx
systemctl restart nginx

# Verificar status
systemctl status nginx
```

### Passo 5: Configurar Firewall

```bash
# Permitir HTTP e HTTPS
ufw allow 'Nginx Full'

# Verificar regras
ufw status
```

---

## 🔒 Configuração SSL com Let's Encrypt

### Passo 1: Verificar DNS

Antes de prosseguir, certifique-se que o DNS está propagado:

```bash
curl -I http://[SEU_DOMINIO]
```

### Passo 2: Obter Certificado SSL

```bash
# Executar certbot
certbot --nginx -d [SEU_DOMINIO]
```

**Durante o processo você será perguntado:**

1. **Email:** Digite um email válido para notificações
2. **Termos de Uso:** Digite `Y` para aceitar
3. **Newsletter:** Digite `N` ou `Y` conforme preferir
4. **Redirecionamento HTTP → HTTPS:** Digite `2` para redirecionar automaticamente

### Passo 3: Verificar Configuração Final

Após a configuração, o nginx terá uma configuração similar a esta:

```nginx
server {
    server_name [SEU_DOMINIO];
    
    # Configuração global para uploads grandes
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Headers CORS (incluindo para respostas de erro)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range' always;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Configurações para uploads grandes
        proxy_request_buffering off;
        proxy_max_temp_file_size 0;
    }
    
    location /storage/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers CORS específicos para storage
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
        
        client_max_body_size 100M;
        proxy_request_buffering off;
        proxy_max_temp_file_size 0;
        
        # Timeouts específicos para uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Tratar requisições OPTIONS (preflight CORS)
    location ~* \.(OPTIONS)$ {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain charset=UTF-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/[SEU_DOMINIO]/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[SEU_DOMINIO]/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = [SEU_DOMINIO]) {
        return 301 https://$host$request_uri;
    }
    
    listen 80;
    server_name [SEU_DOMINIO];
    return 404;
}
```

### Passo 4: Configurar Renovação Automática

```bash
# Testar renovação
certbot renew --dry-run

# Verificar timer de renovação automática
systemctl status certbot.timer

# Se não estiver ativo, ativar
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 🗄️ Configuração do Supabase Self-Hosted

### Passo 1: Instalar e Configurar Supabase

#### Método Geral (Recomendado)

```bash
# Clonar o repositório do Supabase
git clone --depth 1 https://github.com/supabase/supabase

# Criar diretório do projeto
mkdir supabase-project

# Estrutura deve ficar assim:
# .
# ├── supabase
# └── supabase-project

# Copiar arquivos de compose para o projeto
cp -rf supabase/docker/* supabase-project

# Copiar variáveis de ambiente de exemplo
cp supabase/docker/.env.example supabase-project/.env

# Entrar no diretório do projeto
cd supabase-project

# Baixar as imagens mais recentes
docker compose pull

# Iniciar os serviços (modo detached)
docker compose up -d
```

#### Para Docker Rootless

Se estiver usando docker rootless, edite `.env` e configure:

```env
DOCKER_SOCKET_LOCATION=/run/user/1000/docker.sock
```

### Passo 2: Verificar Instalação

```bash
# Verificar containers em execução
docker compose ps

# Todos os serviços devem ter status "running (healthy)"
# Se algum serviço estiver "created" mas não "running":
docker compose start <service-name>
```

### Passo 3: Configurar Variáveis de Ambiente

**Arquivo: `.env`**

**Configurações Básicas:**
```env
# Portas
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# URLs do Site
SITE_URL=https://[SEU_DOMINIO]
ADDITIONAL_REDIRECT_URLS=https://[SEU_DOMINIO]/auth/callback
API_EXTERNAL_URL=https://[SEU_DOMINIO]
SUPABASE_PUBLIC_URL=https://[SEU_DOMINIO]

# Autenticação
JWT_EXPIRY=3600
DISABLE_SIGNUP=false

# Database
PGRST_DB_SCHEMAS=public,storage,graphql_public
POSTGRES_PASSWORD=Fu9qWO9KRBTHJJolCqXY
POOLER_TENANT_ID=your-tenant-id

# Dashboard
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=8Rt10fNWfsbYR0bo

# JWT Secret
JWT_SECRET=8UfvlMR0206Ee2Iwq7EFLdS2PcpN0dRi
```

### Passo 4: Gerar Chaves API Seguras

**⚠️ IMPORTANTE:** Nunca use as chaves padrão em produção!

#### Gerar JWT Secret

```bash
# Gerar secret de 40 caracteres
openssl rand -base64 32 | tr -d "=+/" | cut -c1-40
```

#### Gerar Chaves ANON e SERVICE

Use o JWT Secret para gerar as chaves:

**Para ANON_KEY:**
```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1756609200,
  "exp": 1914375600
}
```

**Para SERVICE_ROLE_KEY:**
```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1756609200,
  "exp": 1914375600
}
```

**Adicionar no `.env`:**
```env
ANON_KEY=sua_anon_key_gerada
SERVICE_ROLE_KEY=sua_service_key_gerada
```

### Passo 5: Configurações de Storage

#### Storage Local (Padrão)
```env
STORAGE_BACKEND=file
FILE_SIZE_LIMIT=52428800
FILE_STORAGE_BACKEND_PATH=/var/lib/storage
STORAGE_PUBLIC_URL=https://[SEU_DOMINIO]/storage/v1/object/public
```

#### Storage S3 (Opcional)
```env
STORAGE_BACKEND=s3
GLOBAL_S3_BUCKET=nome-do-seu-bucket-s3
REGION=regiao-do-seu-bucket-s3
```

### Passo 6: Configurar SMTP (Email)

```env
SMTP_ADMIN_EMAIL=admin@[SEU_DOMINIO]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
SMTP_SENDER_NAME=Agencia WOW
```

**Recomendação:** Use AWS SES para produção (extremamente barato e confiável).

### Passo 7: Reiniciar Serviços

```bash
# Parar e remover containers
docker compose down

# Recriar e iniciar containers
docker compose up -d

# Verificar logs
docker compose logs -f

# Verificar status
docker compose ps
```

### Passo 8: Acessar Serviços

#### Supabase Studio (Dashboard)
- **URL:** https://[SEU_DOMINIO]
- **Usuário:** supabase
- **Senha:** 8Rt10fNWfsbYR0bo

#### APIs Disponíveis
- **REST:** https://[SEU_DOMINIO]/rest/v1/
- **Auth:** https://[SEU_DOMINIO]/auth/v1/
- **Storage:** https://[SEU_DOMINIO]/storage/v1/
- **Realtime:** https://[SEU_DOMINIO]/realtime/v1/
- **Functions:** https://[SEU_DOMINIO]/functions/v1/

#### Postgres Database

**Conexões via Supavisor (Recomendado):**
```bash
# Conexões baseadas em sessão (equivalente ao Postgres direto)
psql 'postgres://postgres.your-tenant-id:Fu9qWO9KRBTHJJolCqXY@localhost:5432/postgres'

# Conexões transacionais pooled
psql 'postgres://postgres.your-tenant-id:Fu9qWO9KRBTHJJolCqXY@localhost:6543/postgres'
```

**String de conexão para ORMs:**
```
postgres://postgres:Fu9qWO9KRBTHJJolCqXY@[IP_DO_SEU_SERVIDOR]:5432/postgres
```

---

## ⚙️ Configurações Avançadas

### Configuração de Serviços Individuais

Cada sistema pode ser configurado independentemente. As opções de configuração podem ser encontradas na documentação de cada produto:

- **Postgres:** [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- **PostgREST:** [Documentação PostgREST](https://postgrest.org/)
- **Realtime:** [Documentação Realtime](https://github.com/supabase/realtime)
- **Auth (GoTrue):** [Documentação Auth](https://github.com/supabase/gotrue)
- **Storage:** [Documentação Storage](https://github.com/supabase/storage-api)
- **Kong:** [Documentação Kong](https://docs.konghq.com/)
- **Supavisor:** [Documentação Supavisor](https://github.com/supabase/supavisor)

### Configuração do AI Assistant (Opcional)

Para habilitar o Supabase AI Assistant, adicione sua chave OpenAI:

**docker-compose.yml:**
```yaml
services:
  studio:
    image: supabase/studio
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
```

**Arquivo .env:**
```env
OPENAI_API_KEY=sua_chave_openai_aqui
```

### Configuração de Log Level

Por padrão, o docker compose define `log_min_messages` como `fatal` para prevenir logs redundantes do Realtime:

```env
# Configurar nível de log do PostgreSQL
# Opções: debug5, debug4, debug3, debug2, debug1, info, notice, warning, error, log, fatal, panic
POSTGRES_LOG_MIN_MESSAGES=fatal
```

### Acesso Direto ao Postgres (Menos Seguro)

Se precisar de acesso direto ao Postgres sem passar pelo Supavisor:

**docker-compose.yml:**
```yaml
# Comentar ou remover a seção supavisor
# supavisor:
#   ports:
# ...

db:
  ports:
    - ${POSTGRES_PORT}:${POSTGRES_PORT}
```

**⚠️ Atenção:** Isso é menos seguro, certifique-se de ter um firewall configurado.

### Configuração para macOS

Para compatibilidade com macOS, escolha VirtioFS como implementação de compartilhamento de arquivos:

**Docker Desktop → Preferences → General → Choose file sharing implementation: VirtioFS**

### Edge Functions

As Edge Functions são armazenadas em `volumes/functions`. A configuração padrão tem uma função `hello`:

```bash
# Acessar função hello
curl https://[SEU_DOMINIO]/functions/v1/hello

# Adicionar nova função
# Criar arquivo: volumes/functions/<FUNCTION_NAME>/index.ts

# Reiniciar serviço de functions
docker compose restart functions --no-deps
```

### Gerenciamento de Segredos

**⚠️ IMPORTANTE:** Muitos componentes do Supabase usam segredos e senhas seguras. Para produção, recomendamos usar um gerenciador de segredos:

#### Sistemas Recomendados:
- **Doppler**
- **Infisical**
- **Azure Key Vault**
- **AWS Secrets Manager**
- **GCP Secrets Manager**
- **HashiCorp Vault**

#### Exemplo com Variáveis de Ambiente:

**docker-compose.yml:**
```yaml
services:
  rest:
    image: postgrest/postgrest
    environment:
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_URI: ${DATABASE_URL}
```

**Arquivo .env:**
```env
JWT_SECRET=seu_jwt_secret_seguro
DATABASE_URL=postgres://user:pass@host:port/db
```

---

## ⚛️ Configuração da Aplicação Next.js

### Passo 1: Atualizar Variáveis de Ambiente

**Arquivo: `.env.local` (na aplicação Next.js)**

**CONFIGURAÇÃO CENTRALIZADA (RECOMENDADA):**
```env
# Configurações principais do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[SEU_DOMINIO]
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui

# 🆕 NOVAS VARIÁVEIS PARA ESTRATÉGIA HÍBRIDA
# URL para uploads (pode ser IP direto para melhor performance)
NEXT_PUBLIC_SUPABASE_UPLOAD_URL=http://[IP_DO_SEU_SERVIDOR]:8000

# Domínio e hostname para configurações dinâmicas
NEXT_PUBLIC_SUPABASE_DOMAIN=[SEU_DOMINIO]
NEXT_PUBLIC_SUPABASE_HOSTNAME=[IP_DO_SEU_SERVIDOR]
```

**CONFIGURAÇÃO ANTERIOR (AINDA FUNCIONA):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[SEU_DOMINIO]
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### Passo 2: Validar Variáveis de Ambiente

**🆕 Arquivo: `lib/env.ts` (ATUALIZAÇÃO OBRIGATÓRIA)**

Para usar as novas variáveis de ambiente, você DEVE adicionar as validações no arquivo `env.ts`:

```typescript
// Adicionar na seção client:
client: {
  // ... outras variáveis existentes
  
  // 🆕 NOVAS VARIÁVEIS PARA ESTRATÉGIA HÍBRIDA
  NEXT_PUBLIC_SUPABASE_UPLOAD_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_HOSTNAME: z.string().min(1),
},

// Adicionar na seção runtimeEnv:
runtimeEnv: {
  // ... outras variáveis existentes
  
  // 🆕 NOVAS VARIÁVEIS PARA ESTRATÉGIA HÍBRIDA
  NEXT_PUBLIC_SUPABASE_UPLOAD_URL: process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL,
  NEXT_PUBLIC_SUPABASE_DOMAIN: process.env.NEXT_PUBLIC_SUPABASE_DOMAIN,
  NEXT_PUBLIC_SUPABASE_HOSTNAME: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME,
},
```

**⚠️ IMPORTANTE:** Sem essa validação, as variáveis não serão carregadas e você receberá erro "Failed to fetch".

### Passo 3: Verificar Configuração do Cliente Supabase

**Arquivo: `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

export const createClient = () =>
  createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL, // https://[SEU_DOMINIO]
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
```

**🆕 Arquivo: `lib/supabase/upload-client.ts` (NOVO)**

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

// Cliente específico para uploads (pode usar IP direto)
export const createUploadClient = () =>
  createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL, // http://[IP_DO_SEU_SERVIDOR]:8000
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
```

**Arquivo: `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../env';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL, // https://[SEU_DOMINIO]
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Error handling
          }
        },
      },
    }
  );
};
```

### Passo 3: Configurar Next.js para Aceitar Novo Domínio

**Arquivo: `next.config.ts`**

O Next.js precisa ser configurado para aceitar imagens do novo domínio. **CONFIGURAÇÃO CENTRALIZADA (RECOMENDADA):**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Outros hostnames existentes...
      
      // 🆕 CONFIGURAÇÃO CENTRALIZADA: Supabase storage com variáveis de ambiente
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME || '[IP_DO_SEU_SERVIDOR]',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_DOMAIN || '[SEU_DOMINIO]',
      },
      
      // Outros hostnames...
    ],
  },
  // ... resto da configuração
};

export default nextConfig;
```

**CONFIGURAÇÃO ANTERIOR (AINDA FUNCIONA):**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase storage, custom IP
      {
        protocol: 'http',
        hostname: '[IP_DO_SEU_SERVIDOR]',
      },
      
      // Supabase storage, custom domain
      {
        protocol: 'https',
        hostname: '[SEU_DOMINIO]',
      },
    ],
  },
};

export default nextConfig;
```

### Passo 4: Benefícios da Estratégia Híbrida

**🎯 VANTAGENS DA CONFIGURAÇÃO CENTRALIZADA:**

1. **Flexibilidade:** Pode alternar entre IP direto e domínio sem alterar código
2. **Performance:** Upload via IP direto (mais rápido) + URLs públicas via HTTPS
3. **Manutenção:** Configurações centralizadas em variáveis de ambiente
4. **Compatibilidade:** Funciona tanto em desenvolvimento quanto produção
5. **Segurança:** URLs públicas sempre via HTTPS

**📋 CASOS DE USO:**
- **Upload de arquivos:** Usa `NEXT_PUBLIC_SUPABASE_UPLOAD_URL` (IP direto)
- **Exibição de imagens:** Usa `NEXT_PUBLIC_SUPABASE_URL` (HTTPS)
- **Configuração de imagens:** Usa variáveis dinâmicas no `next.config.ts`

### Passo 5: Reiniciar Aplicação

```bash
# Parar aplicação Next.js
# Ctrl+C no terminal onde está rodando

# Instalar dependências (se necessário)
npm install

# Iniciar novamente (OBRIGATÓRIO após mudança no next.config.ts)
npm run dev
```

**⚠️ IMPORTANTE:** O servidor Next.js DEVE ser reiniciado após qualquer mudança no `next.config.ts` ou `env.ts`.

---

## 🧪 Testes e Verificações

### Passo 1: Testar Acesso HTTPS

```bash
# Testar se o site está acessível
curl -I https://[SEU_DOMINIO]

# Resposta esperada:
# HTTP/2 200
# content-type: text/html; charset=utf-8
```

### Passo 2: Testar API do Supabase

```bash
# Testar endpoint da API
curl -I https://[SEU_DOMINIO]/rest/v1/

# Testar storage
curl -I https://[SEU_DOMINIO]/storage/v1/object/list/
```

### Passo 3: Testar URL de Imagem

```bash
# Testar uma URL de imagem específica
curl -I https://[SEU_DOMINIO]/storage/v1/object/public/files/24fd2361-7220-40b8-86fd-fe4a3da3ceb0/exemplo.jpeg
```

### Passo 4: Verificar SSL

```bash
# Verificar certificado SSL
openssl s_client -connect [SEU_DOMINIO]:443 -servername [SEU_DOMINIO]

# Ou usar online: https://www.ssllabs.com/ssltest/
```

### Passo 5: Testar na Aplicação

1. **Acesse a aplicação:** Verifique se carrega normalmente
2. **Teste upload de imagem:** Verifique se as URLs geradas usam HTTPS
3. **Teste conectividade:** Verifique se não há erros de CORS ou certificado
4. **🆕 Teste variáveis de ambiente:** Verifique se as novas variáveis estão carregando

### 🆕 Verificar Variáveis de Ambiente

**No console do navegador (F12):**
```javascript
// Verificar se as variáveis estão carregadas
console.log('Upload URL:', process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL);
console.log('Domain:', process.env.NEXT_PUBLIC_SUPABASE_DOMAIN);
console.log('Hostname:', process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME);
```

**Resultado esperado:**
```
Upload URL: http://[IP_DO_SEU_SERVIDOR]:8000
Domain: [SEU_DOMINIO]
Hostname: [IP_DO_SEU_SERVIDOR]
```

### Exemplo de URLs Corretas

**ESTRATÉGIA HÍBRIDA (RECOMENDADA):**

*Upload (via IP direto):*
```
http://[IP_DO_SEU_SERVIDOR]:8000/storage/v1/object/files/bucket/arquivo.jpeg
```

*URL pública (via HTTPS):*
```
https://[SEU_DOMINIO]/storage/v1/object/public/files/24fd2361-7220-40b8-86fd-fe4a3da3ceb0/exemplo.jpeg
```

**CONFIGURAÇÃO ANTERIOR:**

*ANTES:*
```
http://[IP_DO_SEU_SERVIDOR]:8000/storage/v1/object/public/files/24fd2361-7220-40b8-86fd-fe4a3da3ceb0/exemplo.jpeg
```

*DEPOIS:*
```
https://[SEU_DOMINIO]/storage/v1/object/public/files/24fd2361-7220-40b8-86fd-fe4a3da3ceb0/exemplo.jpeg
```

---

## 🚨 Solução de Problemas

### 🆕 Erro "Failed to fetch" após Configuração

**Sintoma:** Erro ao fazer upload de imagens após implementar configuração centralizada.

**Causa:** Variáveis de ambiente não validadas no `lib/env.ts`.

**Solução:**
```typescript
// Verificar se as variáveis estão no lib/env.ts
// Seção client:
NEXT_PUBLIC_SUPABASE_UPLOAD_URL: z.string().url(),
NEXT_PUBLIC_SUPABASE_DOMAIN: z.string().min(1),
NEXT_PUBLIC_SUPABASE_HOSTNAME: z.string().min(1),

// Seção runtimeEnv:
NEXT_PUBLIC_SUPABASE_UPLOAD_URL: process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL,
NEXT_PUBLIC_SUPABASE_DOMAIN: process.env.NEXT_PUBLIC_SUPABASE_DOMAIN,
NEXT_PUBLIC_SUPABASE_HOSTNAME: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME,
```

**Verificação:**
```bash
# Reiniciar aplicação após alterar env.ts
npm run dev

# Verificar no console do navegador
console.log(process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL);
```

### 🆕 Variáveis de Ambiente Undefined

**Sintoma:** `process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_URL` retorna `undefined`.

**Soluções:**
1. **Verificar arquivo `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_UPLOAD_URL=http://[IP_DO_SEU_SERVIDOR]:8000
   ```

2. **Verificar validação no `env.ts`:**
   - Deve estar nas seções `client` E `runtimeEnv`

3. **Reiniciar servidor:**
   ```bash
   # Ctrl+C para parar
   npm run dev
   ```

### DNS não Propaga

```bash
# Verificar se DNS está correto
nslookup [SEU_DOMINIO]

# Verificar propagação mundial
# Use: https://dnschecker.org/#A/[SEU_DOMINIO]

# Limpar cache DNS local
sudo systemctl restart systemd-resolved
```

### Nginx não Inicia

```bash
# Verificar configuração
nginx -t

# Ver logs de erro
journalctl -u nginx -f
tail -f /var/log/nginx/error.log

# Verificar se porta está em uso
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### SSL não Funciona

```bash
# Verificar logs do certbot
tail -f /var/log/letsencrypt/letsencrypt.log

# Tentar novamente (força renovação)
certbot --nginx -d [SEU_DOMINIO] --force-renewal

# Verificar certificados
certbot certificates

# Testar renovação
certbot renew --dry-run
```

### Supabase não Responde

```bash
# Verificar containers
docker ps

# Ver logs do Supabase
docker-compose logs -f

# Verificar se porta 8000 está aberta
netstat -tulpn | grep :8000

# Reiniciar Supabase
docker-compose restart
```

### URLs ainda com IP

1. **Verificar variáveis de ambiente do Supabase**
2. **Reiniciar completamente o Supabase**
3. **Verificar cache da aplicação**
4. **Limpar cache do navegador**

### Erro: Next.js não carrega imagens do novo domínio

**Erro típico:**
```
Error: Invalid src prop (https://[SEU_DOMINIO]/storage/...) on `next/image`, 
hostname "[SEU_DOMINIO]" is not configured under images in your `next.config.js`
```

**Solução:**

1. **Adicionar hostname no `next.config.ts`:**
```typescript
{
  protocol: 'https',
  hostname: '[SEU_DOMINIO]',
}
```

2. **Reiniciar servidor Next.js (OBRIGATÓRIO):**
```bash
# Parar com Ctrl+C
# Iniciar novamente
npm run dev
```

### Erro: 413 Request Entity Too Large

**Sintomas:**
- Erro "413 Request Entity Too Large" ao fazer upload de imagens
- Uploads falham para arquivos maiores que 1MB
- Erro aparece nos logs do Nginx

**Causa:**
O Nginx tem limite padrão de 1MB para o corpo da requisição.

**Solução:**

1. **Editar nginx.conf global:**
```bash
sudo nano /etc/nginx/nginx.conf
```

2. **Adicionar no bloco http {}:**
```nginx
http {
    client_max_body_size 100M;
    client_body_buffer_size 16k;
    client_body_timeout 60s;
}
```

3. **Reiniciar Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Configuração Adicional para Uploads Grandes

**Para otimizar uploads de arquivos grandes, adicione também no nginx.conf:**

```nginx
http {
    # ... configurações anteriores ...
    
    # Configurações específicas para uploads grandes
    proxy_request_buffering off;
    proxy_max_temp_file_size 0;
    proxy_buffering off;
    
    # Timeouts para uploads grandes
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    
    # ... resto das configurações ...
}
```

**⚠️ IMPORTANTE:** Essas configurações desabilitam o buffering de requisições, permitindo que uploads grandes sejam processados diretamente sem usar espaço em disco temporário.

### Erros de CORS

**Sintomas:**
- Erro "Access to XMLHttpRequest... has been blocked by CORS policy"
- Erro aparece mesmo em respostas de erro (413, 500, etc.)
- Upload falha com erro de CORS

**Causa:**
O Nginx não adiciona headers CORS em respostas de erro por padrão.

**Solução:**

1. **Verificar configuração atual:**
```bash
cat /etc/nginx/sites-available/supabase
```

2. **Adicionar headers CORS com parâmetro 'always':**
```nginx
location / {
    # ... outras configurações
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range' always;
}
```

3. **Adicionar tratamento para requisições OPTIONS:**
```nginx
location ~* \.(OPTIONS)$ {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With' always;
    add_header 'Access-Control-Max-Age' 1728000 always;
    add_header 'Content-Type' 'text/plain charset=UTF-8' always;
    add_header 'Content-Length' 0 always;
    return 204;
}
```

**⚠️ IMPORTANTE:** O parâmetro `always` é crucial para que os headers CORS sejam incluídos mesmo em respostas de erro (4xx, 5xx).

### Erro: Object not found após upload

**Sintomas:**
- Upload parece funcionar mas imagem não aparece
- URL da imagem retorna "Object not found"
- Erro 404 ao acessar URL da imagem

**Causa:**
O upload falhou silenciosamente devido aos erros acima.

**Solução:**
1. Resolver primeiro os erros 413 e CORS
2. Testar upload novamente
3. Verificar logs do Supabase: `docker-compose logs -f storage`

### Teste das Correções

**Após aplicar todas as correções acima, teste o upload:**

1. **Verificar configuração do Nginx:**
```bash
# Testar sintaxe
sudo nginx -t

# Verificar se as configurações estão ativas
sudo nginx -T | grep -A 5 -B 5 "client_max_body_size"
sudo nginx -T | grep -A 5 -B 5 "Access-Control-Allow-Origin"
```

2. **Reiniciar serviços:**
```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar status
sudo systemctl status nginx
```

3. **Testar upload de imagem:**
   - Tente fazer upload de uma imagem > 1MB
   - Verifique se não há erros 413 ou CORS
   - Confirme se a imagem aparece corretamente

4. **Verificar logs em caso de erro:**
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Logs do Supabase Storage
docker-compose logs -f storage
```

**✅ Sinais de sucesso:**
- Upload completa sem erros
- Imagem aparece na aplicação
- Sem erros 413 ou CORS nos logs
- URL da imagem retorna a imagem corretamente

---

## 🔧 Manutenção e Atualizações

### Atualizando o Supabase

**Para atualizar para a versão mais recente:**

```bash
# Parar os serviços
docker-compose down

# Fazer backup do banco de dados
docker-compose exec db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Atualizar as imagens
docker-compose pull

# Reiniciar os serviços
docker-compose up -d

# Verificar se tudo está funcionando
docker-compose ps
```

### Monitoramento de Serviços

**Verificar status dos containers:**
```bash
# Status geral
docker-compose ps

# Logs de todos os serviços
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f kong
docker-compose logs -f auth
docker-compose logs -f rest
docker-compose logs -f storage
```

**Verificar recursos do sistema:**
```bash
# Uso de recursos pelos containers
docker stats

# Espaço em disco usado pelo Docker
docker system df

# Limpar recursos não utilizados
docker system prune -f
```

### Backup e Restauração

**Backup do banco de dados:**
```bash
# Backup completo
docker-compose exec db pg_dump -U postgres postgres > backup_full_$(date +%Y%m%d).sql

# Backup apenas do schema
docker-compose exec db pg_dump -U postgres --schema-only postgres > backup_schema_$(date +%Y%m%d).sql

# Backup apenas dos dados
docker-compose exec db pg_dump -U postgres --data-only postgres > backup_data_$(date +%Y%m%d).sql
```

**Restauração do banco de dados:**
```bash
# Restaurar backup completo
cat backup_full_20240101.sql | docker-compose exec -T db psql -U postgres postgres

# Ou usando docker cp
docker cp backup_full_20240101.sql supabase_db_1:/tmp/
docker-compose exec db psql -U postgres postgres -f /tmp/backup_full_20240101.sql
```

### Comandos Úteis - Nginx

```bash
# Verificar status
systemctl status nginx

# Recarregar configuração (sem parar)
systemctl reload nginx

# Reiniciar nginx
systemctl restart nginx

# Testar configuração
nginx -t

# Ver logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Comandos Úteis - SSL

```bash
# Listar certificados
certbot certificates

# Renovar certificados
certbot renew

# Renovar específico
certbot renew --cert-name [SEU_DOMINIO]

# Testar renovação
certbot renew --dry-run

# Verificar timer automático
systemctl status certbot.timer
```

### Comandos Úteis - Docker/Supabase

```bash
# Ver containers
docker ps

# Logs de todos os serviços
docker-compose logs -f

# Logs de serviço específico
docker-compose logs -f kong

# Reiniciar serviço específico
docker-compose restart kong

# Reiniciar tudo
docker-compose restart
```

### Comandos Úteis - Sistema

```bash
# Verificar uso de disco
df -h

# Verificar uso de memória
free -h

# Verificar processos
htop

# Verificar portas abertas
netstat -tulpn

# Verificar conectividade
ping [SEU_DOMINIO]
telnet [SEU_DOMINIO] 443
```

---

## 🔒 Segurança

### Gerenciamento de Chaves API

**Gerar novas chaves API:**
```bash
# Gerar nova chave anon
docker run --rm supabase/gotrue:latest gotrue generate anon

# Gerar nova chave service_role
docker run --rm supabase/gotrue:latest gotrue generate service_role
```

**Atualizar chaves no arquivo .env:**
```bash
# Editar arquivo de configuração
nano .env

# Atualizar as seguintes variáveis:
ANON_KEY=nova_chave_anon_aqui
SERVICE_ROLE_KEY=nova_chave_service_role_aqui

# Reiniciar os serviços
docker-compose down
docker-compose up -d
```

### Segurança do JWT

**Gerar novo JWT Secret:**
```bash
# Gerar secret aleatório de 256 bits
openssl rand -base64 32

# Ou usar o gerador do Supabase
docker run --rm supabase/gotrue:latest gotrue generate secret
```

**Atualizar JWT_SECRET:**
```bash
# No arquivo .env
JWT_SECRET=novo_secret_aqui

# Reiniciar serviços
docker-compose restart
```

### Segurança do Banco de Dados

**Alterar senha do PostgreSQL:**
```bash
# Conectar ao banco
docker-compose exec db psql -U postgres

# Alterar senha
ALTER USER postgres PASSWORD 'nova_senha_segura';

# Sair
\q

# Atualizar no .env
POSTGRES_PASSWORD=nova_senha_segura
```

### Configurações de Firewall

**Configurar UFW (Ubuntu Firewall):**
```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Bloquear acesso direto ao PostgreSQL (opcional)
sudo ufw deny 5432

# Verificar status
sudo ufw status
```

### Monitoramento de Segurança

**Verificar logs de autenticação:**
```bash
# Logs do GoTrue (Auth)
docker-compose logs auth | grep -i "error\|fail\|invalid"

# Logs do Kong (Gateway)
docker-compose logs kong | grep -i "error\|fail\|invalid"

# Logs do sistema
sudo tail -f /var/log/auth.log
```

**Verificar tentativas de acesso:**
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log | grep -v "200\|304"

# Verificar IPs suspeitos
sudo tail -f /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr
```

### Backup de Segurança

**Backup automático diário:**
```bash
# Criar script de backup
sudo nano /usr/local/bin/supabase-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker-compose exec -T db pg_dump -U postgres postgres > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos de configuração
cp .env $BACKUP_DIR/env_backup_$DATE
cp docker-compose.yml $BACKUP_DIR/compose_backup_$DATE.yml

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +7 -delete
find $BACKUP_DIR -name "compose_backup_*" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/supabase-backup.sh

# Adicionar ao crontab para execução diária às 2h
sudo crontab -e
# Adicionar linha:
0 2 * * * /usr/local/bin/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1
```

### Auditoria e Compliance

**Habilitar logging detalhado:**
```bash
# No arquivo .env, adicionar:
LOG_LEVEL=info
DB_LOG_LEVEL=log

# Reiniciar serviços
docker-compose restart
```

**Verificar conformidade GDPR:**
- Implementar políticas de retenção de dados
- Configurar anonização automática
- Documentar fluxos de dados pessoais
- Implementar direito ao esquecimento

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kong Gateway Documentation](https://docs.konghq.com/)

### Comunidade e Suporte
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Supabase Discord](https://discord.supabase.com/)
- [Supabase Community Forum](https://github.com/supabase/supabase/discussions)

### Ferramentas Úteis
- [Supabase CLI](https://github.com/supabase/cli)
- [pgAdmin](https://www.pgadmin.org/) - Interface gráfica para PostgreSQL
- [Portainer](https://www.portainer.io/) - Interface gráfica para Docker

---

## 📊 Monitoramento

### Logs Importantes

```bash
# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log

# Sistema
journalctl -f

# Docker
docker-compose logs -f
```

### Verificações Periódicas

**Diariamente:**
- Verificar se o site está acessível
- Verificar logs de erro

**Semanalmente:**
- Verificar espaço em disco
- Verificar uso de memória

**Mensalmente:**
- Testar renovação SSL
- Backup das configurações

---

## 📋 Checklist Final

### ✅ Configuração Completa

- [ ] DNS configurado e propagado
- [ ] Nginx instalado e configurado
- [ ] SSL/HTTPS funcionando
- [ ] Supabase configurado com novo domínio
- [ ] Aplicação Next.js variáveis de ambiente atualizadas
- [ ] **Next.js `next.config.ts` atualizado com novo hostname**
- [ ] **Servidor Next.js reiniciado após mudanças no config**
- [ ] URLs de imagem usando HTTPS
- [ ] Imagens carregando sem erros no navegador
- [ ] Todos os testes passando
- [ ] Renovação automática SSL ativa

### 🔗 URLs de Teste

- **Site principal:** https://[SEU_DOMINIO]
- **API Supabase:** https://[SEU_DOMINIO]/rest/v1/
- **Storage:** https://[SEU_DOMINIO]/storage/v1/object/
- **Exemplo de imagem:** https://[SEU_DOMINIO]/storage/v1/object/public/files/...

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs** nos locais indicados acima
2. **Seguir seção de solução de problemas**
3. **Verificar configurações** passo a passo
4. **Testar cada componente** individualmente

**Configuração atualizada em:** [Data de hoje]
**Versão do documento:** 1.0
**Domínio:** [SEU_DOMINIO]
**IP:** [IP_DO_SEU_SERVIDOR]