import { useEffect, useState } from 'react';
import { ApiError } from '../api/http';
import { fetchConfig, type RuntimeConfig } from '../api/config';
import { fetchGraph } from '../api/graph';
import { listGenerations } from '../api/generations';
import type { GraphData, GenerationData } from '@canvas/contracts';

type BootstrapData = {
  graph: GraphData;
  etag: string;
  generations: GenerationData[];
  config: RuntimeConfig;
};

type BootstrapState =
  | { status: 'loading' }
  | ({ status: 'ready' } & BootstrapData)
  | { status: 'error'; error: ApiError };

export function useCanvasBootstrap(spaceId: string): BootstrapState {
  const [state, setState] = useState<BootstrapState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    async function load() {
      try {
        const [{ graph, etag }, generations, config] = await Promise.all([
          fetchGraph(spaceId),
          listGenerations(spaceId),
          fetchConfig(),
        ]);
        if (!cancelled) setState({ status: 'ready', graph, etag, generations, config });
      } catch (cause) {
        if (cancelled) return;
        if (cause instanceof ApiError) setState({ status: 'error', error: cause });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  return state;
}
