'use client';

import { updateProjectAction } from '@/app/actions/project/update';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSaveProject } from '@/hooks/use-save-project';
import { handleError } from '@/lib/error/handle';
import { isValidSourceTarget } from '@/lib/xyflow';
import { getModelMaxImages } from '@/lib/model-filtering';
import { NodeDropzoneProvider } from '@/providers/node-dropzone';
import { NodeOperationsProvider } from '@/providers/node-operations';
import { useProject } from '@/providers/project';
import {
  Background,
  type IsValidConnection,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
  type ReactFlowProps,
  getOutgoers,
  useReactFlow,
} from '@xyflow/react';
import {
  type Edge,
  type Node,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';
import { BoxSelectIcon, PlusIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { MouseEvent, MouseEventHandler } from 'react';
import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDebouncedCallback } from 'use-debounce';
import { ConnectionLine } from './connection-line';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu';

export const Canvas = ({ children, ...props }: ReactFlowProps) => {
  const project = useProject();
  const {
    onConnect,
    onConnectStart,
    onConnectEnd,
    onEdgesChange,
    onNodesChange,
    nodes: initialNodes,
    edges: initialEdges,
    ...rest
  } = props ?? {};
  const content = project?.content as { nodes: Node[]; edges: Edge[] };
  const [nodes, setNodes] = useState<Node[]>(
    initialNodes ?? content?.nodes ?? []
  );
  const [edges, setEdges] = useState<Edge[]>(
    initialEdges ?? content?.edges ?? []
  );
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const {
    getEdges,
    toObject,
    screenToFlowPosition,
    getNodes,
    getNode,
    updateNode,
  } = useReactFlow();
  const analytics = useAnalytics();
  const [saveState, setSaveState] = useSaveProject();

  const save = useDebouncedCallback(async () => {
    if (saveState.isSaving || !project?.userId || !project?.id) {
      return;
    }

    try {
      setSaveState((prev) => ({ ...prev, isSaving: true }));

      // Sanitize React Flow content to avoid non-serializable values in Server Actions
      const rf = toObject();
      const nodes = getNodes().map((n) => ({
        id: n.id,
        type: n.type,
        data: n.data,
        position: n.position,
        origin: (n as any).origin ?? [0, 0.5],
        width: n.width,
        height: n.height,
        selected: n.selected,
      }));
      const edges = getEdges().map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        selected: e.selected,
      }));

      const safeContent = {
        nodes,
        edges,
        viewport: rf.viewport,
      } as { nodes: Node[]; edges: Edge[]; viewport?: any };

      const response = await updateProjectAction(project.id, {
        content: safeContent,
      });

      if ('error' in response) {
        throw new Error(response.error);
      }

      setSaveState((prev) => ({ ...prev, lastSaved: new Date() }));
    } catch (error) {
      handleError('Error saving project', error);
    } finally {
      setSaveState((prev) => ({ ...prev, isSaving: false }));
    }
  }, 1000);

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      setNodes((current) => {
        const updated = applyNodeChanges(changes, current);
        save();
        onNodesChange?.(changes);
        return updated;
      });
    },
    [save, onNodesChange]
  );

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      setEdges((current) => {
        const updated = applyEdgeChanges(changes, current);
        save();
        onEdgesChange?.(changes);
        return updated;
      });
    },
    [save, onEdgesChange]
  );

  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      const newEdge: Edge = {
        id: nanoid(),
        type: 'animated',
        ...connection,
      };
      
      setEdges((eds: Edge[]) => {
        const newEdges = eds.concat(newEdge);
        
        // Re-validar conexões se esta nova conexão pode afetar o filtering
        const nodes = getNodes();
        const target = nodes.find(n => n.id === connection.target);
        const source = nodes.find(n => n.id === connection.source);
        
        // Se conectando texto a nó de imagem, re-validar limites de imagem
        if (target?.type === 'image' && source?.type === 'text') {
          const targetModel = target.data?.model;
          
          if (targetModel) {
            const maxImages = getModelMaxImages(targetModel, 'image');
            
            if (maxImages !== undefined) {
              // Contar conexões de imagem existentes (incluindo a nova se for imagem)
              const imageConnections = newEdges.filter(edge => 
                edge.target === target.id && 
                nodes.find(n => n.id === edge.source)?.type === 'image'
              );
              
              // Se excede o limite, remover as excedentes
              if (imageConnections.length > maxImages) {
                console.log('🔄 Re-validando após conectar texto:', {
                  targetModel,
                  maxImages,
                  imageConnections: imageConnections.length,
                  removing: imageConnections.length - maxImages
                });
                
                const connectionsToRemove = imageConnections.slice(maxImages);
                return newEdges.filter(edge => 
                  !connectionsToRemove.some(conn => conn.id === edge.id)
                );
              }
            }
          }
        }
        
        return newEdges;
      });
      
      save();
      onConnect?.(connection);
    },
    [save, onConnect, getNodes, getModelMaxImages]
  );

  const addNode = useCallback(
    (type: string, options?: Record<string, unknown>) => {
      const { data: nodeData, ...rest } = options ?? {};
      const newNode: Node = {
        id: nanoid(),
        type,
        data: {
          ...(nodeData ? nodeData : {}),
        },
        position: { x: 0, y: 0 },
        origin: [0, 0.5],
        ...rest,
      };

      setNodes((nds: Node[]) => nds.concat(newNode));
      save();

      analytics.track('toolbar', 'node', 'added', {
        type,
      });

      return newNode.id;
    },
    [save, analytics]
  );

  const duplicateNode = useCallback(
    (id: string) => {
      const node = getNode(id);

      if (!node || !node.type) {
        return;
      }

      const { id: oldId, ...rest } = node;

      const newId = addNode(node.type, {
        ...rest,
        position: {
          x: node.position.x + 200,
          y: node.position.y + 200,
        },
        selected: true,
      });

      setTimeout(() => {
        updateNode(id, { selected: false });
        updateNode(newId, { selected: true });
      }, 0);
    },
    [addNode, getNode, updateNode]
  );

  const handleConnectEnd = useCallback<OnConnectEnd>(
    (event, connectionState) => {
      // when a connection is dropped on the pane it's not valid

      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;

        const sourceId = connectionState.fromNode?.id;
        const isSourceHandle = connectionState.fromHandle?.type === 'source';

        if (!sourceId) {
          return;
        }

        const newNodeId = addNode('drop', {
          position: screenToFlowPosition({ x: clientX, y: clientY }),
          data: {
            isSource: !isSourceHandle,
            sourceNodeId: sourceId,
          },
        });

        setEdges((eds: Edge[]) =>
          eds.concat({
            id: nanoid(),
            source: isSourceHandle ? sourceId : newNodeId,
            target: isSourceHandle ? newNodeId : sourceId,
            type: 'temporary',
          })
        );
      }
    },
    [addNode, screenToFlowPosition]
  );

  const isValidConnection = useCallback<IsValidConnection>(
    (connection) => {
      // we are using getNodes and getEdges helpers here
      // to make sure we create isValidConnection function only once
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);


      if (connection.source) {
        const source = nodes.find((node) => node.id === connection.source);

        if (!source || !target) {
          return false;
        }

        const valid = isValidSourceTarget(source, target);

        if (!valid) {
          return false;
        }

        // Validar limite de imagens para modelos image-to-image
        if (target.type === 'image' && source.type === 'image') {
          const targetModel = target.data?.model;
          
          // Se não tem modelo definido ainda, permitir a conexão por enquanto
          if (targetModel) {
            const maxImages = getModelMaxImages(targetModel, 'image');
            
            // Se modelo tem limite definido, verificar
            if (maxImages !== undefined) {
              // Contar quantas imagens já estão conectadas ao target
              const existingImageConnections = edges.filter(edge => 
                edge.target === target.id && 
                nodes.find(n => n.id === edge.source)?.type === 'image'
              ).length;
              
              console.log('🔍 Validação de imagens:', {
                targetId: target.id,
                targetModel,
                maxImages,
                existingImageConnections,
                wouldBlock: existingImageConnections >= maxImages,
                targetData: target.data
              });
              
              if (existingImageConnections >= maxImages) {
                return false;
              }
            }
          }
        }

        // Bloquear conexões inválidas para vídeo: apenas texto/agente podem conectar
        if (target.type === 'video' && !(source.type === 'text' || source.type === 'agent')) {
          return false;
        }

        // Validar limite de conexões de prompt (texto/agente)
        // Regra: Qualquer nó (text, image, video, agent) aceita no máximo UMA entrada do tipo 'prompt'
        // 'prompt' = conexões vindas de nós 'text' OU 'agent'. Não pode ter os dois.
        const isPromptSource = source.type === 'text' || source.type === 'agent';
        const isPromptTarget = ['text', 'image', 'video', 'agent'].includes(target.type);
        if (isPromptSource && isPromptTarget) {
          const existingPromptConnections = edges.filter(edge =>
            edge.target === target.id &&
            ['text', 'agent'].includes(nodes.find(n => n.id === edge.source)?.type || '')
          ).length;

          if (existingPromptConnections >= 1) {
            return false;
          }
        }
      }

      // Prevent cycles
      const hasCycle = (node: Node, visited = new Set<string>()) => {
        if (visited.has(node.id)) {
          return false;
        }

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source || hasCycle(outgoer, visited)) {
            return true;
          }
        }
      };

      if (!target || target.id === connection.source) {
        return false;
      }

      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  const handleConnectStart = useCallback<OnConnectStart>(() => {
    // Delete any drop nodes when starting to drag a node
    setNodes((nds: Node[]) => nds.filter((n: Node) => n.type !== 'drop'));
    setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.type !== 'temporary'));
    save();
  }, [save]);

  const addDropNode = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const { x, y } = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode('drop', {
        position: { x, y },
      });
    },
    [addNode, screenToFlowPosition]
  );

  const handleSelectAll = useCallback(() => {
    setNodes((nodes: Node[]) =>
      nodes.map((node: Node) => ({ ...node, selected: true }))
    );
  }, []);

  const handleCopy = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    if (selectedNodes.length > 0) {
      setCopiedNodes(selectedNodes);
    }
  }, [getNodes]);

  const handlePaste = useCallback(() => {
    if (copiedNodes.length === 0) {
      return;
    }

    const newNodes = copiedNodes.map((node) => ({
      ...node,
      id: nanoid(),
      position: {
        x: node.position.x + 200,
        y: node.position.y + 200,
      },
      selected: true,
    }));

    // Unselect all existing nodes
    setNodes((nodes: Node[]) =>
      nodes.map((node: Node) => ({
        ...node,
        selected: false,
      }))
    );

    // Add new nodes
    setNodes((nodes: Node[]) => [...nodes, ...newNodes]);
  }, [copiedNodes]);

  const handleDuplicateAll = useCallback(() => {
    const selected = getNodes().filter((node) => node.selected);

    for (const node of selected) {
      duplicateNode(node.id);
    }
  }, [getNodes, duplicateNode]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (
      !(event.target instanceof HTMLElement) ||
      !event.target.classList.contains('react-flow__pane')
    ) {
      event.preventDefault();
    }
  }, []);

  useHotkeys('meta+a', handleSelectAll, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  useHotkeys('meta+d', handleDuplicateAll, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  useHotkeys('meta+c', handleCopy, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  useHotkeys('meta+v', handlePaste, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  return (
    <NodeOperationsProvider addNode={addNode} duplicateNode={duplicateNode}>
      <NodeDropzoneProvider>
        <ContextMenu>
          <ContextMenuTrigger onContextMenu={handleContextMenu}>
            <ReactFlow
              deleteKeyCode={['Backspace', 'Delete']}
              nodes={nodes}
              onNodesChange={handleNodesChange}
              edges={edges}
              onEdgesChange={handleEdgesChange}
              onConnectStart={handleConnectStart}
              onConnect={handleConnect}
              onConnectEnd={handleConnectEnd}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              isValidConnection={isValidConnection}
              connectionLineComponent={ConnectionLine}
              panOnScroll={false}
              zoomOnScroll={true}
              panOnDrag={[1]}
              fitView
              zoomOnDoubleClick={false}
              selectionOnDrag={true}
              onDoubleClick={addDropNode}
              minZoom={0.01}
              maxZoom={10}
              {...rest}
            >
              <Background />
              {children}
            </ReactFlow>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={addDropNode}>
              <PlusIcon size={12} />
              <span>Adicionar novo nó</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleSelectAll}>
              <BoxSelectIcon size={12} />
              <span>Selecionar tudo</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </NodeDropzoneProvider>
    </NodeOperationsProvider>
  );
};
