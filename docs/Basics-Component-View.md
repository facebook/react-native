---
id: basics-component-view
title: View
layout: docs
category: The Basics
permalink: docs/basics-component-view.html
next: basics-component-textinput
---

A [`View`](/react-native/docs/view.html#content) is the most basic building block for a React Native application. The `View` is an abstraction on top of the target platform's native equivalent, such as iOS's `UIView`.

> A `View` is analogous to using a `<div>` HTML tag for building websites.

It is recommended that you wrap your components in a `View` to style and control layout.

The example below creates a `View` that aligns the `string` `Hello` in the top center of the device, something which could not be done with a `Text` component alone (i.e., a `Text` component without a `View` would place the `string` in a fixed location in the upper corner):

```JavaScript
import React from 'react';
import { AppRegistry, Text, View } from 'react-native';

const AwesomeProject = () => {
  return (
    <View style={{marginTop: 22, alignItems: 'center'}}>
      <Text>Hello!</Text>
    </View>
  );
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
