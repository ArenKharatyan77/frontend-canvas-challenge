import { useEffect, useRef, useState } from 'react';
import { GenerationTracker } from '../domain/generationTracker';

export function useGenerationTracker(spaceId: string, pollIntervalMs: number) {
  const trackerRef = useRef<GenerationTracker | null>(null);
  if (!trackerRef.current) trackerRef.current = new GenerationTracker(spaceId, pollIntervalMs);
  const tracker = trackerRef.current;

  const [version, setVersion] = useState(0);

  useEffect(() => tracker.subscribe(() => setVersion((tick) => tick + 1)), [tracker]);
  useEffect(() => () => tracker.dispose(), [tracker]);

  return { tracker, version };
}
