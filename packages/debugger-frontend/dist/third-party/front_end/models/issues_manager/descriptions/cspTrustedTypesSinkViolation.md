# Trusted Type expected, but String received

Your site tries to use a plain string in a DOM modification where a Trusted Type is expected. Requiring Trusted Types for DOM modifications helps to prevent cross-site scripting attacks.

To solve this, provide a Trusted Type to all the DOM modifications listed below. You can convert a string into a Trusted Type by:

* defining a policy and using its corresponding `createHTML`, `createScript` or `createScriptURL` function.
* defining a policy named `default` which will be automatically called.