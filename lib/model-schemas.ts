// Configuração de esquemas dinâmicos por modelo de IA

export interface ModelField {
  name: string;
  type: 'input' | 'select' | 'checkbox' | 'number';
  label: string;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  defaultValue: any;
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