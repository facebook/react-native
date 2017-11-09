---
id: touchablehighlight
title: TouchableHighlight
layout: docs
category: components
permalink: docs/touchablehighlight.html
next: touchablenativefeedback
previous: toolbarandroid
---
A wrapper for making views respond properly to touches.
On press down, the opacity of the wrapped view is decreased, which allows
the underlay color to show through, darkening or tinting the view.

The underlay comes from wrapping the child in a new View, which can affect
layout, and sometimes cause unwanted visual artifacts if not used correctly,
for example if the backgroundColor of the wrapped view isn't explicitly set
to an opaque color.

TouchableHighlight must have one child (not zero or more than one).
If you wish to have several child components, wrap them in a View.

Example:

```
renderButton: function() {
  return (
    <TouchableHighlight onPress={this._onPressButton}>
      <Image
        style={styles.button}
        source={require('./myButton.png')}
      />
    </TouchableHighlight>
  );
},
```


### Example

```ReactNativeWebPlayer
import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  TouchableHighlight,
  Text,
  View,
} from 'react-native'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { count: 0 }
  }

  onPress = () => {
    this.setState({
      count: this.state.count+1
    })
  }

 render() {
    return (
      <View style={styles.container}>
        <TouchableHighlight
         style={styles.button}
         onPress={this.onPress}
        >
         <Text> Touch Here </Text>
        </TouchableHighlight>
        <View style={[styles.countContainer]}>
          <Text style={[styles.countText]}>
            { this.state.count !== 0 ? this.state.count: null}
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10
  },
  countContainer: {
    alignItems: 'center',
    padding: 10
  },
  countText: {
    color: '#FF00FF'
  }
})

AppRegistry.registerComponent('App', () => App)
```

### Props

* [TouchableWithoutFeedback props...](docs/touchablewithoutfeedback.html#props)
- [`activeOpacity`](docs/touchablehighlight.html#activeopacity)
- [`onHideUnderlay`](docs/touchablehighlight.html#onhideunderlay)
- [`onShowUnderlay`](docs/touchablehighlight.html#onshowunderlay)
- [`style`](docs/touchablehighlight.html#style)
- [`underlayColor`](docs/touchablehighlight.html#underlaycolor)
- [`hasTVPreferredFocus`](docs/touchablehighlight.html#hastvpreferredfocus)
- [`tvParallaxProperties`](docs/touchablehighlight.html#tvparallaxproperties)






---

# Reference

## Props

### `activeOpacity`

Determines what the opacity of the wrapped view should be when touch is
active.

| Type | Required |
| - | - |
| number | No |




---

### `onHideUnderlay`

Called immediately after the underlay is hidden

| Type | Required |
| - | - |
| function | No |




---

### `onShowUnderlay`

Called immediately after the underlay is shown

| Type | Required |
| - | - |
| function | No |




---

### `style`



| Type | Required |
| - | - |
| [ViewPropTypes.style](docs/viewproptypes.html#style) | No |




---

### `underlayColor`

The color of the underlay that will show through when the touch is
active.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `hasTVPreferredFocus`

*(Apple TV only)* TV preferred focus (see documentation for the View component).



| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `tvParallaxProperties`

*(Apple TV only)* Object with properties to control Apple TV parallax effects.

enabled: If true, parallax effects are enabled.  Defaults to true.
shiftDistanceX: Defaults to 2.0.
shiftDistanceY: Defaults to 2.0.
tiltAngle: Defaults to 0.05.
magnification: Defaults to 1.0.



| Type | Required | Platform |
| - | - | - |
| object | No | iOS  |






