---
id: using-navigators
title: Using Navigators
layout: docs
category: The Basics
permalink: docs/using-navigators.html
next: more-resources
previous: networking
---

Mobile apps rarely consist of just one screen. As soon as you add a second screen to your app, you will have to take into consideration how the user will navigate from one screen to the other.

You can use navigators to transition between multiple screens. These transitions can be typical side-to-side animations down a master/detail stack, or vertical modal popups.

## Navigator

React Native has several built-in navigation components, but for your first app you will probably want to use `Navigator`. It provides a JavaScript implementation of a navigation stack, so it works on both iOS and Android and is easy to customize.

![](img/NavigationStack-Navigator.gif)

### Working with Scenes

At this point you should feel comfortable rendering all sorts of components in your app, be it a simple `View` with `Text` inside, or a `ScrollView` with a list of `Image`s. Together, these components make up a scene (another word for screen) in your app.

A scene is nothing other than a React component that is typically rendered full screen. This is in contrast to a `Text`, an `Image`, or even a custom `SpinningBeachball` component that is meant to be rendered as part of a screen. You may have already used one without realizing it - the ["HelloWorldApp"](/react-native/docs/tutorial.html), the ["FlexDirectionBasics"](/react-native/docs/flexbox.html), and the ["ListViewBasics"](/react-native/docs/using-a-listview.html) components covered earlier in the tutorial are all examples of scenes.

For simplicity's sake, let's define a simple scene that displays a bit of text. We will come back to this scene later as we add navigation to our app. Create a new file called "MyScene.js" with the following contents:

```javascript
import React, { Component } from 'react';
import { View, Text } from 'react-native';

export default class MyScene extends Component {
  static get defaultProps() {
    return {
      title: 'MyScene'
    };
  }

  render() {
    return (
      <View>
        <Text>Hi! My name is {this.props.title}.</Text>
      </View>
    )
  }
}
```

Notice the `export default` in front of the component declaration. This will _export_ the component, and in turn allow other components to _import_ it later on, like so:

```javascript
import React, { Component } from 'react';
import { AppRegistry } from 'react-native';

import MyScene from './MyScene';

class YoDawgApp extends Component {
  render() {
    return (
      <MyScene />
    )
  }
}

AppRegistry.registerComponent('YoDawgApp', () => YoDawgApp);
```

We now have a simple app that renders your scene and nothing else. In this case, `MyScene` is a simple example of a [reusable React component](https://facebook.github.io/react/docs/reusable-components.html).

### Using Navigator

Enough about scenes, let's start navigating. We will start by rendering a `Navigator`, and then let the `Navigator` render the scene for you by passing in your own render function to its `renderScene` prop.

```javascript
render() {
  return (
    <Navigator
      initialRoute={{ title: 'My Initial Scene' }}
      renderScene={(route, navigator) =>
        <MyScene title={route.title} navigator={navigator} />
      }
    />
  );
}
```

Something you will encounter a lot when dealing with navigation is the concept of routes. A route is an object that contains information about a scene. It is used to provide all the context that the navigator's `renderScene` function needs to render a scene. It can have any number of keys to help distinguish your scene, and I happened to pick a single `title` key for the above example.

#### Pushing scenes onto the stack

In order to transition to a new scene, you will need to learn about `push` and `pop`. These two methods are provided by the `navigator` object that is passed to your `renderScene` function above. They can be used, as you may have realized, to push and pop routes into your navigation stack.

```javascript
navigator.push({
  title: 'Next Scene',
});

navigator.pop();
```

A more complete example that demonstrates the pushing and popping of routes could therefore look something like this:

```javascript
import React, { Component, PropTypes } from 'react';
import {
  AppRegistry, Navigator, PixelRatio, StyleSheet, Text, TouchableHighlight, View
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
  },
  row: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#CDCDCD',
  },
  rowText: {
    fontSize: 17,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
});

export default class UsingNavigators extends Component {
  render() {
    return (
      <Navigator
        initialRoute={{ title: 'My Initial Scene' }}
        renderScene={(route, navigator) =>
          <MyScene title={route.title} navigator={navigator} />
        }
      />
    )
  }
}

class MyScene extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    navigator: PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this._onForward = this._onForward.bind(this);
    this._onBack = this._onBack.bind(this);
  }

  // Function to call when a new scene should be displayed           
  _onForward() {    
    this.props.navigator.push({ title: 'Next Scene' });
  }

  // Function to call to go back to the previous scene
  _onBack() {
    this.props.navigator.pop();
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.rowText}>
            Current Scene: { this.props.title }
          </Text>
        </View>
        <TouchableHighlight
          style={styles.row}
          underlayColor="#D0D0D0"
          onPress={this._onForward}
        >
          <Text style={styles.buttonText}>
            Tap me to load the next scene
          </Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.row}
          underlayColor="#D0D0D0"
          onPress={this._onBack}
        >
          <Text style={styles.buttonText}>
            Tap me to go back
          </Text>
        </TouchableHighlight>
      </View>
    )
  }
}

AppRegistry.registerComponent('UsingNavigators', () => UsingNavigators);
```

In this example, the `MyScene` component is passed the title of the current route via the `title` prop, as well as a reference to the `Navigator`. The component displays two tappable components that call the `_onForward` and `_onBack` methods, which in turn will call `push()` and `pop()` as needed.

Check out the [Navigator API reference](/react-native/docs/navigator.html) for more `Navigator` code samples, or read through the [Navigation guide](/react-native/docs/navigation.html) for other examples of what you can do with navigators.

## High Five!

If you've gotten here by reading linearly through the tutorial, then you are a pretty impressive human being. Congratulations. Next, you might want to check out [all the cool stuff the community does with React Native](/react-native/docs/more-resources.html).
