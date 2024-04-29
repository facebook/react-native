# Mark SameParty cookies as Secure and do not use SameSite=Strict for SameParty cookies

Cookies marked with `SameParty` must also be marked with `Secure`. In addition, cookies marked
with `SameParty` cannot use `SameSite=Strict`.

Resolve this issue by updating the attributes of the cookie:
  * Remove `SameParty` if the cookie should only be used by the same site but not the same first-party set
  * Remove `SameSite=Strict` and specify `Secure` if the cookie should be available to all sites of the same first-party set
