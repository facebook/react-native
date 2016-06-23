---
id: basics-component-text
title: Text
layout: docs
category: The Basics
permalink: docs/basics-component-text.html
next: basics-component-image
---

The most basic component in React Native is the [`Text`](/react-native/docs/text.html#content) component. The `Text` component simply renders text.

This example displays the `string` `"Hello World!"` on the device.

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text } from 'react-native';

class TextBasics extends Component {
  render() {
    return (
      <Text style={{marginTop: 22}}>Hello World!</Text>
    );
  }
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => TextBasics);
```

In this slightly more advanced example we will display the `string` `"Hello World"` retrieved from this.state on the device and stored in the `text` variable. The value of the `text` variable is rendered by using `{text}`.

```ReactNativeWebPlayer
import React, {Component} from 'react';
import { AppRegistry, Text } from 'react-native';

class TextBasicsWithState extends Component {
  constructor(props) {
    super(props);
    this.state = {text: "Hello World"};
  }
  render() {
    var text = this.state.text;
    return (
        <Text style={{marginTop: 22}}>
            {text}
        </Text>
    )
  }
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => TextBasicsWithState);
```
