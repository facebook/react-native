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

## View

## TextInput

## ListView
