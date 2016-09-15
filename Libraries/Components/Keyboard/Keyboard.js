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

const NativeEventEmitter = require('NativeEventEmitter');
const KeyboardObserver = require('NativeModules').KeyboardObserver;
const dismissKeyboard = require('dismissKeyboard');

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
 *
 * ### `addListener` method
 *
 * Connects a JavaScript function to an identified native Keyboard notification event.
 * The event string can be any of:
 * - keyboardWillShow
 * - keyboardDidShow
 * - keyboardWillHide
 * - keyboardDidHide
 * - keyboardWillChangeFrame
 * - keyboardDidChangeFrame
 *
 * ### `dismiss` method
 *
 * Dismisses the active keyboard and removes focus.
 */
const Keyboard = new NativeEventEmitter(KeyboardObserver);
// Add dismissKeyboard helper function
Keyboard.dismiss = dismissKeyboard;

module.exports = Keyboard;
