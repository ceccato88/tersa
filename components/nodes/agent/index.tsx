import { AgentTransform } from './transform';

export type AgentNodeProps = {
  type: string;
  data: {
    agentId?: string;
    instructions?: string;
    generated?: {
      text: string;
    };
    updatedAt?: string;
  };
  id: string;
};

export const AgentNode = (props: AgentNodeProps) => (
  <AgentTransform {...props} title="Agente" />
);

