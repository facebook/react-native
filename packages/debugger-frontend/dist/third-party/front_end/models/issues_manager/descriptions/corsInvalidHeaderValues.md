# Ensure CORS response header values are valid

A cross-origin resource sharing (CORS) request was blocked because of invalid or missing response headers of the request or the associated [preflight request](issueCorsPreflightRequest).

To fix this issue, ensure the response to the CORS request and/or the associated [preflight request](issueCorsPreflightRequest) are not missing headers and use valid header values.

Note that if an opaque response is sufficient, the request's mode can be set to `no-cors` to fetch the resource with CORS disabled; that way CORS headers are not required but the response content is inaccessible (opaque).
