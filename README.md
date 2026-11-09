# JXScout Chrome

A **Manifest V3** Chrome extension for [r1pu5u/jxscout](https://github.com/r1pu5u/jxscout).

Click its toolbar icon. The popup has only:

- **On / Off** — enable or disable JavaScript capture.
- **Host** — defaults to `localhost`.
- **Port** — defaults to `3333`.

Capture starts **On** in a fresh browser profile. Host and port changes save automatically. No DevTools or proxy is required.

## Install and use

1. Download or clone this repository.
2. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked** → the `extension/` folder.
3. Start your JXScout server: `jxscout serve --project your-project`.
4. Capture starts automatically. Use the toolbar popup to change Host/Port or turn it Off.
5. Browse or reload your target pages. JavaScript responses go to `http://HOST:PORT/caido-ingest`. JXScout applies the active project's scope.

Capture covers regular HTTP(S) tabs, including tabs opened while On. Turn it Off to stop. The setting is remembered across browser restarts.

Chrome displays its standard debugging banner while capture is On. This is how the extension reads JavaScript response bodies without DevTools. Dismissing that banner or opening DevTools can detach capture from the affected tab; toggle Off and On to reconnect. Chrome internal pages and other restricted tabs cannot be captured.

## Headless

Use Chromium or Chrome for Testing with modern headless mode. Fresh profiles start capture automatically at `localhost:3333`; no popup interaction is needed.

From the repository directory:

```sh
chromium --headless=new \
  --user-data-dir=/tmp/jxscout-headless-profile \
  --disable-extensions-except="$PWD/extension" \
  --load-extension="$PWD/extension" \
  --remote-debugging-port=9222 \
  https://your-target.example
```

For the release ZIP, replace `$PWD/extension` with the absolute path of the extracted folder containing `manifest.json`. Start JXScout first. Reload the target after extension startup if its earliest scripts loaded before capture attached. In automation, wait for the extension worker and its tab debugger to attach before navigating.

A reused profile retains its saved On/Off and Host/Port settings. If you previously turned capture Off, turn it back On in that profile before a headless run, or use a fresh profile.

Standard Google Chrome removed command-line `--load-extension` support starting in version 137; use Chromium or Chrome for Testing for the command above. See [Chromium's announcement](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY) and [Chrome's extension testing guide](https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing).

## Development

Node.js 20+ and Python 3; no dependencies to install.

```sh
npm run check
npm test
npm run build
```

The build writes `dist/jxscout-chrome.zip`. Extract it and load the extracted folder to install the packaged version.

## Credits

Inspired by [francisconeves97/jxscout-burp](https://github.com/francisconeves97/jxscout-burp). Independently implements Chrome capture using the existing JXScout ingestion format. Extension source is MIT licensed; JXScout and the Burp extension retain their own licenses.
