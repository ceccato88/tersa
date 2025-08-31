# 📋 Guia de Sistema de Logging Simplificado

Este guia explica como usar o sistema de logging otimizado implementado no projeto para rastrear operações essenciais, chamadas de API e erros de forma eficiente.

## 🚀 Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Logging Configuration
VERBOSE_LOGGING=true    # Habilita logs detalhados (apenas em desenvolvimento)
NODE_ENV=development    # Controla o nível de logging
```

### Níveis de Log

- **INFO**: Informações sobre operações concluídas com sucesso
- **DEBUG**: Informações detalhadas (apenas em desenvolvimento + verbose)
- **WARN**: Avisos sobre situações que podem causar problemas
- **ERROR**: Erros que ocorreram durante a execução

### Características do Sistema

- **Logs Sanitizados**: Remove automaticamente dados sensíveis (passwords, tokens, keys)
- **Limitação de Tamanho**: Logs grandes são truncados para evitar spam
- **Logs Condicionais**: Logs verbosos apenas em desenvolvimento
- **Performance Otimizada**: Logs essenciais com mínimo overhead

## 📖 Como Usar

### 1. Importar o Logger

```typescript
import { logger, logServerAction, logApiCall, logInfo, logError } from '@/lib/logger';
```

### 2. Logging Básico Simplificado

```typescript
// Log de informação rápido
logInfo('Usuário autenticado', { userId: '123' });

// Log de erro rápido
logError('Falha na autenticação', error, { userId: '123' });

// Log de debug (apenas em desenvolvimento verbose)
logger.debug('🔄 Processando dados');

// Log de warning
logger.warn('⚠️ Limite de rate quase atingido', {
  metadata: { remaining: 5 }
});
```

### 3. Logging de Server Actions (Recomendado)

Use `logServerAction` para envolver suas server actions:

```typescript
export const updateProjectAction = async (projectId: string, data: any) => {
  return logServerAction('updateProjectAction', async () => {
    // Sua lógica aqui
    const result = await updateProject(projectId, data);
    return result;
  }, { projectId, data });
};
```

### 4. Logging de Chamadas de API (Recomendado)

Use `logApiCall` para rastrear chamadas para APIs externas:

```typescript
const result = await logApiCall(
  'FAL',
  'vision',
  () => fal.subscribe('fal-ai/any-llm/vision', { input: params }),
  params
);
```

### 5. Medição de Tempo Manual

Use `timeAsync` apenas quando necessário:

```typescript
const result = await logger.timeAsync(
  '🔄 Processamento complexo',
  async () => {
    return await complexOperation();
  },
  { metadata: { type: 'heavy_computation' } }
);
```

## 📊 Formato dos Logs

### Exemplo de Log de Sucesso

```
[2024-01-15T10:30:45.123Z] [INFO] ✅ 🔧 updateProjectAction (150ms)
  📋 METADATA: {
    "duration": 150,
    "success": true,
    "type": "server_action",
    "hasInput": true
  }
```

### Exemplo de Log de API

```
[2024-01-15T10:30:45.123Z] [INFO] ✅ 🌐 API FAL/vision (1250ms)
  📋 METADATA: {
    "duration": 1250,
    "success": true,
    "type": "api_call",
    "apiName": "FAL",
    "endpoint": "vision",
    "hasInput": true
  }
```

### Exemplo de Log de Erro

```
[2024-01-15T10:30:45.123Z] [ERROR] ❌ 🔧 updateProjectAction (50ms)
  ❌ ERROR: Project not found
  📋 METADATA: {
    "duration": 50,
    "success": false,
    "type": "server_action"
  }
```

### Exemplo de Log Verbose (Desenvolvimento)

```
[2024-01-15T10:30:45.123Z] [INFO] ℹ️ Usuário autenticado
  📋 METADATA: {
    "userId": "user_123",
    "role": "admin"
  }
```

## 🔧 Implementação em Ações Existentes

### Antes (sem logging)

```typescript
export const myAction = async (input: string) => {
  try {
    const result = await someOperation(input);
    return { success: true, data: result };
  } catch (error) {
    return { error: parseError(error) };
  }
};
```

### Depois (com logging detalhado)

```typescript
export const myAction = async (input: string) => {
  return logServerAction('myAction', async () => {
    logger.info('🚀 INICIANDO OPERAÇÃO', {
      input: { input },
      metadata: { action: 'my_operation' }
    });

    try {
      logger.debug('🔄 Processando dados');
      const result = await someOperation(input);
      
      logger.info('✅ Operação concluída com sucesso', {
        output: { success: true, dataLength: result.length },
        metadata: { success: true }
      });
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('💥 Erro durante operação', error, {
        input: { input },
        metadata: { action: 'my_operation', success: false }
      });
      
      return { error: parseError(error) };
    }
  }, input);
};
```

## 🎯 Benefícios

### 1. **Rastreabilidade Completa**
- Veja exatamente quais dados entraram e saíram de cada função
- Rastreie o fluxo completo de uma requisição

### 2. **Debugging Eficiente**
- Identifique rapidamente onde ocorrem erros
- Veja o estado dos dados em cada etapa

### 3. **Monitoramento de Performance**
- Meça o tempo de execução de cada operação
- Identifique gargalos de performance

### 4. **Auditoria de API**
- Rastreie todas as chamadas para APIs externas
- Monitore uso de tokens e custos

### 5. **Logs Estruturados**
- Formato consistente e legível
- Fácil de filtrar e analisar

## 🔍 Exemplos de Uso

### Rastreando Upload de Imagem

```typescript
// Você verá logs como:
// [INFO] 🖼️ INICIANDO ANÁLISE DE IMAGEM
// [DEBUG] 🔐 Verificando autenticação do usuário
// [INFO] ✅ Usuário autenticado com sucesso
// [DEBUG] 🤖 Inicializando cliente Replicate
// [INFO] ✅ Cliente Replicate inicializado
// [DEBUG] 🔍 Buscando projeto no banco de dados
// [INFO] ✅ Projeto encontrado
// [INFO] 🚀 Iniciando chamada para API Replicate
// [INFO] ✅ Resposta recebida da API Replicate
// [INFO] 🎉 Descrição da imagem gerada com sucesso
```

### Rastreando Atualização de Projeto

```typescript
// Você verá logs como:
// [INFO] 📝 INICIANDO ATUALIZAÇÃO DE PROJETO
// [DEBUG] 🔐 Verificando autenticação do usuário
// [INFO] ✅ Usuário autenticado
// [DEBUG] 📊 Dados preparados para atualização
// [DEBUG] 💾 Executando atualização no banco de dados
// [INFO] 🎉 Projeto atualizado com sucesso
```

## ⚙️ Configurações Avançadas

### Configuração de Ambiente

```bash
# Produção - Logs mínimos
NODE_ENV=production
VERBOSE_LOGGING=false

# Desenvolvimento - Logs completos
NODE_ENV=development
VERBOSE_LOGGING=true

# Staging - Logs intermediários
NODE_ENV=staging
VERBOSE_LOGGING=false
```

### Comportamento por Ambiente

- **Produção**: Apenas logs de sucesso/erro com metadados essenciais
- **Desenvolvimento + Verbose**: Logs completos com input/output sanitizados
- **Desenvolvimento**: Logs de sucesso/erro + logs de debug

### Logs Críticos

```typescript
// Para erros que requerem atenção imediata
logger.error('🚨 Falha crítica no sistema', error, {
  metadata: { 
    severity: 'critical',
    requiresAlert: true 
  }
});
```

## 🚨 Considerações de Segurança

- **Nunca** logue dados sensíveis como senhas, tokens de API, ou informações pessoais
- Use `metadata` para informações contextuais não sensíveis
- Em produção, considere filtrar logs que contenham dados sensíveis

## 🚀 Status Atual e Melhorias

### ✅ Implementado

- **Sistema de Logging Simplificado**: Logs otimizados com sanitização automática
- **Funções Auxiliares**: `logInfo` e `logError` para logs rápidos
- **Sanitização de Dados**: Limitação automática de tamanho e remoção de dados sensíveis
- **Logs Condicionais**: Comportamento inteligente baseado no ambiente
- **Metadados Estruturados**: Informações essenciais sem verbosidade excessiva

### 🔄 Próximos Passos

1. **Migração Gradual**
   - Substituir logs antigos pelos novos métodos simplificados
   - Usar `logServerAction` e `logApiCall` consistentemente

2. **Monitoramento**
   - Implementar alertas para logs críticos
   - Configurar dashboard de performance

3. **Otimização Contínua**
   - Ajustar sanitização baseada no uso real
   - Refinar metadados conforme necessário

### 📋 Checklist de Implementação

- [ ] Migrar server actions para `logServerAction`
- [ ] Migrar chamadas de API para `logApiCall`
- [ ] Substituir logs manuais por `logInfo`/`logError`
- [ ] Configurar variáveis de ambiente adequadamente
- [ ] Testar logs em diferentes ambientes

---

**Dica**: Use emojis nos logs para facilitar a identificação visual dos diferentes tipos de operação! 🎉