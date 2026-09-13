import { createContext, useContext } from 'react';
import type { GenerationData, GenerationRequest } from '@canvas/contracts';
import type { ApiError } from '../api/http';

export type CanvasActions = {
  updateText(nodeId: string, text: string): void;
  deleteNode(nodeId: string): void;
  generate(nodeId: string, scenario?: GenerationRequest['scenario']): void;
  generationFor(nodeId: string): GenerationData | null;
  generationErrorFor(nodeId: string): ApiError | null;
  hasResultTarget(nodeId: string): boolean;
  imageFor(resultNodeId: string): string | null;
};

export const CanvasActionsContext = createContext<CanvasActions | null>(null);

export function useCanvasActions(): CanvasActions {
  const value = useContext(CanvasActionsContext);
  if (!value) throw new Error('useCanvasActions must be used inside CanvasActionsContext');
  return value;
}
