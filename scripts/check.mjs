import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const manifest = JSON.parse(readFileSync('extension/manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background.type, 'module');
assert.ok(!manifest.background.scripts && !manifest.background.persistent);
assert.ok(!(manifest.permissions || []).includes('webRequestBlocking'));
for (const file of [manifest.devtools_page, manifest.background.service_worker, 'panel.html']) assert.ok(existsSync(`extension/${file}`));
for (const file of readdirSync('extension').filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', `extension/${file}`]);
for (const file of ['panel.html', 'devtools.html']) {
  const text = readFileSync(`extension/${file}`, 'utf8');
  assert.doesNotMatch(text, /\bon\w+\s*=|<script(?![^>]*src=)/i);
}
console.log('Manifest V3, entry points, CSP, and JavaScript syntax checks passed.');
