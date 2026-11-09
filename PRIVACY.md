# Privacy

Capture starts On in a fresh profile; a saved Off setting is respected. When On, JXScout Chrome captures successful JavaScript GET responses from regular HTTP(S) tabs. It sends captured URLs, request and response headers, and JavaScript bodies to your configured HTTP JXScout server at `/caido-ingest`. Headers may contain cookies or authorization credentials.

The extension stores only its On/Off setting, host, and port. It has no analytics or telemetry and does not persist captured traffic. JXScout controls server-side processing and retention.

Off stops capture and disconnects the tab debuggers. Deliveries already sent may complete. Chrome's debugger permission is used to read response bodies without opening DevTools; HTTP host access allows sending them to your chosen server.
