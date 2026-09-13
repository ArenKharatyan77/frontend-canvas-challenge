import { request } from './http';
import type { SpaceData } from '@canvas/contracts';

export type { SpaceData };

export async function createSpace(title: string): Promise<SpaceData> {
  const { data } = await request<SpaceData>({
    method: 'POST',
    path: '/api/spaces',
    body: { title },
  });
  return data;
}

export async function getSpace(spaceId: string): Promise<SpaceData> {
  const { data } = await request<SpaceData>({ path: `/api/spaces/${spaceId}` });
  return data;
}
