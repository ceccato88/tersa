import { type wowModel, providers } from '../providers';

type wowVisionModel = wowModel & {
  providers: typeof providers[keyof typeof providers][];
};

// Minimal vision model set: keep only FAL text model placeholder
export const visionModels: Record<string, wowVisionModel> = {
  'fal-ai/any-llm': {
    label: 'GPT-5',
    chef: providers.fal,
    providers: [providers.fal],
    default: true,
  },
};
