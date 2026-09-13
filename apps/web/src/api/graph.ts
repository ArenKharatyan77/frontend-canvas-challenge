import { request } from './http';
import type { GraphData } from '@canvas/contracts';

export type StoredGraph = { graph: GraphData; etag: string };

function requireETag(headers: Headers): string {
  const etag = headers.get('ETag');
  if (!etag) throw new Error('Ответ сервера не содержит ETag графа.');
  return etag;
}

export async function fetchGraph(spaceId: string): Promise<StoredGraph> {
  const { data, headers } = await request<GraphData>({ path: `/api/spaces/${spaceId}/graph` });
  return { graph: data, etag: requireETag(headers) };
}

export async function saveGraph(
  spaceId: string,
  graph: GraphData,
  etag: string,
): Promise<StoredGraph> {
  const { data, headers } = await request<GraphData>({
    method: 'PUT',
    path: `/api/spaces/${spaceId}/graph`,
    body: graph,
    headers: { 'If-Match': etag },
  });
  return { graph: data, etag: requireETag(headers) };
}
