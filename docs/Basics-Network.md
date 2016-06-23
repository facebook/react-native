---
id: basics-network
title: Networking
layout: docs
category: The Basics
permalink: docs/network.html
next: more-resources
---

Many modern mobile apps will at some point find the need to load resources from a remote endpoint. You may want to make a POST request to a REST API, or you may simply need to fetch a chunk of static content from another server.

React Native provides the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for your networking needs.

## Using Fetch

Fetch will seem familiar if you have used `XMLHttpRequest` or other networking APIs before. You may refer to MDN's guide on [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) for additional information.

In order to fetch content from an arbitrary endpoint, just pass the URL to fetch:

```js
fetch('https://mywebsite.com/endpoint/')
```

Fetch also takes an optional second argument that allows you to customize the HTTP request. You may want to specify additional headers, or make a POST request:

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

Take a look at the [Fetch Request docs](https://developer.mozilla.org/en-US/docs/Web/API/Request) for a full list of properties.

### Handling the response

The above examples show how you can make a request. In many cases, you will want to do something with the response.

Networking is an inherently asynchronous operation. Fetch methods will return a  [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that make it straightforward to write code that works in an asynchronous manner:

  ```js
  getMoviesFromApiAsync() {
    return fetch('http://facebook.github.io/react-native/movies.json')
      .then((response) => response.json())
      .then((responseJson) => {
        return responseJson.movies;
      })
      .catch((error) => {
        console.error(error);
      });
  }
  ```

You can also use ES7's `async`/`await` syntax in React Native app:

  ```js
  async getMoviesFromApi() {
    try {
      let response = await fetch('http://facebook.github.io/react-native/movies.json');
      let responseJson = await response.json();
      return responseJson.movies;
    } catch(error) {
      console.error(error);
    }
  }
  ```

Don't forget to catch any errors that may be thrown by `fetch`, otherwise they will be dropped silently.

## WebSocket Support

React Native supports [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), a protocol which provides full-duplex communication channels over a single TCP connection.

## Using Other Networking Libraries

The `XMLHttpRequest` API, used by many networking libraries, is built in to React Native. This means that you can use third party libraries such as [frisbee](https://github.com/niftylettuce/frisbee) or [axios](https://github.com/mzabriskie/axios) if you prefer.
