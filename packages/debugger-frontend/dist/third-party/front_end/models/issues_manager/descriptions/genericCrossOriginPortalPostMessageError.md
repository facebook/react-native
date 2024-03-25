# Cross-origin portal post messages are blocked on your site

In order to prevent cross-site tracking, cross-origin portal content cannot communicate with the page that embeds it. `window.portalHost.postMessage()` is blocked: messages will not be sent from the portal to the page that embeds it.
