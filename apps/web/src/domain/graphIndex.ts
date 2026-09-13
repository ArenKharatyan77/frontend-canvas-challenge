import type { CanvasNode, CanvasEdge } from '../types';

export type GraphIndex = {
  nodesById: Map<string, CanvasNode>;
  incomingSource: Map<string, string>;
  outgoingTarget: Map<string, string>;
};

export function buildGraphIndex(nodes: CanvasNode[], edges: CanvasEdge[]): GraphIndex {
  const nodesById = new Map<string, CanvasNode>();
  for (const node of nodes) nodesById.set(node.id, node);

  const incomingSource = new Map<string, string>();
  const outgoingTarget = new Map<string, string>();
  for (const edge of edges) {
    incomingSource.set(edge.target, edge.source);
    outgoingTarget.set(edge.source, edge.target);
  }

  return { nodesById, incomingSource, outgoingTarget };
}
