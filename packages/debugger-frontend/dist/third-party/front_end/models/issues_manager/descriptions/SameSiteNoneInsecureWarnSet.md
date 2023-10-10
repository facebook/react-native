# Mark cross-site cookies as Secure to allow setting them in cross-site contexts

In a future version of the browser, cookies marked with `SameSite=None` must also be marked with `Secure` to allow setting them in a cross-site context.
This behavior protects user data from being sent over an insecure connection.

Resolve this issue by updating the attributes of the cookie:
* Specify `SameSite=None` and `Secure` if the cookie is intended to be set in cross-site contexts. Note that only cookies sent over HTTPS may use the `Secure` attribute.
* Specify `SameSite=Strict` or `SameSite=Lax` if the cookie should not be set by cross-site requests.
