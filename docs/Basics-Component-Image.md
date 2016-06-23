---
id: basics-component-image
title: Image
layout: docs
category: The Basics
permalink: docs/basics-component-image.html
next: basics-component-view
---

Another basic React Native component is the [`Image`](/react-native/docs/image.html#content) component. Like `Text`, the `Image` component simply renders an image.

> An `Image` is analogous to the `<img>` HTML tag when building websites.

The simplest way to render an image is to provide a source file to that image via the `source` attribute.

This example displays a checkbox `Image` on the device.

```ReactNativeWebPlayer
import React from 'react';
import { AppRegistry, Image } from 'react-native';

const AwesomeProject = () => {
  return (
    <Image source={require('./img/favicon.png')} />
  );
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
