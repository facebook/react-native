---
id: style
title: 스타일
layout: docs
category: The Basics
permalink: docs/style.html
next: height-and-width
previous: state
---

React Native에서는 styles를 정의할 때 특별한 언어나 문법(syntax)을 사용하지 않아도 됩니다. JavaScript를 사용하여 애플리케이션을 스타일하게 됩니다. 코어 컴포넌트 모두 `style`이란 이름으로 prop을 받습니다. `style` 이름과 [값](docs/colors.html)은 이름이 캐멀 케이스로 쓰이는 것(예를 들어, `background-color` 보다는 `backgroundColor`)을 제외하고는 보통 웹에서 CSS가 동작하는 방식과 같습니다.

`style` prop은 자바스크립트 오브젝트(plain old JavaScript object)로 쓸 수 있습니다. 가장 간단하며 보통 예시 코드를 위해서 쓰이게 됩니다. 또한 스타일을 배열로 값을 넘길 수 있습니다 - 배열에서 가장 마지막의 스타일이 우선권을 가지므로 styles를 상속하는데 쓸 수 있습니다.

컴포넌트가 복잡하게 늘어나게 되면 여러 styles를 한 곳에서 정의할 수 있는 `StyleSheet.create`를 사용하는 것이 더 깔끔합니다. 여기 예시코드를 보면:

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';

export default class LotsOfStyles extends Component {
  render() {
    return (
      <View>
        <Text style={styles.red}>just red</Text>
        <Text style={styles.bigblue}>just bigblue</Text>
        <Text style={[styles.bigblue, styles.red]}>bigblue, then red</Text>
        <Text style={[styles.red, styles.bigblue]}>red, then bigblue</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bigblue: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 30,
  },
  red: {
    color: 'red',
  },
});

// Create React Native App 을 사용하면 아래 코드는 넘어가세요.
AppRegistry.registerComponent('AwesomeProject', () => LotsOfStyles);
```

공통적으로 `style` 속성을 가지는 컴포넌트를 생성하여 자식 컴포넌트에 스타일하는 패턴을 많이 쓰입니다. 이것을 사용하여 CSS에서 하는 것처럼 styles를 "cascade" 할 수 있습니다.

text style을 개별화 하는 방법은 더 많이 있습니다. [Text component](docs/text.html)를 참조하시면 됩니다.

이제 text를 멋있게 만들 수 있습니다. 다음 단계는 [컴포넌트 크기를 조절하는 방법 배우기](docs/height-and-width.html)를 참조하여 스타일에 대해 완벽하게 습득 하실 수 있습니다.
