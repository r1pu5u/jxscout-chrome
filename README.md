# JXScout Chrome

A small **Manifest V3** Chrome DevTools extension for [r1pu5u/jxscout](https://github.com/r1pu5u/jxscout). It sends JavaScript responses from the inspected tab to:

```text
http://localhost:3333/caido-ingest
```

No proxy, server configuration, or build step is required for the extension. JXScout must be installed and running separately.

## Install

1. Clone this repository, or download and extract its source ZIP.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` directory containing `manifest.json`.
4. Open DevTools on your target page and select **JXScout** (it may be in the `»` overflow menu).

If installing a packaged `jxscout-chrome.zip`, extract it and load the extracted directory instead.

## Use

Start your existing JXScout project:

```sh
jxscout serve --project your-project
```

In the JXScout DevTools panel, click **Start capture**, then reload the target page. JavaScript responses are sent automatically to port **3333**. **Pause capture** stops new deliveries. Keep DevTools open; the extension captures only the tab whose DevTools session you started. You can switch to another DevTools panel while capture continues.

The JXScout server applies the active project's scope and runs its existing save, discovery, and analysis pipeline. **Sent** means the ingestion endpoint accepted the data; it does not mean JXScout saved an asset. Check the server dashboard if a script is outside scope or rejected by its validator.

## Behavior

- Forwards successful `GET` responses identified by JavaScript MIME type, `.js`/`.mjs` URL, or Chrome's script resource type.
- Uses the existing `{ requestUrl, request, response }` JSON contract; no changes to JXScout are needed.
- Includes the captured response body, URL, and HTTP headers. Preserves target ports and canonicalizes header names.
- Normalizes HAR's decoded response to HTTP/1.1, removing compression and transfer framing headers and recalculating the content length.
- Starts paused on each DevTools session. Does not replay requests that finished before capture started.
- Limits deliveries to two at a time, with 50 waiting requests, a 5 MiB serialized payload limit, and a 10-second delivery timeout. Overflow is shown in the panel. Failed deliveries are shown and are not retried automatically; reload the page after fixing the server.
- Does not capture HTML, inline scripts, WebSocket messages, or traffic from tabs without an active capture session. Browser evictions and some cached responses can make bodies unavailable; reload with DevTools' **Disable cache** enabled if needed.

The extension sends captured headers, including any cookies or authorization headers Chrome exposes, to your local JXScout server. It does not persist traffic or settings. The last 100 delivery URLs are held in memory until DevTools closes. JXScout manages its own stored data.

## Manifest V3

The extension uses an ES module service worker and `chrome.devtools.network`. It has only a `http://localhost/*` host permission, allowing delivery to the local collector. Chrome host permissions cover all ports for a host; the extension's code uses only port 3333. It requires Chrome 120 or newer. There are no content scripts, remotely hosted scripts, background pages, `eval`, `webRequestBlocking`, or runtime dependencies.

## Development

Node.js 20+ and Python 3 are needed for validation and packaging. No `npm install` is needed.

```sh
npm run check
npm test
npm run build
```

The build writes `dist/jxscout-chrome.zip`, with `manifest.json` at its root. CI validates and uploads the same archive.

## Credits

Inspired by [francisconeves97/jxscout-burp](https://github.com/francisconeves97/jxscout-burp). This repository independently implements the Chrome transport and UI for the JXScout ingestion protocol; it does not bundle the Burp extension or JXScout server. Extension source is MIT licensed; those projects retain their own licenses.
