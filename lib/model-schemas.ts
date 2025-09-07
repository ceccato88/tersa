// Configuração de esquemas dinâmicos por modelo de IA

export interface ModelField {
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

export interface ModelSchema {
  label: string;
  fields: ModelField[];
  aspectRatios: Array<{ label: string; value: string }>;
}

export const MODEL_SCHEMAS: Record<string, ModelSchema> = {
  'wan-video/wan-2.2-i2v-a14b': {
    label: 'WAN Video I2V',
    aspectRatios: [
      { label: '480p (832x480)', value: '480p' },
      { label: '720p (1280x720)', value: '720p' }
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
        name: 'resolution',
        type: 'select',
        label: 'Resolução',
        options: [
          { value: '480p', label: '480p' },
          { value: '720p', label: '720p' }
        ],
        defaultValue: '480p',
        gridColumn: 1
      },
      {
        name: 'frames_per_second',
        type: 'select',
        label: 'FPS',
        options: [
          { value: 5, label: '5 FPS' },
          { value: 8, label: '8 FPS' },
          { value: 12, label: '12 FPS' },
          { value: 16, label: '16 FPS' },
          { value: 20, label: '20 FPS' },
          { value: 24, label: '24 FPS' }
        ],
        defaultValue: 16,
        gridColumn: 2
      }
    ]
  },
  'black-forest-labs/flux-dev': {
    label: 'FLUX Dev',
    aspectRatios: [
      { label: '1:1 (1024x1024)', value: '1:1' },
      { label: '9:16 (832x1216)', value: '9:16' },
      { label: '16:9 (1216x832)', value: '16:9' },
      { label: '4:5 (896x1152)', value: '4:5' },
      { label: '5:4 (1152x896)', value: '5:4' },
      { label: '3:4 (768x1024)', value: '3:4' },
      { label: '4:3 (1024x768)', value: '4:3' },
      { label: '2:3 (832x1216)', value: '2:3' },
      { label: '3:2 (1216x832)', value: '3:2' },
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
        name: 'guidance',
        type: 'input',
        label: 'Guidance',
        placeholder: '4.5',
        defaultValue: 3.5,
        gridColumn: 1
      },
      {
        name: 'promptStrength',
        type: 'input',
        label: 'Prompt Strength',
        placeholder: '0.8',
        defaultValue: 0.8,
        gridColumn: 2
      },
      {
        name: 'numInferenceSteps',
        type: 'input',
        label: 'Inference Steps',
        placeholder: '28',
        defaultValue: 28,
        gridColumn: 1
      }
    ]
  },
  'black-forest-labs/flux-krea-dev': {
    label: 'FLUX Krea Dev',
    aspectRatios: [
      { label: '1:1 (1024x1024)', value: '1:1' },
      { label: '9:16 (832x1216)', value: '9:16' },
      { label: '16:9 (1216x832)', value: '16:9' },
      { label: '4:5 (896x1152)', value: '4:5' },
      { label: '5:4 (1152x896)', value: '5:4' },
      { label: '3:4 (768x1024)', value: '3:4' },
      { label: '4:3 (1024x768)', value: '4:3' },
      { label: '2:3 (832x1216)', value: '2:3' },
      { label: '3:2 (1216x832)', value: '3:2' },
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
        name: 'guidance',
        type: 'input',
        label: 'Guidance',
        placeholder: '3.5',
        defaultValue: 3.5,
        gridColumn: 1
      },
      {
        name: 'promptStrength',
        type: 'input',
        label: 'Prompt Strength',
        placeholder: '0.8',
        defaultValue: 0.8,
        gridColumn: 2
      },
      {
        name: 'numInferenceSteps',
        type: 'input',
        label: 'Inference Steps',
        placeholder: '28',
        defaultValue: 28,
        gridColumn: 1
      }
    ]
  },
  'black-forest-labs/flux-1.1-pro': {
    label: 'FLUX 1.1 Pro',
    aspectRatios: [
      { label: '1:1 (1024x1024)', value: '1:1' },
      { label: '16:9 (1216x832)', value: '16:9' },
      { label: '3:2 (1216x832)', value: '3:2' },
      { label: '2:3 (832x1216)', value: '2:3' },
      { label: '4:5 (896x1152)', value: '4:5' },
      { label: '5:4 (1152x896)', value: '5:4' },
      { label: '9:16 (832x1216)', value: '9:16' },
      { label: '3:4 (768x1024)', value: '3:4' },
      { label: '4:3 (1024x768)', value: '4:3' },
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
      }
    ]
  },
  // Modelos FAL
  'fal-ai/flux-pro-kontext': {
    label: 'FLUX.1 Kontext [pro]',
    aspectRatios: [
      { label: 'Tamanho original', value: 'fixed' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale (1-20)',
        placeholder: '3.5',
        defaultValue: 3.5,
        min: 1,
        max: 20,
        step: 0.1,
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncronno',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'safety_tolerance',
        type: 'select',
        label: 'Tolerância de Segurança (1-6)',
        options: [
          { value: '1', label: '1 - Mais Restritivo' },
          { value: '2', label: '2 - Restritivo' },
          { value: '3', label: '3 - Moderado' },
          { value: '4', label: '4 - Permissivo' },
          { value: '5', label: '5 - Mais Permissivo' },
          { value: '6', label: '6 - Máximo' }
        ],
        defaultValue: '2',
        gridColumn: 1
      },
      {
        name: 'enhance_prompt',
        type: 'checkbox',
        label: 'Melhorar Prompt',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/flux-pro-kontext-max': {
    label: 'FLUX.1 Kontext [max]',
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
      { label: '4:3', value: '4:3' },
      { label: '3:2', value: '3:2' },
      { label: '2:3', value: '2:3' },
      { label: '3:4', value: '3:4' },
      { label: '9:16', value: '9:16' },
      { label: '9:21', value: '9:21' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale (1-20)',
        placeholder: '3.5',
        defaultValue: 3.5,
        min: 1,
        max: 20,
        step: 0.1,
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'safety_tolerance',
        type: 'select',
        label: 'Tolerância de Segurança',
        options: [
          { value: '1', label: '1 (Mais Restritivo)' },
          { value: '2', label: '2 (Padrão)' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6 (Mais Permissivo)' }
        ],
        defaultValue: '2',
        gridColumn: 1
      },
      {
        name: 'enhance_prompt',
        type: 'checkbox',
        label: 'Melhorar Prompt',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/flux-pro-kontext-text': {
    label: 'FLUX.1 Kontext [pro]',
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
      { label: '4:3', value: '4:3' },
      { label: '3:2', value: '3:2' },
      { label: '2:3', value: '2:3' },
      { label: '3:4', value: '3:4' },
      { label: '9:16', value: '9:16' },
      { label: '9:21', value: '9:21' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale (1-20)',
        placeholder: '3.5',
        defaultValue: 3.5,
        min: 1,
        max: 20,
        step: 0.1,
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'safety_tolerance',
        type: 'select',
        label: 'Tolerância de Segurança',
        options: [
          { value: '1', label: '1 (Mais Restritivo)' },
          { value: '2', label: '2 (Padrão)' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6 (Mais Permissivo)' }
        ],
        defaultValue: '2',
        gridColumn: 1
      },
      {
        name: 'enhance_prompt',
        type: 'checkbox',
        label: 'Melhorar Prompt',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/flux-pro/kontext/max': {
    label: 'FLUX.1 Kontext [max]',
    aspectRatios: [
      { label: 'Tamanho original', value: 'fixed' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale (1-20)',
        placeholder: '3.5',
        defaultValue: 3.5,
        min: 1,
        max: 20,
        step: 0.1,
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncronno',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'safety_tolerance',
        type: 'select',
        label: 'Tolerância de Segurança (1-6)',
        options: [
          { value: '1', label: '1 - Mais Restritivo' },
          { value: '2', label: '2 - Restritivo' },
          { value: '3', label: '3 - Moderado' },
          { value: '4', label: '4 - Permissivo' },
          { value: '5', label: '5 - Mais Permissivo' },
          { value: '6', label: '6 - Máximo' }
        ],
        defaultValue: '2',
        gridColumn: 1
      },
      {
        name: 'enhance_prompt',
        type: 'checkbox',
        label: 'Melhorar Prompt',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/flux-pro-v1.1': {
    label: 'FLUX1.1 [pro]',
    aspectRatios: [
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'enable_safety_checker',
        type: 'checkbox',
        label: 'Verificação de Segurança',
        defaultValue: true,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'safety_tolerance',
        type: 'select',
        label: 'Tolerância de Segurança',
        options: [
          { value: '1', label: '1 (Mais Restritivo)' },
          { value: '2', label: '2 (Padrão)' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6 (Mais Permissivo)' }
        ],
        defaultValue: '2',
        gridColumn: 1
      },
      {
        name: 'enhance_prompt',
        type: 'checkbox',
        label: 'Melhorar Prompt',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/flux-pro-v1.1-ultra': {
    label: 'FLUX1.1 [pro] ultra',
    aspectRatios: [
      { label: '16:9', value: '16:9' },
      { label: '21:9', value: '21:9' },
      { label: '4:3', value: '4:3' },
      { label: '3:2', value: '3:2' },
      { label: '1:1', value: '1:1' },
      { label: '2:3', value: '2:3' },
      { label: '3:4', value: '3:4' },
      { label: '9:16', value: '9:16' },
      { label: '9:21', value: '9:21' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'enable_safety_checker',
        type: 'checkbox',
        label: 'Verificação de Segurança',
        defaultValue: true,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'safety_tolerance',
        type: 'select',
        label: 'Tolerância de Segurança',
        options: [
          { value: '1', label: '1 (Mais Restritivo)' },
          { value: '2', label: '2 (Padrão)' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6 (Mais Permissivo)' }
        ],
        defaultValue: '2',
        gridColumn: 1
      },
      {
        name: 'enhance_prompt',
        type: 'checkbox',
        label: 'Melhorar Prompt',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'raw',
        type: 'checkbox',
        label: 'Imagens Naturais (Raw)',
        defaultValue: false,
        gridColumn: 1
      }
    ]
  },
  'fal-ai/nano-banana': {
    label: 'Nano Banana',
    aspectRatios: [
      { label: 'Tamanho único', value: 'fixed' }, // Valor especial que não é enviado para API
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 1
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono (Data URIs)',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },

  'fal-ai/stable-video-diffusion': {
    label: 'Stable Video Diffusion (FAL)',
    aspectRatios: [
      { label: '1:1 (512x512)', value: '1:1' },
      { label: '4:3 (640x480)', value: '4:3' },
      { label: '3:4 (480x640)', value: '3:4' },
      { label: '16:9 (854x480)', value: '16:9' },
      { label: '9:16 (480x854)', value: '9:16' },
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
        name: 'fps',
        type: 'select',
        label: 'FPS',
        options: [
          { value: 6, label: '6 FPS' },
          { value: 12, label: '12 FPS' },
          { value: 24, label: '24 FPS' }
        ],
        defaultValue: 24,
        gridColumn: 2
      },
      {
        name: 'duration',
        type: 'select',
        label: 'Duração',
        options: [
          { value: 2, label: '2 segundos' },
          { value: 3, label: '3 segundos' },
          { value: 4, label: '4 segundos' },
          { value: 5, label: '5 segundos' }
        ],
        defaultValue: 3,
        gridColumn: 1
      },
      {
        name: 'motionStrength',
        type: 'input',
        label: 'Motion Strength',
        placeholder: '127',
        defaultValue: 127,
        gridColumn: 2
      }
    ]
  },

  'fal-ai/imagen4': {
    label: 'Imagen 4',
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '4:3', value: '4:3' },
      { label: '3:4', value: '3:4' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva o que você NÃO quer na imagem',
        defaultValue: '',
        gridColumn: 1
      },
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 2
      },
      {
        name: 'resolution',
        type: 'select',
        label: 'Resolução',
        options: [
          { value: '1K', label: '1K' },
          { value: '2K', label: '2K' },
        ],
        defaultValue: '1K',
        gridColumn: 1
      }
    ]
  },
  'fal-ai/imagen4-ultra': {
    label: 'Imagen 4 Ultra',
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '4:3', value: '4:3' },
      { label: '3:4', value: '3:4' },
    ],
    fields: [
      // Campo que aparece no nó principal (sempre 1 para Ultra)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva o que você NÃO quer na imagem',
        defaultValue: '',
        gridColumn: 1
      },
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 2
      },
      {
        name: 'resolution',
        type: 'select',
        label: 'Resolução',
        options: [
          { value: '1K', label: '1K' },
          { value: '2K', label: '2K' },
        ],
        defaultValue: '1K',
        gridColumn: 1
      }
    ]
  },
  'fal-ai/ideogram-v3': {
    label: 'Ideogram 3.0',
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    fields: [
      {
        name: 'image_size',
        type: 'select',
        label: 'Tamanho',
        options: [
          { value: 'square_hd', label: 'Square HD' },
          { value: 'square', label: 'Square' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
        defaultValue: 'square_hd',
        gridColumn: 2
      },
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'rendering_speed',
        type: 'select',
        label: 'Rendering Speed',
        options: [
          { value: 'TURBO', label: 'Turbo' },
          { value: 'BALANCED', label: 'Balanced' },
          { value: 'QUALITY', label: 'Quality' },
        ],
        defaultValue: 'BALANCED',
        gridColumn: 2
      },
      {
        name: 'style',
        type: 'select',
        label: 'Style',
        options: [
          { value: 'AUTO', label: 'Auto' },
          { value: 'GENERAL', label: 'General' },
          { value: 'REALISTIC', label: 'Realistic' },
          { value: 'DESIGN', label: 'Design' },
        ],
        defaultValue: 'AUTO',
        gridColumn: 1
      },
      {
        name: 'expand_prompt',
        type: 'checkbox',
        label: 'Expandir Prompt (MagicPrompt)',
        defaultValue: true,
        gridColumn: 2
      },
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva o que excluir da imagem',
        defaultValue: '',
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'color_palette_type',
        type: 'select',
        label: 'Tipo de Paleta',
        options: [
          { value: 'none', label: 'Nenhuma' },
          { value: 'preset', label: 'Predefinida' },
          { value: 'custom', label: 'Personalizada' },
        ],
        defaultValue: 'none',
        gridColumn: 1
      },
      {
        name: 'color_palette_preset',
        type: 'select',
        label: 'Paleta Predefinida',
        options: [
          { value: 'EMBER', label: 'Ember' },
          { value: 'FRESH', label: 'Fresh' },
          { value: 'JUNGLE', label: 'Jungle' },
          { value: 'MAGIC', label: 'Magic' },
          { value: 'MELON', label: 'Melon' },
          { value: 'MOSAIC', label: 'Mosaic' },
          { value: 'PASTEL', label: 'Pastel' },
          { value: 'ULTRAMARINE', label: 'Ultramarine' },
        ],
        defaultValue: null,
        gridColumn: 2,
        conditional: { field: 'color_palette_type', value: 'preset' }
      },
      {
        name: 'color_r',
        type: 'number',
        label: 'Vermelho (R)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 190,
        gridColumn: 1,
        conditional: { field: 'color_palette_type', value: 'custom' }
      },
      {
        name: 'color_g',
        type: 'number',
        label: 'Verde (G)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 29,
        gridColumn: 1,
        conditional: { field: 'color_palette_type', value: 'custom' }
      },
      {
        name: 'color_b',
        type: 'number',
        label: 'Azul (B)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 29,
        gridColumn: 1,
        conditional: { field: 'color_palette_type', value: 'custom' }
      },
    ]
  },
  'fal-ai/recraft-v3': {
    label: 'Recraft V3',
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'style',
        type: 'select',
        label: 'Estilo',
        options: [
          { value: 'any', label: 'Any' },
          { value: 'realistic_image', label: 'Realistic Image' },
          { value: 'digital_illustration', label: 'Digital Illustration' },
          { value: 'vector_illustration', label: 'Vector Illustration' },
          { value: 'realistic_image/b_and_w', label: 'B&W' },
          { value: 'realistic_image/hard_flash', label: 'Hard Flash' },
          { value: 'realistic_image/hdr', label: 'HDR' },
          { value: 'realistic_image/natural_light', label: 'Natural Light' },
          { value: 'realistic_image/studio_portrait', label: 'Studio Portrait' },
          { value: 'realistic_image/enterprise', label: 'Enterprise' },
          { value: 'realistic_image/motion_blur', label: 'Motion Blur' },
          { value: 'realistic_image/evening_light', label: 'Evening Light' },
          { value: 'realistic_image/faded_nostalgia', label: 'Faded Nostalgia' },
          { value: 'realistic_image/forest_life', label: 'Forest Life' },
          { value: 'realistic_image/mystic_naturalism', label: 'Mystic Naturalism' },
          { value: 'realistic_image/natural_tones', label: 'Natural Tones' },
          { value: 'realistic_image/organic_calm', label: 'Organic Calm' },
          { value: 'realistic_image/real_life_glow', label: 'Real Life Glow' },
          { value: 'realistic_image/retro_realism', label: 'Retro Realism' },
          { value: 'realistic_image/retro_snapshot', label: 'Retro Snapshot' },
          { value: 'realistic_image/urban_drama', label: 'Urban Drama' },
          { value: 'realistic_image/village_realism', label: 'Village Realism' },
          { value: 'realistic_image/warm_folk', label: 'Warm Folk' },
          { value: 'digital_illustration/pixel_art', label: 'Pixel Art' },
          { value: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
          { value: 'digital_illustration/grain', label: 'Grain' },
          { value: 'digital_illustration/infantile_sketch', label: 'Infantile Sketch' },
          { value: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
          { value: 'digital_illustration/handmade_3d', label: 'Handmade 3D' },
          { value: 'digital_illustration/hand_drawn_outline', label: 'Hand Drawn Outline' },
          { value: 'digital_illustration/engraving_color', label: 'Engraving Color' },
          { value: 'digital_illustration/2d_art_poster_2', label: '2D Art Poster 2' },
          { value: 'digital_illustration/antiquarian', label: 'Antiquarian' },
          { value: 'digital_illustration/bold_fantasy', label: 'Bold Fantasy' },
          { value: 'digital_illustration/child_book', label: 'Child Book' },
          { value: 'digital_illustration/child_books', label: 'Child Books' },
          { value: 'digital_illustration/cover', label: 'Cover' },
          { value: 'digital_illustration/crosshatch', label: 'Crosshatch' },
          { value: 'digital_illustration/digital_engraving', label: 'Digital Engraving' },
          { value: 'digital_illustration/expressionism', label: 'Expressionism' },
          { value: 'digital_illustration/freehand_details', label: 'Freehand Details' },
          { value: 'digital_illustration/grain_20', label: 'Grain 20' },
          { value: 'digital_illustration/graphic_intensity', label: 'Graphic Intensity' },
          { value: 'digital_illustration/hard_comics', label: 'Hard Comics' },
          { value: 'digital_illustration/long_shadow', label: 'Long Shadow' },
          { value: 'digital_illustration/modern_folk', label: 'Modern Folk' },
          { value: 'digital_illustration/multicolor', label: 'Multicolor' },
          { value: 'digital_illustration/neon_calm', label: 'Neon Calm' },
          { value: 'digital_illustration/noir', label: 'Noir' },
          { value: 'digital_illustration/nostalgic_pastel', label: 'Nostalgic Pastel' },
          { value: 'digital_illustration/outline_details', label: 'Outline Details' },
          { value: 'digital_illustration/pastel_gradient', label: 'Pastel Gradient' },
          { value: 'digital_illustration/pastel_sketch', label: 'Pastel Sketch' },
          { value: 'digital_illustration/pop_art', label: 'Pop Art' },
          { value: 'digital_illustration/pop_renaissance', label: 'Pop Renaissance' },
          { value: 'digital_illustration/street_art', label: 'Street Art' },
          { value: 'digital_illustration/tablet_sketch', label: 'Tablet Sketch' },
          { value: 'digital_illustration/urban_glow', label: 'Urban Glow' },
          { value: 'digital_illustration/urban_sketching', label: 'Urban Sketching' },
          { value: 'digital_illustration/vanilla_dreams', label: 'Vanilla Dreams' },
          { value: 'digital_illustration/young_adult_book', label: 'Young Adult Book' },
          { value: 'digital_illustration/young_adult_book_2', label: 'Young Adult Book 2' },
          { value: 'vector_illustration/bold_stroke', label: 'Bold Stroke' },
          { value: 'vector_illustration/chemistry', label: 'Chemistry' },
          { value: 'vector_illustration/colored_stencil', label: 'Colored Stencil' },
          { value: 'vector_illustration/contour_pop_art', label: 'Contour Pop Art' },
          { value: 'vector_illustration/cosmics', label: 'Cosmics' },
          { value: 'vector_illustration/cutout', label: 'Cutout' },
          { value: 'vector_illustration/depressive', label: 'Depressive' },
          { value: 'vector_illustration/editorial', label: 'Editorial' },
          { value: 'vector_illustration/emotional_flat', label: 'Emotional Flat' },
          { value: 'vector_illustration/infographical', label: 'Infographical' },
          { value: 'vector_illustration/marker_outline', label: 'Marker Outline' },
          { value: 'vector_illustration/mosaic', label: 'Mosaic' },
          { value: 'vector_illustration/naivector', label: 'Naivector' },
          { value: 'vector_illustration/roundish_flat', label: 'Roundish Flat' },
          { value: 'vector_illustration/segmented_colors', label: 'Segmented Colors' },
          { value: 'vector_illustration/sharp_contrast', label: 'Sharp Contrast' },
          { value: 'vector_illustration/thin', label: 'Thin' },
          { value: 'vector_illustration/vector_photo', label: 'Vector Photo' },
          { value: 'vector_illustration/vivid_shapes', label: 'Vivid Shapes' },
          { value: 'vector_illustration/engraving', label: 'Engraving' },
          { value: 'vector_illustration/line_art', label: 'Line Art' },
          { value: 'vector_illustration/line_circuit', label: 'Line Circuit' },
          { value: 'vector_illustration/linocut', label: 'Linocut' }
        ],
        defaultValue: 'realistic_image',
        gridColumn: 1
      },
      {
        name: 'enable_safety_checker',
        type: 'checkbox',
        label: 'Verificação de Segurança',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva elementos indesejados',
        defaultValue: '',
        gridColumn: 1
      },
      {
        name: 'colors_type',
        type: 'select',
        label: 'Tipo de Cores',
        options: [
          { value: 'none', label: 'Nenhuma' },
          { value: 'custom', label: 'Personalizada' },
        ],
        defaultValue: 'none',
        gridColumn: 2
      },
      {
        name: 'colors_r',
        type: 'number',
        label: 'Vermelho (R)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 120,
        gridColumn: 1,
        conditional: { field: 'colors_type', value: 'custom' }
      },
      {
        name: 'colors_g',
        type: 'number',
        label: 'Verde (G)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 47,
        gridColumn: 2,
        conditional: { field: 'colors_type', value: 'custom' }
      },
      {
        name: 'colors_b',
        type: 'number',
        label: 'Azul (B)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 85,
        gridColumn: 1,
        conditional: { field: 'colors_type', value: 'custom' }
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncronno',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/flux-krea': {
    label: 'FLUX.1 Krea',
    aspectRatios: [
      { label: 'Square HD', value: 'square_hd' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait 4:3', value: 'portrait_4_3' },
      { label: 'Portrait 16:9', value: 'portrait_16_9' },
      { label: 'Landscape 4:3', value: 'landscape_4_3' },
      { label: 'Landscape 16:9', value: 'landscape_16_9' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'num_inference_steps',
        type: 'number',
        label: 'Passos de Inferência (1-50)',
        placeholder: '28',
        defaultValue: 28,
        min: 1,
        max: 50,
        gridColumn: 2
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale (1-20)',
        placeholder: '4.5',
        defaultValue: 4.5,
        min: 1,
        max: 20,
        step: 0.1,
        gridColumn: 1
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'enable_safety_checker',
        type: 'checkbox',
        label: 'Verificação de Segurança',
        defaultValue: true,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'acceleration',
        type: 'select',
        label: 'Aceleração',
        options: [
          { value: 'none', label: 'Nenhuma' },
          { value: 'regular', label: 'Regular' },
          { value: 'high', label: 'Alta' }
        ],
        defaultValue: 'none',
        gridColumn: 1
      }
    ]
  },

  'fal-ai/luma-photon': {
    label: 'Luma Photon',
    aspectRatios: [
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '1:1', value: '1:1' },
      { label: '4:3', value: '4:3' },
      { label: '3:4', value: '3:4' },
      { label: '21:9', value: '21:9' },
      { label: '9:21', value: '9:21' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        min: 1,
        max: 4,
        gridColumn: 2
      },
    ]
  },
  'fal-ai/nano-banana-edit': {
    label: 'Nano Banana Edit',
    aspectRatios: [
      { label: 'Tamanho original', value: 'fixed' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' },
        ],
        defaultValue: 'jpeg',
        gridColumn: 1
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncronno',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/ideogram/character': {
    label: 'Ideogram 3.0 Character',
    aspectRatios: [
      { label: 'Tamanho original', value: 'fixed' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade (1-8)',
        defaultValue: 1,
        min: 1,
        max: 8,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'rendering_speed',
        type: 'select',
        label: 'Velocidade de Renderização',
        options: [
          { value: 'TURBO', label: 'Turbo' },
          { value: 'BALANCED', label: 'Balanceado' },
          { value: 'QUALITY', label: 'Qualidade' },
        ],
        defaultValue: 'BALANCED',
        gridColumn: 1
      },
      {
        name: 'style',
        type: 'select',
        label: 'Estilo',
        options: [
          { value: 'AUTO', label: 'Automático' },
          { value: 'REALISTIC', label: 'Realístico' },
          { value: 'FICTION', label: 'Ficção' },
        ],
        defaultValue: 'AUTO',
        gridColumn: 2
      },
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'expand_prompt',
        type: 'checkbox',
        label: 'Expandir Prompt',
        defaultValue: true,
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncronno',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva o que excluir da imagem',
        defaultValue: '',
        gridColumn: 2
      }
    ]
  },
  'fal-ai/recraft/v3/image-to-image': {
    label: 'Recraft V3',
    aspectRatios: [
      { label: 'Tamanho original', value: 'fixed' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'strength',
        type: 'number',
        label: 'Strength (0-1)',
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        gridColumn: 1
      },
      {
        name: 'style',
        type: 'select',
        label: 'Style',
        options: [
          { value: 'any', label: 'Any' },
          { value: 'realistic_image', label: 'Realistic Image' },
          { value: 'digital_illustration', label: 'Digital Illustration' },
          { value: 'vector_illustration', label: 'Vector Illustration' },
          { value: 'realistic_image/b_and_w', label: 'B&W' },
          { value: 'realistic_image/hard_flash', label: 'Hard Flash' },
          { value: 'realistic_image/hdr', label: 'HDR' },
          { value: 'realistic_image/natural_light', label: 'Natural Light' },
          { value: 'realistic_image/studio_portrait', label: 'Studio Portrait' },
          { value: 'digital_illustration/pixel_art', label: 'Pixel Art' },
          { value: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
          { value: 'digital_illustration/grain', label: 'Grain' },
          { value: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
          { value: 'digital_illustration/pop_art', label: 'Pop Art' },
          { value: 'vector_illustration/bold_stroke', label: 'Bold Stroke' },
          { value: 'vector_illustration/line_art', label: 'Line Art' },
          { value: 'vector_illustration/flat', label: 'Flat Vector' },
        ],
        defaultValue: 'realistic_image',
        gridColumn: 2
      },
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva elementos indesejados',
        defaultValue: '',
        gridColumn: 2
      },
      {
        name: 'colors_type',
        type: 'select',
        label: 'Tipo de Cores',
        options: [
          { value: 'none', label: 'Nenhuma' },
          { value: 'custom', label: 'Personalizada' },
        ],
        defaultValue: 'none',
        gridColumn: 1
      },
      {
        name: 'colors_r',
        type: 'number',
        label: 'Vermelho (R)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 120,
        gridColumn: 2,
        conditional: { field: 'colors_type', value: 'custom' }
      },
      {
        name: 'colors_g',
        type: 'number',
        label: 'Verde (G)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 47,
        gridColumn: 1,
        conditional: { field: 'colors_type', value: 'custom' }
      },
      {
        name: 'colors_b',
        type: 'number',
        label: 'Azul (B)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 85,
        gridColumn: 2,
        conditional: { field: 'colors_type', value: 'custom' }
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncronno',
        defaultValue: false,
        gridColumn: 1
      }
    ]
  },
  'fal-ai/ideogram/v3/reframe': {
    label: 'Ideogram 3.0 Reframe',
    aspectRatios: [
      { label: 'Square HD (1024x1024)', value: 'square_hd' },
      { label: 'Square (512x512)', value: 'square' },
      { label: 'Portrait 4:3 (768x1024)', value: 'portrait_4_3' },
      { label: 'Portrait 16:9 (576x1024)', value: 'portrait_16_9' },
      { label: 'Landscape 4:3 (1024x768)', value: 'landscape_4_3' },
      { label: 'Landscape 16:9 (1024x576)', value: 'landscape_16_9' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'rendering_speed',
        type: 'select',
        label: 'Velocidade de Renderização',
        options: [
          { value: 'TURBO', label: 'Turbo' },
          { value: 'BALANCED', label: 'Balanceado' },
          { value: 'QUALITY', label: 'Qualidade' }
        ],
        defaultValue: 'BALANCED',
        gridColumn: 1
      },
      {
        name: 'seed',
        type: 'input',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: '',
        gridColumn: 2
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 1
      }
    ]
  },

  'fal-ai/ideogram/v3/remix': {
    label: 'Ideogram 3.0 Remix',
    aspectRatios: [
      { label: 'Tamanho original', value: 'fixed' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'strength',
        type: 'number',
        label: 'Strength (0.01-1)',
        defaultValue: 0.8,
        min: 0.01,
        max: 1,
        step: 0.01,
        gridColumn: 1
      },
      {
        name: 'rendering_speed',
        type: 'select',
        label: 'Velocidade de Renderização',
        options: [
          { value: 'TURBO', label: 'Turbo' },
          { value: 'BALANCED', label: 'Balanceado' },
          { value: 'QUALITY', label: 'Qualidade' }
        ],
        defaultValue: 'BALANCED',
        gridColumn: 2
      },
      {
        name: 'style',
        type: 'select',
        label: 'Estilo',
        options: [
          { value: 'AUTO', label: 'Automático' },
          { value: 'GENERAL', label: 'Geral' },
          { value: 'REALISTIC', label: 'Realístico' },
          { value: 'DESIGN', label: 'Design' }
        ],
        defaultValue: 'AUTO',
        gridColumn: 1
      },
      {
        name: 'expand_prompt',
        type: 'checkbox',
        label: 'Expandir Prompt (MagicPrompt)',
        defaultValue: true,
        gridColumn: 2
      },
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        placeholder: 'Deixe vazio para aleatório',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'negative_prompt',
        type: 'input',
        label: 'Prompt Negativo',
        placeholder: 'Descreva o que excluir da imagem',
        defaultValue: '',
        gridColumn: 2
      },
      {
        name: 'color_palette_type',
        type: 'select',
        label: 'Tipo de Paleta',
        options: [
          { value: 'none', label: 'Nenhuma' },
          { value: 'preset', label: 'Predefinida' },
          { value: 'custom', label: 'Personalizada' }
        ],
        defaultValue: 'none',
        gridColumn: 1
      },
      {
        name: 'color_palette_preset',
        type: 'select',
        label: 'Paleta Predefinida',
        options: [
          { value: 'EMBER', label: 'Ember' },
          { value: 'FRESH', label: 'Fresh' },
          { value: 'JUNGLE', label: 'Jungle' },
          { value: 'MAGIC', label: 'Magic' },
          { value: 'MELON', label: 'Melon' },
          { value: 'MOSAIC', label: 'Mosaic' },
          { value: 'PASTEL', label: 'Pastel' },
          { value: 'ULTRAMARINE', label: 'Ultramarine' }
        ],
        defaultValue: null,
        gridColumn: 2,
        conditional: { field: 'color_palette_type', value: 'preset' }
      },
      {
        name: 'color_r',
        type: 'number',
        label: 'Vermelho (R)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 190,
        gridColumn: 1,
        conditional: { field: 'color_palette_type', value: 'custom' }
      },
      {
        name: 'color_g',
        type: 'number',
        label: 'Verde (G)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 29,
        gridColumn: 2,
        conditional: { field: 'color_palette_type', value: 'custom' }
      },
      {
        name: 'color_b',
        type: 'number',
        label: 'Azul (B)',
        placeholder: '0-255',
        min: 0,
        max: 255,
        defaultValue: 29,
        gridColumn: 1,
        conditional: { field: 'color_palette_type', value: 'custom' }
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/topaz/upscale/image': {
    label: 'Topaz Upscale',
    aspectRatios: [
      { label: 'Upscale', value: 'upscale' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'topaz_model',
        type: 'select',
        label: 'Modelo de Upscale',
        options: [
          { value: 'Low Resolution V2', label: 'Low Resolution V2' },
          { value: 'Standard V2', label: 'Standard V2' },
          { value: 'CGI', label: 'CGI' },
          { value: 'High Fidelity V2', label: 'High Fidelity V2' },
          { value: 'Text Refine', label: 'Text Refine' },
          { value: 'Recovery', label: 'Recovery' },
          { value: 'Redefine', label: 'Redefine' },
          { value: 'Recovery V2', label: 'Recovery V2' }
        ],
        defaultValue: 'Standard V2',
        gridColumn: 1
      },
      {
        name: 'upscale_factor',
        type: 'number',
        label: 'Fator de Upscale (1-4)',
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 0.1,
        gridColumn: 2
      },
      {
        name: 'crop_to_fill',
        type: 'checkbox',
        label: 'Cortar para Preencher',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      },
      {
        name: 'subject_detection',
        type: 'select',
        label: 'Detecção de Assunto',
        options: [
          { value: 'All', label: 'Todos' },
          { value: 'Foreground', label: 'Primeiro Plano' },
          { value: 'Background', label: 'Fundo' }
        ],
        defaultValue: 'All',
        gridColumn: 1
      },
      {
        name: 'face_enhancement',
        type: 'checkbox',
        label: 'Melhoria Facial',
        defaultValue: true,
        gridColumn: 2
      },
      {
        name: 'face_enhancement_creativity',
        type: 'number',
        label: 'Criatividade Facial (0-1)',
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
        gridColumn: 1
      },
      {
        name: 'face_enhancement_strength',
        type: 'number',
        label: 'Força Facial (0-1)',
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/ideogram/upscale': {
    label: 'Ideogram 3.0 Upscale',
    aspectRatios: [
      { label: 'Upscale', value: 'upscale' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'prompt',
        type: 'textarea',
        label: 'Prompt para Upscale',
        defaultValue: '',
        gridColumn: 1
      },
      {
        name: 'resemblance',
        type: 'number',
        label: 'Semelhança (1-100)',
        defaultValue: 50,
        min: 1,
        max: 100,
        step: 1,
        gridColumn: 2
      },
      {
        name: 'detail',
        type: 'number',
        label: 'Detalhe (1-100)',
        defaultValue: 50,
        min: 1,
        max: 100,
        step: 1,
        gridColumn: 1
      },
      {
        name: 'expand_prompt',
        type: 'checkbox',
        label: 'Expandir Prompt (MagicPrompt)',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'seed',
        type: 'number',
        label: 'Seed',
        defaultValue: null,
        gridColumn: 1
      },
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  },
  'fal-ai/recraft/upscale/creative': {
    label: 'Recraft Creative Upscale',
    aspectRatios: [
      { label: 'Upscale', value: 'upscale' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'enable_safety_checker',
        type: 'checkbox',
        label: 'Verificador de Segurança',
        defaultValue: false,
        gridColumn: 2
      },
      {
        name: 'crop_to_fill',
        type: 'checkbox',
        label: 'Cortar para Preencher',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 2
      }
    ]
  },
  'fal-ai/recraft/upscale/crisp': {
    label: 'Recraft Crisp Upscale',
    aspectRatios: [
      { label: 'Upscale', value: 'upscale' },
    ],
    fields: [
      // Campo que aparece no nó principal (controla quantos nós criar)
      {
        name: 'num_images',
        type: 'number',
        label: 'Quantidade',
        defaultValue: 1,
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'sync_mode',
        type: 'checkbox',
        label: 'Modo Síncrono',
        defaultValue: false,
        gridColumn: 1
      },
      {
        name: 'enable_safety_checker',
        type: 'checkbox',
        label: 'Verificador de Segurança',
        defaultValue: false,
        gridColumn: 2
      }
    ]
  }
};

// Função para obter o esquema de um modelo
export const getModelSchema = (modelId: string): ModelSchema | null => {
  return MODEL_SCHEMAS[modelId] || null;
};

// Função para obter valores padrão de um modelo
export const getModelDefaults = (modelId: string): Record<string, any> => {
  const schema = getModelSchema(modelId);
  if (!schema) return {};
  
  const defaults: Record<string, any> = {};
  schema.fields.forEach(field => {
    defaults[field.name] = field.defaultValue;
  });
  
  // Adicionar valores padrão para campos ocultos no modelo flux-dev
  if (modelId === 'black-forest-labs/flux-dev') {
    defaults.megapixels = 1;
    defaults.outputFormat = 'png';
    defaults.outputQuality = 100;
    defaults.disableSafetyChecker = false;
    defaults.goFast = false;
  }
  
  // Adicionar valores padrão para campos ocultos no modelo flux-krea-dev
  if (modelId === 'black-forest-labs/flux-krea-dev') {
    defaults.megapixels = 1;
    defaults.outputFormat = 'png';
    defaults.outputQuality = 100;
    defaults.disableSafetyChecker = false;
    defaults.goFast = false;
  }
  
  // Adicionar valores padrão para campos ocultos no modelo flux-1.1-pro
  if (modelId === 'black-forest-labs/flux-1.1-pro') {
    defaults.outputFormat = 'png';
    defaults.outputQuality = 100;
    defaults.safetyTolerance = 2;
    defaults.promptUpsampling = false;
  }
  
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-kontext
  if (modelId === 'fal-ai/flux-pro-kontext') {
    defaults.fixed_size = 'fixed';
    defaults.guidance_scale = 3.5;
    defaults.sync_mode = false;
    defaults.output_format = 'jpeg';
    defaults.safety_tolerance = '2';
    defaults.enhance_prompt = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-kontext-max
  if (modelId === 'fal-ai/flux-pro-kontext-max') {
    defaults.aspect_ratio = '1:1';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro/kontext/max
  if (modelId === 'fal-ai/flux-pro/kontext/max') {
    defaults.fixed_size = 'fixed';
    defaults.guidance_scale = 3.5;
    defaults.sync_mode = false;
    defaults.output_format = 'jpeg';
    defaults.safety_tolerance = '2';
    defaults.enhance_prompt = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-v1.1
  if (modelId === 'fal-ai/flux-pro-v1.1') {
    defaults.image_size = 'landscape_4_3';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-v1.1-ultra
  if (modelId === 'fal-ai/flux-pro-v1.1-ultra') {
    defaults.aspect_ratio = '16:9';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/nano-banana
  if (modelId === 'fal-ai/nano-banana') {
    defaults.fixed_size = 'fixed'; // Valor especial para tamanho fixo
  }
  

  
  // Adicionar valores padrão para o modelo fal-ai/imagen4
  if (modelId === 'fal-ai/imagen4') {
    defaults.aspect_ratio = '1:1';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/imagen4-ultra
  if (modelId === 'fal-ai/imagen4-ultra') {
    defaults.aspect_ratio = '1:1';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/ideogram-v3
  if (modelId === 'fal-ai/ideogram-v3') {
    defaults.image_size = 'square_hd';
    defaults.color_palette_type = 'none';
    defaults.color_r = 190;
    defaults.color_g = 29;
    defaults.color_b = 29;
  }
  
  
  // Adicionar valores padrão para o modelo fal-ai/recraft-v3
  if (modelId === 'fal-ai/recraft-v3') {
    defaults.image_size = 'square_hd';
    defaults.style = 'realistic_image';
    defaults.negative_prompt = '';
    defaults.colors_type = 'none';
    defaults.colors_r = 120;
    defaults.colors_g = 47;
    defaults.colors_b = 85;
    defaults.sync_mode = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-krea
  if (modelId === 'fal-ai/flux-krea') {
    defaults.image_size = 'landscape_4_3';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/luma-photon
  if (modelId === 'fal-ai/luma-photon') {
    defaults.aspect_ratio = '1:1';
  }
  
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-kontext-text
  if (modelId === 'fal-ai/flux-pro-kontext-text') {
    defaults.aspect_ratio = '1:1';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/nano-banana-edit
  if (modelId === 'fal-ai/nano-banana-edit') {
    defaults.fixed_size = 'fixed';
    defaults.output_format = 'jpeg';
    defaults.sync_mode = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/ideogram/character
  if (modelId === 'fal-ai/ideogram/character') {
    defaults.fixed_size = 'fixed';
    defaults.rendering_speed = 'BALANCED';
    defaults.style = 'AUTO';
    defaults.expand_prompt = true;
    defaults.sync_mode = false;
    defaults.negative_prompt = '';
  }
  
  
  // Adicionar valores padrão para o modelo fal-ai/recraft/v3/image-to-image
  if (modelId === 'fal-ai/recraft/v3/image-to-image') {
    defaults.fixed_size = 'fixed';
    defaults.strength = 0.5;
    defaults.style = 'realistic_image';
    defaults.negative_prompt = '';
    defaults.colors_type = 'none';
    defaults.colors_r = 120;
    defaults.colors_g = 47;
    defaults.colors_b = 85;
    defaults.sync_mode = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/ideogram/v3/reframe
  if (modelId === 'fal-ai/ideogram/v3/reframe') {
    defaults.rendering_speed = 'BALANCED';
    defaults.sync_mode = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/ideogram/v3/remix
  if (modelId === 'fal-ai/ideogram/v3/remix') {
    defaults.fixed_size = 'fixed';
    defaults.strength = 0.8;
    defaults.rendering_speed = 'BALANCED';
    defaults.style = 'AUTO';
    defaults.expand_prompt = true;
    defaults.seed = null;
    defaults.negative_prompt = '';
    defaults.color_palette_type = 'none';
    defaults.color_palette_preset = null;
    defaults.color_r = 190;
    defaults.color_g = 29;
    defaults.color_b = 29;
    defaults.sync_mode = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/topaz/upscale/image
  if (modelId === 'fal-ai/topaz/upscale/image') {
    defaults.upscale = 'upscale';
    defaults.topaz_model = 'Standard V2';
    defaults.upscale_factor = 2;
    defaults.crop_to_fill = false;
    defaults.output_format = 'jpeg';
    defaults.subject_detection = 'All';
    defaults.face_enhancement = true;
    defaults.face_enhancement_creativity = 0;
    defaults.face_enhancement_strength = 0.8;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/recraft/upscale/creative
  if (modelId === 'fal-ai/recraft/upscale/creative') {
    defaults.upscale = 'upscale';
    defaults.sync_mode = false;
    defaults.enable_safety_checker = false;
  }
  
  // Adicionar valores padrão para o modelo fal-ai/ideogram/upscale
  if (modelId === 'fal-ai/ideogram/upscale') {
    defaults.upscale = 'upscale';
    defaults.prompt = '';
    defaults.resemblance = 50;
    defaults.detail = 50;
    defaults.expand_prompt = false;
    defaults.seed = null;
    defaults.sync_mode = false;
  }
  
  
  // Adicionar valores padrão para campos ocultos no modelo wan-video
  if (modelId === 'wan-video/wan-2.2-i2v-a14b') {
    defaults.go_fast = false;
    defaults.num_frames = 81;
    defaults.sample_steps = 40;
    defaults.sample_shift = 5;
  }
  
  return defaults;
};

// Função para verificar se um modelo tem um campo específico
export const modelHasField = (modelId: string, fieldName: string): boolean => {
  const schema = getModelSchema(modelId);
  return schema?.fields.some(field => field.name === fieldName) || false;
};