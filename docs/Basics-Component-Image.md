---
id: basics-component-image
title: Image
layout: docs
category: Basics
permalink: docs/basics-component-image.html
next: basics-component-view
---

The other basic React Native component is the [`Image`](/react-native/docs/image.html#content) component. Like `Text`, the `Image` component simply renders an image.

> An `Image` is analogous to using `img` when building websites.

The simplest way to render an image is to provide a source file to that image via the `source` attribute.

This example displays a checkbox `Image` on the device.

```JavaScript
import React from 'react';
import { AppRegistry, Image } from 'react-native';

const App = () => {
  return (
    <Image source={require('./img/check.png')} />
  );
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App);
```
