# Cookie is blocked due to a cross-site redirect chain

The cookie was blocked because the URL redirect chain was not fully same-site,
meaning the final request was treated as a cross-site request.
Like other cross-site requests, this blocks cookies with `SameSite=Lax` or
`SameSite=Strict`.

For example: If site A redirects to site B which then redirects back to site A,
the final request to site A will be a cross-site request.

If this behavior is causing breakage, please file a bug report with the link
below.