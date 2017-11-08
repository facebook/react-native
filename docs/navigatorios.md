---
id: navigatorios
title: NavigatorIOS
layout: docs
category: components
permalink: docs/navigatorios.html
next: picker
previous: modal
---
`NavigatorIOS` is a wrapper around
[`UINavigationController`](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/),
enabling you to implement a navigation stack. It works exactly the same as it
would on a native app using `UINavigationController`, providing the same
animations and behavior from UIKit.

As the name implies, it is only available on iOS. Take a look at
[`React Navigation`](https://reactnavigation.org/) for a cross-platform
solution in JavaScript, or check out either of these components for native
solutions: [native-navigation](http://airbnb.io/native-navigation/),
[react-native-navigation](https://github.com/wix/react-native-navigation).

To set up the navigator, provide the `initialRoute` prop with a route
object. A route object is used to describe each scene that your app
navigates to. `initialRoute` represents the first route in your navigator.

```
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { NavigatorIOS, Text } from 'react-native';

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
    );
  }
}

class MyScene extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    navigator: PropTypes.object.isRequired,
  }

  _onForward = () => {
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

In this code, the navigator renders the component specified in initialRoute,
which in this case is `MyScene`. This component will receive a `route` prop
and a `navigator` prop representing the navigator. The navigator's navigation
bar will render the title for the current scene, "My Initial Scene".

You can optionally pass in a `passProps` property to your `initialRoute`.
`NavigatorIOS` passes this in as props to the rendered component:

```
initialRoute={{
  component: MyScene,
  title: 'My Initial Scene',
  passProps: { myProp: 'foo' }
}}
```

You can then access the props passed in via `{this.props.myProp}`.

#### Handling Navigation

To trigger navigation functionality such as pushing or popping a view, you
have access to a `navigator` object. The object is passed in as a prop to any
component that is rendered by `NavigatorIOS`. You can then call the
relevant methods to perform the navigation action you need:

```
class MyView extends Component {
  _handleBackPress() {
    this.props.navigator.pop();
  }

  _handleNextPress(nextRoute) {
    this.props.navigator.push(nextRoute);
  }

  render() {
    const nextRoute = {
      component: MyView,
      title: 'Bar That',
      passProps: { myProp: 'bar' }
    };
    return(
      <TouchableHighlight onPress={() => this._handleNextPress(nextRoute)}>
        <Text style={{marginTop: 200, alignSelf: 'center'}}>
          See you on the other nav {this.props.myProp}!
        </Text>
      </TouchableHighlight>
    );
  }
}
```

You can also trigger navigator functionality from the `NavigatorIOS`
component:

```
class NavvyIOS extends Component {
  _handleNavigationRequest() {
    this.refs.nav.push({
      component: MyView,
      title: 'Genius',
      passProps: { myProp: 'genius' },
    });
  }

  render() {
    return (
      <NavigatorIOS
        ref='nav'
        initialRoute={{
          component: MyView,
          title: 'Foo This',
          passProps: { myProp: 'foo' },
          rightButtonTitle: 'Add',
          onRightButtonPress: () => this._handleNavigationRequest(),
        }}
        style={{flex: 1}}
      />
    );
  }
}
```

The code above adds a `_handleNavigationRequest` private method that is
invoked from the `NavigatorIOS` component when the right navigation bar item
is pressed. To get access to the navigator functionality, a reference to it
is saved in the `ref` prop and later referenced to push a new scene into the
navigation stack.

#### Navigation Bar Configuration

Props passed to `NavigatorIOS` will set the default configuration
for the navigation bar. Props passed as properties to a route object will set
the configuration for that route's navigation bar, overriding any props
passed to the `NavigatorIOS` component.

```
_handleNavigationRequest() {
  this.refs.nav.push({
    //...
    passProps: { myProp: 'genius' },
    barTintColor: '#996699',
  });
}

render() {
  return (
    <NavigatorIOS
      //...
      style={{flex: 1}}
      barTintColor='#ffffcc'
    />
  );
}
```

In the example above the navigation bar color is changed when the new route
is pushed.

### Props

- [`initialRoute`](docs/navigatorios.html#initialroute)
- [`barStyle`](docs/navigatorios.html#barstyle)
- [`barTintColor`](docs/navigatorios.html#bartintcolor)
- [`interactivePopGestureEnabled`](docs/navigatorios.html#interactivepopgestureenabled)
- [`itemWrapperStyle`](docs/navigatorios.html#itemwrapperstyle)
- [`navigationBarHidden`](docs/navigatorios.html#navigationbarhidden)
- [`shadowHidden`](docs/navigatorios.html#shadowhidden)
- [`tintColor`](docs/navigatorios.html#tintcolor)
- [`titleTextColor`](docs/navigatorios.html#titletextcolor)
- [`translucent`](docs/navigatorios.html#translucent)




### Methods

- [`push`](docs/navigatorios.html#push)
- [`popN`](docs/navigatorios.html#popn)
- [`pop`](docs/navigatorios.html#pop)
- [`replaceAtIndex`](docs/navigatorios.html#replaceatindex)
- [`replace`](docs/navigatorios.html#replace)
- [`replacePrevious`](docs/navigatorios.html#replaceprevious)
- [`popToTop`](docs/navigatorios.html#poptotop)
- [`popToRoute`](docs/navigatorios.html#poptoroute)
- [`replacePreviousAndPop`](docs/navigatorios.html#replacepreviousandpop)
- [`resetTo`](docs/navigatorios.html#resetto)




---

# Reference

## Props

### `initialRoute`

NavigatorIOS uses `route` objects to identify child views, their props,
and navigation bar configuration. Navigation operations such as push
operations expect routes to look like this the `initialRoute`.

| Type | Required |
| - | - |
| object: {component: function,title: string,titleImage: Image.propTypes.source,passProps: object,backButtonIcon: Image.propTypes.source,backButtonTitle: string,leftButtonIcon: Image.propTypes.source,leftButtonTitle: string,leftButtonSystemIcon: Object.keys(SystemIcons),onLeftButtonPress: function,rightButtonIcon: Image.propTypes.source,rightButtonTitle: string,rightButtonSystemIcon: Object.keys(SystemIcons),onRightButtonPress: function,wrapperStyle: ViewPropTypes.style,navigationBarHidden: bool,shadowHidden: bool,tintColor: string,barTintColor: string,barStyle: enum('default', 'black'),titleTextColor: string,translucent: bool} | Yes |




---

### `barStyle`

The style of the navigation bar. Supported values are 'default', 'black'.
Use 'black' instead of setting `barTintColor` to black. This produces
a navigation bar with the native iOS style with higher translucency.

| Type | Required |
| - | - |
| enum('default', 'black') | No |




---

### `barTintColor`

The default background color of the navigation bar.

| Type | Required |
| - | - |
| string | No |




---

### `interactivePopGestureEnabled`

Boolean value that indicates whether the interactive pop gesture is
enabled. This is useful for enabling/disabling the back swipe navigation
gesture.

If this prop is not provided, the default behavior is for the back swipe
gesture to be enabled when the navigation bar is shown and disabled when
the navigation bar is hidden. Once you've provided the
`interactivePopGestureEnabled` prop, you can never restore the default
behavior.

| Type | Required |
| - | - |
| bool | No |




---

### `itemWrapperStyle`

The default wrapper style for components in the navigator.
A common use case is to set the `backgroundColor` for every scene.

| Type | Required |
| - | - |
| ViewPropTypes.style | No |




---

### `navigationBarHidden`

Boolean value that indicates whether the navigation bar is hidden
by default.

| Type | Required |
| - | - |
| bool | No |




---

### `shadowHidden`

Boolean value that indicates whether to hide the 1px hairline shadow
by default.

| Type | Required |
| - | - |
| bool | No |




---

### `tintColor`

The default color used for the buttons in the navigation bar.

| Type | Required |
| - | - |
| string | No |




---

### `titleTextColor`

The default text color of the navigation bar title.

| Type | Required |
| - | - |
| string | No |




---

### `translucent`

Boolean value that indicates whether the navigation bar is
translucent by default

| Type | Required |
| - | - |
| bool | No |






## Methods

### `push()`

```javascript
push(route: object)
```

Navigate forward to a new route.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route to navigate to. |




---

### `popN()`

```javascript
popN(n: number)
```

Go back N scenes at once. When N=1, behavior matches `pop()`.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| n | number | No | The number of scenes to pop. |




---

### `pop()`

```javascript
pop()
```

Pop back to the previous scene.



---

### `replaceAtIndex()`

```javascript
replaceAtIndex(route: object, index: number)
```

Replace a route in the navigation stack.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route that will replace the specified one. |
| index | number | No | The route into the stack that should be replaced.   If it is negative, it counts from the back of the stack. |




---

### `replace()`

```javascript
replace(route: object)
```

Replace the route for the current scene and immediately
load the view for the new route.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route to navigate to. |




---

### `replacePrevious()`

```javascript
replacePrevious(route: object)
```

Replace the route/view for the previous scene.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route to will replace the previous scene. |




---

### `popToTop()`

```javascript
popToTop()
```

Go back to the topmost item in the navigation stack.



---

### `popToRoute()`

```javascript
popToRoute(route: object)
```

Go back to the item for a particular route object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route to navigate to. |




---

### `replacePreviousAndPop()`

```javascript
replacePreviousAndPop(route: object)
```

Replaces the previous route/view and transitions back to it.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route that replaces the previous scene. |




---

### `resetTo()`

```javascript
resetTo(route: object)
```

Replaces the top item and pop to it.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| route | object | No | The new route that will replace the topmost item. |




