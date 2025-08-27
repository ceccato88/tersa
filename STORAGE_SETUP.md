# Configuração do Storage do Supabase

Este projeto utiliza o Supabase Storage para armazenar arquivos de usuários. Os buckets necessários são criados automaticamente através do arquivo `supabase/seed.sql`.

## Buckets Criados

### 1. `avatars`
- **Propósito**: Armazenar imagens de perfil dos usuários
- **Tipos de arquivo permitidos**: JPEG, PNG, WebP, GIF
- **Tamanho máximo**: 50MB
- **Acesso**: Público para leitura, usuários podem gerenciar apenas seus próprios arquivos

### 2. `files`
- **Propósito**: Armazenar arquivos gerais dos projetos
- **Tipos de arquivo permitidos**: Imagens (JPEG, PNG, WebP, GIF, SVG), documentos (PDF, TXT), vídeos (MP4, WebM), áudios (MP3, WAV, OGG)
- **Tamanho máximo**: 50MB
- **Acesso**: Público para leitura, usuários podem gerenciar apenas seus próprios arquivos

### 3. `screenshots`
- **Propósito**: Armazenar capturas de tela geradas pelo sistema
- **Tipos de arquivo permitidos**: JPEG, PNG, WebP
- **Tamanho máximo**: 50MB
- **Acesso**: Público para leitura, usuários podem gerenciar apenas seus próprios arquivos

## Políticas de Segurança (RLS)

Cada bucket possui as seguintes políticas de Row Level Security (RLS):

1. **INSERT**: Usuários podem fazer upload apenas em suas próprias pastas (`user_id/filename`)
2. **UPDATE**: Usuários podem atualizar apenas seus próprios arquivos
3. **DELETE**: Usuários podem deletar apenas seus próprios arquivos
4. **SELECT**: Todos os arquivos são publicamente acessíveis para leitura

## Como Aplicar as Configurações

### Para Desenvolvimento Local

1. Certifique-se de que o Supabase CLI está instalado
2. Execute o comando para resetar o banco local (isso aplicará o seed.sql):
   ```bash
   npx supabase db reset
   ```

### Para Produção

1. Acesse o painel do Supabase em https://supabase.com/dashboard
2. Vá para seu projeto
3. Navegue até **Storage** > **Buckets**
4. Execute o conteúdo do arquivo `supabase/seed.sql` no **SQL Editor**

## Estrutura de Pastas

Os arquivos são organizados da seguinte forma:
```
bucket_name/
└── user_id/
    ├── arquivo1.jpg
    ├── arquivo2.png
    └── ...
```

## Troubleshooting

### Erro "Bucket not found"

Se você receber este erro, significa que os buckets não foram criados. Execute:

```bash
# Para desenvolvimento local
npx supabase db reset

# Ou aplique manualmente o seed.sql
npx supabase db reset --db-url "your-database-url"
```

### Erro de Permissão

Se você receber erros de permissão, verifique se:
1. O usuário está autenticado
2. As políticas RLS foram aplicadas corretamente
3. O arquivo está sendo enviado para a pasta correta (`user_id/filename`)

## URLs de Acesso

### Desenvolvimento
- Storage API: `http://127.0.0.1:54321/storage/v1`
- URLs públicas: `http://127.0.0.1:54321/storage/v1/object/public/{bucket}/{path}`

### Produção
- URLs públicas: `https://{project-id}.supabase.co/storage/v1/object/public/{bucket}/{path}`