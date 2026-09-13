import { useEffect, useRef, useState } from 'react';
import { GraphSaveQueue, type SaveState } from '../domain/graphSaveQueue';

export function useGraphSaveQueue(spaceId: string, initialEtag: string, debounceMs: number) {
  const queueRef = useRef<GraphSaveQueue | null>(null);
  if (!queueRef.current) queueRef.current = new GraphSaveQueue(spaceId, initialEtag, debounceMs);
  const queue = queueRef.current;

  const [state, setState] = useState<SaveState>({ status: 'idle', error: null });

  useEffect(() => queue.subscribe(setState), [queue]);
  useEffect(() => () => queue.dispose(), [queue]);

  return { ...state, queue };
}
