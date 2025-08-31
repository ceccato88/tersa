import { type TersaModel, type TersaProvider, providers } from '../providers';

type TersaVisionModel = TersaModel & {
  providers: TersaProvider[];
  falModel: string;
};

export const visionModels: Record<string, TersaVisionModel> = {
  'fal-gpt-5-chat': {
    label: 'GPT-5 Chat',
    chef: providers.fal,
    providers: [providers.fal],
    falModel: 'openai/gpt-5-chat',
    default: true,
  },
};
