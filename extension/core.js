export const ENDPOINT = 'http://localhost:3333/caido-ingest';
export const MAX_BYTES = 5 * 1024 * 1024;
export const byteLength = value => new TextEncoder().encode(value).length;

export function shouldCapture(entry) {
  let url;
  try { url = new URL(entry.request.url); } catch { return false; }
  if (!['http:', 'https:'].includes(url.protocol) || entry.response.status !== 200 || entry.request.method !== 'GET') return false;
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.port === '3333') return false;
  const mime = entry.response.content?.mimeType || '';
  return /javascript|ecmascript/i.test(mime) || /\.m?js$/i.test(url.pathname) || entry._resourceType === 'script';
}
const clean = value => String(value ?? '').replace(/[\r\n]/g, ' ');
const canonical = name => name.toLowerCase().split('-').map(part => part[0]?.toUpperCase() + part.slice(1)).join('-');
function headers(source, exclude = []) {
  return (source || []).filter(h => !h.name.startsWith(':') && !exclude.includes(h.name.toLowerCase()))
    .map(h => `${canonical(h.name)}: ${clean(h.value)}`);
}
export function makePayload(entry, body, encoding = '') {
  // Binary data is not useful for source analysis; never send it as corrupt text.
  if (encoding === 'base64') {
    const mime = entry.response.content?.mimeType || '';
    if (!/^(text\/|application\/(?:[\w.+-]*json|[\w.+-]*xml|javascript|ecmascript|x-javascript))/i.test(mime)) {
      throw new Error('Skipped binary response');
    }
    body = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(body), c => c.charCodeAt(0)));
  } else if (encoding) throw new Error(`Unsupported body encoding: ${encoding}`);
  const url = new URL(entry.request.url);
  url.hash = '';
  const reqBody = entry.request.postData?.text || '';
  if (byteLength(body) + byteLength(reqBody) > MAX_BYTES) throw new Error('Payload exceeds 5 MiB');
  const reqHeaders = headers(entry.request.headers, ['host', 'content-length', 'transfer-encoding']);
  // The upstream mapper expects Host to be the first header and at least one further header.
  reqHeaders.unshift(`Host: ${url.host}`);
  reqHeaders.push(`Content-Length: ${byteLength(reqBody)}`);
  const resHeaders = headers(entry.response.headers, ['content-length', 'content-encoding', 'transfer-encoding']);
  if (!resHeaders.some(h => h.startsWith('Content-Type:'))) resHeaders.push(`Content-Type: ${clean(entry.response.content?.mimeType || 'application/octet-stream')}`);
  resHeaders.push(`Content-Length: ${byteLength(body)}`);
  // HAR bodies are decoded; serialize normalized HTTP/1.1, even for HTTP/2/3 entries.
  const payload = {
    requestUrl: url.href,
    request: [`${clean(entry.request.method)} ${url.pathname}${url.search} HTTP/1.1`, ...reqHeaders, '', reqBody].join('\r\n'),
    response: [`HTTP/1.1 ${entry.response.status} ${clean(entry.response.statusText) || 'Response'}`, ...resHeaders, '', body].join('\r\n')
  };
  if (byteLength(JSON.stringify(payload)) > MAX_BYTES) throw new Error('Serialized payload exceeds 5 MiB');
  return payload;
}
export function readContent(entry, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Response body unavailable (DevTools timeout)')), timeout);
    try {
      entry.getContent((body, encoding) => {
        clearTimeout(timer);
        if (typeof body !== 'string') reject(new Error('Response body unavailable'));
        else resolve({ body, encoding });
      });
    } catch (error) { clearTimeout(timer); reject(error); }
  });
}
