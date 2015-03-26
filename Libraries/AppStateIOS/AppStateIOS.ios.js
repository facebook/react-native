/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppStateIOS
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTAppState = NativeModules.AppState;

var logError = require('logError');

var DEVICE_APPSTATE_EVENT = 'appStateDidChange';

var _appStateHandlers = {};

/**
 * `AppStateIOS` can tell you if the app is in the foreground or background,
 * and notify you when the state changes.
 *
 * AppStateIOS is frequently used to determine the intent and proper behavior when
 * handling push notifications.
 *
 * ### iOS App States
 *
 *  - `active` - The app is running in the foreground
 *  - `background` - The app is running in the background. The user is either
 *     in another app or on the home screen
 *  - `inactive` - This is a transition state that currently never happens for
 *     typical React Native apps.
 *
 * For more information, see
 * [Apple's documentation](https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html)
 *
 * ### Basic Usage
 *
 * To see the current state, you can check `AppStateIOS.currentState`, which
 * will be kept up-to-date. However, `currentState` will be null at launch
 * while `AppStateIOS` retrieves it over the bridge.
 *
 * ```
 * getInitialState: function() {
 *   return {
 *     currentAppState: AppStateIOS.currentState,
 *   };
 * },
 * componentDidMount: function() {
 *   AppStateIOS.addEventListener('change', this._handleAppStateChange);
 * },
 * componentWillUnmount: function() {
 *   AppStateIOS.removeEventListener('change', this._handleAppStateChange);
 * },
 * _handleAppStateChange: function(currentAppState) {
 *   this.setState({ currentAppState, });
 * },
 * render: function() {
 *   return (
 *     <Text>Current state is: {this.state.currentAppState}</Text>
 *   );
 * },
 * ```
 *
 * This example will only ever appear to say "Current state is: active" because
 * the app is only visible to the user when in the `active` state, and the null
 * state will happen only momentarily.
 */

var AppStateIOS = {

  /**
   * Add a handler to AppState changes by listening to the `change` event type
   * and providing the handler
   */
  addEventListener: function(
    type: string,
    handler: Function
  ) {
    _appStateHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_APPSTATE_EVENT,
      (appStateData) => {
        handler(appStateData.app_state);
      }
    );
  },

  /**
   * Remove a handler by passing the `change` event type and the handler
   */
  removeEventListener: function(
    type: string,
    handler: Function
  ) {
    if (!_appStateHandlers[handler]) {
      return;
    }
    _appStateHandlers[handler].remove();
    _appStateHandlers[handler] = null;
  },

  currentState: (null : ?String),

};

RCTDeviceEventEmitter.addListener(
  DEVICE_APPSTATE_EVENT,
  (appStateData) => {
    AppStateIOS.currentState = appStateData.app_state;
  }
);

RCTAppState.getCurrentAppState(
  (appStateData) => {
    AppStateIOS.currentState = appStateData.app_state;
  },
  logError
);

module.exports = AppStateIOS;
