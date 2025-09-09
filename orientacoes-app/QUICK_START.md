# Quick Start — Migrations, Storage e Usuários

Bem direto, para subir o ambiente com segurança (RLS, Storage privado) e criar usuário.

## 0) Requisitos
- Rodar sempre via WSL
- Arquivo `.env.local` com `POSTGRES_URL` e demais variáveis já configuradas

## 1) Migrations + RLS (Drizzle)
```
wsl pnpm migrate
```
Saída esperada: sem erros, e a última linha semelhante a:
```
✅ RLS habilitado e políticas aplicadas para profile e project
```

## 2) Storage (Supabase)
- Criar/checar buckets e políticas privadas (avatars, files, screenshots):
```
wsl node setup-supabase-storage.js
```
- Se quiser recriar do zero (apaga tudo):
```
wsl node setup-supabase-storage.js --reset
```
- Só conferir a configuração:
```
wsl node setup-supabase-storage.js --check-only
```

Observações rápidas:
- Buckets ficam privados; leitura via proxy do app: `/api/storage/<bucket>/<userId>/<arquivo>`
- Imagens e vídeos gerados já usam esse proxy; não expiram e exigem login

## 3) Criar usuário
- Criar:
```
wsl node create-user.js create <email> <senha>
```
- Verificar:
```
wsl node create-user.js verify <email>
```
- Listar:
```
wsl node create-user.js list
```
- Excluir (se precisar):
```
wsl node delete-user.js delete <email>
```

## 4) Rodar a aplicação
```
wsl pnpm dev
```
Acesse a UI, faça login com o usuário criado e vá em Perfil para salvar o seu token FAL.

## 5) (Opcional) Migrar URLs antigas do Storage
Se já existirem projetos com URLs públicas antigas do Supabase e você quer trocar para o proxy privado:
```
wsl pnpm migrate:storage-urls
```

Pronto. Ambiente com banco em dia (RLS), storage privado com proxy seguro, e usuário criado.

