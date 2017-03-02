---
id: network
title: Networking
layout: docs
category: The Basics
permalink: docs/network.html
next: more-resources
previous: using-a-listview
---

Many mobile apps need to load resources from a remote URL. You may want to make a POST request to a REST API, or you may simply need to fetch a chunk of static content from another server.

## Using Fetch

React Native provides the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for your networking needs. Fetch will seem familiar if you have used `XMLHttpRequest` or other networking APIs before. You may refer to MDN's guide on [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) for additional information.

#### Making requests

In order to fetch content from an arbitrary URL, just pass the URL to fetch:

```js
fetch('https://mywebsite.com/mydata.json')
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

#### Handling the response

The above examples show how you can make a request. In many cases, you will want to do something with the response.

Networking is an inherently asynchronous operation. Fetch methods will return a  [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that makes it straightforward to write code that works in an asynchronous manner:

  ```js
  function getMoviesFromApiAsync() {
    return fetch('https://facebook.github.io/react-native/movies.json')
      .then((response) => response.json())
      .then((responseJson) => {
        return responseJson.movies;
      })
      .catch((error) => {
        console.error(error);
      });
  }
  ```

You can also use the proposed ES2017 `async`/`await` syntax in a React Native app:

  ```js
  async function getMoviesFromApi() {
    try {
      let response = await fetch('https://facebook.github.io/react-native/movies.json');
      let responseJson = await response.json();
      return responseJson.movies;
    } catch(error) {
      console.error(error);
    }
  }
  ```

Don't forget to catch any errors that may be thrown by `fetch`, otherwise they will be dropped silently.

> By default, iOS will block any request that's not encrypted using SSL. If you need to fetch from a cleartext URL (one that begins with `http`) you will first need to add an App Transport Security exception. If you know ahead of time what domains you will need access to, it is more secure to add exceptions just for those domains; if the domains are not known until runtime you can [disable ATS completely](docs/integration-with-existing-apps.html#app-transport-security). Note however that from January 2017, [Apple's App Store review will require reasonable justification for disabling ATS](https://forums.developer.apple.com/thread/48979). See [Apple's documentation](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW33) for more information.

### Using Other Networking Libraries

The [XMLHttpRequest API](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) is built in to React Native. This means that you can use third party libraries such as [frisbee](https://github.com/niftylettuce/frisbee) or [axios](https://github.com/mzabriskie/axios) that depend on it, or you can use the XMLHttpRequest API directly if you prefer.

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

request.open('GET', 'https://mywebsite.com/endpoint/');
request.send();
```

> The security model for XMLHttpRequest is different than on web as there is no concept of [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) in native apps.

## WebSocket Support

React Native also supports [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), a protocol which provides full-duplex communication channels over a single TCP connection.

```js
var ws = new WebSocket('ws://host.com/path');

ws.onopen = () => {
  // connection opened

  ws.send('something'); // send a message
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

Your app can now display all sorts of data and you may soon need to organize this content into several screens. To manage the transition between these screens, you will need to learn about [navigators](docs/using-navigators.html).
