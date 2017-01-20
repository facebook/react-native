/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppState
 * @flow
 */
'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const RCTAppState = NativeModules.AppState;

const logError = require('logError');
const invariant = require('fbjs/lib/invariant');

/**
 * `AppState` can tell you if the app is in the foreground or background,
 * and notify you when the state changes.
 *
 * AppState is frequently used to determine the intent and proper behavior when
 * handling push notifications.
 *
 * ### App States
 *
 *  - `active` - The app is running in the foreground
 *  - `background` - The app is running in the background. The user is either
 *     in another app or on the home screen
 *  - `inactive` - This is a state that occurs when transitioning between
 *  	 foreground & background, and during periods of inactivity such as
 *  	 entering the Multitasking view or in the event of an incoming call
 *
 * For more information, see
 * [Apple's documentation](https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html)
 *
 * ### Basic Usage
 *
 * To see the current state, you can check `AppState.currentState`, which
 * will be kept up-to-date. However, `currentState` will be null at launch
 * while `AppState` retrieves it over the bridge.
 *
 * ```
 * import React, {Component} from 'react'
 * import {AppState, Text} from 'react-native'
 *
 * class AppStateExample extends Component {
 *
 *   state = {
 *     appState: AppState.currentState
 *   }
 *
 *   componentDidMount() {
 *     AppState.addEventListener('change', this._handleAppStateChange);
 *   }
 *
 *   componentWillUnmount() {
 *     AppState.removeEventListener('change', this._handleAppStateChange);
 *   }
 *
 *   _handleAppStateChange = (nextAppState) => {
 *     if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
 *       console.log('App has come to the foreground!')
 *     }
 *     this.setState({appState: nextAppState});
 *   }
 *
 *   render() {
 *     return (
 *       <Text>Current state is: {this.state.appState}</Text>
 *     );
 *   }
 *
 * }
 * ```
 *
 * This example will only ever appear to say "Current state is: active" because
 * the app is only visible to the user when in the `active` state, and the null
 * state will happen only momentarily.
 */

class AppState extends NativeEventEmitter {

  _eventHandlers: Object;
  currentState: ?string;

  constructor() {
    super(RCTAppState);

    this._eventHandlers = {
      change: new Map(),
      memoryWarning: new Map(),
    };

    // TODO: Remove the 'active' fallback after `initialAppState` is exported by
    // the Android implementation.
    this.currentState = RCTAppState.initialAppState || 'active';

    // TODO: this is a terrible solution - in order to ensure `currentState` prop
    // is up to date, we have to register an observer that updates it whenever
    // the state changes, even if nobody cares. We should just deprecate the
    // `currentState` property and get rid of this.
    this.addListener(
      'appStateDidChange',
      (appStateData) => {
        this.currentState = appStateData.app_state;
      }
    );

    // TODO: see above - this request just populates the value of `currentState`
    // when the module is first initialized. Would be better to get rid of the prop
    // and expose `getCurrentAppState` method directly.
    RCTAppState.getCurrentAppState(
      (appStateData) => {
        this.currentState = appStateData.app_state;
      },
      logError
    );
  }

  /**
   * Add a handler to AppState changes by listening to the `change` event type
   * and providing the handler
   *
   * TODO: now that AppState is a subclass of NativeEventEmitter, we could deprecate
   * `addEventListener` and `removeEventListener` and just use `addListener` and
   * `listener.remove()` directly. That will be a breaking change though, as both
   * the method and event names are different (addListener events are currently
   * required to be globally unique).
   */
  addEventListener(
    type: string,
    handler: Function
  ) {
    invariant(
      ['change', 'memoryWarning'].indexOf(type) !== -1,
      'Trying to subscribe to unknown event: "%s"', type
    );
    if (type === 'change') {
      this._eventHandlers[type].set(handler, this.addListener(
        'appStateDidChange',
        (appStateData) => {
          handler(appStateData.app_state);
        }
      ));
    } else if (type === 'memoryWarning') {
      this._eventHandlers[type].set(handler, this.addListener(
        'memoryWarning',
        handler
      ));
    }
  }

  /**
   * Remove a handler by passing the `change` event type and the handler
   */
  removeEventListener(
    type: string,
    handler: Function
  ) {
    invariant(
      ['change', 'memoryWarning'].indexOf(type) !== -1,
      'Trying to remove listener for unknown event: "%s"', type
    );
    if (!this._eventHandlers[type].has(handler)) {
      return;
    }
    this._eventHandlers[type].get(handler).remove();
    this._eventHandlers[type].delete(handler);
  }
}

AppState = new AppState();

module.exports = AppState;
