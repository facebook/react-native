/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AccessibilityInfo
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var Promise = require('Promise');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var AccessibilityManager = NativeModules.AccessibilityManager;

var VOICE_OVER_EVENT = 'voiceOverDidChange';

type ChangeEventName = $Enum<{
  change: string,
}>;

var _subscriptions = new Map();

/**
 * Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The
 * `AccessibilityInfo` API is designed for this purpose. You can use it to query the current state of the
 * screen reader as well as to register to be notified when the state of the screen reader changes.
 *
 * Here's a small example illustrating how to use `AccessibilityInfo`:
 *
 * ```javascript
 * class ScreenReaderStatusExample extends React.Component {
 *   state = {
 *     screenReaderEnabled: false,
 *   }
 *
 *   componentDidMount() {
 *     AccessibilityInfo.addEventListener(
 *       'change',
 *       this._handleScreenReaderToggled
 *     );
 *     AccessibilityInfo.fetch().done((isEnabled) => {
 *       this.setState({
 *         screenReaderEnabled: isEnabled
 *       });
 *     });
 *   }
 *
 *   componentWillUnmount() {
 *     AccessibilityInfo.removeEventListener(
 *       'change',
 *       this._handleScreenReaderToggled
 *     );
 *   }
 *
 *   _handleScreenReaderToggled = (isEnabled) => {
 *     this.setState({
 *       screenReaderEnabled: isEnabled,
 *     });
 *   }
 *
 *   render() {
 *     return (
 *       <View>
 *         <Text>
 *           The screen reader is {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.
 *         </Text>
 *       </View>
 *     );
 *   }
 * }
 * ```
 */
var AccessibilityInfo = {

  /**
   * Query whether a screen reader is currently enabled. Returns a promise which
   * resolves to a boolean. The result is `true` when a screen reader is enabled
   * and `false` otherwise.
   */
  fetch: function(): Promise {
    return new Promise((resolve, reject) => {
      AccessibilityManager.getCurrentVoiceOverState(
        resolve,
        reject
      );
    });
  },

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when the state of the screen reader changes. The argument
   *   to the event handler is a boolean. The boolean is `true` when a screen
   *   reader is enabled and `false` otherwise.
   */
  addEventListener: function (
    eventName: ChangeEventName,
    handler: Function
  ): Object {
    var listener = RCTDeviceEventEmitter.addListener(
      VOICE_OVER_EVENT,
      handler
    );
    _subscriptions.set(handler, listener);
    return {
      remove: AccessibilityInfo.removeEventListener.bind(null, eventName, handler),
    };
  },

  /**
   * Remove an event handler.
   */
  removeEventListener: function(
    eventName: ChangeEventName,
    handler: Function
  ): void {
    var listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  },

};

module.exports = AccessibilityInfo;
