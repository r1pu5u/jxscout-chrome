import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { deliver } from '../extension/transport.js';
const ENDPOINT = 'http://localhost:3333/caido-ingest';
const payload = { requestUrl: 'https://example.com/app.js', request: 'GET /app.js HTTP/1.1\r\nHost: example.com\r\n\r\n', response: 'HTTP/1.1 200 OK\r\nContent-Type: text/javascript\r\n\r\nlet x=1;' };
test('HTTP collector receives expected JSON and server errors are reported', async t => {
  let received; let status = 202;
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    received = { path: req.url, type: req.headers['content-type'], payload: JSON.parse(body) };
    res.writeHead(status); res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const fetcher = (url, options) => {
    assert.equal(url, ENDPOINT);
    return fetch(`http://127.0.0.1:${server.address().port}/caido-ingest`, options);
  };
  assert.deepEqual(await deliver(payload, ENDPOINT, { fetcher }), { ok: true });
  assert.deepEqual(received, { path: '/caido-ingest', type: 'application/json', payload });
  status = 500;
  await assert.rejects(deliver(payload, ENDPOINT, { fetcher }), /HTTP 500/);
});
test('transport rejects redirects and omits ambient credentials', async () => {
  await deliver(payload, ENDPOINT, { fetcher: async (url, options) => {
    assert.equal(url, 'http://localhost:3333/caido-ingest');
    assert.equal(options.redirect, 'error'); assert.equal(options.credentials, 'omit'); assert.ok(options.signal);
    return { ok: true };
  } });
});
test('invalid payloads cannot be forwarded', async () => {
  await assert.rejects(deliver({}, ENDPOINT), /Invalid ingestion payload/);
  await assert.rejects(deliver({ ...payload, requestUrl: 'file:///tmp/a.js' }, ENDPOINT), /Invalid request URL/);
});
