# An attribution OS source registration was ignored because the request was ineligible

This page tried to register an OS source using the Attribution Reporting API,
but the request was ineligible to do so, so the OS source registration was
ignored.

A request is eligible for OS source registration if it has all of the following:

- An `Attribution-Reporting-Eligible` header whose value is a structured
  dictionary that contains the key `navigation-source` or `event-source`
- An `Attribution-Reporting-Support` header whose value is a structured
  dictionary that contains the key `os`

Otherwise, any `Attribution-Reporting-Register-OS-Source` response header will
be ignored.

Additionally, a single HTTP redirect chain may register only all sources or all
triggers, not a combination of both.
