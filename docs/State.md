---
id: state
title: State
layout: docs
category: The Basics
permalink: docs/state.html
next: style
previous: props
---
There are two types of data that control a component: `props` and `state`. `props` are set by the parent and they are fixed throughout the lifetime of a component. For data that is going to change, we have to use `state`.


컴포넌트를 제어하는 데이터에는 두가지 타입 `props` 와 `state` 가 있습니다. `props` 는 부모에 의해서 설정이 되며 컴포넌트의 생명주기를 통해서 변경이 되지 않게 고정 되어집니다. 변경이 일어나는 데이터에 대해서는 `state` 를 사용하여야 합니다. 


In general, you should initialize `state` in the constructor, and then call `setState` when you want to change it.

일반적으로 `state` 는 생성자에서 초기화 하여야 하며 데이터 값을 변경하고 하고 싶다면 `setState` 를 호출하여 데이터 값을 변경합니다.

For example, let's say we want to make text that blinks all the time. The text itself gets set once when the blinking component gets created, so the text itself is a `prop`. The "whether the text is currently on or off" changes over time, so that should be kept in `state`.

예를 들어, 텍스트 즉 글자가 항상 깜빡이는 것을 구현하고 싶다고 칩시다. 아래 샘플 코드를 보면 **Blink** 컴포넌트가 생성이 될때 **text** 를 한번 설정이 되는것을 알수 있는데, 이 **text** 가  `prop` 이 됩니다. 특정한 시간 주기로 "**text** 가 보이고 안보이는 설정" 하는 것은 `state` 로 관리 되어야 합니다. 


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

In a real application, you probably won't be setting state with a timer. You might set state when you have new data arrive from the server, or from user input. You can also use a state container like [Redux](http://redux.js.org/index.html) to control your data flow. In that case you would use Redux to modify your state rather than calling `setState` directly.

실제 어플리케이션에서는 타이머로 state를 설정하지 않을 것입니다. 보통 서버나 사용자의 입력으로 부터 받은 새로운 데이터를 받을때 state 를 설정하게 될것 입니다. 또한, 데이터 흐름을 제어하는 [Redux](http://redux.js.org/index.html) 와 같은 state 컨테이너를 이용 할수도 있습니다.

When setState is called, BlinkApp will re-render its Component. By calling setState within the Timer, the component will re-render every time the Timer ticks.

setState 가 호출이 될때, BlinkApp 은 컴포넌트를 re-render 할것 입니다. 타이머 안에서 setState 가 호출 됨으로서, 컴포넌트는 타이머를 통해 매시간 마다 re-render 를 하게 됩니다.

State works the same way as it does in React, so for more details on handling state, you can look at the [React.Component API](https://facebook.github.io/react/docs/component-api.html).
At this point, you might be annoyed that most of our examples so far use boring default black text. To make things more beautiful, you will have to [learn about Style](docs/style.html).

State 는 React 와 같은 방식으로 동작이 되므로 state 를 다루는 것에 대한 자세한 설명은 [React.Component API](https://facebook.github.io/react/docs/component-api.html)를 참조 하시면 됩니다. 이 시점에서, 여기 나와있는 예시 대부분에 쓰인 지루하고 디폴트한 검정색 텍스트로 사용된 것에 대해 화나실 수도 있는데, 좀 더 아름답고 잼있게 만들려면 [Style](docs/style.html) 를 참조하여 쓰시면 됩니다.