export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4001';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

type ApiResult<T> = {
  data: T;
  headers: Headers;
};

async function parseErrorBody(response: Response): Promise<{ code: string; message: string }> {
  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string } };
    return {
      code: payload.error?.code ?? 'UNKNOWN_ERROR',
      message: payload.error?.message ?? 'Не удалось обработать ответ сервера.',
    };
  } catch {
    return { code: 'UNKNOWN_ERROR', message: 'Не удалось обработать ответ сервера.' };
  }
}

export async function request<T>(options: RequestOptions): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${options.path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Сервер недоступен. Проверьте соединение и повторите.');
  }

  if (!response.ok) {
    const { code, message } = await parseErrorBody(response);
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers };
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers };
}

export function resolveAssetUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
