import type { SaveStatus } from '../domain/graphSaveQueue';

const LABELS: Record<SaveStatus, string> = {
  idle: 'Синхронизировано',
  pending: 'Есть несохранённые правки',
  saving: 'Сохраняем…',
  saved: 'Сохранено',
  conflict: 'Конфликт версий',
  error: 'Ошибка сохранения',
};

export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  return <span className={`save-badge save-badge--${status}`}>{LABELS[status]}</span>;
}
