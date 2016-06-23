---
id: basics-layout
title: Layout
layout: docs
category: The Basics
permalink: docs/basics-layout.html
next: basics-network
---

A component can specify the layout of its children using the flexbox algorithm. Flexbox is designed to provide a consistent layout on different screen sizes.

You will normally use a combination of `flexDirection`, `alignItems`, and `justifyContent` to achieve the right layout.

> Flexbox works the same way in React Native as it does in CSS on the web, with a few exceptions. The most notable one: the defaults are different, with `flexDirection`  defaulting to `column` instead of `row`, and `alignItems` defaulting to `stretch` instead of `flex-start`.

#### Flex Direction

Adding `flexDirection` to a component's `style` determines the **primary axis** of its layout. Should the children be organized horizontally (`row`) or vertically (`column`)? The default is `column`.

```ReactNativeWebPlayer
import React from 'react';
import { AppRegistry, View } from 'react-native';

class AwesomeProject {
  render() {
    return (
      // Try setting `flexDirection` to `column`.
      <View style={{flex: 1, flexDirection: 'row'}}>
        <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
        <View style={{width: 50, height: 50, backgroundColor: 'skyblue'}} />
        <View style={{width: 50, height: 50, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```

#### Justify Content

Adding `justifyContent` to a component's style determines the **distribution** of children along the **primary axis**. Should children be distributed at the start, the center, the end, or spaced evenly? Available options are `flex-start`, `center`, `flex-end`, `space-around`, and `space-between`.

```ReactNativeWebPlayer
import React from 'react';
import { AppRegistry, View } from 'react-native';

class AwesomeProject {
  render() {
    return (
      // Try setting `justifyContent` to `center`.
      // Try setting `flexDirection` to `row`.
      <View style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
        <View style={{width: 50, height: 50, backgroundColor: 'skyblue'}} />
        <View style={{width: 50, height: 50, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```

#### Align Items

Adding `alignItems` to a component's style determines the **alignment** of children along the **secondary axis** (if the primary axis is `row`, then the secondary is `column`, and vice versa). Should children be aligned at the start, the center, the end, or stretched to fill? Available options are `flex-start`, `center`, `flex-end`, and `stretch`.

> For `stretch` to have an effect, children must not have a fixed dimension along the secondary axis. In the following example, setting `alignItems: stretch` does nothing until the `width: 50` is removed from the children.

```ReactNativeWebPlayer
import React from 'react';
import { AppRegistry, View } from 'react-native';

class AwesomeProject {
  render() {
    return (
      // Try setting `alignItems` to 'flex-start'
      // Try setting `justifyContent` to `flex-end`.
      // Try setting `flexDirection` to `row`.
      <View style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
        <View style={{width: 50, height: 50, backgroundColor: 'skyblue'}} />
        <View style={{width: 50, height: 50, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```

#### API Reference

We've covered the basics, but there are many other styles you may need for layouts. The full list is available [here](./docs/flexbox.html).
