---
id: tutorials-core-components
title: Core Components
layout: docs
category: Tutorials
permalink: docs/tutorials/core-components.html
next: sample-applications-movies
---

Components are the building blocks for a React Native application. A React Native user interface
(UI) is specified by declaring components, possibly nested, and then those components are mapped
to the native UI on the targeted platform.

React Native has a number of core components that are commonly used in applications, either on
their own or combined to build new components.

## Text

The most basic component in React Native is the `Text` component. The `Text` component simply
renders text.

This example displays the `string` `"Hello"` on the device.

```JavaScript
import React, { AppRegistry, Text } from 'react-native'

const App = () => {
  return (
    // Normally this would at least be wrapped in a View for better control.
    <Text>Hello!</Text>
  )
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App)
```

## Image

The other basic React Native component is the `Image` component. Like `Text`, the `Image` component
simply renders an image.

> An `Image` is analogous to using `img` when building websites.

The simplest way to render an image is to provide a source file to that image via the `source`
attribute.

This example displays a checkbox `Image` on the device.

```JavaScript
import React, { AppRegistry, Image } from 'react-native'

const App = () => {
  return (
    // Normally this would at least be wrapped in a View for better control.
    <Image source={require('./img/check.png')} />
  )
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App)
```

## View

A `View` is the most basic building block for a React Native application. The `View` is an
abstraction on top of the target platform's native equivalent, such as iOS's `UIView`.

> A `View` is analogous to using a `div` for building websites.

While basic components such as `Text` and `Image`, can be displayed without a `View`, this is not
generally recommended since the `View` gives you the control for styling and layout of those
components.

This example creates a `View` that aligns the `string` `Hello` in the top center of the device,
something which could not be done with a `Text` component alone (i.e., a `Text` component
without a `View` would place the `string` in a fixed location in the upper corner):

```JavaScript
import React, { AppRegistry, Text, View } from 'react-native'

const App = () => {
  return (
    <View style={{alignItems: `center`}}>
      <Text>Hello!</Text>
    </View>
  )
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App)
```

## TextInput

## ListView
