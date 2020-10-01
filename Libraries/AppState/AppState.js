/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import logError from '../Utilities/logError';
import EventEmitter from '../vendor/emitter/EventEmitter';
import NativeAppState from './NativeAppState';
import invariant from 'invariant';

/**
 * `AppState` can tell you if the app is in the foreground or background,
 * and notify you when the state changes.
 *
 * See https://reactnative.dev/docs/appstate.html
 */
class AppState extends NativeEventEmitter {
  _eventHandlers: Object;
  _supportedEvents = ['change', 'memoryWarning', 'blur', 'focus'];
  currentState: ?string;
  isAvailable: boolean;

  constructor() {
    super(NativeAppState);

    this.isAvailable = true;
    this._eventHandlers = this._supportedEvents.reduce((handlers, key) => {
      handlers[key] = new Map();
      return handlers;
    }, {});

    this.currentState = NativeAppState.getConstants().initialAppState;

    let eventUpdated = false;

    // TODO: this is a terrible solution - in order to ensure `currentState`
    // prop is up to date, we have to register an observer that updates it
    // whenever the state changes, even if nobody cares. We should just
    // deprecate the `currentState` property and get rid of this.
    this.addListener('appStateDidChange', appStateData => {
      eventUpdated = true;
      this.currentState = appStateData.app_state;
    });

    // TODO: see above - this request just populates the value of `currentState`
    // when the module is first initialized. Would be better to get rid of the
    // prop and expose `getCurrentAppState` method directly.
    NativeAppState.getCurrentAppState(appStateData => {
      // It's possible that the state will have changed here & listeners need to be notified
      if (!eventUpdated && this.currentState !== appStateData.app_state) {
        this.currentState = appStateData.app_state;
        this.emit('appStateDidChange', appStateData);
      }
    }, logError);
  }

  // TODO: now that AppState is a subclass of NativeEventEmitter, we could
  // deprecate `addEventListener` and `removeEventListener` and just use
  // addListener` and `listener.remove()` directly. That will be a breaking
  // change though, as both the method and event names are different
  // (addListener events are currently required to be globally unique).
  /**
   * Add a handler to AppState changes by listening to the `change` event type
   * and providing the handler.
   *
   * See https://reactnative.dev/docs/appstate.html#addeventlistener
   */
  addEventListener(type: string, handler: Function) {
    invariant(
      this._supportedEvents.indexOf(type) !== -1,
      'Trying to subscribe to unknown event: "%s"',
      type,
    );

    switch (type) {
      case 'change': {
        this._eventHandlers[type].set(
          handler,
          this.addListener('appStateDidChange', appStateData => {
            handler(appStateData.app_state);
          }),
        );
        break;
      }
      case 'memoryWarning': {
        this._eventHandlers[type].set(
          handler,
          this.addListener('memoryWarning', handler),
        );
        break;
      }

      case 'blur':
      case 'focus': {
        this._eventHandlers[type].set(
          handler,
          this.addListener('appStateFocusChange', hasFocus => {
            if (type === 'blur' && !hasFocus) {
              handler();
            }
            if (type === 'focus' && hasFocus) {
              handler();
            }
          }),
        );
      }
    }
  }

  /**
   * Remove a handler by passing the `change` event type and the handler.
   *
   * See https://reactnative.dev/docs/appstate.html#removeeventlistener
   */
  removeEventListener(type: string, handler: Function) {
    invariant(
      this._supportedEvents.indexOf(type) !== -1,
      'Trying to remove listener for unknown event: "%s"',
      type,
    );
    if (!this._eventHandlers[type].has(handler)) {
      return;
    }
    this._eventHandlers[type].get(handler).remove();
    this._eventHandlers[type].delete(handler);
  }
}

function throwMissingNativeModule() {
  invariant(
    false,
    'Cannot use AppState module when native RCTAppState is not included in the build.\n' +
      'Either include it, or check AppState.isAvailable before calling any methods.',
  );
}

class MissingNativeAppStateShim extends EventEmitter {
  // AppState
  isAvailable: boolean = false;
  currentState: ?string = null;

  addEventListener(type: string, handler: Function) {
    throwMissingNativeModule();
  }

  removeEventListener(type: string, handler: Function) {
    throwMissingNativeModule();
  }

  // EventEmitter
  addListener() {
    throwMissingNativeModule();
  }

  removeAllListeners() {
    throwMissingNativeModule();
  }

  removeSubscription() {
    throwMissingNativeModule();
  }
}

// This module depends on the native `RCTAppState` module. If you don't include it,
// `AppState.isAvailable` will return `false`, and any method calls will throw.
// We reassign the class variable to keep the autodoc generator happy.
const AppStateInstance: AppState | MissingNativeAppStateShim = NativeAppState
  ? new AppState()
  : new MissingNativeAppStateShim();

module.exports = AppStateInstance;
