---
id: basics-component-textinput
title: TextInput
layout: docs
category: Basics
permalink: docs/basics-component-textinput.html
next: basics-component-listview
---

Direct text-based user input is a foundation for many apps. Writing a post or comment on a page is a canonical example of this. [`TextInput`](/react-native/docs/textinput.html#content) is a basic component that allows the user to enter text.

This example creates a simple `TextInput` box with the `string` `Hello` as the placeholder when the `TextInput` is empty.

```JavaScript
import React from 'react';
import { AppRegistry, TextInput, View } from 'react-native';

const App = () => {
  return (
      <View>
        <TextInput placeholder="Hello" />
      </View>
  );
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App);
```
