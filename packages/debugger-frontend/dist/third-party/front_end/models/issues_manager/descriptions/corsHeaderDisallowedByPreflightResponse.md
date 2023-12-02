# Ensure CORS request includes only allowed headers

A cross-origin resource sharing (CORS) request was blocked because it contained request headers that were neither CORS-safelisted (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type`) nor allowed by the `Access-Control-Allow-Headers` response header of the associated preflight request.

To fix this issue, include the additional request headers you want to use in the `Access-Control-Allow-Headers` response header of the associated preflight request.
