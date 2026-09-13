import type { GraphData } from '@canvas/contracts';
import { ApiError } from '../api/http';
import { fetchGraph, saveGraph } from '../api/graph';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'conflict' | 'error';

export type SaveState = {
  status: SaveStatus;
  error: ApiError | null;
};

type Listener = (state: SaveState) => void;

export class GraphSaveQueue {
  private pending: GraphData | null = null;
  private inFlight: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private status: SaveStatus = 'idle';
  private error: ApiError | null = null;
  private etagValue: string;
  private listeners = new Set<Listener>();

  constructor(
    private readonly spaceId: string,
    etag: string,
    private readonly debounceMs: number,
  ) {
    this.etagValue = etag;
  }

  get etag(): string {
    return this.etagValue;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  schedule(graph: GraphData): void {
    this.pending = graph;
    this.emit('pending');
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.pump();
    }, this.debounceMs);
  }

  async flush(): Promise<{ etag: string } | null> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (;;) {
      if (this.inFlight) {
        await this.inFlight;
        continue;
      }
      if (!this.pending) break;
      this.pump();
    }
    return this.status === 'conflict' || this.status === 'error' ? null : { etag: this.etagValue };
  }

  async reload(): Promise<GraphData> {
    const { graph, etag } = await fetchGraph(this.spaceId);
    this.etagValue = etag;
    this.pending = null;
    this.emit('idle');
    return graph;
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.listeners.clear();
  }

  private snapshot(): SaveState {
    return { status: this.status, error: this.error };
  }

  private emit(status: SaveStatus, error: ApiError | null = null): void {
    this.status = status;
    this.error = error;
    for (const listener of this.listeners) listener(this.snapshot());
  }

  private pump(): void {
    if (this.inFlight || !this.pending) return;
    const graph = this.pending;
    this.pending = null;
    this.emit('saving');
    this.inFlight = saveGraph(this.spaceId, graph, this.etagValue)
      .then((result) => {
        this.etagValue = result.etag;
        this.emit(this.pending ? 'pending' : 'saved');
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof ApiError)) throw cause;
        this.pending = graph;
        this.emit(cause.status === 412 ? 'conflict' : 'error', cause);
      })
      .finally(() => {
        this.inFlight = null;
        if (this.pending && this.status !== 'conflict' && this.status !== 'error') this.pump();
      });
  }
}
