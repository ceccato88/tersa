# 🧹 Exemplo Prático: Configuração de Limpeza Automática do Storage

## 📋 Cenário

Você tem uma aplicação em produção que gera muitas imagens e screenshots. Quer configurar limpeza automática para:
- Manter apenas 30 dias de arquivos em `files` e `screenshots`
- Manter apenas 90 dias de `avatars` (mais importantes)
- Executar limpeza todo dia às 2h da manhã
- Monitorar execução via logs

## 🚀 Passo a Passo Completo

### 1. Primeiro Teste (Simulação)

```bash
# Navegar para o projeto
wsl cd /mnt/c/ai/tersa

# Verificar estatísticas atuais
wsl node scripts/cleanup-storage.js --stats

# Simular limpeza de 30 dias
wsl node scripts/cleanup-storage.js --dry-run --days=30

# Simular limpeza específica de screenshots
wsl node scripts/cleanup-storage.js --bucket=screenshots --dry-run --days=7
```

**Saída esperada:**
```
📊 ESTATÍSTICAS DO STORAGE
==========================
📁 files:
   Arquivos: 245
   Tamanho: 78.5 MB

📁 screenshots:
   Arquivos: 156
   Tamanho: 23.2 MB

📁 avatars:
   Arquivos: 89
   Tamanho: 4.1 MB

📋 TOTAL:
   Arquivos: 490
   Tamanho: 105.8 MB
```

### 2. Limpeza Manual (Teste Real)

```bash
# Limpeza conservadora primeiro (7 dias)
wsl node scripts/cleanup-storage.js --days=7

# Verificar resultado
wsl node scripts/cleanup-storage.js --stats

# Se tudo OK, limpeza mais agressiva (30 dias)
wsl node scripts/cleanup-storage.js --days=30
```

### 3. Configuração de Automação

#### Opção A: Configuração Automática

```bash
# Configuração padrão (todo dia às 2h, 30 dias)
wsl node scripts/setup-storage-cleanup-cron.js

# Testar configuração
wsl node scripts/setup-storage-cleanup-cron.js --test
```

#### Opção B: Configuração Personalizada

```bash
# Todo domingo às 3h, retenção de 14 dias
wsl node scripts/setup-storage-cleanup-cron.js --schedule="0 3 * * 0" --days=14

# A cada 6 horas (para alto volume)
wsl node scripts/setup-storage-cleanup-cron.js --schedule="0 */6 * * *" --days=7
```

#### Opção C: Configuração Manual

```bash
# Ver instruções detalhadas
wsl node scripts/setup-storage-cleanup-cron.js --manual

# Editar crontab manualmente
crontab -e

# Adicionar linha:
# 0 2 * * * /mnt/c/ai/tersa/scripts/storage-cleanup-cron.sh >> /tmp/storage-cleanup.log 2>&1
```

### 4. Configuração Avançada (Múltiplos Agendamentos)

Para diferentes políticas de retenção por bucket:

```bash
# Crontab personalizado
crontab -e

# Adicionar múltiplas linhas:
# Limpeza diária de screenshots (7 dias)
0 2 * * * cd /mnt/c/ai/tersa && node scripts/cleanup-storage.js --bucket=screenshots --days=7 >> /tmp/storage-cleanup.log 2>&1

# Limpeza semanal de files (30 dias)
0 3 * * 0 cd /mnt/c/ai/tersa && node scripts/cleanup-storage.js --bucket=files --days=30 >> /tmp/storage-cleanup.log 2>&1

# Limpeza mensal de avatars (90 dias)
0 4 1 * * cd /mnt/c/ai/tersa && node scripts/cleanup-storage.js --bucket=avatars --days=90 >> /tmp/storage-cleanup.log 2>&1
```

### 5. Monitoramento e Logs

```bash
# Ver logs em tempo real
tail -f /tmp/storage-cleanup.log

# Ver últimas 50 linhas
tail -50 /tmp/storage-cleanup.log

# Buscar por erros
grep -i "erro\|error\|failed" /tmp/storage-cleanup.log

# Buscar por sucessos
grep -i "sucesso\|success\|concluída" /tmp/storage-cleanup.log

# Ver estatísticas de espaço liberado
grep -i "espaço liberado\|bytes" /tmp/storage-cleanup.log
```

### 6. Verificação e Manutenção

#### Verificação Semanal

```bash
# Script de verificação semanal
#!/bin/bash
echo "=== Relatório Semanal de Storage $(date) ==="
echo ""
echo "📊 Estatísticas atuais:"
cd /mnt/c/ai/tersa
node scripts/cleanup-storage.js --stats
echo ""
echo "📋 Últimas execuções:"
tail -20 /tmp/storage-cleanup.log | grep "RELATÓRIO FINAL" -A 5
echo ""
echo "❌ Erros recentes:"
grep -i "erro\|error" /tmp/storage-cleanup.log | tail -5
```

#### Verificação de Cron

```bash
# Verificar se cron está rodando
ps aux | grep cron

# Ver tarefas agendadas
crontab -l

# Testar execução manual
/mnt/c/ai/tersa/scripts/storage-cleanup-cron.sh
```

### 7. Troubleshooting Comum

#### Problema: "Bucket not found"

```bash
# Verificar se buckets existem
wsl node scripts/setup-supabase-storage.js

# Verificar conexão
wsl node scripts/cleanup-storage.js --stats
```

#### Problema: "Permission denied"

```bash
# Dar permissão ao script
chmod +x /mnt/c/ai/tersa/scripts/storage-cleanup-cron.sh

# Verificar permissões
ls -la /mnt/c/ai/tersa/scripts/storage-cleanup-cron.sh
```

#### Problema: Variáveis de ambiente

```bash
# Verificar se .env.local existe
ls -la /mnt/c/ai/tersa/.env.local

# Testar carregamento
source /mnt/c/ai/tersa/.env.local
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### Problema: Cron não executa

```bash
# Verificar status do cron
sudo service cron status

# Reiniciar se necessário
sudo service cron restart

# Ver logs do sistema
sudo tail -f /var/log/syslog | grep CRON
```

## 📊 Resultados Esperados

Após configuração completa, você deve ter:

- ✅ **Limpeza automática** funcionando diariamente
- ✅ **Logs detalhados** de cada execução
- ✅ **Economia de espaço** significativa
- ✅ **Monitoramento** via logs
- ✅ **Flexibilidade** para ajustar retenção

### Exemplo de Log de Sucesso

```
[2024-01-15 02:00:01] Iniciando limpeza automática do storage...
🧹 LIMPEZA AUTOMÁTICA DO SUPABASE STORAGE
==========================================
📅 Data de corte: 2024-01-15T02:00:00.000Z
⏰ Retenção: 30 dias
🪣 Buckets: files, screenshots, avatars
🔍 Modo: EXECUÇÃO REAL

📊 ESTATÍSTICAS ANTES DA LIMPEZA:
   files: 245 arquivos, 78.5 MB
   screenshots: 156 arquivos, 23.2 MB
   avatars: 89 arquivos, 4.1 MB

🔍 Verificando bucket: files
📊 files: 245 arquivos total, 67 para remoção
🗑️  Removendo 67 arquivos do bucket files
✅ Removidos 67 arquivos com sucesso

📋 RELATÓRIO FINAL:
===================
📁 Arquivos encontrados: 89
🗑️  Arquivos removidos: 89
💾 Espaço liberado: 28.7 MB
❌ Erros: 0

✅ Limpeza concluída com sucesso!
[2024-01-15 02:00:45] Limpeza concluída com sucesso
```

## 🎯 Próximos Passos

1. **Implementar monitoramento** via dashboard
2. **Configurar alertas** para falhas
3. **Otimizar agendamentos** baseado no uso
4. **Adicionar métricas** de economia de espaço
5. **Configurar backup** antes da limpeza (opcional)

---

**💡 Dica:** Sempre teste em modo `--dry-run` antes de executar limpezas reais em produção!