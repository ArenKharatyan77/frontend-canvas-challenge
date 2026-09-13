import { request } from './http';
import type { GenerationData, GenerationRequest } from '@canvas/contracts';

export async function listGenerations(spaceId: string): Promise<GenerationData[]> {
  const { data } = await request<GenerationData[]>({ path: `/api/spaces/${spaceId}/generations` });
  return data;
}

export async function createGeneration(
  spaceId: string,
  body: GenerationRequest,
  idempotencyKey: string,
): Promise<GenerationData> {
  const { data } = await request<GenerationData>({
    method: 'POST',
    path: `/api/spaces/${spaceId}/generations`,
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data;
}

export async function fetchGeneration(
  spaceId: string,
  generationId: string,
): Promise<GenerationData> {
  const { data } = await request<GenerationData>({
    path: `/api/spaces/${spaceId}/generations/${generationId}`,
  });
  return data;
}
