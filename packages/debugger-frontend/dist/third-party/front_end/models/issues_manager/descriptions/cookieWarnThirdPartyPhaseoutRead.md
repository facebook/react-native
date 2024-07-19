# Reading cookie in cross-site context will be blocked in future Chrome versions

Cookies with the `SameSite=None; Secure` and not `Partitioned` attributes that operate in cross-site contexts are third-party cookies.
In future Chrome versions, reading third-party cookies will be blocked.
This behavior protects user data from cross-site tracking.

Please refer to the article linked to learn more about preparing your site to avoid potential breakage.
