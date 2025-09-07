import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { nodeButtons } from '@/lib/node-buttons';
import { type XYPosition, useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { useEffect, useRef } from 'react';
import { NodeLayout } from './layout';

type DropNodeProps = {
  data: {
    isSource?: boolean;
    position: XYPosition;
    sourceNodeId?: string;
  };
  id: string;
};

export const DropNode = ({ data, id }: DropNodeProps) => {
  const { addNodes, deleteElements, getNode, addEdges, getNodeConnections } =
    useReactFlow();
  const ref = useRef<HTMLDivElement>(null);

  // Get the source node type to filter available node types
  const sourceNode = data.sourceNodeId ? getNode(data.sourceNodeId) : null;
  const sourceNodeType = sourceNode?.type;

  // Filter available node types based on source node type
  const getAvailableNodeTypes = () => {
    if (sourceNodeType === 'text') {
      return ['text', 'image', 'video'];
    }
    if (sourceNodeType === 'image') {
      return ['text', 'image', 'video'];
    }
    if (sourceNodeType === 'video') {
      return ['video'];
    }
    // Default: somente Texto, Imagem e Vídeo
    return ['text', 'image', 'video'];
  };

  const availableNodeTypes = getAvailableNodeTypes();

  const handleSelect = (type: string, options?: Record<string, unknown>) => {
    // Get the position of the current node
    const currentNode = getNode(id);
    const position = currentNode?.position || { x: 0, y: 0 };
    const sourceNodes = getNodeConnections({
      nodeId: id,
    });

    // Delete the drop node
    deleteElements({
      nodes: [{ id }],
    });

    const newNodeId = nanoid();
    const { data: nodeData, ...rest } = options ?? {};

    // Add the new node of the selected type
    addNodes({
      id: newNodeId,
      type,
      position,
      data: {
        ...(nodeData ? nodeData : {}),
      },
      origin: [0, 0.5],
      ...rest,
    });

    for (const sourceNode of sourceNodes) {
      addEdges({
        id: nanoid(),
        source: data.isSource ? newNodeId : sourceNode.source,
        target: data.isSource ? sourceNode.source : newNodeId,
        type: 'animated',
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Delete the drop node when Escape is pressed
        deleteElements({
          nodes: [{ id }],
        });
      }
    };

    const handleClick = (event: MouseEvent) => {
      // Get the DOM element for this node
      const nodeElement = ref.current;

      // Check if the click was outside the node
      if (nodeElement && !nodeElement.contains(event.target as Node)) {
        deleteElements({
          nodes: [{ id }],
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    setTimeout(() => {
      window.addEventListener('click', handleClick);
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [deleteElements, id]);

  return (
    <div ref={ref}>
      <NodeLayout id={id} data={data} type="drop" title="Adicionar um novo nó">
        <Command className="rounded-lg">
          <CommandInput placeholder="Digite um comando ou pesquise..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Adicionar nó">
              {nodeButtons
                .filter(
                  (button) => availableNodeTypes.includes(button.id)
                )
                .map((button) => (
                  <CommandItem
                    key={button.id}
                    onSelect={() => handleSelect(button.id, button.data)}
                  >
                    <button.icon size={16} />
                    {button.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </NodeLayout>
    </div>
  );
};
