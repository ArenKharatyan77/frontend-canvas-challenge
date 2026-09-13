import { request } from './http';

export type RuntimeConfig = {
  debounceMs: number;
  pollIntervalMs: number;
  generationDelayMs: number;
  maxNodes: number;
  maxEdges: number;
};

export async function fetchConfig(): Promise<RuntimeConfig> {
  const { data } = await request<RuntimeConfig>({ path: '/api/config' });
  return data;
}
