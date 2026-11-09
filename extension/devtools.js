import { Capture } from './capture.js';
const capture = new Capture(payload => chrome.runtime.sendMessage({ type: 'ingest', payload }));
chrome.devtools.network.onRequestFinished.addListener(entry => capture.enqueue(entry));
chrome.devtools.panels.create('JXScout', '', 'panel.html', panel => {
  panel.onShown.addListener(panelWindow => {
    const attach = () => panelWindow.attachController(capture);
    if (typeof panelWindow.attachController === 'function') attach();
    else panelWindow.addEventListener('load', attach, { once: true });
  });
});
