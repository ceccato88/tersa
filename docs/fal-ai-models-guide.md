# Guia do Sistema de Modelos Fal AI - Tersa

## Visão Geral

Este documento explica como o sistema Tersa gerencia e cadastra modelos da Fal AI, detalhando toda a arquitetura, desde a configuração dos schemas até a integração com a interface do usuário.

## Arquitetura do Sistema

O sistema de modelos Fal AI no Tersa é composto por várias camadas:

1. **Schemas de Modelos** (`lib/model-schemas.ts`) - Define configurações e parâmetros
2. **Filtragem de Modelos** (`lib/model-filtering.ts`) - Sistema de compatibilidade
3. **Provedores** (`lib/providers.ts`) - Definição do provedor Fal
4. **Ações** (`app/actions/image/fal.ts`) - Integração com API
5. **Componentes** - Interface do usuário nos nós

## 1. Estruturas de Dados Principais

### ModelField
```typescript
interface ModelField {
  name: string;
  type: 'input' | 'select' | 'checkbox' | 'number' | 'hidden';
  label: string;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  gridColumn?: 1 | 2; // Para layout em grid
}
```

### ModelSchema
```typescript
interface ModelSchema {
  label: string;
  fields: ModelField[];
  aspectRatios: Array<{ label: string; value: string }>;
}
```

## 2. Cadastro de Modelos no MODEL_SCHEMAS

### Local: `lib/model-schemas.ts`

Os modelos Fal AI são cadastrados no objeto `MODEL_SCHEMAS` com a chave sendo o ID do modelo:

```typescript
export const MODEL_SCHEMAS: Record<string, ModelSchema> = {
  'fal-ai/flux-dev': {
    label: 'FLUX Dev',
    aspectRatios: [
      { label: 'Square 1:1', value: 'square' },
      { label: 'Square 1:1 HD', value: 'square_hd' },
      { label: '4:3', value: 'landscape_4_3' },
      // ... mais aspect ratios
    ],
    fields: [
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      // ... mais campos
    ]
  }
}
```

### Tipos de Campos Suportados:

- **`input`**: Campo de texto livre
- **`select`**: Lista dropdown com opções predefinidas
- **`checkbox`**: Campo booleano
- **`number`**: Campo numérico com min/max/step opcionais
- **`hidden`**: Campo não visível na UI, apenas no código

### Campos Especiais para Modelos Fal:

- **Campos Visíveis**: Aparece na interface principal do nó
- **Campos do Popup**: Aparecem no popup de parâmetros avançados
- **Campos Hidden**: Enviados para a API mas não mostrados na UI

## 3. Sistema de Filtragem (`lib/model-filtering.ts`)

### Definição de Modelos Disponíveis

```typescript
const IMAGE_MODELS = {
  'fal-ai/flux-dev': {
    id: 'fal-ai/flux-dev',
    label: 'FLUX.1 [dev]',
    provider: 'fal',
    supportedInputs: ['none', 'text-primitive', 'text-transform']
  },
  'fal-ai/flux-schnell': {
    id: 'fal-ai/flux-schnell',
    label: 'FLUX Schnell',
    provider: 'fal',
    supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
  }
};
```

### Tipos de Input Suportados:

- **`none`**: Modelo pode ser usado sem entrada
- **`text-primitive`**: Aceita texto de nós de texto simples
- **`text-transform`**: Aceita texto processado
- **`image-primitive`**: Aceita imagens de nós de imagem
- **`image-transform`**: Aceita imagens processadas

### Função de Filtragem:

```typescript
export const filterImageModels = (
  connectionType: NodeConnectionType,
  availableModels: Record<string, any>
): Record<string, any> => {
  const filteredModels: Record<string, any> = {};
  
  Object.entries(availableModels).forEach(([modelId, modelConfig]) => {
    const modelInfo = IMAGE_MODELS[modelId as keyof typeof IMAGE_MODELS];
    
    if (modelInfo && modelInfo.supportedInputs.includes(connectionType)) {
      filteredModels[modelId] = {
        ...modelConfig,
        provider: modelInfo.provider,
        label: modelInfo.label
      };
    }
  });
  
  return filteredModels;
};
```

## 4. Valores Padrão (`getModelDefaults`)

A função `getModelDefaults` adiciona valores padrão específicos para cada modelo:

```typescript
// Adicionar valores padrão para o modelo fal-ai/flux-dev
if (modelId === 'fal-ai/flux-dev') {
  defaults.image_size = 'landscape_4_3';
}
```

## 5. Configuração nos Componentes

### Local: `components/nodes/image/hybrid-transform.tsx`

```typescript
const AVAILABLE_MODELS = {
  'fal-ai/flux-dev': {
    label: 'FLUX.1 [dev]',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square 1:1', value: 'square' },
      // ... aspect ratios específicos para o componente
    ],
    default: true, // Modelo padrão
  },
};
```

### Aplicação da Filtragem:

```typescript
const filteredModels = useFilteredModels(
  currentNode || null, 
  allNodes, 
  allEdges, 
  'image', 
  AVAILABLE_MODELS
);
```

## 6. Integração com API Fal (`app/actions/image/fal.ts`)

### Mapeamento de Modelos:

```typescript
const FAL_MODEL_MAP: Record<string, string> = {
  'fal-ai/flux-dev': 'fal-ai/flux/dev',
  'fal-ai/flux-schnell': 'fal-ai/flux/schnell',
};
```

### Mapeamento de Aspect Ratios:

```typescript
const ASPECT_RATIO_MAP: Record<string, string> = {
  'square_hd': 'square_hd',
  'square': 'square',
  'portrait_4_3': 'portrait_4_3',
  'portrait_16_9': 'portrait_16_9',
  'landscape_4_3': 'landscape_4_3',
  'landscape_16_9': 'landscape_16_9',
  // Fallbacks para compatibilidade
  '1:1': 'square_hd',
  '4:3': 'landscape_4_3',
  // ...
};
```

### Preparação dos Parâmetros:

```typescript
const input: any = {
  prompt,
  image_size: imageSize,
  num_inference_steps: data.num_inference_steps || data.numInferenceSteps || 28,
  seed: data.seed ? parseInt(data.seed.toString()) : null,
  guidance_scale: data.guidance_scale || data.guidance || 3.5,
  sync_mode: data.sync_mode !== undefined ? data.sync_mode : false,
  num_images: data.num_images || data.numOutputs || 1,
  enable_safety_checker: data.enable_safety_checker !== undefined ? data.enable_safety_checker : true,
  output_format: data.output_format || data.outputFormat || 'jpeg',
  acceleration: data.acceleration || 'none',
}
```

## 7. Passo-a-Passo: Como Adicionar um Novo Modelo Fal AI

### Passo 1: Adicionar no MODEL_SCHEMAS

```typescript
// Em lib/model-schemas.ts
'fal-ai/novo-modelo': {
  label: 'Novo Modelo FAL',
  aspectRatios: [
    { label: '1:1 (1024x1024)', value: '1:1' },
    // ... definir aspect ratios suportados
  ],
  fields: [
    {
      name: 'seed',
      type: 'input',
      label: 'Seed',
      placeholder: 'Deixe vazio para aleatório',
      defaultValue: '',
      gridColumn: 1
    },
    // ... definir campos específicos do modelo
  ]
}
```

### Passo 2: Adicionar no Sistema de Filtragem

```typescript
// Em lib/model-filtering.ts
const IMAGE_MODELS = {
  // ... modelos existentes
  'fal-ai/novo-modelo': {
    id: 'fal-ai/novo-modelo',
    label: 'Novo Modelo FAL',
    provider: 'fal',
    supportedInputs: ['none', 'text-primitive', 'text-transform']
  }
};
```

### Passo 3: Configurar Valores Padrão

```typescript
// Em lib/model-schemas.ts na função getModelDefaults
if (modelId === 'fal-ai/novo-modelo') {
  defaults.parametro_especifico = 'valor_padrao';
  defaults.image_size = 'square';
}
```

### Passo 4: Adicionar Mapeamento na API

```typescript
// Em app/actions/image/fal.ts
const FAL_MODEL_MAP: Record<string, string> = {
  // ... mapeamentos existentes
  'fal-ai/novo-modelo': 'fal-ai/caminho/real/do/modelo',
};
```

### Passo 5: Configurar no Componente

```typescript
// Em components/nodes/image/hybrid-transform.tsx (ou outro componente)
const AVAILABLE_MODELS = {
  // ... modelos existentes
  'fal-ai/novo-modelo': {
    label: 'Novo Modelo FAL',
    chef: providers.fal,
    providers: [providers.fal],
    aspectRatios: [
      { label: 'Square 1:1', value: 'square' },
      // ... aspect ratios para o componente
    ],
    default: false,
  },
};
```

## 8. Exemplo Prático: Modelo FLUX Schnell

### Configuração Completa:

```typescript
// 1. MODEL_SCHEMAS
'fal-ai/flux-schnell': {
  label: 'FLUX Schnell',
  aspectRatios: [
    { label: '1:1 (1024x1024)', value: '1:1' },
    { label: '4:3 (1024x768)', value: '4:3' },
    { label: '3:4 (768x1024)', value: '3:4' },
    { label: '16:9 (1216x832)', value: '16:9' },
    { label: '9:16 (832x1216)', value: '9:16' },
  ],
  fields: [
    {
      name: 'seed',
      type: 'input',
      label: 'Seed',
      placeholder: 'Deixe vazio para aleatório',
      defaultValue: '',
      gridColumn: 1
    },
    {
      name: 'numOutputs',
      type: 'number',
      label: 'Quantidade',
      defaultValue: 1,
      gridColumn: 2
    },
    {
      name: 'numInferenceSteps',
      type: 'input',
      label: 'Inference Steps',
      placeholder: '4',
      defaultValue: 4,
      gridColumn: 1
    }
  ]
}

// 2. Model Filtering
'fal-ai/flux-schnell': {
  id: 'fal-ai/flux-schnell',
  label: 'FLUX Schnell',
  provider: 'fal',
  supportedInputs: ['none', 'text-primitive', 'text-transform', 'image-primitive', 'image-transform']
}

// 3. API Mapping
'fal-ai/flux-schnell': 'fal-ai/flux/schnell'

// 4. Component Configuration
'fal-ai/flux-schnell': {
  label: 'FLUX Schnell',
  chef: providers.fal,
  providers: [providers.fal],
  aspectRatios: [
    { label: 'Square 1:1', value: 'square' },
    { label: 'Square 1:1 HD', value: 'square_hd' },
    { label: '4:3', value: 'landscape_4_3' },
    { label: '3:4', value: 'portrait_4_3' },
    { label: '16:9', value: 'landscape_16_9' },
    { label: '9:16', value: 'portrait_16_9' },
  ],
  default: false,
}
```

## 9. Considerações Importantes

### Nomenclatura:
- **ID do modelo**: Use o formato `fal-ai/nome-do-modelo`
- **Label**: Nome amigável para exibição na UI
- **Campos**: Use nomes consistentes com a API Fal

### Aspect Ratios:
- **Valores no Schema**: Use valores legíveis (`'1:1'`, `'4:3'`)
- **Valores no Componente**: Use códigos Fal (`'square'`, `'landscape_4_3'`)
- **Mapeamento**: É feito automaticamente na função de API

### Campos Hidden:
- Use para parâmetros que não devem aparecer na UI
- Importante para parâmetros técnicos como `sync_mode`, `acceleration`

### Compatibilidade:
- Defina corretamente os `supportedInputs` no sistema de filtragem
- Teste com diferentes tipos de entrada (texto, imagem)

## 10. Debugging e Troubleshooting

### Logs Importantes:
- A função `generateImageFalAction` logga todos os parâmetros
- Verifique os logs no console para debug de parâmetros

### Problemas Comuns:
1. **Modelo não aparece**: Verifique se está em todos os 4 locais
2. **Parâmetros incorretos**: Confira mapeamento na API
3. **Aspect ratios**: Verifique mapeamento no `ASPECT_RATIO_MAP`

### Validação:
- Teste o modelo com diferentes configurações
- Verifique se os valores padrão estão corretos
- Confirme que o modelo funciona com as entradas suportadas

---

Este guia cobre toda a arquitetura do sistema de modelos Fal AI no Tersa. Para qualquer dúvida ou adição de novos modelos, siga os passos documentados e verifique a consistência em todos os pontos de configuração.