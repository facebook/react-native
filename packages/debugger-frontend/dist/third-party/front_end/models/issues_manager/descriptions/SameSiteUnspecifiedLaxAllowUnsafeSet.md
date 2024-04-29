# Indicate whether a cookie is intended to be set in cross-site context by specifying its SameSite attribute

Because a cookie’s `SameSite` attribute was not set or is invalid, it defaults to `SameSite=Lax`,
which will prevents the cookie from being set in a cross-site context in a future version of the browser.
This behavior protects user data from accidentally leaking to third parties and cross-site request forgery.

Resolve this issue by updating the attributes of the cookie:
* Specify `SameSite=None` and `Secure` if the cookie is intended to be set in cross-site contexts. Note that only cookies sent over HTTPS may use the `Secure` attribute.
* Specify `SameSite=Strict` or `SameSite=Lax` if the cookie should not be set by cross-site requests.
