# Ensure only same-origin resources are fetched with same-origin request mode

A cross-origin resource sharing (CORS) request to a cross-origin resource was blocked because the request mode was set to `same-origin`.

To fix this issue, ensure that only same-origin resources are fetched with the `same-origin` request mode. If you need to fetch a cross-origin resource, use a request mode such as `cors`.

Note that if an opaque response is sufficient, the request's mode can be set to `no-cors` to fetch the resource with CORS disabled; that way CORS headers are not required but the response content is inaccessible (opaque).
