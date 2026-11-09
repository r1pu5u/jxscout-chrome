import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldCapture, makePayload, readContent, MAX_BYTES } from '../extension/core.js';

export const entry = () => ({
  request: { url: 'https://app.example.com:8443/app.js?v=2', method: 'GET', httpVersion: 'h2', headers: [{ name: ':authority', value: 'app.example.com' }, { name: 'referer', value: 'https://app.example.com/' }] },
  response: { status: 200, statusText: '', httpVersion: 'h2', content: { mimeType: 'application/javascript' }, headers: [{ name: 'content-type', value: 'application/javascript' }, { name: 'content-encoding', value: 'gzip' }, { name: 'content-length', value: '90' }] }
});

test('capture includes only successful GET JavaScript and excludes the collector', () => {
  const e = entry();
  assert.equal(shouldCapture(e), true);
  e.request.url = 'https://example.com/'; e.response.content.mimeType = 'text/html';
  assert.equal(shouldCapture(e), false);
  e.response.content.mimeType = 'application/javascript';
  assert.equal(shouldCapture(e), true);
  e.request.url = 'http://localhost:3333/app.js';
  assert.equal(shouldCapture(e), false);
  e.request.url = 'https://example.com/app.mjs'; e.response.content.mimeType = '';
  assert.equal(shouldCapture(e), true);
  e.response.status = 404; assert.equal(shouldCapture(e), false);
  e.response.status = 200; e.request.method = 'POST'; assert.equal(shouldCapture(e), false);
});

test('HAR serializes for upstream parser, retaining ports and normalizing HTTP/2', () => {
  const p = makePayload(entry(), 'const café = "✓";');
  assert.equal(p.requestUrl, 'https://app.example.com:8443/app.js?v=2');
  assert.match(p.request, /^GET \/app.js\?v=2 HTTP\/1.1\r\nHost: app.example.com:8443\r\nReferer:/);
  assert.match(p.response, /^HTTP\/1.1 200 Response\r\nContent-Type: application\/javascript\r\nContent-Length: 20\r\n\r\n/);
  assert.doesNotMatch(p.response, /gzip|:authority/);
  // Mirror only the externally imposed parser contract: >= 3 header lines, status reason, Host first.
  assert.ok(p.request.split('\r\n\r\n')[0].split('\r\n').length >= 3);
  assert.ok(p.response.split('\r\n\r\n')[0].split('\r\n').length >= 3);
});

test('base64 text becomes UTF-8 while binary and oversized bodies are rejected', () => {
  assert.ok(makePayload(entry(), Buffer.from('let x = "✓"').toString('base64'), 'base64').response.endsWith('let x = "✓"'));
  const e = entry(); e.response.content.mimeType = 'image/png';
  assert.throws(() => makePayload(e, 'aGVsbG8=', 'base64'), /binary/);
  assert.throws(() => makePayload(entry(), 'x'.repeat(MAX_BYTES)), /exceeds/);
});

test('POST bodies and missing HAR headers still produce valid ingestion envelopes', () => {
  const e = entry();
  e.request.method = 'POST'; e.request.headers = []; e.request.postData = { text: 'a=1' }; e.response.headers = [];
  const p = makePayload(e, '');
  assert.match(p.request, /Host: .*\r\nContent-Length: 3\r\n\r\na=1$/);
  assert.match(p.response, /Content-Type: application\/javascript\r\nContent-Length: 0/);
});

test('missing response body callbacks time out', async () => {
  await assert.rejects(readContent({ getContent() {} }, 5), /timeout/);
  await assert.rejects(readContent({ getContent(cb) { cb(undefined); } }), /unavailable/);
});
