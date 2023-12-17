# Ensure credentialed requests are not sent to CORS resources with origin wildcards

A cross-origin resource sharing (CORS) request was blocked because it was configured to `include` credentials and the `Access-Control-Allow-Origin` response header of the request or the associated [preflight request](issueCorsPreflightRequest) was set to a wildcard `*`. CORS requests may only include credentials for resources where the `Access-Control-Allow-Origin` header is not a wildcard.

To fix this issue, ensure that either the request is configured to not include credentials, or change the `Access-Control-Allow-Origin` header of the resource to not be a wildcard.

Note that if an opaque response is sufficient, the request's mode can be set to `no-cors` to fetch the resource with CORS disabled; that way CORS headers are not required but credentials are not sent and the response content is inaccessible (opaque).

