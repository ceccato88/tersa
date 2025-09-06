# Scripts

## Criar usuário unlimited

```bash
wsl npx tsc scripts/create-user.ts --outDir scripts/dist
wsl node scripts/dist/scripts/create-user.js email@exemplo.com senha123 "Nome Completo"
```
