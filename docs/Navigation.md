---
id: navigation
title: Navigation
layout: docs
category: Guides
permalink: docs/navigation.html
next: images
previous: animations
---

This guide covers the various navigation components available in React Native. If you are just getting started with navigation, you will probably want to use [React Navigation](docs/navigation.html#react-navigation).

If you are only targeting iOS and would like to stick to the native look and feel, check out [NavigatorIOS](docs/navigation.html#navigatorios).

If you're targeting both iOS and Android, the following libraries provide native navigation on both platforms: [native-navigation](http://airbnb.io/native-navigation/), [react-native-navigation](https://github.com/wix/react-native-navigation).

## React Navigation

The community solution to navigation is a standalone library that allows developers to set up the screens of an app with just a few lines of code.

The first step is to install in your project:

```
npm install --save react-navigation
```

Then you can quickly create an app with a home screen and a profile screen:

```
import {
  StackNavigator,
} from 'react-navigation';

const App = StackNavigator({
  Home: { screen: HomeScreen },
  Profile: { screen: ProfileScreen },
});
```

Each screen component can set navigation options such as the header title. It can use action creators on the `navigation` prop to link to other screens:

```
class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Welcome',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <Button
        title="Go to Jane's profile"
        onPress={() =>
          navigate('Profile', { name: 'Jane' })
        }
      />
    );
  }
}
```

React Navigation routers make it easy to override navigation logic or integrate it into redux. Because routers can be nested inside each other, developers can override navigation logic for one area of the app without making widespread changes.

The views in React Navigation use native components and the [`Animated`](docs/animated.html) library to deliver 60fps animations that are run on the native thread. Plus, the animations and gestures can be easily customized.

For a complete intro to React Navigation, follow the [React Navigation Getting Started Guide](https://reactnavigation.org/docs/intro/), or browse other docs such as the [Intro to Navigators](https://reactnavigation.org/docs/navigators/).

## NavigatorIOS

If you are targeting iOS only, you may also want to consider using [`NavigatorIOS`](docs/navigatorios.html). It looks and feels just like [`UINavigationController`](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/), because it is actually built on top of it.

![](img/NavigationStack-NavigatorIOS.gif)

```javascript
<NavigatorIOS
  initialRoute={{
    component: MyScene,
    title: 'My Initial Scene',
    passProps: { myProp: 'foo' },
  }}
/>
```

Like other navigation systems, `NavigatorIOS` uses routes to represent screens, with some important differences. The actual component that will be rendered can be specified using the `component` key in the route, and any props that should be passed to this component can be specified in `passProps`. A "navigator" object is automatically passed as a prop to the component, allowing you to call `push` and `pop` as needed.

As `NavigatorIOS` leverages native UIKit navigation, it will automatically render a navigation bar with a back button and title.

```javascript
import React from 'react';
import PropTypes from 'prop-types';
import { Button, NavigatorIOS, Text, View } from 'react-native';

export default class NavigatorIOSApp extends React.Component {
  render() {
    return (
      <NavigatorIOS
        initialRoute={{
          component: MyScene,
          title: 'My Initial Scene',
        }}
        style={{flex: 1}}
      />
    )
  }
}

class MyScene extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    navigator: PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this._onForward = this._onForward.bind(this);
  }

  _onForward() {
    this.props.navigator.push({
      title: 'Scene ' + nextIndex,
    });
  }

  render() {
    return (
      <View>
        <Text>Current Scene: { this.props.title }</Text>
        <Button
          onPress={this._onForward}
          title="Tap me to load the next scene"
        />
      </View>
    )
  }
}
```

Check out the [`NavigatorIOS` reference docs](docs/navigatorios.html) to learn more about this component.
