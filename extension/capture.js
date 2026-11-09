import { shouldCapture, makePayload, readContent } from './core.js';

export class Capture {
  constructor(send, onChange = () => {}) {
    this.send = send;
    this.onChange = onChange;
    this.running = false;
    this.generation = 0;
    this.queue = [];
    this.active = 0;
    this.counts = { sent: 0, skipped: 0, failed: 0, dropped: 0 };
    this.events = [];
  }
  emit() { this.onChange(this); }
  log(state, url, detail = '') {
    this.events.unshift({ time: new Date().toLocaleTimeString(), state, url, detail });
    this.events.length = Math.min(this.events.length, 100);
    this.emit();
  }
  start() {
    this.running = true;
    this.emit();
  }
  stop() {
    this.running = false;
    this.generation++;
    this.counts.dropped += this.queue.length;
    this.queue = [];
    this.emit();
  }
  enqueue(entry) {
    if (!this.running) return;
    if (!shouldCapture(entry)) { this.counts.skipped++; this.emit(); return; }
    if (this.queue.length >= 50) { this.counts.dropped++; this.log('dropped', entry.request.url, 'Queue full'); return; }
    this.queue.push({ entry, generation: this.generation });
    this.pump();
  }
  pump() {
    while (this.running && this.active < 2 && this.queue.length) {
      const job = this.queue.shift();
      this.active++;
      this.process(job).finally(() => { this.active--; this.emit(); this.pump(); });
    }
    this.emit();
  }
  async process({ entry, generation }) {
    try {
      const { body, encoding } = await readContent(entry);
      if (!this.running || generation !== this.generation) { this.counts.dropped++; return; }
      const payload = makePayload(entry, body, encoding);
      const result = await this.send(payload);
      if (!result?.ok) throw new Error(result?.error || 'No response from extension service worker');
      this.counts.sent++;
      this.log('sent', entry.request.url);
    } catch (error) {
      if (/binary|exceeds/.test(error.message)) this.counts.skipped++;
      else this.counts.failed++;
      this.log('error', entry.request.url, error.message);
    }
  }
}
