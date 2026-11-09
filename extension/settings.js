export const DEFAULTS = { enabled: true, host: 'localhost', port: 3333 };
export function settingsFrom(value = {}) {
  const host = String(value.host ?? DEFAULTS.host).trim();
  const port = Number(value.port ?? DEFAULTS.port);
  if (!host || /[\s/?#@]/.test(host)) throw new Error('Enter a hostname or IP address.');
  const url = new URL(`http://${host}:${port}/caido-ingest`);
  if (url.hostname !== host.toLowerCase() || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Enter a valid host and port (1–65535).');
  return { enabled: Boolean(value.enabled ?? DEFAULTS.enabled), host, port };
}
export const endpointFor = settings => `http://${settings.host}:${settings.port}/caido-ingest`;
