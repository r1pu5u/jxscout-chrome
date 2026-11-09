import { ENDPOINT, MAX_BYTES, byteLength } from './core.js';

export async function deliver(payload, { fetcher = fetch } = {}) {
  if (!payload || !['requestUrl', 'request', 'response'].every(key => typeof payload[key] === 'string')) throw new Error('Invalid ingestion payload');
  if (!/^https?:$/.test(new URL(payload.requestUrl).protocol)) throw new Error('Invalid request URL');
  const body = JSON.stringify(payload);
  if (byteLength(body) > MAX_BYTES) throw new Error('Payload exceeds 5 MiB');
  const response = await fetcher(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000)
  });
  // Do not retain collector response bodies, which can be large or sensitive.
  await response.body?.cancel();
  if (!response.ok) throw new Error(`JXScout returned HTTP ${response.status}`);
  return { ok: true };
}
