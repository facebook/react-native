# Ensure that attribution responses contain either source or trigger, not both

This page tried to register a source and a trigger in the same HTTP response
using the Attribution Reporting API, which is prohibited.

The corresponding request was eligible to register either a source or a
trigger, but the response may only set either the
`Attribution-Reporting-Register-Source` header or the
`Attribution-Reporting-Register-Trigger` header, not both.
