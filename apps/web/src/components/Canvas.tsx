import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type OnMoveEnd,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { GraphData, GenerationData, GenerationRequest } from '@canvas/contracts';
import type { RuntimeConfig } from '../api/config';
import { resolveAssetUrl } from '../api/http';
import { fromPersistedGraph, toPersistedGraph } from '../domain/persistedGraph';
import { buildGraphIndex } from '../domain/graphIndex';
import { isConnectionAllowed, MAX_EDGES, MAX_NODES } from '../domain/graphRules';
import { useGraphSaveQueue } from '../hooks/useGraphSaveQueue';
import { useGenerationTracker } from '../hooks/useGenerationTracker';
import { CanvasActionsContext, type CanvasActions } from '../hooks/useCanvasActions';
import { nodeTypes } from './nodes';
import { Toolbar } from './Toolbar';
import { ConflictBanner } from './ConflictBanner';
import type { CanvasNode, CanvasEdge, CanvasNodeType } from '../types';

type Props = {
  spaceId: string;
  initialGraph: GraphData;
  initialEtag: string;
  initialGenerations: GenerationData[];
  config: RuntimeConfig;
};

function createNode(type: CanvasNodeType, order: number): CanvasNode {
  const id = crypto.randomUUID();
  const position = { x: 80 + (order % 4) * 260, y: 80 + Math.floor(order / 4) * 180 };
  if (type === 'prompt') return { id, type, position, data: { text: '' } };
  if (type === 'generator') return { id, type, position, data: { label: 'Генератор' } };
  return { id, type, position, data: { label: 'Результат' } };
}

function CanvasInner({ spaceId, initialGraph, initialEtag, initialGenerations, config }: Props) {
  const initial = useMemo(() => fromPersistedGraph(initialGraph), [initialGraph]);
  const [nodes, setNodes] = useState<CanvasNode[]>(initial.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(initial.edges);
  const viewportRef = useRef<Viewport>(initial.viewport);
  const reactFlowInstance = useReactFlow();

  const {
    status: saveStatus,
    error: saveError,
    queue: saveQueue,
  } = useGraphSaveQueue(spaceId, initialEtag, config.debounceMs);
  const { tracker: generationTracker, version: generationVersion } = useGenerationTracker(
    spaceId,
    config.pollIntervalMs,
  );

  useEffect(() => {
    generationTracker.restore(initialGenerations);
  }, [generationTracker, initialGenerations]);

  const index = useMemo(() => buildGraphIndex(nodes, edges), [nodes, edges]);

  const scheduleSave = useCallback(
    (nextNodes: CanvasNode[], nextEdges: CanvasEdge[]) => {
      saveQueue.schedule(toPersistedGraph(nextNodes, nextEdges, viewportRef.current));
    },
    [saveQueue],
  );

  // node delete cascades into an edges change too, fired as a separate handler —
  // flag + effect avoids each handler reading the other's stale pre-update array
  const dirtyRef = useRef(false);
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    scheduleSave(nodes, edges);
  }, [nodes, edges, scheduleSave]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
      if (
        changes.some(
          (change) =>
            change.type === 'position' || change.type === 'add' || change.type === 'remove',
        )
      )
        markDirty();
      for (const change of changes)
        if (change.type === 'remove') generationTracker.forget(change.id);
    },
    [markDirty, generationTracker],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdge>[]) => {
      setEdges((current) => applyEdgeChanges(changes, current));
      if (changes.some((change) => change.type === 'add' || change.type === 'remove')) markDirty();
    },
    [markDirty],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (edges.length >= MAX_EDGES) return;
      if (!isConnectionAllowed(connection, index)) return;
      setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
      markDirty();
    },
    [edges.length, index, markDirty],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) =>
      edges.length < MAX_EDGES && isConnectionAllowed(connection, index),
    [edges.length, index],
  );

  const handleMoveEnd = useCallback<OnMoveEnd>(
    (_event, viewport) => {
      const unchanged =
        viewport.x === viewportRef.current.x &&
        viewport.y === viewportRef.current.y &&
        viewport.zoom === viewportRef.current.zoom;
      viewportRef.current = viewport;
      if (unchanged) return;
      scheduleSave(nodes, edges);
    },
    [nodes, edges, scheduleSave],
  );

  const handleAddNode = useCallback(
    (type: CanvasNodeType) => {
      if (nodes.length >= MAX_NODES) return;
      setNodes((current) => [...current, createNode(type, current.length)]);
      markDirty();
    },
    [nodes.length, markDirty],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      reactFlowInstance.deleteElements({ nodes: [{ id: nodeId }] });
    },
    [reactFlowInstance],
  );

  const handleGenerate = useCallback(
    async (nodeId: string, scenario: GenerationRequest['scenario'] = 'success') => {
      if (!index.outgoingTarget.has(nodeId)) return;
      const flushed = await saveQueue.flush();
      if (!flushed) return;
      await generationTracker.start(nodeId, flushed.etag, scenario);
    },
    [index, saveQueue, generationTracker],
  );

  const handleReload = useCallback(async () => {
    const graph = await saveQueue.reload();
    const restored = fromPersistedGraph(graph);
    setNodes(restored.nodes);
    setEdges(restored.edges);
    viewportRef.current = restored.viewport;
    reactFlowInstance.setViewport(restored.viewport);
  }, [saveQueue, reactFlowInstance]);

  const actions = useMemo<CanvasActions>(
    () => ({
      updateText: (nodeId, text) => {
        setNodes((current) =>
          current.map((node) =>
            node.id === nodeId && node.type === 'prompt'
              ? { ...node, data: { ...node.data, text } }
              : node,
          ),
        );
        markDirty();
      },
      deleteNode: handleDeleteNode,
      generate: handleGenerate,
      generationFor: (nodeId) => generationTracker.get(nodeId),
      generationErrorFor: (nodeId) => generationTracker.errorFor(nodeId),
      hasResultTarget: (nodeId) => index.outgoingTarget.has(nodeId),
      imageFor: (resultNodeId) => {
        const generatorId = index.incomingSource.get(resultNodeId);
        if (!generatorId) return null;
        const generation = generationTracker.get(generatorId);
        if (!generation || generation.status !== 'succeeded') return null;
        if (generation.resultNodeId !== resultNodeId || !generation.imageUrl) return null;
        return resolveAssetUrl(generation.imageUrl);
      },
    }),
    [markDirty, handleDeleteNode, handleGenerate, generationTracker, generationVersion, index],
  );

  return (
    <div className="canvas-page">
      <Toolbar
        saveStatus={saveStatus}
        onAddNode={handleAddNode}
        canAddNode={nodes.length < MAX_NODES}
      />
      {(saveStatus === 'conflict' || saveStatus === 'error') && (
        <ConflictBanner status={saveStatus} error={saveError} onReload={handleReload} />
      )}
      <CanvasActionsContext.Provider value={actions}>
        <div className="canvas-surface">
          <ReactFlow<CanvasNode, CanvasEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            onMoveEnd={handleMoveEnd}
            defaultViewport={initial.viewport}
            minZoom={0.1}
            maxZoom={4}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </CanvasActionsContext.Provider>
    </div>
  );
}

export function Canvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
