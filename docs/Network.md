---
id: network
title: Network
layout: docs
category: Polyfills
permalink: docs/network.html
next: timers
---

One of React Native goal is to be a playground where we can experiment with different architectures and crazy ideas. Since browsers are not flexible enough, we had no choice but to reimplement the entire stack. In the places that we did not intend to change, we tried to be as faithful as possible to the browser APIs. The networking stack is a great example.

## XMLHttpRequest

XMLHttpRequest API is implemented on-top of [iOS networking apis](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/URLLoadingSystem/URLLoadingSystem.html). The notable difference from web is the security model: you can read from arbitrary websites on the internet since there is no concept of [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).

```javascript
var request = new XMLHttpRequest();
request.onreadystatechange = (e) => {
  if (request.readyState !== 4) {
    return;
  }

  if (request.status === 200) {
    console.log('success', request.responseText);
  } else {
    console.warn('error');
  }
};

request.open('GET', 'https://mywebsite.com/endpoint.php');
request.send();
```

Please follow the [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) for a complete description of the API.

As a developer, you're probably not going to use XMLHttpRequest directly as its API is very tedious to work with. But the fact that it is implemented and compatible with the browser API gives you the ability to use third-party libraries such as [Parse]( https://parse.com/products/javascript) or [super-agent](https://github.com/visionmedia/superagent) directly from npm.

## Fetch

[fetch](https://fetch.spec.whatwg.org/) is a better networking API being worked on by the standard committee and is already available in Chrome. It is available in React Native by default.

```javascript
fetch('https://mywebsite.com/endpoint.php')
  .then((response) => response.text())
  .then((responseText) => {
    console.log(responseText);
  })
  .catch((error) => {
    console.warn(error);
  });
```
