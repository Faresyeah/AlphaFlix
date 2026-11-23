/**
 * عميل HTTP مشترك بلا حالة خاصة بقسم: timeout، إعادة محاولة محدودة،
 * منع تكرار الطلبات المتطابقة الجارية، وذاكرة مؤقتة قصيرة (TTL) في الذاكرة.
 * مفاتيح الكاش هي الرابط الكامل، لذلك لا تتداخل بيانات الأقسام.
 */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `HTTP_${status}`);
    this.status = status;
  }
}

type Options = {
  headers?: Record<string, string>;
  retries?: number;
  timeoutMs?: number;
  /** مدة الكاش بالملّي ثانية؛ 0 يعطّله. */
  ttlMs?: number;
};

const memory = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const MAX_CACHE = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getJson<T>(url: string, options: Options = {}): Promise<T> {
  const { headers, retries = 1, timeoutMs = 20000, ttlMs = 0 } = options;
  if (ttlMs > 0) {
    const hit = memory.get(url);
    if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  }
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const run = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { headers: { Accept: "application/json", ...headers }, signal: controller.signal });
        if (!response.ok) throw new HttpError(response.status);
        const value = (await response.json()) as T;
        if (ttlMs > 0) {
          if (memory.size >= MAX_CACHE) memory.delete(memory.keys().next().value as string);
          memory.set(url, { at: Date.now(), value });
        }
        return value;
      } catch (error) {
        lastError = error;
        // 4xx (عدا 408/429) لا فائدة من إعادته
        if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) break;
        if (attempt < retries) await sleep(400 * (attempt + 1));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error ? lastError : new Error("NETWORK_ERROR");
  })();

  inflight.set(url, run);
  try {
    return await run;
  } finally {
    inflight.delete(url);
  }
}

export function clearHttpCache() {
  memory.clear();
}
