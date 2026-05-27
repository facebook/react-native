# An attribution trigger registration was ignored because the request was ineligible

This page tried to register a trigger using the Attribution Reporting API, but
the request was ineligible to do so, so the trigger registration was ignored.

A request is eligible for trigger registration if it has an
`Attribution-Reporting-Eligible` header whose value is a structured dictionary
that contains the key `trigger`, or if the header is absent. Otherwise, any
`Attribution-Reporting-Register-Trigger` response header will be ignored.

Additionally, a single HTTP redirect chain may register only all sources or all
triggers, not a combination of both.
