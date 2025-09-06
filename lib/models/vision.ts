import { type TersaModel, providers } from '../providers';

type TersaVisionModel = TersaModel & {
  providers: typeof providers[keyof typeof providers][];
};

// Minimal vision model set: keep only FAL text model placeholder
export const visionModels: Record<string, TersaVisionModel> = {
  'fal-ai/any-llm': {
    label: 'FAL Any LLM',
    chef: providers.fal,
    providers: [providers.fal],
    default: true,
  },
};
