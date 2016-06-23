---
id: basics-network
title: Networking
layout: docs
category: The Basics
permalink: docs/network.html
next: more-resources
---

Many modern mobile apps will at some point find the need to load resources from a remote endpoint. You may want to integrate with a third party REST API, or you may simply need to fetch a chunk of static content from another server.

## Using Fetch

React Native provides the [Fetch API](https://fetch.spec.whatwg.org/) for your networking needs. This standard is currently being worked on, and is not available in all web browsers yet, but you can start using it today in your React Native apps without any additional work.

Fetch works generally like this. In order to fetch content from an arbitrary endpoint,

```js
fetch('https://mywebsite.com/endpoint/')
```

Fetch also takes an optional second argument that allows you to customize the HTTP request:

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

### Asynchronous

Networking is an inherently asynchronous operation. Fetch methods will return a  [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that make it straightforward to write code that works in an asynchronous manner.

// clean up these examples, they should be completely identical save for await, try, catch

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

Always make sure to catch any errors that may thrown by fetch. Unhandled errors will be dropped silently.

## Advanced networking

React Native also comes with support for [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

## Networking in third party libraries

Many third party libraries use the `XMLHttpRequest` API. This API is also built in to React Native, which means that you can use third party libraries such as [frisbee](https://github.com/niftylettuce/frisbee) or [axios](https://github.com/mzabriskie/axios) directly from NPM.
