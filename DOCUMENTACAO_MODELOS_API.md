# Documentação - Modelos de IA e Sistema de Filtragem

## Visão Geral
Este documento mapeia onde são configurados os modelos de IA (texto, imagem e vídeo), schemas, sistema de filtragem dinâmica e chamadas de API no projeto Tersa.

## 🔄 Sistema de Filtragem Dinâmica (Implementado em 2025-01-21)

### Visão Geral do Sistema
Sistema que filtra dinamicamente os modelos disponíveis nos nós de imagem e vídeo baseado no tipo de conexão anterior na cadeia de processamento.

### Arquivos Principais

#### 1. Detector de Conexões
**Arquivo:** `C:\ai\tersa\lib\node-connection-detector.ts`
- **Função:** `detectPreviousNodeType()` - Detecta o tipo de nó conectado anteriormente
- **Tipos detectados:**
  - `none` - Nenhuma conexão
  - `text-primitive` - Nó de texto simples
  - `text-transform` - Nó de texto com IA
  - `image-primitive` - Nó de imagem simples
  - `image-transform` - Nó de imagem com IA
  - `video-primitive` - Nó de vídeo simples
  - `video-transform` - Nó de vídeo com IA

#### 2. Sistema de Filtragem
**Arquivo:** `C:\ai\tersa\lib\model-filtering.ts`
- **Modelos de Imagem:** Definição com `supportedInputs` (none, text, image, video)
- **Modelos de Vídeo:** Definição com `supportedInputs` (none, text, image, video)
- **Hook:** `useFilteredModels()` - Retorna modelos filtrados para um nó específico
- **Funções auxiliares:**
  - `filterImageModels()` - Filtra modelos de imagem
  - `filterVideoModels()` - Filtra modelos de vídeo
  - `getFirstAvailableModel()` - Obtém primeiro modelo disponível
  - `hasAvailableModels()` - Verifica se há modelos disponíveis

### Regras de Filtragem

#### Para Nós de Imagem:
- **Sem conexão:** Todos os modelos text-to-image
- **Conexão de texto:** Modelos que suportam text-to-image
- **Conexão de imagem:** Modelos que suportam image-to-image
- **Conexão de vídeo:** Modelos que suportam video-to-image

#### Para Nós de Vídeo:
- **Sem conexão:** Nenhum modelo (mensagem: "Conecte um nó de imagem")
- **Conexão de texto:** Nenhum modelo (mensagem: "Modelos text-to-video em breve")
- **Conexão de imagem:** Modelos que suportam image-to-video
- **Conexão de vídeo:** Nenhum modelo (mensagem: "Modelos video-to-video em breve")

### Integração nos Componentes

#### Nós de Imagem
**Arquivo:** `C:\ai\tersa\components\nodes\image\transform.tsx`
- Importa `useFilteredModels`, `getFirstAvailableModel`
- Usa modelos filtrados no `ModelSelector`
- Aplica modelo padrão baseado na filtragem

#### Nós de Vídeo
**Arquivo:** `C:\ai\tersa\components\nodes\video\transform.tsx`
- Importa sistema de filtragem completo
- Exibe mensagens contextuais quando não há modelos
- Usa modelos filtrados no `ModelSelector`

## 📝 Como Cadastrar Novos Modelos

### 1. Adicionando Modelos de Imagem

#### Passo 1: Definir o Modelo
**Arquivo:** `C:\ai\tersa\lib\model-filtering.ts`
```typescript
const IMAGE_MODELS = {
  'novo-modelo/versao': {
    label: 'Nome do Modelo',
    chef: providers.replicate,
    icon: IconeDoModelo,
    providers: [{
      ...providers.replicate,
      icon: IconeDoModelo,
    }],
    supportedInputs: ['none', 'text', 'image'], // Tipos de entrada suportados
    default: false, // Se é modelo padrão
  },
};
```

#### Passo 2: Configurar Schema (se necessário)
**Arquivo:** `C:\ai\tersa\lib\model-schemas.ts`
```typescript
export const getModelSchema = (modelId: string) => {
  switch (modelId) {
    case 'novo-modelo/versao':
      return {
        aspectRatio: { type: 'select', options: ['1:1', '16:9', '9:16'] },
        seed: { type: 'number', min: 0, max: 999999 },
        // outros parâmetros...
      };
  }
};
```

### 2. Adicionando Modelos de Vídeo

#### Passo 1: Definir o Modelo
**Arquivo:** `C:\ai\tersa\lib\model-filtering.ts`
```typescript
const VIDEO_MODELS = {
  'novo-video-modelo/versao': {
    label: 'Nome do Modelo de Vídeo',
    chef: providers.replicate,
    icon: IconeDoModelo,
    providers: [{
      ...providers.replicate,
      icon: IconeDoModelo,
    }],
    supportedInputs: ['image'], // Apenas image-to-video por enquanto
    default: false,
  },
};
```

### 3. Tipos de Entrada Suportados

- **`'none'`** - Modelo pode ser usado sem conexão anterior (text-to-image/video)
- **`'text'`** - Modelo aceita entrada de texto
- **`'image'`** - Modelo aceita entrada de imagem
- **`'video'`** - Modelo aceita entrada de vídeo

### 4. Configuração de Actions

#### Para Modelos de Imagem
**Arquivo:** `C:\ai\tersa\app\actions\image\replicate.ts`
- Adicionar lógica específica do modelo se necessário
- Configurar parâmetros específicos

#### Para Modelos de Vídeo
**Arquivo:** `C:\ai\tersa\app\actions\video\replicate.ts`
- Adicionar lógica específica do modelo se necessário
- Configurar parâmetros específicos

## 🧪 Como Testar o Sistema de Filtragem

### Cenários de Teste

#### 1. Teste de Nó de Imagem Isolado
- **Ação:** Criar um nó de imagem sem conexões
- **Resultado esperado:** Todos os modelos text-to-image disponíveis
- **Verificação:** Seletor deve mostrar modelos como FLUX.1 [dev], FLUX.1 [schnell]

#### 2. Teste de Conexão Texto → Imagem
- **Ação:** Conectar nó de texto a nó de imagem
- **Resultado esperado:** Modelos que suportam text-to-image
- **Verificação:** Filtragem baseada em `supportedInputs: ['text']`

#### 3. Teste de Conexão Imagem → Vídeo
- **Ação:** Conectar nó de imagem a nó de vídeo
- **Resultado esperado:** Modelos image-to-video (ex: WAN Video I2V)
- **Verificação:** Seletor deve mostrar apenas modelos compatíveis

#### 4. Teste de Nó de Vídeo Isolado
- **Ação:** Criar um nó de vídeo sem conexões
- **Resultado esperado:** Mensagem "Conecte um nó de imagem para gerar vídeos"
- **Verificação:** Nenhum modelo disponível, mensagem explicativa

### Comandos para Teste

```bash
# Subir a aplicação
wsl pnpm dev

# Aguardar compilação (até 2 minutos)
# Acessar: http://localhost:3000
```

### Debugging

#### Verificar Detecção de Conexões
```typescript
// No console do navegador
console.log('Tipo de conexão:', detectPreviousNodeType(nodeId, nodes, edges));
```

#### Verificar Modelos Filtrados
```typescript
// No console do navegador
console.log('Modelos filtrados:', useFilteredModels('image', nodeId));
```

## 📋 Checklist de Implementação

### ✅ Concluído (2025-01-21)
- [x] Sistema de detecção de conexões (`node-connection-detector.ts`)
- [x] Sistema de filtragem de modelos (`model-filtering.ts`)
- [x] Integração em nós de imagem (`image/transform.tsx`)
- [x] Integração em nós de vídeo (`video/transform.tsx`)
- [x] Mensagens contextuais para casos sem modelos
- [x] Testes básicos de funcionamento

### 🔄 Próximos Passos
- [ ] Adicionar mais modelos de imagem com diferentes `supportedInputs`
- [ ] Implementar modelos text-to-video
- [ ] Implementar modelos video-to-video
- [ ] Adicionar testes automatizados
- [ ] Otimizar performance da filtragem

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

## 📤 Processo de Upload no Supabase e Renderização nos Nós

### Visão Geral do Fluxo

Todos os providers (Replicate e FAL) seguem o mesmo padrão:
1. **Geração** → Provider externo gera a imagem
2. **Download** → Download da URL temporária do provider
3. **Upload** → Upload para Supabase Storage
4. **Renderização** → Exibição da URL permanente do Supabase

### Arquitetura do Sistema

```
Usuário → Nó Canvas → API Action → Provider (Replicate/FAL) → Download → Supabase Storage → Renderização
```

### 1. Actions de Imagem

#### Replicate Action (`app/actions/image/replicate.ts`)
```typescript
// 1. Geração via Replicate
const completedPrediction = await replicate.wait(prediction);
const imageUrls = completedPrediction.output;
const primaryImageUrl = imageUrls[0];

// 2. Download da imagem
const imageResponse = await fetch(primaryImageUrl);
const imageBuffer = await imageResponse.arrayBuffer();

// 3. Upload para Supabase
const fileName = `${nanoid()}.${extension}`;
const { data: supabaseUrl } = await supabase.storage
  .from('generated-images')
  .upload(fileName, imageBuffer);

// 4. Retorno da URL pública
return {
  output: supabaseUrl.publicUrl,
  urls: [supabaseUrl.publicUrl],
  metadata: {
    supabase_url: supabaseUrl.publicUrl,
    original_replicate_url: primaryImageUrl
  }
};
```

#### FAL Action (`app/actions/image/fal.ts`)
```typescript
// 1. Geração via FAL
const result = await fal.subscribe(falModel, { input });
const primaryImageUrl = result.data.images?.[0]?.url;

// 2. Download da imagem
const imageResponse = await fetch(primaryImageUrl);
const imageBuffer = await imageResponse.arrayBuffer();

// 3. Upload para Supabase
const fileName = `${nanoid()}.${extension}`;
const { data: supabaseUrl } = await supabase.storage
  .from('generated-images')
  .upload(fileName, imageBuffer);

// 4. Retorno da URL pública
return {
  output: supabaseUrl.publicUrl,
  urls: [supabaseUrl.publicUrl],
  metadata: {
    supabase_url: supabaseUrl.publicUrl,
    original_fal_url: primaryImageUrl
  }
};
```

### 2. Processamento nos Componentes

#### Estrutura de Resposta Esperada
```typescript
interface ImageResponse {
  success: boolean;
  data: {
    output: string; // URL pública do Supabase
    seed?: number;
    prompt: string;
    model: string;
    provider: 'replicate' | 'fal';
    metadata: {
      supabase_url: string;
      original_url?: string;
    };
  };
}
```

#### Transform Component (`components/nodes/image/transform.tsx`)
```typescript
// Para FAL (após correção)
if (falResult.success && falResult.data && falResult.data.output) {
  response = {
    nodeData: {
      url: falResult.data.output, // URL do Supabase
      width: 1024,
      height: 1024,
      contentType: 'image/jpeg',
      seed: falResult.data.seed,
      prompt: falResult.data.prompt,
      provider: 'fal',
      model: falResult.data.model
    }
  };
}
```

#### Hybrid Transform Component (`components/nodes/image/hybrid-transform.tsx`)
```typescript
// Para FAL (após correção)
if (falResult.success && falResult.data && falResult.data.output) {
  const newData = {
    ...existingNode.data,
    updatedAt: new Date().toISOString(),
    generated: {
      url: falResult.data.output, // URL do Supabase
      type: 'image/jpeg',
    },
    seed: falResult.data.seed,
    prompt: falResult.data.prompt,
    provider: 'fal',
    model: falResult.data.model
  };
}
```

### 3. Renderização no Canvas

#### Componente de Imagem
```typescript
<Image
  src={data.generated?.url} // URL pública do Supabase
  alt={data.generated?.prompt || 'Generated image'}
  width={data.generated?.width || 1024}
  height={data.generated?.height || 1024}
  className="rounded-lg"
/>
```

### 4. Configuração do Supabase Storage

#### Bucket: `generated-images`
- **Acesso público** para leitura
- **Upload restrito** para usuários autenticados
- **Estrutura**: `[nanoid].{jpg|png|webp}`

#### Políticas de Segurança
```sql
-- Leitura pública
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

-- Upload autenticado
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated-images' AND 
  auth.role() = 'authenticated'
);
```

### 5. Vantagens do Sistema

#### Persistência
- ✅ URLs não expiram
- ✅ Imagens sempre disponíveis
- ✅ Backup automático

#### Performance
- ✅ CDN do Supabase
- ✅ Cache automático
- ✅ Redução de dependência externa

#### Consistência
- ✅ Mesmo fluxo para todos providers
- ✅ URLs padronizadas
- ✅ Estrutura unificada

### 6. Troubleshooting

#### Problema: Imagem não renderiza
**Causa**: Estrutura de resposta incorreta
**Solução**: Verificar se está acessando `falResult.data.output`

#### Problema: URLs expiram
**Causa**: Usando URL direta do provider
**Solução**: Garantir upload para Supabase

#### Problema: Upload falha
**Causa**: Configuração/permissões incorretas
**Solução**: Verificar env vars e políticas do bucket

### 7. Monitoramento

Logs detalhados em cada etapa:
```typescript
logger.info('🔗 Fazendo download da imagem da FAL:', primaryImageUrl);
logger.info('📤 Fazendo upload para Supabase Storage');
logger.info('✅ Upload concluído:', supabaseUrl.publicUrl);
```

---

**Última atualização:** Janeiro 2025 - Adicionada documentação do processo de upload Supabase
**Responsável:** Documentação automática do sistema.