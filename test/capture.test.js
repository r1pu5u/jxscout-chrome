import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Capture } from '../extension/capture.js';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const entry = callback => ({
  request: { url: 'https://example.com/a.js', method: 'GET', headers: [] },
  response: { status: 200, headers: [], content: { mimeType: 'text/javascript' } },
  getContent: callback || (cb => cb('let hello = 1', ''))
});
function setup(send = async () => ({ ok: true })) {
  const capture = new Capture(send);
  return capture;
}
test('capture requires explicit start and can be paused', async () => {
  let sent = 0;
  const capture = setup(async () => { sent++; return { ok: true }; });
  capture.enqueue(entry()); await tick(); assert.equal(sent, 0);
  capture.start(); capture.enqueue(entry()); await tick(); assert.equal(sent, 1);
  capture.stop(); assert.equal(capture.running, false);
});
test('pause prevents a delayed getContent callback from sending data', async () => {
  let callback; let sent = 0;
  const capture = setup(async () => { sent++; return { ok: true }; });
  capture.start(); capture.enqueue(entry(cb => { callback = cb; }));
  capture.stop(); capture.start(); callback('late response', ''); await tick();
  assert.equal(sent, 0); assert.equal(capture.counts.dropped, 1);
});
test('queue has bounded concurrency and reports overflow', async () => {
  const pending = [];
  const capture = setup(() => new Promise(resolve => pending.push(resolve)));
  capture.start();
  for (let i = 0; i < 60; i++) capture.enqueue(entry());
  await tick();
  assert.equal(pending.length, 2); assert.equal(capture.queue.length, 50); assert.equal(capture.counts.dropped, 8);
  capture.stop(); pending.forEach(resolve => resolve({ ok: true })); await tick();
  assert.equal(capture.active, 0); assert.equal(capture.queue.length, 0);
});
test('collector failures are visible and the queue continues', async () => {
  const capture = setup(async () => ({ ok: false, error: 'JXScout returned HTTP 500' }));
  capture.start(); capture.enqueue(entry()); await tick();
  assert.equal(capture.counts.failed, 1); assert.match(capture.events[0].detail, /500/);
});
