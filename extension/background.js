import { settingsFrom, endpointFor } from './settings.js';
import { shouldCapture, makePayload, MAX_BYTES } from './core.js';
import { deliver } from './transport.js';

const attached = new Set();
const requests = new Map();
let settings;
let generation = 0;
const ready = chrome.storage.local.get('settings').then(result => { settings = settingsFrom(result.settings); });
const keyFor = (tabId, requestId) => `${tabId}:${requestId}`;
const httpHeaders = headers => Object.entries(headers || {}).map(([name, value]) => ({ name, value: String(value) }));

async function attach(tab) {
  if (!settings.enabled || attached.has(tab.id) || !/^https?:/.test(tab.url || '')) return;
  const epoch = generation;
  try {
    await chrome.debugger.attach({ tabId: tab.id }, '1.3');
    attached.add(tab.id);
    if (!settings.enabled || epoch !== generation) { await detach(tab.id); return; }
    await chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.enable', { maxResourceBufferSize: MAX_BYTES, maxTotalBufferSize: 2 * MAX_BYTES });
  } catch (error) { console.warn('JXScout:', error.message); }
}
async function detach(tabId) {
  attached.delete(tabId);
  for (const key of requests.keys()) if (key.startsWith(`${tabId}:`)) requests.delete(key);
  await chrome.debugger.detach({ tabId }).catch(() => {});
}
async function apply(value) {
  const next = settingsFrom(value);
  generation++;
  settings = next;
  await chrome.storage.local.set({ settings });
  if (!settings.enabled) await Promise.all([...attached].map(detach));
  else await Promise.all((await chrome.tabs.query({})).map(attach));
  await chrome.action.setBadgeText({ text: settings.enabled ? 'ON' : '' });
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('popup.html') || message?.type !== 'settings') return false;
  ready.then(() => apply(message.settings)).then(() => respond({ ok: true }), error => respond({ error: error.message }));
  return true;
});
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.status === 'loading' || change.url) ready.then(() => attach(tab));
});
chrome.debugger.onDetach.addListener(source => {
  attached.delete(source.tabId);
  for (const key of requests.keys()) if (key.startsWith(`${source.tabId}:`)) requests.delete(key);
});
chrome.debugger.onEvent.addListener((source, method, data) => {
  if (!attached.has(source.tabId) || !settings?.enabled) return;
  const key = keyFor(source.tabId, data.requestId);
  if (method === 'Network.requestWillBeSent') {
    // Keep only recent request metadata, never a persistent traffic history.
    if (requests.size >= 500) requests.delete(requests.keys().next().value);
    requests.set(key, { request: data.request, epoch: generation });
  } else if (method === 'Network.responseReceived') {
    const item = requests.get(key);
    if (item) { item.response = data.response; item.type = data.type; }
  } else if (method === 'Network.loadingFailed') requests.delete(key);
  else if (method === 'Network.loadingFinished') {
    const item = requests.get(key);
    requests.delete(key);
    if (!item?.response || item.epoch !== generation || data.encodedDataLength > MAX_BYTES) return;
    const entry = {
      request: { ...item.request, headers: httpHeaders(item.request.headers) },
      response: { ...item.response, content: { mimeType: item.response.mimeType }, headers: httpHeaders(item.response.headers) },
      _resourceType: item.type?.toLowerCase()
    };
    const endpoint = endpointFor(settings);
    if (!shouldCapture(entry, endpoint)) return;
    chrome.debugger.sendCommand(source, 'Network.getResponseBody', { requestId: data.requestId }).then(body => {
      if (!settings.enabled || item.epoch !== generation) return;
      return deliver(makePayload(entry, body.body, body.base64Encoded ? 'base64' : ''), endpoint);
    }).catch(error => console.warn('JXScout:', error.message));
  }
});
ready.then(() => apply(settings)).catch(error => console.warn('JXScout:', error.message));
