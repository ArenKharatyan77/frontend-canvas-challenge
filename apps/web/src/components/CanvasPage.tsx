import { useSpace } from '../hooks/useSpace';
import { useCanvasBootstrap } from '../hooks/useCanvasBootstrap';
import { Canvas } from './Canvas';

export function CanvasPage() {
  const space = useSpace();

  if (space.status === 'loading') return <CenteredMessage text="Открываем пространство…" />;
  if (space.status === 'error') return <CenteredMessage text={space.error.message} isError />;

  return <CanvasBootstrapped spaceId={space.spaceId} />;
}

function CanvasBootstrapped({ spaceId }: { spaceId: string }) {
  const bootstrap = useCanvasBootstrap(spaceId);

  if (bootstrap.status === 'loading') return <CenteredMessage text="Загружаем граф…" />;
  if (bootstrap.status === 'error')
    return <CenteredMessage text={bootstrap.error.message} isError />;

  return (
    <Canvas
      key={spaceId}
      spaceId={spaceId}
      initialGraph={bootstrap.graph}
      initialEtag={bootstrap.etag}
      initialGenerations={bootstrap.generations}
      config={bootstrap.config}
    />
  );
}

function CenteredMessage({ text, isError }: { text: string; isError?: boolean }) {
  return (
    <div className={`centered-message${isError ? ' centered-message--error' : ''}`}>{text}</div>
  );
}
