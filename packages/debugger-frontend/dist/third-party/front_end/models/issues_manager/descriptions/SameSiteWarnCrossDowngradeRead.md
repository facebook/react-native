# Migrate entirely to HTTPS to continue having cookies sent to same-site subresources

A cookie is being sent to {PLACEHOLDER_destination} origin from {PLACEHOLDER_origin} context.
Because this cookie is being sent across schemes on the same site, it will not be sent in a future version of Chrome.
This behavior enhances the `SameSite` attribute’s protection of user data from request forgery by network attackers.

Resolve this issue by migrating your site (as defined by the eTLD+1) entirely to HTTPS.
It is also recommended to mark the cookie with the `Secure` attribute if that is not already the case.
