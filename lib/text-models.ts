import { providers } from '@/lib/providers';
import type { TersaModel } from '@/lib/providers';

export const TEXT_MODELS: Record<string, TersaModel> = {
  // FAL AI Models
  'openai/gpt-5-mini': {
    label: 'GPT-5 Mini',
    chef: providers.fal,
    providers: [providers.fal],
    priceIndicator: 'low',
    default: true,
  },
  'openai/gpt-5': {
    label: 'GPT-5',
    chef: providers.fal,
    providers: [providers.fal],
    priceIndicator: 'highest',
    default: false,
  },
  'google/gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash',
    chef: providers.fal,
    providers: [providers.fal],
    priceIndicator: 'medium',
    default: false,
  },
  'google/gemini-2.5-pro': {
    label: 'Gemini 2.5 Pro',
    chef: providers.fal,
    providers: [providers.fal],
    priceIndicator: 'high',
    default: false,
  },
  'anthropic/claude-sonnet-4': {
    label: 'Claude Sonnet 4',
    chef: providers.fal,
    providers: [providers.fal],
    priceIndicator: 'highest',
    default: false,
  },
  'x-ai/grok-4': {
    label: 'Grok 4',
    chef: providers.fal,
    providers: [providers.fal],
    priceIndicator: 'high',
    default: false,
  },
};

export const getDefaultTextModel = () => {
  return Object.entries(TEXT_MODELS).find(([_, model]) => model.default)?.[0] || Object.keys(TEXT_MODELS)[0];
};

export const getTextModelsByProvider = (providerId: string) => {
  return Object.fromEntries(
    Object.entries(TEXT_MODELS).filter(([_, model]) => model.chef.id === providerId)
  );
};