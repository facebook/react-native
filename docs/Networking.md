---
id: network
title: 네트워킹
layout: docs
category: The Basics
permalink: docs/network.html
next: more-resources
previous: using-a-listview
---

대다수의 모바일 앱들은 외부 URL로부터 데이터를 가져와야 합니다. REST API로 POST 요청을 만들거나 간단히 다른 서버로부터 정적 콘텐츠를 가져오고 싶을 때도 있을 것입니다.

## Fetch 사용하기

React Native는 네트워킹 시 [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)를 제공합니다. 이전에 `XMLHttpRequest`나 다른 네트워킹 API를 써봤다면 Fetch가 익숙하게 느껴질 것입니다. 자세한 정보는 [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)에 대한 MDN 가이드를 참조하시길 바랍니다.

#### 요청하기

임의의 URL로부터 데이터를 가져오기 위해서는 URL을 fetch에 전달해주기만 하면 됩니다.

```js
fetch('https//mywebsite.com/mydata.json')
```

또한, Fetch는 두 번째 인수에 HTTP 요청을 커스터마이징 할 수 있는 옵션을 설정할 수 있으며, 아래와 같이 추가 헤더를 지정하거나 POST 요청을 만들 수도 있습니다.

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


전체 속성에 대한 정보를 보려면 [Fetch Request Docs](https://developer.mozilla.org/en-US/docs/Web/API/Request)를 살펴보시길 바랍니다.

#### 응답 처리하기

위의 예제들은 요청하는 방법에 대해 보여줬습니다. 대부분의 경우, 우리는 응답 온 결과를 토대로 작업을 할 겁니다.

네트워킹은 본질적으로 비동기식 작업입니다. Fetch 메소드는 비동기 방식으로 작동하는 코드인 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)를 반환할 것입니다.

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

또한, React Native 앱에선 ES2017 `async`/`await` 문법을 사용할 수 있습니다.

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

`fetch`에서 발생할 수 있는 오류를 catch 하는 것을 잊지 마세요.

```SnackPlayer?name=Fetch%20Example
import React, { Component } from 'react';
import { ActivityIndicator, ListView, Text, View } from 'react-native';

export default class Movies extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    }
  }

  componentDidMount() {
    return fetch('https://facebook.github.io/react-native/movies.json')
      .then((response) => response.json())
      .then((responseJson) => {
        let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.setState({
          isLoading: false,
          dataSource: ds.cloneWithRows(responseJson.movies),
        }, function() {
          // 새 state로 작업하기
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <View style={{flex: 1, paddingTop: 20}}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={{flex: 1, paddingTop: 20}}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData.title}, {rowData.releaseYear}</Text>}
        />
      </View>
    );
  }
}
```
> 기본적으로, iOS에서는 SSL로 암호화되지 않은 요청은 모두 막혀있습니다. 만약 평문 통신을 하는 URL (`http` 같은)로 가져와야 한다면 먼저 App Transport Security exception에 URL을 추가해줘야 합니다. 어떤 도메인에 접근해야 하는지 미리 아는 경우엔 해당 도메인에 대한 예외만 추가하는 것이 안전합니다. 그러나 런타임까지 도메인을 모른다면 [disable ATS completely](docs/integration-with-existing-apps.html#app-transport-security) 링크를 참고해주세요. 2017년 1월 문서에 따르면, [애플의 앱스토어는 ATS를 비활성화한 앱에 대해서 합리적인 이유를 조사](https://forums.developer.apple.com/thread/48979)한다고 합니다. 자세한 정보는 [Apple's documentation](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW33) 이곳에서 확인하시길 바랍니다.

### 다른 네트워킹 라이브러리

[XMLHttpRequest API](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)는 React Native 안에 내장된 API입니다. 즉, [axios](https://github.com/mzabriskie/axios)와 [frisbee](https://github.com/niftylettuce/frisbee) 같은 써드파티 라이브러리를 사용할 수 있으며, 원하는 경우 직접 XMLHttpRequest API를 사용할 수 있습니다.

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

> XMLHttpRequest의 보안 모델은 네이티브 앱에 [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) 개념이 없으므로 웹과 다릅니다.

## 웹소켓 지원

React Native는 단일 TCP 연결을 통해 full-duplex 통신 채널을 제공하는 프로토콜인 [웹소켓](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)도 지원합니다.

```js
var ws = new WebSocket('ws://host.com/path');

ws.onopen = () => {
  // 연결 열림.
  ws.send('something'); // 메시지 보냄.
};

ws.onmessage = (e) => {
  // 메세지 들어옴.
  console.log(e.data);
};

ws.onerror = (e) => {
  // 오류 발생.
  console.log(e.message);
};

ws.onclose = (e) => {
  // 연결 닫힘.
  console.log(e.code, e.reason);
};
```

## 짱짱맨!

만약 처음부터 순서대로 튜토리얼을 진행하셨다면, 이미 당신은 훌륭한 개발자입니다. 축하합니다! 다음으로 [all the cool stuff the community does with React Native](docs/more-resources.html)에서 유용한 정보들을 확인하시길 바랍니다.