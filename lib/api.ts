const TIMEOUT_MS = 12_000;

export class NetworkError extends Error {
  readonly isNetworkError = true;
  constructor(message = "Can't reach the server. Check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    const msg =
      err.name === "AbortError"
        ? "Request timed out. The server may be down."
        : "Can't reach the server. Check your connection.";
    throw new NetworkError(msg);
  } finally {
    clearTimeout(timer);
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
