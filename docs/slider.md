---
id: slider
title: Slider
layout: docs
category: components
permalink: docs/slider.html
next: snapshotviewios
previous: segmentedcontrolios
---
A component used to select a single value from a range of values.

### Usage

The example below shows how to use `Slider` to change
a value used by `Text`. The value is stored using
the state of the root component (`App`). The same component
subscribes to the `onValueChange`  of `Slider` and changes
the value using `setState`.

```javascript
import React from 'react';
import { StyleSheet, Text, View, Slider } from 'react-native';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 50
    }
  }

  change(value) {
    this.setState(() => {
      return {
        value: parseFloat(value)
      };
    });
  }

  render() {
    const {value} = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{String(value)}</Text>
        <Slider
          step={1}
          maximumValue={100}
          onValueChange={this.change.bind(this)}
          value={value} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  text: {
    fontSize: 50,
    textAlign: 'center'
  }
});
```

### Props

- [View props...](docs/view.html#props)
- [`style`](docs/slider.html#style)
- [`disabled`](docs/slider.html#disabled)
- [`maximumValue`](docs/slider.html#maximumvalue)
- [`minimumTrackTintColor`](docs/slider.html#minimumtracktintcolor)
- [`minimumValue`](docs/slider.html#minimumvalue)
- [`onSlidingComplete`](docs/slider.html#onslidingcomplete)
- [`onValueChange`](docs/slider.html#onvaluechange)
- [`step`](docs/slider.html#step)
- [`maximumTrackTintColor`](docs/slider.html#maximumtracktintcolor)
- [`testID`](docs/slider.html#testid)
- [`value`](docs/slider.html#value)
- [`thumbTintColor`](docs/slider.html#thumbtintcolor)
- [`maximumTrackImage`](docs/slider.html#maximumtrackimage)
- [`minimumTrackImage`](docs/slider.html#minimumtrackimage)
- [`thumbImage`](docs/slider.html#thumbimage)
- [`trackImage`](docs/slider.html#trackimage)






---

# Reference

## Props

### `style`

Used to style and layout the `Slider`.  See `StyleSheet.js` and
`ViewStylePropTypes.js` for more info.

| Type | Required |
| - | - |
| [ViewPropTypes.style](docs/viewproptypes.html#style) | No |




---

### `disabled`

If true the user won't be able to move the slider.
Default value is false.

| Type | Required |
| - | - |
| bool | No |




---

### `maximumValue`

Initial maximum value of the slider. Default value is 1.

| Type | Required |
| - | - |
| number | No |




---

### `minimumTrackTintColor`

The color used for the track to the left of the button.
Overrides the default blue gradient image on iOS.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `minimumValue`

Initial minimum value of the slider. Default value is 0.

| Type | Required |
| - | - |
| number | No |




---

### `onSlidingComplete`

Callback that is called when the user releases the slider,
regardless if the value has changed. The current value is passed
as an argument to the callback handler.

| Type | Required |
| - | - |
| function | No |




---

### `onValueChange`

Callback continuously called while the user is dragging the slider.

| Type | Required |
| - | - |
| function | No |




---

### `step`

Step value of the slider. The value should be
between 0 and (maximumValue - minimumValue).
Default value is 0.

| Type | Required |
| - | - |
| number | No |




---

### `maximumTrackTintColor`

The color used for the track to the right of the button.
Overrides the default blue gradient image on iOS.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `testID`

Used to locate this view in UI automation tests.

| Type | Required |
| - | - |
| string | No |




---

### `value`

Initial value of the slider. The value should be between minimumValue
and maximumValue, which default to 0 and 1 respectively.
Default value is 0.

*This is not a controlled component*, you don't need to update the
value during dragging.

| Type | Required |
| - | - |
| number | No |




---

### `thumbTintColor`

Color of the foreground switch grip.


| Type | Required | Platform |
| - | - | - |
| [color](docs/colors.html) | No | Android  |




---

### `maximumTrackImage`

Assigns a maximum track image. Only static images are supported. The
leftmost pixel of the image will be stretched to fill the track.


| Type | Required | Platform |
| - | - | - |
| [Image.propTypes.source](docs/image.html#source) | No | iOS  |




---

### `minimumTrackImage`

Assigns a minimum track image. Only static images are supported. The
rightmost pixel of the image will be stretched to fill the track.


| Type | Required | Platform |
| - | - | - |
| [Image.propTypes.source](docs/image.html#source) | No | iOS  |




---

### `thumbImage`

Sets an image for the thumb. Only static images are supported.


| Type | Required | Platform |
| - | - | - |
| [Image.propTypes.source](docs/image.html#source) | No | iOS  |




---

### `trackImage`

Assigns a single image for the track. Only static images are supported.
The center pixel of the image will be stretched to fill the track.


| Type | Required | Platform |
| - | - | - |
| [Image.propTypes.source](docs/image.html#source) | No | iOS  |






