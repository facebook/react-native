---
id: handling-text-input
title: 텍스트 입력 핸들링하기
layout: docs
category: The Basics
permalink: docs/handling-text-input.html
next: handling-touches
previous: flexbox
---

[`TextInput`](docs/textinput.html#content)은 사용자가 텍스트를 입력할 수 있게 해주는 기본 컴포넌트 입니다. TextInput은 텍스트가 변경될 때마다 호출되는 함수를 받는 `onChangeText` prop과 텍스트 입력이 끝나고 전송될 때 불리는 함수를 받는 `onSubmitEditing` prop을 가집니다.

예를 들어, 사용자가 텍스트를 입력하면 다른 언어로 번역을 한다고 칩시다. 새로운 언어에서는 모든 단어가 🍕로 쓰여집니다. 그래서 "Hello there Bob"이라는 문장은 "🍕🍕🍕"으로 번역되게 됩니다.

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

// Create React Native App을 사용한다면 아래 줄을 생략하세요
AppRegistry.registerComponent('AwesomeProject', () => PizzaTranslator);
```

이 예제에서는 `text`가 입력에 따라 매번 바뀌기 때문에 state에 `text`를 저장합니다.

텍스트 입력을 통해 할 수 있는 것들은 많습니다. 예를 들어, 사용자가 텍스트를 입력하는 동안 해당 텍스트가 유효한지 확인할 수 있습니다. 더 자세한 예제들은 [Controlled component에 관한 리액트 문서](https://facebook.github.io/react/docs/forms.html), 또는 [TextInput에 대한 참고 문서](docs/textinput.html)에서 확인할 수 있습니다.

텍스트 입력은 사용자와 앱이 상호 작용할 수 있는 방법 중 하나입니다. 다음은 다른 종류의 입력에 대해 알아보고 [터치를 핸들링하는 방법을 학습](docs/handling-touches.html)해 봅시다.
