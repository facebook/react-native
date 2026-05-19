# Ensure CORS requesting origin matches resource's allowed origin

A cross-origin resource sharing (CORS) request was blocked because the `Access-Control-Allow-Origin` response header of the request or the associated [preflight request](issueCorsPreflightRequest) specified an origin different from the origin of the context that initiated the request.

To fix this issue, ensure that the `Access-Control-Allow-Origin` header for the resource matches the request context's origin.
If the resource never needs to be accessed with credentials, the `Access-Control-Allow-Origin` header may be set to a wildcard `*` to allow access from everywhere.
