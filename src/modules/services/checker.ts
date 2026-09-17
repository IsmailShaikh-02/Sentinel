export interface ProbeResult {
  statusCode: number | null;
  responseTimeMs: number;
  ok: boolean;
}

export async function probeUrl(
  url: string,
  method: string,
  expectedStatus: number,
  timeoutMs = 5000
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Sentinel-Health-Monitor/1.0',
      },
    });

    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const statusCode = response.status;
    const ok = statusCode === expectedStatus;

    return {
      statusCode,
      responseTimeMs,
      ok,
    };
  } catch (_error) {
    // Handles network drops, unreachable hosts, DNS failures, or 5s timeouts
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    return {
      statusCode: null,
      responseTimeMs,
      ok: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}