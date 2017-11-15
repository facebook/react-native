---
id: touchableopacity
title: TouchableOpacity
---
A wrapper for making views respond properly to touches.
On press down, the opacity of the wrapped view is decreased, dimming it.

Opacity is controlled by wrapping the children in an Animated.View, which is
added to the view hiearchy.  Be aware that this can affect layout.

Example:

```
renderButton: function() {
  return (
    <TouchableOpacity onPress={this._onPressButton}>
      <Image
        style={styles.button}
        source={require('./myButton.png')}
      />
    </TouchableOpacity>
  );
},
```
### Example

```ReactNativeWebPlayer
import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  TouchableOpacity,
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
       <TouchableOpacity
         style={styles.button}
         onPress={this.onPress}
       >
         <Text> Touch Here </Text>
       </TouchableOpacity>
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
- [`activeOpacity`](docs/touchableopacity.html#activeopacity)
- [`tvParallaxProperties`](docs/touchableopacity.html#tvparallaxproperties)
- [`hasTVPreferredFocus`](docs/touchableopacity.html#hastvpreferredfocus)




### Methods

- [`setOpacityTo`](docs/touchableopacity.html#setopacityto)




---

# Reference

## Props

### `activeOpacity`

Determines what the opacity of the wrapped view should be when touch is
active. Defaults to 0.2.

| Type | Required |
| - | - |
| number | No |




---

### `tvParallaxProperties`

Apple TV parallax effects

| Type | Required |
| - | - |
| object | No |




---

### `hasTVPreferredFocus`

*(Apple TV only)* TV preferred focus (see documentation for the View component).



| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |






## Methods

### `setOpacityTo()`

```javascript
setOpacityTo(value: number, duration: number)
```

Animate the touchable to a new opacity.



