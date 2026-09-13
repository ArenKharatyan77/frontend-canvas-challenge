import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasActions } from '../../hooks/useCanvasActions';
import type { GeneratorNode as GeneratorNodeType } from '../../types';

export function GeneratorNode({ id, data, selected }: NodeProps<GeneratorNodeType>) {
  const { deleteNode, generate, generationFor, generationErrorFor, hasResultTarget } =
    useCanvasActions();
  const generation = generationFor(id);
  const startError = generationErrorFor(id);
  const canRun = hasResultTarget(id);
  const isRunning = generation?.status === 'processing';

  const label = isRunning
    ? 'Генерируем…'
    : generation?.status === 'failed'
      ? 'Повторить'
      : 'Сгенерировать';

  return (
    <div className={`canvas-node canvas-node--generator${selected ? ' is-selected' : ''}`}>
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
      <button
        type="button"
        className="canvas-node__generate nodrag"
        disabled={!canRun || isRunning}
        onClick={() => generate(id)}
      >
        {label}
      </button>
      <button
        type="button"
        className="canvas-node__generate-failure nodrag"
        disabled={!canRun || isRunning}
        onClick={() => generate(id, 'failure')}
      >
        Смоделировать отказ
      </button>
      {!canRun && <p className="canvas-node__hint">Соедините текст и результат</p>}
      {generation?.status === 'failed' && (
        <p className="canvas-node__error">Не получилось сгенерировать</p>
      )}
      {startError && <p className="canvas-node__error">{startError.message}</p>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
