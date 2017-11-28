---
id: modal
title: Modal
layout: docs
category: components
permalink: docs/modal.html
next: navigatorios
previous: maskedviewios
---

Minimal modal example:

```
import React, { Component } from 'react';
import { Text, View, Button, Modal, StyleSheet } from 'react-native';

export default class MyComponent extends Component {
  state = {
    modalVisible: false,
  };

  openModal() {
    this.setState({modalVisible:true});
  }

  closeModal() {
    this.setState({modalVisible:false});
  }

  render() {
    return (
        <View style={styles.container}>
          <Modal
              visible={this.state.modalVisible}
              animationType={'slide'}
              onRequestClose={() => this.closeModal()}
          >
            <View style={styles.modalContainer}>
              <View style={styles.innerContainer}>
                <Text>This is content inside of modal component</Text>
                <Button
                    onPress={() => this.closeModal()}
                    title="Close modal"
                >
                </Button>
              </View>
            </View>
          </Modal>
          <Button
              onPress={() => this.openModal()}
              title="Open modal"
          />
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  innerContainer: {
    alignItems: 'center',
  },
});
```

### Props

- [`visible`](docs/modal.html#visible)
- [`supportedOrientations`](docs/modal.html#supportedorientations)
- [`onRequestClose`](docs/modal.html#onrequestclose)
- [`onShow`](docs/modal.html#onshow)
- [`transparent`](docs/modal.html#transparent)
- [`animationType`](docs/modal.html#animationtype)
- [`hardwareAccelerated`](docs/modal.html#hardwareaccelerated)
- [`onDismiss`](docs/modal.html#ondismiss)
- [`onOrientationChange`](docs/modal.html#onorientationchange)
- [`presentationStyle`](docs/modal.html#presentationstyle)
- [`animated`](docs/modal.html#animated)






---

# Reference

## Props

### `visible`

The `visible` prop determines whether your modal is visible.

| Type | Required |
| - | - |
| bool | No |




---

### `supportedOrientations`

The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field.
When using `presentationStyle` of `pageSheet` or `formSheet`, this property will be ignored by iOS.


| Type | Required | Platform |
| - | - | - |
| array of enum('portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right') | No | iOS  |




---

### `onRequestClose`

The `onRequestClose` callback is called when the user taps the hardware back button on Android or the menu button on Apple TV.

| Type | Required |
| - | - |
| function | Required on Android and Apple TV |




---

### `onShow`

The `onShow` prop allows passing a function that will be called once the modal has been shown.

| Type | Required |
| - | - |
| function | No |




---

### `transparent`

The `transparent` prop determines whether your modal will fill the entire view. Setting this to `true` will render the modal over a transparent background.

| Type | Required |
| - | - |
| bool | No |




---

### `animationType`

The `animationType` prop controls how the modal animates.

- `slide` slides in from the bottom
- `fade` fades into view
- `none` appears without an animation

Default is set to `none`.

| Type | Required |
| - | - |
| enum('none', 'slide', 'fade') | No |




---

### `hardwareAccelerated`

The `hardwareAccelerated` prop controls whether to force hardware acceleration for the underlying window.


| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `onDismiss`

The `onDismiss` prop allows passing a function that will be called once the modal has been dismissed.


| Type | Required | Platform |
| - | - | - |
| function | No | iOS  |




---

### `onOrientationChange`

The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.


| Type | Required | Platform |
| - | - | - |
| function | No | iOS  |




---

### `presentationStyle`

The `presentationStyle` prop controls how the modal appears (generally on larger devices such as iPad or plus-sized iPhones).
See https://developer.apple.com/reference/uikit/uimodalpresentationstyle for details.


- `fullScreen` covers the screen completely
- `pageSheet` covers portrait-width view centered (only on larger devices)
- `formSheet` covers narrow-width view centered (only on larger devices)
- `overFullScreen` covers the screen completely, but allows transparency

Default is set to `overFullScreen` or `fullScreen` depending on `transparent` property.

| Type | Required | Platform |
| - | - | - |
| enum('fullScreen', 'pageSheet', 'formSheet', 'overFullScreen') | No | iOS  |




---

### `animated`

**Deprecated.** Use the `animationType` prop instead.



| Type | Required |
| - | - |
| bool | No |






