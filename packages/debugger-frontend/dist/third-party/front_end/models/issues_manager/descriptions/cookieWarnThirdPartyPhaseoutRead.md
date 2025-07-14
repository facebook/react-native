# Reading cookie in cross-site context may be impacted on Chrome

Cookies with the `SameSite=None; Secure` and not `Partitioned` attributes that operate in cross-site contexts are third-party cookies.
Chrome is moving towards a new experience that allows users to choose to browse without third-party cookies.

Learn more from the linked article about preparing your site to avoid potential breakage.