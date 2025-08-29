# Documentação - Modelos de Texto e Imagem

## Visão Geral
Este documento mapeia onde são configurados os modelos de texto e imagem, schemas e chamadas de API no projeto Tersa.

## 🎯 Componentes Principais

### 1. Modelos de Texto

#### Configuração dos Modelos
**Arquivo:** `C:\ai\tersa\components\nodes\text\transform.tsx`
- **Linhas 50-65:** Definição dos modelos disponíveis
```typescript
const AVAILABLE_MODELS = {
  'openai/gpt-5': {
    name: 'GPT-5',
    provider: 'replicate',
    default: true,
  },
  'openai/gpt-5-mini': {
    name: 'GPT-5 Mini',
    provider: 'replicate',
  },
  'anthropic/claude-4-sonnet': {
    name: 'Claude 4 Sonnet',
    provider: 'replicate',
  },
};
```

#### API de Streaming de Texto
**Arquivo:** `C:\ai\tersa\app\api\replicate-stream\route.ts`
- Endpoint personalizado para streaming de texto via Replicate
- Processa prompts, system prompts e parâmetros
- Suporte a múltiplas variações
- Tratamento de imagens como input

### 2. Modelos de Imagem

#### Action para Geração de Imagem
**Arquivo:** `C:\ai\tersa\app\actions\image\replicate.ts`
- Implementação da geração de imagens via Replicate
- Configuração de modelos de imagem
- Processamento de parâmetros como aspect ratio, seed, etc.

#### Componente de Imagem
**Diretório:** `C:\ai\tersa\components\nodes\image\`
- **transform.tsx:** Componente principal de transformação de imagem
- **primitive.tsx:** Componente primitivo de imagem
- **index.ts:** Exports e tipos

### 3. Schemas de Modelos

#### Definições de Schema
**Arquivo:** `C:\ai\tersa\lib\model-schemas.ts`
- Schemas para validação de parâmetros
- Definições de tipos para modelos
- Configurações de campos dinâmicos

## 🔧 Estrutura de Configuração

### Modelos de Texto
```
C:\ai\tersa\components\nodes\text\transform.tsx
├── AVAILABLE_MODELS (linhas 50-65)
├── getDefaultModel() (linha 67)
└── handleGenerate() (linha 95+)
```

### API de Texto
```
C:\ai\tersa\app\api\replicate-stream\
├── route.ts (endpoint principal)
└── Configurações de streaming
```

### Modelos de Imagem
```
C:\ai\tersa\app\actions\image\replicate.ts
├── Configuração de modelos
├── Parâmetros de geração
└── Processamento de resultados
```

### Componentes de Interface
```
C:\ai\tersa\components\nodes\image\
├── transform.tsx (interface principal)
├── primitive.tsx (componente base)
└── index.ts (exports)
```

### Schemas e Validação
```
C:\ai\tersa\lib\model-schemas.ts
├── Schemas de validação
├── Tipos de dados
└── Configurações de campos
```

## 📋 Checklist para Modificações

### Para Adicionar Novo Modelo de Texto:
1. ✅ Atualizar `AVAILABLE_MODELS` em `components/nodes/text/transform.tsx`
2. ✅ Verificar compatibilidade com API em `app/api/replicate-stream/route.ts`
3. ✅ Atualizar schemas se necessário em `lib/model-schemas.ts`

### Para Adicionar Novo Modelo de Imagem:
1. ✅ Modificar `app/actions/image/replicate.ts`
2. ✅ Atualizar componente em `components/nodes/image/transform.tsx`
3. ✅ Verificar schemas em `lib/model-schemas.ts`

### Para Modificar APIs:
1. ✅ Texto: `app/api/replicate-stream/route.ts`
2. ✅ Imagem: `app/actions/image/replicate.ts`
3. ✅ Atualizar tipos e interfaces relacionadas

## 🚨 Pontos de Atenção

### Dependências Críticas
- **Replicate API:** Todos os modelos usam a API do Replicate
- **Streaming:** Implementação customizada para texto
- **Schemas:** Validação centralizada em `model-schemas.ts`

### Arquivos Relacionados (Confirmados)
- `lib/gateway.tsx` - Configurações de gateway
- `providers/gateway/` - Providers de API
- `schema.ts` - Schemas gerais do projeto
- `lib/models/vision.ts` - Modelos de visão para análise de imagem
- `lib/models/video/replicate.ts` - Modelos de vídeo via Replicate
- `lib/providers.ts` - Definições de provedores (Replicate, etc.)
- `app/actions/image/describe.ts` - Action para descrição de imagens
- `app/api/replicate-stream/route.ts` - API de streaming de texto

## 🔍 Detalhamento Adicional

### 4. Modelos de Visão (Análise de Imagem)

#### Configuração dos Modelos de Visão
**Arquivo:** `C:\ai\tersa\lib\models\vision.ts`
```typescript
export const visionModels: Record<string, TersaVisionModel> = {
  'replicate-gpt-5': {
    label: 'GPT-5',
    chef: providers.replicate,
    providers: [providers.replicate],
    replicateModel: 'openai/gpt-5',
    default: true,
  },
  'replicate-gpt-5-mini': {
    label: 'GPT-5 Mini',
    chef: providers.replicate,
    providers: [providers.replicate],
    replicateModel: 'openai/gpt-5-mini',
  },
  'replicate-claude-4-sonnet': {
    label: 'Claude 4 Sonnet',
    chef: providers.replicate,
    providers: [providers.replicate],
    replicateModel: 'anthropic/claude-4-sonnet',
  },
};
```

#### Action para Descrição de Imagem
**Arquivo:** `C:\ai\tersa\app\actions\image\describe.ts`
- Usa modelos de visão para analisar imagens
- Suporte a GPT e Claude para análise visual
- Processamento de URLs e conversão base64

### 5. Modelos de Vídeo

#### Configuração dos Modelos de Vídeo
**Arquivo:** `C:\ai\tersa\lib\models\video\replicate.ts`
- Modelos Kling via Replicate
- Suporte a diferentes versões (v1.5, v1.6, v2.0)
- Configurações de duração e aspect ratio

### 6. Provedores de API

#### Definições de Provedores
**Arquivo:** `C:\ai\tersa\lib\providers.ts`
- Configuração do provedor Replicate
- Ícones e metadados dos provedores
- Tipos e interfaces para modelos

## 📋 Mapeamento Completo de Arquivos

### Modelos de Texto
```
C:\ai\tersa\components\nodes\text\transform.tsx
├── AVAILABLE_MODELS (linhas 57-75)
├── getDefaultModel() 
├── handleGenerate() (streaming personalizado)
└── Configuração de input para Replicate

C:\ai\tersa\app\api\replicate-stream\route.ts
├── Endpoint POST para streaming
├── Processamento de system_prompt
├── Suporte a image_input
└── Streaming de resposta
```

### Modelos de Imagem
```
C:\ai\tersa\components\nodes\image\transform.tsx
├── AVAILABLE_MODELS (linhas 43-100+)
│   ├── black-forest-labs/flux-dev
│   ├── black-forest-labs/flux-krea-dev
│   └── black-forest-labs/flux-1.1-pro
├── Configuração de aspectRatios por modelo
└── Integração com model-schemas.ts

C:\ai\tersa\app\actions\image\replicate.ts
├── generateImageReplicateAction()
├── Processamento de parâmetros por modelo
├── Upload para Supabase
└── Atualização do projeto

C:\ai\tersa\lib\model-schemas.ts
├── MODEL_SCHEMAS por modelo
├── Campos dinâmicos (seed, guidance, etc.)
├── getModelSchema()
└── getModelDefaults()
```

### Modelos de Visão
```
C:\ai\tersa\lib\models\vision.ts
├── visionModels (GPT-5, Claude)
├── Configuração replicateModel
└── Provedores por modelo

C:\ai\tersa\app\actions\image\describe.ts
├── describeAction()
├── Processamento de imagem (base64)
├── Diferenciação GPT vs Claude
└── Chamada direta ao Replicate
```

### Modelos de Vídeo
```
C:\ai\tersa\lib\models\video\replicate.ts
├── Modelos Kling (v1.5 a v2.0)
├── Configuração de input
└── Processamento de output
```

## 📝 Notas para Agentes de IA

1. **Sempre verificar** os arquivos listados acima antes de fazer modificações
2. **Manter consistência** entre schemas, componentes e APIs
3. **Testar** tanto a interface quanto as chamadas de API após modificações
4. **Documentar** novas adições neste arquivo
5. **Verificar compatibilidade** entre modelos GPT e Claude (diferentes formatos de input)
6. **Considerar schemas dinâmicos** ao adicionar novos modelos de imagem

---

**Última atualização:** Documento criado para mapear a arquitetura atual de modelos e APIs.
**Responsável:** Documentação automática do sistema.