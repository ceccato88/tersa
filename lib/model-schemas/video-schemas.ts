import { ModelSchema } from './types';

// Schemas para modelos de vídeo (image-to-video e text-to-video)
export const VIDEO_SCHEMAS: Record<string, ModelSchema> = {
  // I2V: Hailuo 02 Pro
  'fal-ai/minimax/hailuo-02/pro/image-to-video': {
    fields: [
      { name: 'fixed_size', type: 'select', label: 'Tamanho', options: [{ value: 'fixed', label: 'Não Aplicável' }], defaultValue: 'fixed', gridColumn: 2 },
      { name: 'prompt_optimizer', type: 'checkbox', label: 'Prompt Optimizer', defaultValue: true, gridColumn: 1 },
    ],
  },
  // I2V: Marey
  'moonvalley/marey/i2v': {
    fields: [
      { name: 'dimensions', type: 'select', label: 'Dimensões', defaultValue: '1920x1080', options: [
        { value: '1920x1080', label: '1920x1080 (16:9)' },
        { value: '1080x1920', label: '1080x1920 (9:16)' },
        { value: '1152x1152', label: '1152x1152 (1:1)' },
        { value: '1536x1152', label: '1536x1152 (4:3)' },
        { value: '1152x1536', label: '1152x1536 (3:4)' },
      ], gridColumn: 1 },
      { name: 'duration', type: 'select', label: 'Duração', defaultValue: '5s', options: [ { value: '5s', label: '5s' }, { value: '10s', label: '10s' } ], gridColumn: 2 },
      { name: 'negative_prompt', type: 'input', label: 'Negative Prompt', defaultValue: '', gridColumn: 1 },
      { name: 'seed', type: 'number', label: 'Seed', defaultValue: null, gridColumn: 2 },
    ],
  },
  // I2V: Pika v2.2
  'fal-ai/pika/v2.2/image-to-video': {
    fields: [
      { name: 'resolution', type: 'select', label: 'Resolução', defaultValue: '720p', options: [ { value: '720p', label: '720p' }, { value: '1080p', label: '1080p' } ], gridColumn: 1 },
      { name: 'duration', type: 'select', label: 'Duração', defaultValue: '5', options: [ { value: '5', label: '5s' } ], gridColumn: 2 },
      { name: 'negative_prompt', type: 'input', label: 'Negative Prompt', defaultValue: '', gridColumn: 1 },
      { name: 'seed', type: 'number', label: 'Seed', defaultValue: null, gridColumn: 2 },
    ],
  },
  // I2V: Veo3
  'fal-ai/veo3/image-to-video': {
    fields: [
      { name: 'duration', type: 'select', label: 'Duração', defaultValue: '8s', options: [ { value: '8s', label: '8s' } ], gridColumn: 1 },
      { name: 'generate_audio', type: 'checkbox', label: 'Gerar Áudio', defaultValue: true, gridColumn: 2 },
      { name: 'resolution', type: 'select', label: 'Resolução', defaultValue: '720p', options: [ { value: '720p', label: '720p' }, { value: '1080p', label: '1080p' } ], gridColumn: 1 },
    ],
  },
  // I2V: Luma Ray 2
  'fal-ai/luma-dream-machine/ray-2/image-to-video': {
    fields: [
      { name: 'aspect_ratio', type: 'select', label: 'Aspect Ratio', defaultValue: '16:9', options: [
        { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '4:3', label: '4:3' }, { value: '3:4', label: '3:4' }, { value: '21:9', label: '21:9' }, { value: '9:21', label: '9:21' },
      ], gridColumn: 1 },
      { name: 'loop', type: 'checkbox', label: 'Loop', defaultValue: false, gridColumn: 2 },
      { name: 'resolution', type: 'select', label: 'Resolução', defaultValue: '540p', options: [
        { value: '540p', label: '540p' }, { value: '720p', label: '720p' }, { value: '1080p', label: '1080p' },
      ], gridColumn: 1 },
      { name: 'duration', type: 'select', label: 'Duração', defaultValue: '5s', options: [ { value: '5s', label: '5s' }, { value: '9s', label: '9s' } ], gridColumn: 2 },
    ],
  },
  // I2V: Kling 2.1 Master
  'fal-ai/kling-video/v2.1/master/image-to-video': {
    fields: [
      { name: 'fixed_size', type: 'select', label: 'Tamanho', defaultValue: 'fixed', options: [ { value: 'fixed', label: 'Não Aplicável' } ], gridColumn: 2 },
      { name: 'duration', type: 'select', label: 'Duração', defaultValue: '5', options: [ { value: '5', label: '5s' }, { value: '10', label: '10s' } ], gridColumn: 1 },
      { name: 'negative_prompt', type: 'input', label: 'Negative Prompt', defaultValue: 'blur, distort, and low quality', gridColumn: 2 },
      { name: 'cfg_scale', type: 'number', label: 'CFG Scale (0-1)', defaultValue: 0.5, min: 0, max: 1, step: 0.1, gridColumn: 1 },
    ],
  },
};