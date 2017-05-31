---
id: style
title: Style
layout: docs
category: The Basics
permalink: docs/style.html
next: height-and-width
previous: state
---

With React Native, you don't use a special language or syntax for  defining styles. You just style your application using JavaScript. All of the core components accept a prop named `style`. The style names and [values](docs/colors.html) usually match how CSS works on the web, except names are written using camel casing, e.g `backgroundColor` rather than `background-color`.

The `style` prop can be a plain old JavaScript object. That's the simplest and what we usually use for example code. You can also pass an array of styles - the last style in the array has precedence, so you can use this to inherit styles.

As a component grows in complexity, it is often cleaner to use `StyleSheet.create` to define several styles in one place. Here's an example:

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';

export default class LotsOfStyles extends Component {
  render() {
    return (
      <View>
        <Text style={styles.red}>just red</Text>
        <Text style={styles.bigblue}>just bigblue</Text>
        <Text style={[styles.bigblue, styles.red]}>bigblue, then red</Text>
        <Text style={[styles.red, styles.bigblue]}>red, then bigblue</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bigblue: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 30,
  },
  red: {
    color: 'red',
  },
});

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => LotsOfStyles);
```

One common pattern is to make your component accept a `style` prop which in
turn is used to style subcomponents. You can use this to make styles "cascade" the way they do in CSS.

There are a lot more ways to customize text style. Check out the [Text component reference](docs/text.html) for a complete list.

Now you can make your text beautiful. The next step in becoming a style master is to [learn how to control component size](docs/height-and-width.html).
