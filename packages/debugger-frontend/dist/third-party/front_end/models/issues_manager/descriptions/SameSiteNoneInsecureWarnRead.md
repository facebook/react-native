# Mark cross-site cookies as Secure to allow them to be sent in cross-site requests

In a future version of the browser, cookies marked with `SameSite=None` must also be marked with `Secure` to get sent in cross-site requests.
This behavior protects user data from being sent over an insecure connection.

Resolve this issue by updating the attributes of the cookie:
* Specify `SameSite=None` and `Secure` if the cookie should be sent in cross-site requests. This enables third-party use.
* Specify `SameSite=Strict` or `SameSite=Lax` if the cookie should not be sent in cross-site requests.
