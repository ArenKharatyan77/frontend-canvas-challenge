import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasActions } from '../../hooks/useCanvasActions';
import type { ResultNode as ResultNodeType } from '../../types';

export function ResultNode({ id, data, selected }: NodeProps<ResultNodeType>) {
  const { deleteNode, imageFor } = useCanvasActions();
  const imageUrl = imageFor(id);

  return (
    <div className={`canvas-node canvas-node--result${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="canvas-node__header">
        <span>{data.label}</span>
        <button
          type="button"
          className="canvas-node__remove"
          onClick={() => deleteNode(id)}
          aria-label="Удалить ноду"
        >
          ×
        </button>
      </div>
      <div className="canvas-node__preview">
        {imageUrl ? (
          <img src={imageUrl} alt="Результат генерации" />
        ) : (
          <span className="canvas-node__placeholder">Пока пусто</span>
        )}
      </div>
    </div>
  );
}
