import type { ApiError } from '../api/http';

type Props = {
  status: 'conflict' | 'error';
  error: ApiError | null;
  onReload: () => void;
};

export function ConflictBanner({ status, error, onReload }: Props) {
  const message =
    status === 'conflict'
      ? 'Граф изменился на сервере. Ваши правки на экране сохранены — перечитайте серверную версию, чтобы продолжить.'
      : (error?.message ?? 'Не удалось сохранить граф. Попробуйте ещё раз.');

  return (
    <div className="conflict-banner" role="alert">
      <span>{message}</span>
      {status === 'conflict' && (
        <button type="button" onClick={onReload}>
          Перечитать граф
        </button>
      )}
    </div>
  );
}
