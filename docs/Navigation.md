---
id: navigation
title: Navigation
layout: docs
category: Guides
permalink: docs/navigation.html
next: images
previous: animations
---

This guide covers the various navigation components available in React Native. If you are just getting started with navigation, you will probably want to use React Navigation.

If you are only targeting iOS and would like to stick to the native look and feel, check out `NavigatorIOS`. The `Navigator` component is older but has been thoroughly tested in production.

## React Navigation

The community solution to navigation is a standalone library that allows developers to set up the screens of an app with just a few lines of code.

The first step is to install in your app:

```
npm install --save react-navigation
```

Then you can quickly create an app with a home screen and a profile screen:

```
import {
  StackNavigator,
} from 'react-navigation';

const App = StackNavigator({
  Main: {screen: MainScreen},
  Profile: {screen: ProfileScreen},
});
```

Each screen component can set navigation options such as the header title. It can use action creators on the `navigation` prop to link to other screens:

```
class MainScreen extends React.Component {
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

The views in React Navigation use native components and the `Animated` library to deliver 60fps animations that are run on the native thread. Plus, the animations and gestures can be easily customized.

For a complete intro to React Navigation, follow the [getting started guide](https://reactnavigation.org/docs/intro/), or browse other docs such as the [intro to navigators](https://reactnavigation.org/docs/navigators/).

## Navigator

Like React Navigation, `Navigator` provides a JavaScript implementation of a navigation stack, so it works on both iOS and Android and is easy to customize. Navigator was released alongside React Native in 2015, so it predates the Animated library with native-thread animations.

![](img/NavigationStack-Navigator.gif)

`Navigator` can be adapted to render different components based on the current route in its `renderScene` function. It will transition new scenes onto the screen by sliding in from the right by default, but you can control this behavior by using the `configureScene` function. You can also configure a navigation bar through the `navigationBar` prop.

Check out the [Navigator API reference](docs/navigator.html) for specific examples that cover each of these scenarios.

## NavigatorIOS

If you are targeting iOS only, you may also want to consider using [NavigatorIOS](docs/navigatorios.html). It looks and feels just like [`UINavigationController`](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/), because it is actually built on top of it.

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
import React, { Component, PropTypes } from 'react';
import { NavigatorIOS, Text, TouchableHighlight, View } from 'react-native';

export default class NavigatorIOSApp extends Component {
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

class MyScene extends Component {
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
        <TouchableHighlight onPress={this._onForward}>
          <Text>Tap me to load the next scene</Text>
        </TouchableHighlight>
      </View>
    )
  }
}
```

Check out the [`NavigatorIOS` reference docs](docs/navigatorios.html) to learn more about this component.

> You may also want to check out [react-native-navigation](https://github.com/wix/react-native-navigation), a component that aims to provide native navigation on both iOS and Android.

## NavigationExperimental

Since early 2016, React Native has shipped with an experimental re-implementation of the original `Navigator` component called `CardStack`. The major benefit it had over `Navigator` is the smooth native-thread animations provided by the Animated library.

Because `NavigationExperimental` only included view components, it required a lot of boilerplate to use by itself. Several libraries sprung up around it, making it easier to use. Libraries such as `react-native-router-flux` and `ex-navigation` wrapped NavigationExperimental views in an easier-to-use API. Authors of many of these libraries now support React Navigation.

The `CardStack` and other NavigationExperimental views live on as a part of the React Navigation project. The new library aims to be easy to use, while continuing to enable the smooth and customizable animations that NavigationExperimental pioneered.

As of React Native 0.43, `NavigationExperimental` is deprecated. It will be removed from the codebase in a later version.
