/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import LayoutAnimation from '../../LayoutAnimation/LayoutAnimation';
import dismissKeyboard from '../../Utilities/dismissKeyboard';
import NativeKeyboardObserver from './NativeKeyboardObserver';
import invariant from 'invariant';
const KeyboardEventEmitter: NativeEventEmitter = new NativeEventEmitter(
  NativeKeyboardObserver,
);

export type KeyboardEventName =
  | 'keyboardWillShow'
  | 'keyboardDidShow'
  | 'keyboardWillHide'
  | 'keyboardDidHide'
  | 'keyboardWillChangeFrame'
  | 'keyboardDidChangeFrame';

export type KeyboardEventEasing =
  | 'easeIn'
  | 'easeInEaseOut'
  | 'easeOut'
  | 'linear'
  | 'keyboard';

export type KeyboardEventCoordinates = $ReadOnly<{|
  screenX: number,
  screenY: number,
  width: number,
  height: number,
|}>;

export type KeyboardEvent = AndroidKeyboardEvent | IOSKeyboardEvent;

type BaseKeyboardEvent = {|
  duration: number,
  easing: KeyboardEventEasing,
  endCoordinates: KeyboardEventCoordinates,
|};

export type AndroidKeyboardEvent = $ReadOnly<{|
  ...BaseKeyboardEvent,
  duration: 0,
  easing: 'keyboard',
|}>;

export type IOSKeyboardEvent = $ReadOnly<{|
  ...BaseKeyboardEvent,
  startCoordinates: KeyboardEventCoordinates,
  isEventFromThisApp: boolean,
|}>;

type KeyboardEventListener = (e: KeyboardEvent) => void;

// The following object exists for documentation purposes
// Actual work happens in
// https://github.com/facebook/react-native/blob/master/Libraries/EventEmitter/NativeEventEmitter.js

/**
 * `Keyboard` module to control keyboard events.
 *
 * ### Usage
 *
 * The Keyboard module allows you to listen for native events and react to them, as
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
 *     this.keyboardDidShowListener.remove();
 *     this.keyboardDidHideListener.remove();
 *   }
 *
 *   _keyboardDidShow () {
 *     alert('Keyboard Shown');
 *   }
 *
 *   _keyboardDidHide () {
 *     alert('Keyboard Hidden');
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

const Keyboard = {
  /**
   * The `addListener` function connects a JavaScript function to an identified native
   * keyboard notification event.
   *
   * This function then returns the reference to the listener.
   *
   * @param {string} eventName The `nativeEvent` is the string that identifies the event you're listening for.  This
   *can be any of the following:
   *
   * - `keyboardWillShow`
   * - `keyboardDidShow`
   * - `keyboardWillHide`
   * - `keyboardDidHide`
   * - `keyboardWillChangeFrame`
   * - `keyboardDidChangeFrame`
   *
   * Note that if you set `android:windowSoftInputMode` to `adjustResize`  or `adjustNothing`,
   * only `keyboardDidShow` and `keyboardDidHide` events will be available on Android.
   * `keyboardWillShow` as well as `keyboardWillHide` are generally not available on Android
   * since there is no native corresponding event.
   *
   * @param {function} callback function to be called when the event fires.
   */
  addListener(eventName: KeyboardEventName, callback: KeyboardEventListener) {
    invariant(false, 'Dummy method used for documentation');
  },

  /**
   * Removes a specific listener.
   *
   * @param {string} eventName The `nativeEvent` is the string that identifies the event you're listening for.
   * @param {function} callback function to be called when the event fires.
   */
  removeListener(
    eventName: KeyboardEventName,
    callback: KeyboardEventListener,
  ) {
    invariant(false, 'Dummy method used for documentation');
  },

  /**
   * Removes all listeners for a specific event type.
   *
   * @param {string} eventType The native event string listeners are watching which will be removed.
   */
  removeAllListeners(eventName: KeyboardEventName) {
    invariant(false, 'Dummy method used for documentation');
  },

  /**
   * Dismisses the active keyboard and removes focus.
   */
  dismiss() {
    invariant(false, 'Dummy method used for documentation');
  },

  /**
   * Useful for syncing TextInput (or other keyboard accessory view) size of
   * position changes with keyboard movements.
   */
  scheduleLayoutAnimation(event: KeyboardEvent) {
    invariant(false, 'Dummy method used for documentation');
  },
};

// Throw away the dummy object and reassign it to original module
KeyboardEventEmitter.dismiss = dismissKeyboard;
KeyboardEventEmitter.scheduleLayoutAnimation = function(event: KeyboardEvent) {
  const {duration, easing} = event;
  if (duration != null && duration !== 0) {
    LayoutAnimation.configureNext({
      duration: duration,
      update: {
        duration: duration,
        type: (easing != null && LayoutAnimation.Types[easing]) || 'keyboard',
      },
    });
  }
};

module.exports = KeyboardEventEmitter;
