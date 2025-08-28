import {
  NodeToolbar as NodeToolbarRaw,
  useReactFlow,
  useViewport,
} from '@xyflow/react';
import { Position } from '@xyflow/react';
import { Fragment, type ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type NodeToolbarProps = {
  id: string;
  items:
    | {
        tooltip?: string;
        children: ReactNode;
      }[]
    | undefined;
};

export const NodeToolbar = ({ id, items }: NodeToolbarProps) => {
  const { getNode } = useReactFlow();
  const { zoom } = useViewport();
  const node = getNode(id);

  return (
    <NodeToolbarRaw isVisible={node?.selected} position={Position.Bottom}>
      <div
        className="flex items-center justify-center gap-1 rounded-full bg-background/40 p-0.5 backdrop-blur-sm"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top',
        }}
      >
        {items?.map((button, index) =>
          button.tooltip ? (
            <Tooltip key={button.tooltip}>
              <TooltipTrigger asChild>{button.children}</TooltipTrigger>
              <TooltipContent>{button.tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <Fragment key={index}>{button.children}</Fragment>
          ),
        )}
      </div>
    </NodeToolbarRaw>
  );
};
