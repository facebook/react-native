# Ensure CORS request uses allowed method

A cross-origin resource sharing (CORS) request was blocked because it neither uses one of the CORS-safelisted methods (`GET`, `HEAD`, `POST`) nor was the request method explicitly allowed by the `Access-Control-Allow-Methods` response header of the associated [preflight request](issueCorsPreflightRequest).

To fix this issue, include the request method in the `Access-Control-Allow-Methods` header of the associated preflight request.
