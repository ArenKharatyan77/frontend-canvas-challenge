import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasActions } from '../../hooks/useCanvasActions';
import type { PromptNode as PromptNodeType } from '../../types';

export function PromptNode({ id, data, selected }: NodeProps<PromptNodeType>) {
  const { updateText, deleteNode } = useCanvasActions();

  return (
    <div className={`canvas-node canvas-node--prompt${selected ? ' is-selected' : ''}`}>
      <div className="canvas-node__header">
        <span>Текст</span>
        <button
          type="button"
          className="canvas-node__remove"
          onClick={() => deleteNode(id)}
          aria-label="Удалить ноду"
        >
          ×
        </button>
      </div>
      <textarea
        className="canvas-node__textarea nodrag"
        value={data.text}
        placeholder="Опишите изображение…"
        maxLength={2000}
        onChange={(event) => updateText(id, event.target.value)}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
