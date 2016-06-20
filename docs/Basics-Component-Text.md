---
id: basics-component-text
title: Text
layout: docs
category: Basics
permalink: docs/basics-component-text.html
next: basics-component-image
---

The most basic component in React Native is the [`Text`](/react-native/docs/text.html#content) component. The `Text` component simply renders text.

This example displays the `string` `"Hello World!"` on the device.

```JavaScript
import React from 'react';
import { AppRegistry, Text } from 'react-native';

const App = () => {
  return (
    <Text>Hello World!</Text>
  );
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App);
```
