---
id: handling-text-input
title: Handling Text Input
layout: docs
category: The Basics
permalink: docs/handling-text-input.html
next: handling-touches
previous: flexbox
---

[`TextInput`](docs/textinput.html#content)은 사용자가 텍스트를 입력할 수 있게 해주는 기본 컴포넌트 입니다. TextInput은 텍스트가 변경될 때마다 호출되는 함수를 받는 `onChangeText` prop과 텍스트 입력이 끝나고 전송될 때 불리는 함수를 받는 `onSubmitEditing` prop을 가집니다.

에를 들어, 사용자가 텍스트를 입력하면 다른 언어로 번역을 한다고 칩시다. 새로운 언어에서는 모든 단어가 🍕로 쓰여집니다. 그래서 "Hello there Bob"이라는 문장은 "🍕🍕🍕"으로 번역되게 됩니다.

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text, TextInput, View } from 'react-native';

export default class PizzaTranslator extends Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }

  render() {
    return (
      <View style={{padding: 10}}>
        <TextInput
          style={{height: 40}}
          placeholder="Type here to translate!"
          onChangeText={(text) => this.setState({text})}
        />
        <Text style={{padding: 10, fontSize: 42}}>
          {this.state.text.split(' ').map((word) => word && '🍕').join(' ')}
        </Text>
      </View>
    );
  }
}

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => PizzaTranslator);
```

이 예제에서는 `text`가 입력에 따라 매번 바뀌기 때문에 state에 `text`를 저장합니다.

Text input으로 할 수 있는 것들은 훨씬 더 많습니다. 예를 들어, 사용자가 텍스트를 입력하는 동안 해당 텍스트가 유효한지 확인할 수 있습니다. 더 자세한 예제들은 [React docs on controlled components](https://facebook.github.io/react/docs/forms.html), 또는 [reference docs for TextInput](docs/textinput.html)에서 확인할 수 있습니다.

Text input은 사용자와 앱이 상호 작용할 수 있는 방법들 중 하나입니다. 다음은 다른 종류의 input과 [learn how to handle touches](docs/handling-touches.html)를 알아봅시다.
