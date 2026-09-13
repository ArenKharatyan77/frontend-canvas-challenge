import type { GraphData } from '@canvas/contracts';
import type { Viewport } from '@xyflow/react';
import type { CanvasNode, CanvasEdge } from '../types';

export function toPersistedGraph(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  viewport: Viewport,
): GraphData {
  return {
    nodes: nodes.map(
      (node) =>
        ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        }) as GraphData['nodes'][number],
    ),
    edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
    viewport,
  };
}

export function fromPersistedGraph(graph: GraphData): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;
} {
  return {
    nodes: graph.nodes.map(
      (node) =>
        ({ id: node.id, type: node.type, position: node.position, data: node.data }) as CanvasNode,
    ),
    edges: graph.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
    viewport: graph.viewport,
  };
}
