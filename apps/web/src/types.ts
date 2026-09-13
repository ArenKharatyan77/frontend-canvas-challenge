import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from '@canvas/contracts';

export type CanvasNodeType = NodeData['type'];

export type PromptNode = Node<{ text: string }, 'prompt'>;
export type GeneratorNode = Node<{ label: string }, 'generator'>;
export type ResultNode = Node<{ label: string }, 'result'>;
export type CanvasNode = PromptNode | GeneratorNode | ResultNode;
export type CanvasEdge = Edge;
