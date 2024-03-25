# An attribution source registration was ignored because the request was ineligible

This page tried to register a source using the Attribution Reporting API, but
the request was ineligible to do so, so the source registration was ignored.

A request is eligible for source registration if it has an
`Attribution-Reporting-Eligible` header whose value is a structured dictionary
that contains the key `navigation-source` or `event-source`. If the header is
absent or does not contain one of those keys, any
`Attribution-Reporting-Register-Source` response header will be ignored.

Additionally, a single HTTP redirect chain may register only all sources or all
triggers, not a combination of both.
