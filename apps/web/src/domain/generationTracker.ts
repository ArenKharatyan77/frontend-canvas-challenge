import type { GenerationData, GenerationRequest } from '@canvas/contracts';
import { ApiError } from '../api/http';
import { createGeneration, fetchGeneration } from '../api/generations';

type Listener = () => void;

export class GenerationTracker {
  private byNode = new Map<string, GenerationData>();
  private errors = new Map<string, ApiError>();
  private controllers = new Map<string, AbortController>();
  private listeners = new Set<Listener>();

  constructor(
    private readonly spaceId: string,
    private readonly pollIntervalMs: number,
  ) {}

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get(nodeId: string): GenerationData | null {
    return this.byNode.get(nodeId) ?? null;
  }

  errorFor(nodeId: string): ApiError | null {
    return this.errors.get(nodeId) ?? null;
  }

  restore(generations: GenerationData[]): void {
    for (const generation of generations) {
      const existing = this.byNode.get(generation.nodeId);
      if (!existing || existing.createdAt < generation.createdAt)
        this.byNode.set(generation.nodeId, generation);
    }
    for (const generation of this.byNode.values())
      if (generation.status === 'processing') this.track(generation);
    this.emit();
  }

  async start(
    nodeId: string,
    graphETag: string,
    scenario: GenerationRequest['scenario'] = 'success',
  ): Promise<void> {
    this.controllers.get(nodeId)?.abort();
    this.errors.delete(nodeId);
    const key = crypto.randomUUID();
    try {
      const generation = await createGeneration(this.spaceId, { nodeId, graphETag, scenario }, key);
      this.byNode.set(nodeId, generation);
      this.emit();
      this.track(generation);
    } catch (cause) {
      if (!(cause instanceof ApiError)) throw cause;
      this.errors.set(nodeId, cause);
      this.emit();
    }
  }

  forget(nodeId: string): void {
    this.controllers.get(nodeId)?.abort();
    this.controllers.delete(nodeId);
    this.byNode.delete(nodeId);
    this.errors.delete(nodeId);
    this.emit();
  }

  dispose(): void {
    for (const controller of this.controllers.values()) controller.abort();
    this.controllers.clear();
    this.listeners.clear();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private track(generation: GenerationData): void {
    if (generation.status !== 'processing') return;
    const controller = new AbortController();
    this.controllers.set(generation.nodeId, controller);
    this.poll(generation, controller.signal);
  }

  private async poll(generation: GenerationData, signal: AbortSignal): Promise<void> {
    await delay(this.pollIntervalMs, signal);
    if (signal.aborted) return;

    let next: GenerationData;
    try {
      next = await fetchGeneration(this.spaceId, generation.id);
    } catch {
      if (signal.aborted) return;
      return this.poll(generation, signal);
    }
    if (signal.aborted) return;

    const current = this.byNode.get(generation.nodeId);
    if (current?.id !== generation.id) return;

    this.byNode.set(generation.nodeId, next);
    this.emit();
    if (next.status === 'processing') this.poll(next, signal);
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
