# Content Security Policy blocks inline execution of scripts and stylesheets

The Content Security Policy (CSP) prevents cross-site scripting attacks by blocking inline execution of scripts and style sheets.

To solve this, move all inline scripts (e.g. `onclick=[JS code]`) and styles into external files.

⚠️ Allowing inline execution comes at the risk of script injection via injection of HTML script elements. If you absolutely must, you can allow inline script and styles by:

* adding `unsafe-inline` as a source to the CSP header
* adding the hash or nonce of the inline script to your CSP header.