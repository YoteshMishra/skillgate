/*
 * runWithFallback: the if/else around every Hugging Face call.
 *
 *   if (token exists and HF is not known to be rejecting us) -> try live
 *   else / on any failure                                    -> static fallback
 *
 * Real errors are logged on the server only, never sent to the client.
 * After an auth/quota failure (401/402/403/429, e.g. an expired token) live
 * calls are skipped for 10 minutes so users are not delayed by a request that
 * is going to fail anyway. Restarting the server resets this.
 * A live call that takes longer than 45 seconds is abandoned for the fallback.
 */

const DISABLE_MS = 10 * 60 * 1000;
const LIVE_TIMEOUT_MS = 45_000;
let hfDisabledUntil = 0;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("AI request timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function looksLikeAuthOrQuotaError(err: unknown): boolean {
  const e = err as {
    status?: number;
    statusCode?: number;
    httpResponse?: { status?: number };
    message?: string;
  } | null;

  const status = e?.httpResponse?.status ?? e?.status ?? e?.statusCode;
  if (status === 401 || status === 402 || status === 403 || status === 429) {
    return true;
  }

  const message = (e?.message ?? "").toLowerCase();
  return /unauthorized|forbidden|invalid.*token|expired|credit|quota|rate limit/.test(
    message
  );
}

export async function runWithFallback<T>(
  label: string,
  live: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (!process.env.HF_TOKEN || Date.now() < hfDisabledUntil) {
    return fallback();
  }

  try {
    return await withTimeout(live(), LIVE_TIMEOUT_MS);
  } catch (err) {
    if (looksLikeAuthOrQuotaError(err)) {
      hfDisabledUntil = Date.now() + DISABLE_MS;
      console.warn(
        `[AI] ${label}: Hugging Face rejected the token or quota. Using built-in fallback for 10 minutes.`
      );
    } else {
      console.warn(
        `[AI] ${label}: live call failed, using fallback.`,
        err instanceof Error ? err.message : err
      );
    }
    return fallback();
  }
}