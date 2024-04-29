# Content Security Policy of your site blocks the use of 'eval' in JavaScript`

The Content Security Policy (CSP) prevents the evaluation of arbitrary strings as JavaScript to make it more difficult for an attacker to inject unathorized code on your site.

To solve this issue, avoid using `eval()`, `new Function()`, `setTimeout([string], ...)` and `setInterval([string], ...)` for evaluating strings.

If you absolutely must: you can enable string evaluation by adding `unsafe-eval` as an allowed source in a `script-src` directive.

⚠️ Allowing string evaluation comes at the risk of inline script injection.