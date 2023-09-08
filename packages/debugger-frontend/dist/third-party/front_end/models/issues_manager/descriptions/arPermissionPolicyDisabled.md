# The Attribution Reporting API can’t be used because Permissions Policy has been disabled

This page tried to use the Attribution Reporting API but failed because the
`attribution-reporting` Permission Policy was explicitly disabled.

This API is currently enabled by default for top-level and cross-origin frames,
but it is still possible for frames to have the permission disabled by their
parent, e.g. with `<iframe src="…" allow="attribution-reporting 'none'">`.
