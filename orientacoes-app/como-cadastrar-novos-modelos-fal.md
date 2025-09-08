# Como Cadastrar Novos Modelos FAL no Sistema Tersa

## Visão Geral

Este guia explica o processo completo para registrar novos modelos da FAL AI no sistema Tersa. O processo envolve 4 etapas principais em arquivos específicos.

## Arquitetura do Sistema

O sistema de modelos FAL no Tersa é composto por 4 camadas obrigatórias:

1. **MODEL_SCHEMAS** (`lib/model-schemas.ts`) - Define campos e valores padrão
2. **Model Filtering** (`lib/model-filtering.ts`) - Sistema de compatibilidade de entrada
3. **API Integration** (`app/actions/image/fal.ts`) - Integração com API FAL
4. **Component Configuration** (`components/nodes/image/hybrid-transform.tsx`) - Interface do usuário

## Processo Step-by-Step

### Passo 1: Adicionar no MODEL_SCHEMAS

**Arquivo:** `lib/model-schemas.ts`

Adicione a configuração do modelo no objeto `MODEL_SCHEMAS`:

```typescript
'fal-ai/novo-modelo': {
  label: 'Nome do Modelo',
  aspectRatios: [
    // Para modelos que usam aspect_ratio (formato 1:1, 16:9, etc.)
    { label: '1:1', value: '1:1' },
    { label: '16:9', value: '16:9' },
    // OU para modelos que usam image_size (formato FAL padrão)
    { label: 'Square HD', value: 'square_hd' },
    { label: 'Landscape 4:3', value: 'landscape_4_3' },
    // OU para modelos com tamanho fixo
    { label: 'Tamanho único', value: 'fixed' },
  ],
  fields: [
    // Campo de tamanho (SEMPRE INCLUA UM DESTES)
    {
      name: 'aspect_ratio', // Para modelos Imagen, Luma Photon
      // OU
      name: 'image_size',   // Para modelos FLUX, Ideogram
      // OU
      name: 'fixed_size',   // Para modelos de tamanho fixo
      type: 'select',
      label: 'Tamanho',
      options: [...],
      defaultValue: 'valor_padrao',
      gridColumn: 2
    },
    // Campos opcionais da aba avançada
    {
      name: 'seed',
      type: 'number',
      label: 'Seed',
      placeholder: 'Deixe vazio para aleatório',
      defaultValue: null,
      gridColumn: 1
    },
    // Adicione outros campos específicos do modelo
  ]
}
```

**Adicione também os valores padrão na função `getModelDefaults`:**

```typescript
// Adicionar valores padrão para o modelo fal-ai/novo-modelo
if (modelId === 'fal-ai/novo-modelo') {
  defaults.aspect_ratio = '1:1';        // Para modelos aspect_ratio
  // OU
  defaults.image_size = 'square_hd';    // Para modelos image_size
  // OU
  defaults.fixed_size = 'fixed';        // Para modelos tamanho fixo
}
```

### Passo 2: Configurar Model Filtering

**Arquivo:** `lib/model-filtering.ts`

Adicione o modelo no objeto `IMAGE_MODELS`:

```typescript
'fal-ai/novo-modelo': {
  id: 'fal-ai/novo-modelo',
  label: 'Nome do Modelo',
  provider: 'fal',
  supportedInputs: ['text-primitive', 'text-transform'] // Apenas texto (padrão)
  // OU para modelos que aceitam imagem também:
  // supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
}
```

### Passo 3: Configurar API Integration

**Arquivo:** `app/actions/image/fal.ts`

#### 3.1 Adicionar no mapeamento de modelos:

```typescript
const FAL_MODEL_MAP: Record<string, string> = {
  // ... modelos existentes
  'fal-ai/novo-modelo': 'fal-ai/caminho/real/do/modelo',
};
```

#### 3.2 Configurar parâmetros específicos:

**Para modelos que usam apenas prompt e aspect_ratio (como Luma Photon):**
```typescript
// Adicionar na condição de exclusão de parâmetros globais
if (data.model !== 'fal-ai/luma-photon' && data.model !== 'fal-ai/novo-modelo') {
  input.seed = data.seed ? parseInt(data.seed.toString()) : null;
  input.guidance_scale = data.guidance_scale || data.guidance || 3.5;
  input.output_format = data.output_format || data.outputFormat || 'jpeg';
}

// E adicionar lógica específica
} else if (data.model === 'fal-ai/novo-modelo') {
  // Modelo usa apenas aspect_ratio
  input.aspect_ratio = data.aspect_ratio || '1:1';
}
```

**Para modelos que usam parâmetros padrão + específicos:**
```typescript
} else if (data.model === 'fal-ai/novo-modelo') {
  // Modelo usa image_size e parâmetros específicos
  const imageSize = ASPECT_RATIO_MAP[data.aspectRatio || data.image_size || 'square_hd'] || 'square_hd';
  input.image_size = imageSize;
  input.parametro_especifico = data.parametro_especifico || 'valor_padrao';
}
```

**Para modelos FLUX padrão:**
Os modelos FLUX padrão não precisam de lógica especial, apenas do mapeamento.

### Passo 4: Configurar Component

**Arquivo:** `components/nodes/image/hybrid-transform.tsx`

#### 4.1 Adicionar no AVAILABLE_MODELS:

```typescript
'fal-ai/novo-modelo': {
  label: 'Nome do Modelo',
  chef: providers.fal,
  providers: [providers.fal],
  aspectRatios: [
    // Mesmas opções do MODEL_SCHEMAS, mas usando os valores FAL
    { label: '1:1', value: '1:1' },            // Para aspect_ratio
    // OU
    { label: 'Square HD', value: 'square_hd' }, // Para image_size
    // OU
    { label: 'Tamanho único', value: 'fixed' }, // Para fixed_size
  ],
  default: false, // true apenas se for modelo padrão
},
```

#### 4.2 Atualizar lógicas condicionais:

**Para modelos que usam aspect_ratio, adicione nas condições existentes:**

```typescript
// Cálculo do aspect ratio
} else if (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/novo-modelo') {

// Seletor de tamanho
: (modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/novo-modelo')

// Analytics e request body (usar replace_all para todas as ocorrências)
(modelId === 'fal-ai/flux-pro-kontext' || modelId === 'fal-ai/flux-pro-kontext-max' || modelId === 'fal-ai/flux-pro-v1.1-ultra' || modelId === 'fal-ai/imagen4' || modelId === 'fal-ai/imagen4-ultra' || modelId === 'fal-ai/novo-modelo')
```

## Modelos Image-to-Image - Considerações Especiais

### Características dos Modelos Image-to-Image

Modelos que aceitam imagens como entrada (ex: Nano Banana Edit) têm requisitos especiais:

1. **Model Filtering:**
   ```typescript
   supportedInputs: ['image-primitive', 'image-transform'] // APENAS imagem
   ```

2. **Tratamento de URLs:**
   - Sistema passa objetos `{url: string, type: string}`
   - API espera array de strings
   - **Solução:** Extrair propriedade `url`:
   ```typescript
   input.image_urls = imageNodes.map((node: any) => 
     typeof node === 'string' ? node : node.url
   );
   ```

3. **Parâmetros da API:**
   - Muitos modelos image-to-image são minimalistas
   - **Excluir parâmetros globais** quando necessário:
   ```typescript
   if (data.model !== 'fal-ai/nano-banana/edit') {
     input.seed = data.seed;
     input.guidance_scale = data.guidance_scale;
     // etc...
   }
   ```

4. **Logs Seguros:**
   ```typescript
   logger.info('🖼️ Usando imagem de referência', {
     imageUrl: typeof imageNodes[0] === 'string' 
       ? imageNodes[0].substring(0, 100) + '...' 
       : 'URL object',
     imageCount: imageNodes.length,
     model: data.model,
   });
   ```

### Fluxo de Trabalho Image-to-Image

1. Usuário conecta **nó de imagem** → **nó de transformação**
2. Sistema detecta conexão `image-primitive` ou `image-transform`  
3. Model filtering mostra apenas modelos compatíveis
4. API recebe `imageNodes` como objetos `{url, type}`
5. Sistema extrai URLs e envia para FAL como `image_urls: string[]`

### Sistema de Validação de Conexões (Limite de Imagens)

O sistema possui validação automática que impede conexões inválidas e gerencia limites de imagem:

#### **Configuração do Limite de Imagens**

No arquivo `lib/model-filtering.ts`, cada modelo image-to-image deve especificar `maxImages`:

```typescript
'fal-ai/flux-pro-kontext': {
  id: 'fal-ai/flux-pro-kontext',
  label: 'FLUX.1 Kontext [pro]',
  provider: 'fal',
  supportedInputs: ['image-primitive', 'image-transform'],
  maxImages: 1 // Aceita apenas uma imagem
},
'fal-ai/nano-banana/edit': {
  id: 'fal-ai/nano-banana/edit',
  label: 'Nano Banana Edit', 
  provider: 'fal',
  supportedInputs: ['image-primitive', 'image-transform'],
  maxImages: Infinity // Aceita múltiplas imagens
}
```

#### **Validação Automática de Conexões**

1. **Prevenção de Conexão:** Sistema bloqueia automaticamente tentativas de conectar mais imagens que o permitido
2. **Feedback Visual:** Cursor mostra "não permitido" quando limite é atingido
3. **Desconexão Automática:** Quando usuário muda modelo, conexões excedentes são removidas automaticamente

#### **Fluxo de Validação**

```typescript
// Canvas.tsx - Validação em tempo real
const isValidConnection = () => {
  const maxImages = getModelMaxImages(targetModel, 'image');
  const existingConnections = edges.filter(/* contar conexões */);
  
  if (existingConnections >= maxImages) {
    return false; // Bloqueia conexão
  }
}

// HybridTransform.tsx - Desconexão ao mudar modelo
onChange={(value) => {
  const maxImages = getModelMaxImages(value, 'image');
  if (imageConnections.length > maxImages) {
    // Remove conexões excedentes automaticamente
    const connectionsToRemove = imageConnections.slice(maxImages);
    setEdges(updatedEdges);
  }
}}
```

#### **Comportamentos por Tipo de Modelo**

| Modelo | maxImages | Comportamento |
|--------|-----------|---------------|
| FLUX.1 Kontext [pro] | `1` | Aceita apenas 1 imagem, bloqueia demais |
| Nano Banana Edit | `Infinity` | Aceita quantas imagens o usuário conectar |
| Modelos Text-only | `undefined` | Não validado (não aceita imagens) |

## Tipos de Modelos e Configurações

### Tipo 1: Modelos FLUX Padrão
- **Exemplos:** FLUX Dev, FLUX Schnell, FLUX Krea
- **Parâmetros:** `image_size`, `seed`, `guidance_scale`, `output_format`, `num_inference_steps`
- **Configuração:** Padrão, sem lógica especial na API

### Tipo 2: Modelos com Aspect Ratio
- **Exemplos:** Imagen 4, Luma Photon, FLUX Kontext
- **Parâmetros:** `aspect_ratio` + parâmetros específicos
- **Configuração:** Requer atualização das condições no componente

### Tipo 3: Modelos com Image Size Customizado
- **Exemplos:** Wan 2.2, Ideogram 3.0, Seedream 3.0
- **Parâmetros:** `image_size` + parâmetros específicos do modelo
- **Configuração:** Lógica específica na API para parâmetros únicos

### Tipo 4: Modelos Minimalistas
- **Exemplos:** Luma Photon, Recraft V3
- **Parâmetros:** Apenas `prompt` + 1-2 parâmetros específicos
- **Configuração:** Exclusão de parâmetros globais na API

### Tipo 5: Modelos com Tamanho Fixo
- **Exemplos:** Nano Banana
- **Parâmetros:** Apenas `prompt` (sem parâmetros de tamanho)
- **Configuração:** `fixed_size` no UI, mas não enviado para API

### Tipo 6: Modelos Image-to-Image
- **Exemplos:** Nano Banana Edit, FLUX.1 Kontext [pro]
- **Entrada:** Aceita apenas imagens (`supportedInputs: ['image-primitive', 'image-transform']`)
- **Parâmetros:** `prompt`, `image_urls` (plural) ou `image_url` (singular), parâmetros específicos
- **Configuração:** Requer tratamento especial para URLs de entrada e validação de limite de imagens
- **Limite de Imagens:** `maxImages` define quantas imagens o modelo aceita (1, Infinity, etc.)

## Checklist de Verificação

### ✅ Antes de Finalizar, Verifique:

1. **MODEL_SCHEMAS:**
   - [ ] Modelo adicionado no objeto `MODEL_SCHEMAS`
   - [ ] Valores padrão configurados em `getModelDefaults`
   - [ ] Campos têm `gridColumn` definido (1 ou 2)
   - [ ] `defaultValue` definido para todos os campos

2. **Model Filtering:**
   - [ ] Modelo adicionado em `IMAGE_MODELS`
   - [ ] `supportedInputs` correto (text-only ou image-only)
   - [ ] `provider: 'fal'` definido
   - [ ] `maxImages` definido para modelos image-to-image (1, Infinity, etc.)

3. **API Integration:**
   - [ ] Mapeamento no `FAL_MODEL_MAP`
   - [ ] Lógica específica se necessário
   - [ ] Parâmetros globais excluídos se necessário
   - [ ] Testes com diferentes prompts

4. **Component:**
   - [ ] Modelo em `AVAILABLE_MODELS`
   - [ ] `aspectRatios` corretos
   - [ ] Condições atualizadas se usa `aspect_ratio`
   - [ ] Testes de UI funcionando

5. **Funcionamento:**
   - [ ] Modelo aparece apenas com entrada correta (texto ou imagem)
   - [ ] Valores padrão são aplicados
   - [ ] Parâmetros corretos enviados para API
   - [ ] Geração de imagem funcionando
   - [ ] Validação de conexões funcionando (se image-to-image)
   - [ ] Desconexão automática ao mudar modelo (se aplicável)

## Exemplos Práticos

### Modelo Simples (tipo FLUX):
```typescript
// MODEL_SCHEMAS
'fal-ai/modelo-simples': {
  label: 'Modelo Simples',
  aspectRatios: [...aspectRatios_padrao_fal],
  fields: [campo_image_size, campo_seed]
}

// Model Filtering
supportedInputs: ['text-primitive', 'text-transform']

// API - apenas mapeamento necessário

// Component - configuração padrão
```

### Modelo com Aspect Ratio:
```typescript
// Requer atualização de TODAS as condições aspect_ratio no componente
// + lógica específica na API se tiver parâmetros únicos
```

### Modelo Image-to-Image Multi-Imagem (Nano Banana Edit):
```typescript
// MODEL_SCHEMAS
'fal-ai/nano-banana/edit': {
  label: 'Nano Banana Edit',
  aspectRatios: [{ label: 'Tamanho original', value: 'fixed' }],
  fields: [
    {
      name: 'fixed_size',
      type: 'select',
      label: 'Tamanho',
      options: [{ value: 'fixed', label: 'Tamanho original' }],
      defaultValue: 'fixed',
      gridColumn: 2
    },
    {
      name: 'output_format',
      type: 'select', 
      label: 'Output Format',
      options: [
        { value: 'jpeg', label: 'JPEG' },
        { value: 'png', label: 'PNG' }
      ],
      defaultValue: 'jpeg',
      gridColumn: 1
    }
  ]
}

// Model Filtering - IMPORTANTE: entrada de imagem + limite
supportedInputs: ['image-primitive', 'image-transform']
maxImages: Infinity // Aceita múltiplas imagens

// API - parâmetros globais excluídos + tratamento de image_urls
if (data.model !== 'fal-ai/nano-banana/edit') {
  // parâmetros globais
}

// Lógica específica
} else if (data.model === 'fal-ai/nano-banana/edit') {
  input.output_format = data.output_format || 'jpeg';
}

// Tratamento de image_urls (plural)
if (data.model === 'fal-ai/nano-banana/edit') {
  input.image_urls = imageNodes.map((node: any) => 
    typeof node === 'string' ? node : node.url
  );
}

// Component - mesmo tratamento que Nano Banana para UI
```

### Modelo Image-to-Image Single-Imagem (FLUX.1 Kontext [pro]):
```typescript
// MODEL_SCHEMAS - convertido de text-only para image-to-image
'fal-ai/flux-pro-kontext': {
  label: 'FLUX.1 Kontext [pro]',
  aspectRatios: [{ label: 'Tamanho original', value: 'fixed' }],
  fields: [
    {
      name: 'fixed_size',
      type: 'select',
      label: 'Tamanho',
      options: [{ value: 'fixed', label: 'Tamanho original' }],
      defaultValue: 'fixed',
      gridColumn: 2
    },
    // Campos opcionais: seed, guidance_scale, output_format
  ]
}

// Model Filtering - IMPORTANTE: entrada de imagem + limite de 1
supportedInputs: ['image-primitive', 'image-transform']
maxImages: 1 // Aceita apenas uma imagem

// API - endpoint atualizado + lógica específica
'fal-ai/flux-pro-kontext': 'fal-ai/flux-pro/kontext' // removido /text-to-image

// Lógica específica
} else if (data.model === 'fal-ai/flux-pro-kontext') {
  // Não precisa de parâmetros de tamanho
}

// Tratamento de image_url (singular) sem strength
if (data.model !== 'fal-ai/flux-pro-kontext') {
  input.strength = data.strength || 0.8;
}

// Component - todas condições atualizadas para incluir flux-pro-kontext
// com fixed_size em vez de aspect_ratio
```

## Debugging

### Problemas Comuns:
1. **Modelo não aparece:** Verifique model filtering
2. **Parâmetros incorretos:** Verifique API mapping e lógica específica
3. **Aspect ratio não funciona:** Verifique todas as condições no componente
4. **Erro de validação:** Verifique se parâmetros extras estão sendo enviados
5. **Modelo image-to-image não aparece:** Verifique se `supportedInputs` tem apenas `image-primitive` e `image-transform`
6. **Erro "substring is not a function":** URLs de imagem estão como objetos, verificar extração da propriedade `url`
7. **API rejeita image_urls:** Verificar se está sendo enviado array de strings e não objetos
8. **Não consegue conectar segunda imagem:** Verificar se modelo tem `maxImages: Infinity` ou valor maior que 1
9. **Conexões não são removidas ao mudar modelo:** Verificar se `setEdges` está sendo importado corretamente no component
10. **Validação não funciona:** Verificar se `getModelMaxImages` está importado no Canvas.tsx
11. **Modelo aceita mais imagens que deveria:** Verificar se `maxImages` está definido no model-filtering.ts

### Logs Úteis:
- Console do navegador para erros de UI
- Logs da API FAL no servidor
- Network tab para ver requisições enviadas

## Conclusão

Seguindo este processo em ordem, qualquer novo modelo FAL pode ser integrado no sistema Tersa. A chave é manter consistência entre todas as 4 camadas e testar cada etapa antes de prosseguir para a próxima.