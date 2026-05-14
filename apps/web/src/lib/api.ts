const DEFAULT_API_URL = "http://localhost:8080/api";

type ApiOptions = RequestInit & {
  token?: string;
};

function getApiUrl() {
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      DEFAULT_API_URL
    );
  }

  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

function buildUrl(endpoint: string) {
  const baseUrl = getApiUrl().replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");

  return new URL(path, `${baseUrl}/`).toString();
}

function getErrorMessage(status: number, body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return `API error ${status}`;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const url = buildUrl(endpoint);
  const { token, headers: optionHeaders, ...fetchOptions } = options;

  const headers = new Headers(optionHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    !headers.has("Content-Type") &&
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      cache: fetchOptions.cache || "no-store",
    });

    if (!response.ok) {
      const errorBody = await readResponseBody(response);

      throw new Error(getErrorMessage(response.status, errorBody));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return readResponseBody(response) as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Gagal terhubung ke API di ${url}.`);
    }

    throw error;
  }
}
