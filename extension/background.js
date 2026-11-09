import { deliver } from './transport.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('devtools.html') || message?.type !== 'ingest') return false;
  deliver(message.payload).then(sendResponse, error => sendResponse({ ok: false, error: error.message }));
  // Keep the MV3 message channel alive until the bounded fetch completes.
  return true;
});
