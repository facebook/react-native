# An attribution OS trigger registration was ignored because the request was ineligible

This page tried to register an OS trigger using the Attribution Reporting API,
but the request was ineligible to do so, so the OS trigger registration was
ignored.

A request is eligible for OS trigger registration if it has all of the following:

- No `Attribution-Reporting-Eligible` header or an
  `Attribution-Reporting-Eligible` header whose value is a structured
  dictionary that contains the key `trigger`
- An `Attribution-Reporting-Support` header whose value is a structured
  dictionary that contains the key `os`

Otherwise, any `Attribution-Reporting-Register-OS-Trigger` response header will
be ignored.

Additionally, a single HTTP redirect chain may register only all sources or all
triggers, not a combination of both.
