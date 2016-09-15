/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Keyboard
 * @flow
 */
'use strict';

const React = require('React');
const NativeEventEmitter = require('NativeEventEmitter');
const KeyboardObserver = require('NativeModules').KeyboardObserver;
const dismissKeyboard = require('dismissKeyboard');

const Keyboard = new NativeEventEmitter(KeyboardObserver);
// Add dismissKeyboard helper function
Keyboard.dismiss = dismissKeyboard;

/**
 * `Keyboard` component to control keyboard events.
 *
 * ### Usage
 *
 * The Keyboard component allows you to listen for native events and react to them, as
 * well as make changes to the keyboard, like dismissing it.
 *
 *```
 * import React, { Component } from 'react';
 * import { Keyboard, TextInput } from 'react-native';
 *
 * class Example extends Component {
 *   componentWillMount () {
 *     this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
 *     this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
 *   }
 *
 *   componentWillUnmount () {
 *      this.keyboardDidShowListener.remove();
 *      this.keyboardDidHideListener.remove();
 *   }
 *
 *   _keyboardDidShow () {
 *    window.alert('Keyboard Shown');
 *   }
 *
 *   _keyboardDidHide () {
 *    window.alert('Keyboard Hidden');
 *   }
 *
 *   render() {
 *     return (
 *       <TextInput
 *         onSubmitEditing={Keyboard.dismiss}
 *       />
 *     );
 *   }
 * }
 *```
 */
class DocsKeyboard extends React.Component {

  static propTypes = {
    none: 'This Component should not be given props',
  };

  /**
   * The `addListener` function connects a JavaScript function to an identified native
   * keyboard notification event.
   *
   * This function then returns the reference to the listener.
   *
   * @param {string} nativeEvent The `nativeEvent` is the string that identifies the event you're listening for.  This
   *can be any of the following
   * - `keyboardWillShow`
   * - `keyboardDidShow`
   * - `keyboardWillHide`
   * - `keyboardDidHide`
   * - `keyboardWillChangeFrame`
   * - `keyboardDidChangeFrame`
   * @param {function} jsFunction function to be called when the event fires.
   */
  addListener (nativeEvent, jsFunction) {
    return Keyboard.addListener(nativeEvent, jsFunction);
  }

  /**
   * Dismisses the active keyboard and removes focus.
   */
  dismiss () {
    dismissKeyboard();
  }

  render() {
    return null;
  }

}

// We're not the the documentation component
module.exports = Keyboard;
