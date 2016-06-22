---
id: basics-component-textinput
title: TextInput
layout: docs
category: Basics
permalink: docs/basics-component-textinput.html
next: basics-component-scrollview
---

Direct text-based user input is a foundation for many apps. Writing a post or comment on a page is a canonical example of this. [`TextInput`](/react-native/docs/textinput.html#content) is a basic component that allows the user to enter text.

This example creates a simple `TextInput` box with the `string` `Type something here` as the placeholder when the `TextInput` is empty.

```JavaScript
import React from 'react';
import { AppRegistry, Text, TextInput, View } from 'react-native';

const AwesomeProject = () => {
  return (
    <View style={{paddingTop: 22}}>
      <TextInput
        style={{
          height: 40,
          margin: 5,
          paddingLeft: 10,
          borderColor: 'black',
          borderWidth: 1
        }}
        placeholder="Type something here"
      />
    </View>
  );
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
