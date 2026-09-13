import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/http';
import { createSpace, getSpace, type SpaceData } from '../api/spaces';

const STORAGE_KEY = 'canvas.spaceId';

type SpaceState =
  | { status: 'loading' }
  | { status: 'ready'; spaceId: string }
  | { status: 'error'; error: ApiError };

async function resolveSpace(): Promise<SpaceData> {
  const storedId = localStorage.getItem(STORAGE_KEY);
  const existing = storedId ? await getSpace(storedId).catch(() => null) : null;
  const space = existing ?? (await createSpace('Мой канвас'));
  localStorage.setItem(STORAGE_KEY, space.id);
  return space;
}

export function useSpace(): SpaceState {
  const [state, setState] = useState<SpaceState>({ status: 'loading' });
  const bootstrapRef = useRef<Promise<SpaceData> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!bootstrapRef.current) bootstrapRef.current = resolveSpace();

    bootstrapRef.current
      .then((space) => {
        if (!cancelled) setState({ status: 'ready', spaceId: space.id });
      })
      .catch((cause) => {
        if (!cancelled && cause instanceof ApiError) setState({ status: 'error', error: cause });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
