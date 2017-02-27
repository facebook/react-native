---
id: navigation
title: Navigation
layout: docs
category: Guides
permalink: docs/navigation.html
next: performance
previous: javascript-environment
---

This guide covers the various navigation components available in React Native. If you are just getting started with navigation, you will probably want to use  `Navigator`. If you are only targeting iOS and would like to stick to the native look and feel, check out `NavigatorIOS`. If you are looking for greater control over your navigation stack, you can't go wrong with `NavigationExperimental`.

## Navigator

`Navigator` provides a JavaScript implementation of a navigation stack, so it works on both iOS and Android and is easy to customize. This is the same component you used to build your first navigation stack in the [navigators tutorial](docs/using-navigators.html).

![](img/NavigationStack-Navigator.gif)

`Navigator` can easily be adapted to render different components based on the current route in its `renderScene` function. It will transition new scenes onto the screen by sliding in from the right by default, but you can control this behavior by using the `configureScene` function. You can also configure a navigation bar through the `navigationBar` prop.

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

Just like `Navigator`, `NavigatorIOS` uses routes to represent scenes, with some important differences. The actual component that will be rendered can be specified using the `component` key in the route, and any props that should be passed to this component can be specified in `passProps`. A "navigator" object is automatically passed as a prop to the component, allowing you to call `push` and `pop` as needed.

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

`Navigator` and `NavigatorIOS` are both stateful components. If your app has multiple of these, it can become tricky to coordinate navigation transitions between them. NavigationExperimental provides a different approach to navigation, allowing any view to act as a navigation view and using reducers to manipulate state at a top-level object. It is bleeding edge as the name implies, but you might want to check it out if you are craving greater control over your app's navigation.

```javascript
<NavigationCardStack
  onNavigateBack={onPopRouteFunc}
  navigationState={myNavigationState}
  renderScene={renderSceneFun}
/>
```

You can import `NavigationExperimental` like any other component in React Native. Once you have that, you can deconstruct any additional components from `NavigationExperimental` that you may find useful. Since I am feeling like building navigation stacks today, I'll go ahead and pick out `NavigationCardStack` and `NavigationStateUtils`.

```javascript
import React, { Component } from 'react';
import { NavigationExperimental } from 'react-native';

const {
  CardStack: NavigationCardStack,
  StateUtils: NavigationStateUtils,
} = NavigationExperimental;
```

As I said earlier, `NavigationExperimental` takes a different approach than `Navigator` and `NavigatorIOS`. Using it to build a navigation stack requires a few more steps than the stateful components, but the payoff is worth it.

### Step 1. Define Initial State and Top Level Component

Create a new component for your application. This will be the top-level object, so we will define the initial state here. The navigation state will be defined in the `navigationState` key, where we define our initial route:

```javascript
class BleedingEdgeApplication extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      // This defines the initial navigation state.
      navigationState: {
        index: 0, // Starts with first route focused.
        routes: [{key: 'My Initial Scene'}], // Starts with only one route.
      },
    };

    // We'll define this function later - hang on
    this._onNavigationChange = this._onNavigationChange.bind(this);
  }

  _onNavigationChange(type) {
    // It's literally the next step. We'll get to it!
  }

  render() {
    return (
      <Text>This is a placeholder. We will come back to this and render our navigation here later.</Text>
    );
  }
}
```

Alright, now we have a simple stateful component that doesn't do much at all. We can change that. Our initial state contains one route, and the current index. That looks suspiciously just like our initial route definition in Navigator. Do you remember which actions its navigator object provided?

Push and pop, of course. That seems pretty straightforward to implement. I promised you earlier we would be using reducers to manage state at the top-level object. Sit tight.

### Step 2. Reducing the Navigation State

NavigationExperimental comes built-in with some useful reducers, and they are all available as part of NavigationStateUtils. The two we will be using right now are called -- yep -- push and pop. They take a navigationState object, and return a new navigationState object.

We can use them to write our `_onNavigationChange` function which, given a "push" or "pop" action, will reduce the state accordingly.

```javascript
_onNavigationChange(type) {
  // Extract the navigationState from the current state:
  let {navigationState} = this.state;

  switch (type) {
    case 'push':
      // Push a new route, which in our case is an object with a key value.
      // I am fond of cryptic keys (but seriously, keys should be unique)
      const route = {key: 'Route-' + Date.now()};

      // Use the push reducer provided by NavigationStateUtils
      navigationState = NavigationStateUtils.push(navigationState, route);
      break;

    case 'pop':
      // Pop the current route using the pop reducer.
      navigationState = NavigationStateUtils.pop(navigationState);
      break;
  }

  // NavigationStateUtils gives you back the same `navigationState` if nothing
  // has changed. We will only update state if it has changed.
  if (this.state.navigationState !== navigationState) {
    // Always use setState() when setting a new state!
    this.setState({navigationState});
    // If you are new to ES6, the above is equivalent to:
    // this.setState({navigationState: navigationState});
  }
}
```

Cool. I'm getting the hang of this. This is the heart of NavigationExperimental. We are only handling two actions here, but a more complex application could also take into account a "back" action (e.g. Android back button), as well as handle the transition between several tabs in a tabbed application.

I am still missing the initial scene that will be rendered (as well as the actual navigator that will wrap it, but let's not get ahead of ourselves).

### Step 3. Define Scenes

First I want to define a Row component out of convenience. It displays some text and can call some function when pressed.

```javascript
class TappableRow extends Component {
  render() {
    return (
      <TouchableHighlight
        style={styles.row}
        underlayColor="#D0D0D0"
        onPress={this.props.onPress}>
        <Text style={styles.buttonText}>
          {this.props.text}
        </Text>
      </TouchableHighlight>
    );
  }
}
```

Now I will define my actual scene. It uses a scroll view to display a vertical list of items. The first row displays the current route's key, and two more rows will call our theoretical navigator's push and pop functions.

```javascript
class MyVeryComplexScene extends Component {
  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <Text style={styles.row}>
          Route: {this.props.route.key}
        </Text>
        <TappableRow
          text="Tap me to load the next scene"
          onPress={this.props.onPushRoute}
        />
        <TappableRow
          text="Tap me to go back"
          onPress={this.props.onPopRoute}
        />
      </ScrollView>
    );
  }
}
```

### Step 4. Create a Navigation Stack

Now that I have defined the state and a function to manage it, I think I can go ahead and create a proper navigator component now. While I'm at it, I'll render my scene after configuring it with the current route's props.

```javascript
class MyVerySimpleNavigator extends Component {

  // This sets up the methods (e.g. Pop, Push) for navigation.
  constructor(props, context) {
    super(props, context);

    this._onPushRoute = this.props.onNavigationChange.bind(null, 'push');
    this._onPopRoute = this.props.onNavigationChange.bind(null, 'pop');

    this._renderScene = this._renderScene.bind(this);
  }

  // Now we finally get to use the `NavigationCardStack` to render the scenes.
  render() {
    return (
      <NavigationCardStack
        onNavigateBack={this._onPopRoute}
        navigationState={this.props.navigationState}
        renderScene={this._renderScene}
        style={styles.navigator}
      />
    );
  }

  // Render a scene for route.
  // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
  // as type `NavigationSceneRendererProps`.
  // Here you could choose to render a different component for each route, but
  // we'll keep it simple.
  _renderScene(sceneProps) {
    return (
      <MyVeryComplexScene
        route={sceneProps.scene.route}
        onPushRoute={this._onPushRoute}
        onPopRoute={this._onPopRoute}
        onExit={this.props.onExit}
      />
    );
  }
}
```

That's it -- so close to the finish line I can smell it. Let's plug our new navigator into our top-level component:

```javascript
class BleedingEdgeApplication extends Component {

  // constructor and other methods omitted for clarity

  render() {
    return (
      <MyVerySimpleNavigator
        navigationState={this.state.navigationState}
        onNavigationChange={this._onNavigationChange}
        onExit={this._exit}
      />
    );
  }
}
```

We're done! Bask in the glory of NavigationExperimental.

#### Hey -- I think you are missing something.

(Oh yes, sorry about that -- here's our missing imports and styles.)

```javascript
import { NavigationExperimental, PixelRatio, ScrollView, StyleSheet, Text, TouchableHighlight } from 'react-native';

const styles = StyleSheet.create({
  navigator: {
    flex: 1,
  },
  scrollView: {
    marginTop: 64
  },
  row: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#CDCDCD',
  },
  rowText: {
    fontSize: 17,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
});
```

### Homework

You are now an expert navigator. Take a look at [NavigationExperimental in UIExplorer](https://github.com/facebook/react-native/tree/master/Examples/UIExplorer/js/NavigationExperimental) to learn how to implement other types of navigation hierarchies, such as a tabbed application with multiple navigation stacks.
