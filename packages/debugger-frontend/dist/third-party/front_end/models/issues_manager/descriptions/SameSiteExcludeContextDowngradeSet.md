# Migrate entirely to HTTPS to allow cookies to be set by same-site subresources

A cookie was not set by {PLACEHOLDER_origin} origin in {PLACEHOLDER_destination} context.
Because this cookie would have been set across schemes on the same site, it was blocked.
This behavior enhances the `SameSite` attribute’s protection of user data from request forgery by network attackers.

Resolve this issue by migrating your site (as defined by the eTLD+1) entirely to HTTPS.
It is also recommended to mark the cookie with the `Secure` attribute if that is not already the case.
