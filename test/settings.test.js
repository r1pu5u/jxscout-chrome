import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settingsFrom, endpointFor } from '../extension/settings.js';
test('defaults and edited host/port produce the ingestion endpoint', () => {
  assert.deepEqual(settingsFrom(), { enabled: false, host: 'localhost', port: 3333 });
  assert.equal(endpointFor(settingsFrom({ host: '127.0.0.1', port: '4444', enabled: true })), 'http://127.0.0.1:4444/caido-ingest');
  assert.equal(endpointFor(settingsFrom({ host: '[::1]', port: 3333 })), 'http://[::1]:3333/caido-ingest');
});
test('invalid settings cannot become collector URLs', () => {
  for (const host of ['', 'https://example.com', 'example.com/path', 'user@example.com', 'localhost:4444']) assert.throws(() => settingsFrom({ host }));
  for (const port of [0, -1, 65536, 1.5, 'bad']) assert.throws(() => settingsFrom({ port }));
});
