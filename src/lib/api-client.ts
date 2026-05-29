const API_BASE =
  process.env.NEXT_PUBLIC_PAYMENTS_API_BASE ||
  "http://localhost:3000/api/v1/public/payments-portal";

type ApiEnvelope<T> = {
  statuscode: number;
  message: string;
  data: T;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok) {
    throw new Error(json?.message || `API_${res.status}`);
  }
  if (!json) {
    throw new Error("INVALID_RESPONSE");
  }
  return json.data;
}

export function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  return request<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token
  );
}

export function apiGet<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { method: "GET" }, token);
}
