# 📋 Guia de Sistema de Logging Detalhado

Este guia explica como usar o sistema de logging detalhado implementado no projeto para rastrear inputs, outputs, chamadas de API e erros.

## 🚀 Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Logging Configuration
VERBOSE_LOGGING=true    # Habilita logs detalhados com input/output
DEBUG_LOGGING=true      # Habilita logs de debug em desenvolvimento
```

### Níveis de Log

- **INFO**: Informações gerais sobre o fluxo da aplicação
- **DEBUG**: Informações detalhadas para debugging (apenas em desenvolvimento)
- **WARN**: Avisos sobre situações que podem causar problemas
- **ERROR**: Erros que ocorreram durante a execução

## 📖 Como Usar

### 1. Importar o Logger

```typescript
import { logger, logServerAction, logApiCall } from '@/lib/logger';
```

### 2. Logging Básico

```typescript
// Log de informação
logger.info('Operação iniciada', {
  input: { userId: '123', action: 'create' },
  metadata: { timestamp: Date.now() }
});

// Log de erro
logger.error('Falha na operação', error, {
  input: { userId: '123' },
  metadata: { context: 'user_creation' }
});

// Log de debug (apenas em desenvolvimento)
logger.debug('Estado interno', {
  output: { currentState: 'processing' }
});
```

### 3. Logging de Server Actions

Use `logServerAction` para envolver suas server actions:

```typescript
export const myAction = async (input: any) => {
  return logServerAction('myAction', async () => {
    // Sua lógica aqui
    return result;
  }, input);
};
```

### 4. Logging de Chamadas de API

Use `logApiCall` para rastrear chamadas para APIs externas:

```typescript
const result = await logApiCall(
  'OpenAI',
  'chat/completions',
  () => openai.chat.completions.create(params),
  params
);
```

### 5. Medição de Tempo

Use `timeAsync` para medir o tempo de execução:

```typescript
const result = await logger.timeAsync(
  'Operação complexa',
  async () => {
    // Operação que demora
    return await complexOperation();
  },
  { input: inputData }
);
```

## 📊 Formato dos Logs

### Exemplo de Log Detalhado

```
[2024-01-15T10:30:45.123Z] [INFO] 🖼️ INICIANDO ANÁLISE DE IMAGEM (1250ms)
  📥 INPUT: {
    "url": "https://example.com/image.jpg",
    "projectId": "proj_123"
  }
  📤 OUTPUT: {
    "description": "Uma imagem mostrando...",
    "success": true
  }
  📋 METADATA: {
    "action": "image_description",
    "model": "replicate-gpt-5",
    "imageSize": 1024576
  }
```

### Exemplo de Log de Erro

```
[2024-01-15T10:30:45.123Z] [ERROR] ❌ Projeto não encontrado (150ms)
  📥 INPUT: {
    "projectId": "invalid_id"
  }
  ❌ ERROR: "Project not found"
  📋 METADATA: {
    "action": "project_update",
    "success": false
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

### Desabilitar Logs em Produção

```typescript
// Os logs são automaticamente ajustados baseado no NODE_ENV
// Em produção, apenas logs de ERROR e WARN são mostrados
// Em desenvolvimento, todos os logs são mostrados
```

### Logs Verbosos

```bash
# Para ver todos os inputs/outputs detalhados
VERBOSE_LOGGING=true
```

### Apenas Logs de Erro

```bash
# Para ver apenas erros
VERBOSE_LOGGING=false
DEBUG_LOGGING=false
```

## 🚨 Considerações de Segurança

- **Nunca** logue dados sensíveis como senhas, tokens de API, ou informações pessoais
- Use `metadata` para informações contextuais não sensíveis
- Em produção, considere filtrar logs que contenham dados sensíveis

## 📈 Próximos Passos

1. **Implementar em todas as server actions**
2. **Adicionar logs em componentes críticos**
3. **Configurar agregação de logs** (ex: LogRocket, Sentry)
4. **Criar dashboards de monitoramento**
5. **Implementar alertas baseados em logs de erro**

---

**Dica**: Use emojis nos logs para facilitar a identificação visual dos diferentes tipos de operação! 🎉