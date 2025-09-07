// Node-level context menu removed to avoid nested popper update loops.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useNodeOperations } from '@/providers/node-operations';
import { Handle, Position, useReactFlow, getIncomers } from '@xyflow/react';
import { CodeIcon, CopyIcon, EyeIcon, TrashIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { NodeToolbar } from './toolbar';

type NodeLayoutProps = {
  children: ReactNode;
  id: string;
  data?: Record<string, unknown> & {
    model?: string;
    source?: string;
    generated?: object;
  };
  title: string;
  type: string;
  toolbar?: {
    tooltip?: string;
    children: ReactNode;
  }[];
  className?: string;
};

export const NodeLayout = ({
  children,
  type,
  id,
  data,
  toolbar,
  title,
  className,
}: NodeLayoutProps) => {
  const { deleteElements, setCenter, getNode, updateNode, getNodes, getEdges } = useReactFlow();
  const { duplicateNode } = useNodeOperations();
  const [showData, setShowData] = useState(false);

  // Verificar se o nó tem conexões de entrada
  const shouldShowInputHandle = () => {
    if (type === 'image' || type === 'text') {
      const node = getNode(id);
      if (!node) return false;
      const incomers = getIncomers(node, getNodes(), getEdges());
      return incomers.length > 0;
    }
    if (type === 'video') {
      // Para nós de vídeo, só mostrar entrada se já tiver conexões (transform)
      // Nós primitivos (sem conexões) não devem ter entrada
      const node = getNode(id);
      if (!node) return false;
      const incomers = getIncomers(node, getNodes(), getEdges());
      return incomers.length > 0;
    }
    return type !== 'file' && type !== 'tweet';
  };

  const handleFocus = () => {
    const node = getNode(id);

    if (!node) {
      return;
    }

    const { x, y } = node.position;
    const width = node.measured?.width ?? 0;

    setCenter(x + width / 2, y, {
      duration: 1000,
    });
  };

  const handleDelete = () => {
    // Usar setTimeout para evitar conflitos durante cascatas de updates
    setTimeout(() => {
      deleteElements({
        nodes: [{ id }],
      });
    }, 0);
  };

  const handleShowData = () => {
    setTimeout(() => {
      setShowData(true);
    }, 100);
  };

  const handleSelect = (open: boolean) => {
    // Removido updateNode para evitar loop infinito de re-renderização
    // A seleção do nó é gerenciada automaticamente pelo React Flow
  };

  return (
    <>
      {type !== 'drop' && Boolean(toolbar?.length) && (
        <NodeToolbar id={id} items={toolbar} />
      )}
      {shouldShowInputHandle() && (
        <Handle type="target" position={Position.Left} />
      )}
      <div className="relative size-full h-auto w-sm" onContextMenu={(e) => e.stopPropagation()}>
            {type !== 'drop' && (
              <div className="-translate-y-full -top-2 absolute right-0 left-0 flex shrink-0 items-center justify-between">
                <p className="font-mono text-muted-foreground text-xs tracking-tighter">
                  {title}
                </p>
              </div>
            )}
            <div
              className={cn(
                'node-container flex size-full flex-col divide-y rounded-[28px] bg-card p-2 ring-1 ring-border transition-all',
                className
              )}
            >
              <div className="overflow-hidden rounded-3xl bg-card">
                {children}
              </div>
            </div>
      </div>
      {type !== 'tweet' && <Handle type="source" position={Position.Right} />}
      <Dialog open={showData} onOpenChange={setShowData}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados do nó</DialogTitle>
            <DialogDescription>
              Dados do nó{' '}
              <code className="rounded-sm bg-secondary px-2 py-1 font-mono">
                {id}
              </code>
            </DialogDescription>
          </DialogHeader>
          <pre className="overflow-x-auto rounded-lg bg-black p-4 text-sm text-white">
            {JSON.stringify(data, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
};
