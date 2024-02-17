# Ensure no-cors requests configure redirect mode follow

A cross-origin resource sharing (CORS) request was blocked because it was configured to use request mode `no-cors` but did not use the redirect mode `follow`.

To fix this issue, ensure that whenever the request mode `no-cors` is set then the redirect mode is set to `follow`.
