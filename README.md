# JXScout Chrome

A **Manifest V3** Chrome extension for [r1pu5u/jxscout](https://github.com/r1pu5u/jxscout).

Click its toolbar icon. The popup has only:

- **On / Off** — enable or disable JavaScript capture.
- **Host** — defaults to `localhost`.
- **Port** — defaults to `3333`.

Host and port changes save automatically. No DevTools or proxy is required.

## Install and use

1. Download or clone this repository.
2. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked** → the `extension/` folder.
3. Start your JXScout server: `jxscout serve --project your-project`.
4. Click the extension's toolbar icon and turn it **On**.
5. Browse or reload your target pages. JavaScript responses go to `http://HOST:PORT/caido-ingest`. JXScout applies the active project's scope.

Capture covers regular HTTP(S) tabs, including tabs opened while On. Turn it Off to stop. The setting is remembered across browser restarts.

Chrome displays its standard debugging banner while capture is On. This is how the extension reads JavaScript response bodies without DevTools. Dismissing that banner or opening DevTools can detach capture from the affected tab; toggle Off and On to reconnect. Chrome internal pages and other restricted tabs cannot be captured.

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
