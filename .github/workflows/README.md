# GitHub Actions - Ping Supabase

Este workflow automatizado evita que o banco de dados Supabase seja pausado por inatividade.

## Como Funciona

O workflow `ping-supabase.yml` executa uma consulta simples no banco de dados a cada segunda e quinta-feira às 9:00 AM UTC, mantendo-o ativo.

## Configuração Necessária

### 1. Secrets do GitHub

Você precisa configurar os seguintes secrets no seu repositório GitHub:

1. Vá para **Settings** > **Secrets and variables** > **Actions**
2. Adicione os seguintes secrets:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role do Supabase

### 2. Como Obter as Credenciais

**URL do Supabase:**
- Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
- Vá para **Settings** > **API**
- Copie a **Project URL**

**Service Role Key:**
- Na mesma página (**Settings** > **API**)
- Copie a **service_role** key (não a anon key)
- ⚠️ **IMPORTANTE**: Esta chave tem privilégios administrativos, mantenha-a segura!

## Personalização

### Alterar Frequência

Para modificar quando o workflow executa, edite a linha `cron` no arquivo:

```yaml
schedule:
  - cron: '0 9 * * 1,4' # Segunda e quinta às 9:00 UTC
```

Exemplos de outras frequências:
- `'0 9 * * *'` - Todos os dias às 9:00 UTC
- `'0 */6 * * *'` - A cada 6 horas
- `'0 9 * * 1,3,5'` - Segunda, quarta e sexta às 9:00 UTC

### Alterar Tabela de Consulta

O workflow consulta a tabela `profile` por padrão. Para usar outra tabela, modifique esta linha:

```javascript
const { data, error } = await supabase.from('sua_tabela').select('id').limit(1);
```

## Execução Manual

Você pode executar o workflow manualmente:

1. Vá para a aba **Actions** do seu repositório
2. Selecione **Ping Supabase to Prevent Pausing**
3. Clique em **Run workflow**

## Monitoramento

Para verificar se o workflow está funcionando:

1. Vá para **Actions** no GitHub
2. Verifique os logs de execução
3. Procure por mensagens como "Ping successful! Database is active."

## Solução de Problemas

### Erro de Autenticação
- Verifique se os secrets estão configurados corretamente
- Confirme que a service role key está correta

### Erro de Tabela
- Certifique-se de que a tabela `profile` existe
- Ou altere para uma tabela que existe no seu banco

### Workflow Não Executa
- Verifique se o repositório não está arquivado
- Confirme que há atividade recente no repositório (GitHub pode desabilitar workflows em repos inativos)

## Benefícios

✅ **Automático**: Executa sem intervenção manual
✅ **Gratuito**: Usa os limites gratuitos do GitHub Actions
✅ **Confiável**: Mantém o banco sempre ativo
✅ **Flexível**: Fácil de personalizar horários e frequência