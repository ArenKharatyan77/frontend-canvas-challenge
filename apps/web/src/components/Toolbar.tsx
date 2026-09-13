import type { SaveStatus } from '../domain/graphSaveQueue';
import { SaveStatusBadge } from './SaveStatusBadge';
import type { CanvasNodeType } from '../types';

type Props = {
  saveStatus: SaveStatus;
  onAddNode: (type: CanvasNodeType) => void;
  canAddNode: boolean;
};

export function Toolbar({ saveStatus, onAddNode, canAddNode }: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button type="button" disabled={!canAddNode} onClick={() => onAddNode('prompt')}>
          + Текст
        </button>
        <button type="button" disabled={!canAddNode} onClick={() => onAddNode('generator')}>
          + Генератор
        </button>
        <button type="button" disabled={!canAddNode} onClick={() => onAddNode('result')}>
          + Результат
        </button>
      </div>
      <SaveStatusBadge status={saveStatus} />
    </div>
  );
}
