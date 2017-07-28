---
id: style
title: Style
layout: docs
category: The Basics
permalink: docs/style.html
next: height-and-width
previous: state
---

With React Native, you don't use a special language or syntax for  defining styles. You just style your application using JavaScript. All of the core components accept a prop named `style`. The style names and [values](docs/colors.html) usually match how CSS works on the web, except names are written using camel casing, e.g `backgroundColor` rather than `background-color`.

React Native 에서는 styles를 정의할때 특별한 언어나 문법(syntax?) 를 사용하지 않습니다. JavaScript 를 사용하여 어플리케이션을 style 합니다. 코어 컴포넌트 모두 `style` 이란 prop 을 수락합니다. `style`의  names 와 [values](docs/colors.html) 는 names 가 camel casing 으로 쓰이는 것(예를 들어, `background-color` 보다는 `backgroundColor`)을 제외하고는 보통 웹에서 CSS가 동작하는 방식과 같습니다.

The `style` prop can be a plain old JavaScript object. That's the simplest and what we usually use for example code. You can also pass an array of styles - the last style in the array has precedence, so you can use this to inherit styles.

`style` prop 은 오래된 방식의 간단한 자바 오브젝트(plain old JavaScript object) 일수 있습니다. 가장 간단하며 보통 예시 코드를 위해서 쓰이게 됩니다. 또한 style를 배열(array)로 값을 넘길수 있습니다 - 배열에서 가장 마지막의 style이 우선권을 가져서 이것을 styles를 상속하는데 쓸수 있습니다.

As a component grows in complexity, it is often cleaner to use `StyleSheet.create` to define several styles in one place. Here's an example:

컴포넌트가 복잡하게 커짐으로서, 여러 styles 를 한 곳에서 정의하는 `StyleSheet.create` 를 사용하는 것이 더 깔끔합니다. 여기 예시코드를 보면:

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

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => LotsOfStyles);
```

One common pattern is to make your component accept a `style` prop which in
turn is used to style subcomponents. You can use this to make styles "cascade" the way they do in CSS.

공통된 패턴은.......
이것을 사용하여 CSS 에서 하는 것처럼 styles 을 "cascade" 할수 있습니다.

There are a lot more ways to customize text style. Check out the [Text component reference](docs/text.html) for a complete list.

텍스트 style를 커스터마이즈 하는 방법은 더 많이 있습니다. [Text component reference](docs/text.html)를 참조하시면 됩니다.


Now you can make your text beautiful. The next step in becoming a style master is to [learn how to control component size](docs/height-and-width.html).

이제 텍스트를 멋있게 만들수 있습니다. 다음 단계는 [learn how to control component size](docs/height-and-width.html) 를 참조하여 style 에 대해 완벽하게 습득 하실수 있습니다.
