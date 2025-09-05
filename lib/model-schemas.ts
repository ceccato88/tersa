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
  'fal-ai/flux-dev': {
    label: 'FLUX.1 [dev]',
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
        gridColumn: 2
      },
      
      // Campos que aparecem apenas na aba avançada
      {
        name: 'num_inference_steps',
        type: 'number',
        label: 'Número de Inferências (1-50)',
        placeholder: '28',
        defaultValue: 28,
        min: 1,
        max: 50,
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
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale (1-20)',
        placeholder: '3.5',
        defaultValue: 3.5,
        min: 1,
        max: 20,
        step: 0.1,
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
  'fal-ai/flux-pro-kontext': {
    label: 'FLUX.1 Kontext [pro]',
    aspectRatios: [
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
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
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 1
      }
    ]
  },
  'fal-ai/flux-pro-kontext-max': {
    label: 'FLUX.1 Kontext [max]',
    aspectRatios: [
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
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
        name: 'output_format',
        type: 'select',
        label: 'Formato de Saída',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' }
        ],
        defaultValue: 'jpeg',
        gridColumn: 1
      }
    ]
  },
  'fal-ai/flux-pro-v1.1': {
    label: 'FLUX1.1 [pro]',
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
  'fal-ai/flux-pro-v1.1-ultra': {
    label: 'FLUX1.1 [pro] ultra',
    aspectRatios: [
      { label: '21:9', value: '21:9' },
      { label: '16:9', value: '16:9' },
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
        name: 'raw',
        type: 'checkbox',
        label: '',
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
      }
    ]
  },
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
  'fal-ai/wan-2.2-text-to-image': {
    label: 'Wan 2.2',
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
        name: 'num_inference_steps',
        type: 'number',
        label: 'Inference Steps',
        defaultValue: 27,
        min: 2,
        max: 40,
        gridColumn: 1
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale',
        defaultValue: 3.5,
        min: 1,
        max: 10,
        step: 0.1,
        gridColumn: 2
      },
      {
        name: 'guidance_scale_2',
        type: 'number',
        label: 'Guidance Scale 2',
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 0.1,
        gridColumn: 1
      },
      {
        name: 'shift',
        type: 'number',
        label: 'Shift',
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.1,
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
      { label: '3:4', value: '3:4' },
      { label: '4:3', value: '4:3' },
    ],
    fields: [
      {
        name: 'aspect_ratio',
        type: 'select',
        label: 'Aspecto',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '3:4', label: '3:4' },
          { value: '4:3', label: '4:3' },
        ],
        defaultValue: '1:1',
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
        name: 'resolution',
        type: 'select',
        label: 'Resolução',
        options: [
          { value: '1K', label: '1K' },
          { value: '2K', label: '2K' },
        ],
        defaultValue: '1K',
        gridColumn: 2
      }
    ]
  },
  'fal-ai/imagen4-ultra': {
    label: 'Imagen 4 Ultra',
    aspectRatios: [
      { label: '1:1', value: '1:1' },
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
      { label: '3:4', value: '3:4' },
      { label: '4:3', value: '4:3' },
    ],
    fields: [
      {
        name: 'aspect_ratio',
        type: 'select',
        label: 'Aspecto',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '3:4', label: '3:4' },
          { value: '4:3', label: '4:3' },
        ],
        defaultValue: '1:1',
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
        name: 'resolution',
        type: 'select',
        label: 'Resolução',
        options: [
          { value: '1K', label: '1K' },
          { value: '2K', label: '2K' },
        ],
        defaultValue: '1K',
        gridColumn: 2
      }
    ]
  },
  'fal-ai/ideogram-v3': {
    label: 'Ideogram 3',
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
      }
    ]
  },
  'fal-ai/seedream-3.0': {
    label: 'Seedream 3.0',
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
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale',
        defaultValue: 2.5,
        min: 1,
        max: 10,
        step: 0.1,
        gridColumn: 2
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
      {
        name: 'aspect_ratio',
        type: 'select',
        label: 'Aspecto',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '21:9', label: '21:9' },
          { value: '9:21', label: '9:21' },
        ],
        defaultValue: '1:1',
        gridColumn: 2
      }
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
        gridColumn: 1
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
        defaultValue: 'landscape_4_3',
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
        name: 'num_inference_steps',
        type: 'number',
        label: 'Inference Steps',
        defaultValue: 28,
        min: 1,
        max: 50,
        gridColumn: 2
      },
      {
        name: 'guidance_scale',
        type: 'number',
        label: 'Guidance Scale',
        defaultValue: 4.5,
        min: 1,
        max: 20,
        step: 0.1,
        gridColumn: 1
      },
      {
        name: 'output_format',
        type: 'select',
        label: 'Output Format',
        options: [
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' },
        ],
        defaultValue: 'jpeg',
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
  
  // Adicionar valores padrão para o modelo fal-ai/flux-dev
  if (modelId === 'fal-ai/flux-dev') {
    defaults.image_size = 'landscape_4_3';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-kontext
  if (modelId === 'fal-ai/flux-pro-kontext') {
    defaults.aspect_ratio = '1:1';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-pro-kontext-max
  if (modelId === 'fal-ai/flux-pro-kontext-max') {
    defaults.aspect_ratio = '1:1';
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
  
  // Adicionar valores padrão para o modelo fal-ai/wan-2.2-text-to-image
  if (modelId === 'fal-ai/wan-2.2-text-to-image') {
    defaults.image_size = 'square_hd';
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
  }
  
  // Adicionar valores padrão para o modelo fal-ai/seedream-3.0
  if (modelId === 'fal-ai/seedream-3.0') {
    defaults.image_size = 'square_hd';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/luma-photon
  if (modelId === 'fal-ai/luma-photon') {
    defaults.aspect_ratio = '1:1';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/recraft-v3
  if (modelId === 'fal-ai/recraft-v3') {
    defaults.image_size = 'square_hd';
  }
  
  // Adicionar valores padrão para o modelo fal-ai/flux-krea
  if (modelId === 'fal-ai/flux-krea') {
    defaults.image_size = 'landscape_4_3';
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