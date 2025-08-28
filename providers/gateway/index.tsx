import { gateway } from '@/lib/gateway';
import type { ReactNode } from 'react';
import { GatewayProviderClient } from './client';

type GatewayProviderProps = {
  children: ReactNode;
};

export const GatewayProvider = async ({ children }: GatewayProviderProps) => {
  const { models } = await gateway.getAvailableModels();
  
  // Filtrar apenas os modelos especificados (apenas os que existem)
  const allowedModels = ['openai/gpt-5', 'openai/gpt-5-mini'];
  const gatewayTextModels = models.filter(
    (model) => allowedModels.includes(model.id) && !model.id.toLowerCase().includes('embed')
  );

  return (
    <GatewayProviderClient models={gatewayTextModels}>
      {children}
    </GatewayProviderClient>
  );
};
