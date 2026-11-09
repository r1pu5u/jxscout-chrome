import { settingsFrom } from './settings.js';
const $ = id => document.getElementById(id);
let enabled = false;
function render(value) {
  enabled = value.enabled;
  $('host').value = value.host;
  $('port').value = value.port;
  $('toggle').textContent = enabled ? 'On' : 'Off';
  $('toggle').setAttribute('aria-pressed', String(enabled));
  $('toggle').disabled = false;
}
async function save(nextEnabled = enabled) {
  $('error').hidden = true;
  try {
    const settings = settingsFrom({ enabled: nextEnabled, host: $('host').value, port: $('port').value });
    $('toggle').disabled = true;
    const result = await chrome.runtime.sendMessage({ type: 'settings', settings });
    if (result?.error) throw new Error(result.error);
    render(settings);
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; $('toggle').disabled = false; }
}
chrome.storage.local.get('settings').then(({ settings }) => render(settingsFrom(settings)));
$('toggle').addEventListener('click', () => save(!enabled));
$('host').addEventListener('change', () => save());
$('port').addEventListener('change', () => save());
