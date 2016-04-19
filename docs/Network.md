---
id: network
title: Network
layout: docs
category: Polyfills
permalink: docs/network.html
next: timers
---

One of React Native's goals is to be a playground where we can experiment with different architectures and crazy ideas. Since browsers are not flexible enough, we had no choice but to reimplement the entire stack. In the places that we did not intend to change anything, we tried to be as faithful as possible to the browser APIs. The networking stack is a great example.

## Fetch

[fetch](https://fetch.spec.whatwg.org/) is a better networking API being worked on by the standards committee and is already available in Chrome. It is available in React Native by default.

#### Usage

```js
fetch('https://mywebsite.com/endpoint/')
```

Include a request object as the optional second argument to customize the HTTP request:

```js
fetch('https://mywebsite.com/endpoint/', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firstParam: 'yourValue',
    secondParam: 'yourOtherValue',
  })
})
```

#### Async

`fetch` returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that can be processed in two ways:

1.  Using `then` and `catch` in synchronous code:

  ```js
  fetch('https://mywebsite.com/endpoint.php')
    .then((response) => response.text())
    .then((responseText) => {
      console.log(responseText);
    })
    .catch((error) => {
      console.warn(error);
    });
  ```
2.  Called within an asynchronous function using ES7 `async`/`await` syntax:

  ```js
  class MyComponent extends React.Component {
    ...
    async getUsersFromApi() {
      try {
        let response = await fetch('https://mywebsite.com/endpoint/');
        let responseJson = await response.json();
        return responseJson.users;
      } catch(error) {
        // Handle error
        console.error(error);
      }
    }
    ...
  }
  ```

- Note: Errors thrown by rejected Promises need to be caught, or they will be swallowed silently

## WebSocket

WebSocket is a protocol providing full-duplex communication channels over a single TCP connection.

```js
var ws = new WebSocket('ws://host.com/path');

ws.onopen = () => {
  // connection opened
  ws.send('something');
};

ws.onmessage = (e) => {
  // a message was received
  console.log(e.data);
};

ws.onerror = (e) => {
  // an error occurred
  console.log(e.message);
};

ws.onclose = (e) => {
  // connection closed
  console.log(e.code, e.reason);
};
```

## XMLHttpRequest

XMLHttpRequest API is implemented on-top of [iOS networking apis](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/URLLoadingSystem/URLLoadingSystem.html). The notable difference from web is the security model: you can read from arbitrary websites on the internet since there is no concept of [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).

```js
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

You can also use - 

```js
var request = new XMLHttpRequest();

function onLoad() {
    console.log(request.status);
    console.log(request.responseText);
};

function onTimeout() {
    console.log('Timeout');
    console.log(request.responseText);
};

function onError() {
    console.log('General network error');
    console.log(request.responseText);
};

request.onload = onLoad;
request.ontimeout = onTimeout;
request.onerror = onError;
request.open('GET', 'https://mywebsite.com/endpoint.php');
request.send();
```


Please follow the [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) for a complete description of the API.

As a developer, you're probably not going to use XMLHttpRequest directly as its API is very tedious to work with. But the fact that it is implemented and compatible with the browser API gives you the ability to use third-party libraries such as [frisbee](https://github.com/niftylettuce/frisbee) or [axios](https://github.com/mzabriskie/axios) directly from npm.
