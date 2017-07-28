---
id: state
title: State
layout: docs
category: The Basics
permalink: docs/state.html
next: style
previous: props
---

컴포넌트를 제어하는 데이터에는 두 가지 타입 `props` 와 `state` 가 있습니다. `props`는 부모에 의해서 설정이 되며 컴포넌트의 생명주기를 통해서 변경되지 않게 고정 됩니다. 변경이 일어나는 데이터에 대해서는 `state`를 사용하여야 합니다. 

일반적으로 `state`는 생성자에서 초기화하여야 하며 값을 변경하고 하고 싶다면 `setState` 를 호출하여 데이터값을 변경합니다.

예를 들어, 텍스트 즉 글자가 항상 깜빡이는 것을 구현하고 싶다고 칩시다. 아래 샘플 코드를 보면 **Blink** 컴포넌트가 생성이 될 때 **text** 를 한번 설정이 되는 것을 알 수 있는데, 이 **text** 가 `prop` 이 됩니다. 특정한 시간 주기로 "**text** 가 보이고 안 보이는 설정" 하는 것은 `state`로 유지 되어야 합니다. 


```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text, View } from 'react-native';

class Blink extends Component {
  constructor(props) {
    super(props);
    this.state = {showText: true};

    // Toggle the state every second
    setInterval(() => {
      this.setState(previousState => {
        return { showText: !previousState.showText };
      });
    }, 1000);
  }

  render() {
    let display = this.state.showText ? this.props.text : ' ';
    return (
      <Text>{display}</Text>
    );
  }
}

export default class BlinkApp extends Component {
  render() {
    return (
      <View>
        <Blink text='I love to blink' />
        <Blink text='Yes blinking is so great' />
        <Blink text='Why did they ever take this out of HTML' />
        <Blink text='Look at me look at me look at me' />
      </View>
    );
  }
}

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => BlinkApp);
```

실제 애플리케이션에서는 타이머로 state를 설정하지 않을 것입니다. 보통 서버나 사용자의 입력으로부터 받은 새로운 데이터를 받을 때 state를 설정하게 될 것 입니다. 또한, 데이터 흐름을 제어하는 [Redux](http://redux.js.org/index.html) 와 같은 state 컨테이너를 이용 할 수도 있습니다. 이 경우에는 `setState`를 직접 호출하여 `state`를 수정하기보다는 Redux 를 사용하여 수정하게 됩니다.

`setState` 가 호출이 될 때, BlinkApp 은 컴포넌트를 re-render 할 것 입니다. 타이머 안에서 `setState` 가 호출 됨으로써, 컴포넌트는 타이머를 통해 매번 re-render를 하게 됩니다.

State는 React와 같은 방식으로 동작이 되므로 state를 다루는 것에 대한 자세한 설명은 [React.Component API](https://facebook.github.io/react/docs/component-api.html)를 참조하시면 됩니다. 이 시점에서, 여기 나와있는 예시 대부분에 쓰인 지루하고 디폴트한 검은색 텍스트로 사용된 것에 대해 화나실 수도 있는데, 좀 더 이쁘게 만들려면 [Style](docs/style.html) 를 참조하여 쓰시면 됩니다.