import { type TersaModel, type TersaProvider, providers } from '../providers';

type TersaVisionModel = TersaModel & {
  providers: TersaProvider[];
  replicateModel: string;
};

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
