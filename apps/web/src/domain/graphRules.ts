import type { CanvasNodeType } from '../types';
import type { GraphIndex } from './graphIndex';

const ALLOWED_TARGET: Record<CanvasNodeType, CanvasNodeType | undefined> = {
  prompt: 'generator',
  generator: 'result',
  result: undefined,
};

export const MAX_NODES = 20;
export const MAX_EDGES = 20;

export function isConnectionAllowed(
  connection: { source: string | null; target: string | null },
  index: GraphIndex,
): boolean {
  if (!connection.source || !connection.target) return false;
  if (connection.source === connection.target) return false;

  const source = index.nodesById.get(connection.source);
  const target = index.nodesById.get(connection.target);
  if (!source || !target) return false;
  if (ALLOWED_TARGET[source.type] !== target.type) return false;
  if (index.incomingSource.has(connection.target)) return false;
  if (source.type === 'generator' && index.outgoingTarget.has(connection.source)) return false;

  return true;
}
