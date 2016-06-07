---
id: tutorial-core-components
title: Core Components
layout: docs
category: Tutorials
permalink: docs/tutorial-core-components.html
next: sample-application-movies
---

Components are the building blocks for a React Native application. A React Native user interface (UI) is specified by declaring components, possibly nested, and then those components are mapped to the native UI on the targeted platform.

React Native has a number of core components that are commonly used in applications, either on their own or combined to build new components.

## Text

The most basic component in React Native is the [`Text`](/react-native/docs/text.html#content) component. The `Text` component simply renders text.

This example displays the `string` `"Hello"` on the device.

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

## Image

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

## View

A [`View`](/react-native/docs/view.html#content) is the most basic building block for a React Native application. The `View` is an abstraction on top of the target platform's native equivalent, such as iOS's `UIView`.

> A `View` is analogous to using a `div` for building websites.

While basic components such as `Text` and `Image`, can be displayed without a `View`, this is not generally recommended since the `View` gives you the control for styling and layout of those components.

This example creates a `View` that aligns the `string` `Hello` in the top center of the device, something which could not be done with a `Text` component alone (i.e., a `Text` component without a `View` would place the `string` in a fixed location in the upper corner):

```JavaScript
import React from 'react';
import { AppRegistry, Text, View } from 'react-native';

const App = () => {
  return (
    <View style={{alignItems: 'center'}}>
      <Text>Hello!</Text>
    </View>
  );
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App);
```

## TextInput

Direct text-based user input is a foundation for many apps. Writing a post or comment on a page is a canonical example of this. [`TextInput`](/react-native/docs/textinput.html#content) is a basic component that allows the user to enter text.

This example creates a simple `TextInput` box with the `string` `Hello` as the placeholder when the `TextInput` is empty.

```JavaScript
import React from 'react';
import { AppRegistry, TextInput, View } from 'react-native';

const App = () => {
  return (
      <View>
        <TextInput placeholder="Hello" />
      </View>
  );
}

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => App);
```

## ListView

On mobile devices, lists are a core element in many applications. The [`ListView`](/react-native/docs/listview.html#content) component is a special type of [`View`](/react-native/docs/tutorials/core-components.html#view) that displays a vertically scrolling list of changing data.

The `ListView` component requires two properties, `dataSource` and `renderRow`. `dataSource` is the actual source of information that will be part of the list. `renderRow` takes the data and returns a renderable component to display.

This example creates a simple `ListView` of hardcoded data. It first initializes the `datasource` that will be used to populate the `ListView`. Then it renders that `ListView` with that data.

> A `rowHasChanged` function is required to use `ListView`. Here we just say a row has changed if the row we are on is not the same as the previous row.

```JavaScript
import React from 'react';
import { AppRegistry, Text, View, ListView} from 'react-native';

var SimpleList = React.createClass({
  // Initialize the hardcoded data
  getInitialState: function() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      dataSource: ds.cloneWithRows(['John', 'Joel', 'James', 'Jimmy', 'Jackson', 'Jillian', 'Julie'])
    };
  },
  render: function() {
    return (
      <View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData}</Text>}
        />
      </View>
    );
  }
});

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => SimpleList);
```
