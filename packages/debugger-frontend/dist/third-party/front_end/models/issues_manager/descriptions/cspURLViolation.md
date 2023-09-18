# Content Security Policy of your site blocks some resources

Some resources are blocked because their origin is not listed in your site's Content Security Policy (CSP). Your site's CSP is allowlist-based, so resources must be listed in the allowlist in order to be accessed.

A site's Content Security Policy is set either via an HTTP header (recommended), or via a meta HTML tag.

To fix this issue do one of the following:

* (Recommended) If you're using an allowlist for `'script-src'`, consider switching from an allowlist CSP to a strict CSP, because strict CSPs are [more robust against XSS](issuesCSPWhyStrictOverAllowlist). [See how to set a strict CSP](issuesCSPSetStrict).
* Or carefully check that all of the blocked resources are trustworthy; if they are, include their sources in the CSP of your site. ⚠️Never add a source you don't trust to your site's CSP. If you don't trust the source, consider hosting resources on your own site instead.