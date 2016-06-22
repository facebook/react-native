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

const AwesomeProject = () => {
  return (
    <Text style={{marginTop: 22}}>Hello World!</Text>
  );
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```

In this slightly more advanced example we will display the `string` `"Hello World"` retrieved from this.state on the device and stored in the `text` variable. The value of the `text` variable is rendered by using `{text}`.

```JavaScript
import React from 'react';
import { AppRegistry, Text } from 'react-native';

var AwesomeProject = React.createClass({
  getInitialState: function() {
    return {text: "Hello World"};
  },
  render: function() {
    var text = this.state.text;
    return (
        <Text style={{marginTop: 22}}>
            {text}
        </Text>
    );
  }
});

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);

```