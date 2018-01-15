---
id: handling-text-input
title: Handling Text Input
layout: docs
category: The Basics
permalink: docs/handling-text-input.html
next: using-a-scrollview
previous: flexbox
---

[`TextInput`](docs/textinput.html#content) is a basic component that allows the user to enter text. It has an `onChangeText` prop that takes
a function to be called every time the text changed, and an `onSubmitEditing` prop that takes a function to be called when the text is submitted.

For example, let's say that as the user types, you're translating their words  into a different language. In this new language, every single word is written the same way: 🍕. So the sentence "Hello there Bob" would be translated
as "🍕🍕🍕".

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text, TextInput, View } from 'react-native';

class PizzaTranslator extends Component {
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

AppRegistry.registerComponent('PizzaTranslator', () => PizzaTranslator);
```

In this example, we store `text` in the state, because it changes over time.

There are a lot more things you might want to do with a text input. For example, you could validate the text inside while the user types. For more detailed examples, see the [React docs on controlled components](https://facebook.github.io/react/docs/forms.html), or the [reference docs for TextInput](docs/textinput.html).

Text input is probably the simplest example of a component whose state naturally changes over time. Next, let's look at another type of component like this one that controls layout, and [learn about the ScrollView](docs/using-a-scrollview.html).
