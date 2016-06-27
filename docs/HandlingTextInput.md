---
id: handling-text-input
title: Handling Text Input
layout: docs
category: The Basics
permalink: docs/handling-text-input.html
next: using-a-scrollview
---

[`TextInput`](/react-native/docs/textinput.html#content) is a basic component that allows the user to enter text. It has an `onChangeText` prop that takes
a function to be called every time the text changed.

This example shows how to count the number of characters that have been typed in a box.

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text, TextInput, View } from 'react-native';

class CharacterCounter extends Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }

  render() {
    return (
      <View style={{padding: 10}}>
        <TextInput
          style={{height: 40}}
          placeholder="Pleeeease type on me!"
          onChangeText={(text) => this.setState({text})}
        />
        <Text style={{padding: 10}}>{this.state.text.length}</Text>
      </View>
    );
  }
}

AppRegistry.registerComponent('CharacterCounter', () => CharacterCounter);
```

In this example, we store `text` in the state, because it changes over time.

There are a lot more advanced things you might want to do with a text input. For example, you could validate the text inside while the user types. For more detailed examples, see the [React docs on controlled components](https://facebook.github.io/react/docs/forms.html), or the [reference docs for TextInput](/react-native/docs/textinput.html).

Text input is probably the simplest example of a component whose state naturally changes over time. Next, let's look at another type of component like this is one that controls layout, and [learn about the ScrollView](/react-native/docs/using-a-scrollview.html).
