# Privacy

JXScout Chrome captures JavaScript requests only after you click Start capture in a tab's DevTools panel. It forwards the URL, available request headers and body, response headers, and JavaScript response body to `http://localhost:3333/caido-ingest`.

Captured headers can contain credentials. No data is sent to a developer-operated service. The extension has no analytics, telemetry, remote code, or persistent traffic storage. The last 100 delivery URLs and errors remain in memory until DevTools closes. Your local JXScout server controls any further processing and retention.

Pause stops new deliveries and clears the waiting queue; deliveries already submitted may complete. Closing DevTools ends the capture session.
