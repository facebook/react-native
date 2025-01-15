/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import logError from '../Utilities/logError';
import Platform from '../Utilities/Platform';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import NativeAppState from './NativeAppState';

export type AppStateValues = 'inactive' | 'background' | 'active';

type AppStateEventDefinitions = {
  change: [AppStateValues],
  memoryWarning: [],
  blur: [],
  focus: [],
};

type NativeAppStateEventDefinitions = {
  appStateDidChange: [{app_state: AppStateValues}],
  appStateFocusChange: [boolean],
  memoryWarning: [],
};

/**
 * `AppState` can tell you if the app is in the foreground or background,
 * and notify you when the state changes.
 *
 * See https://reactnative.dev/docs/appstate
 */
class AppState {
  currentState: ?string = null;
  isAvailable: boolean;

  _emitter: ?NativeEventEmitter<NativeAppStateEventDefinitions>;

  constructor() {
    if (NativeAppState == null) {
      this.isAvailable = false;
    } else {
      this.isAvailable = true;

      const emitter: NativeEventEmitter<NativeAppStateEventDefinitions> =
        new NativeEventEmitter(
          // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
          // If you want to use the native module on other platforms, please remove this condition and test its behavior
          Platform.OS !== 'ios' ? null : NativeAppState,
        );
      this._emitter = emitter;

      this.currentState = NativeAppState.getConstants().initialAppState;

      let eventUpdated = false;

      // TODO: this is a terrible solution - in order to ensure `currentState`
      // prop is up to date, we have to register an observer that updates it
      // whenever the state changes, even if nobody cares. We should just
      // deprecate the `currentState` property and get rid of this.
      emitter.addListener('appStateDidChange', appStateData => {
        eventUpdated = true;
        this.currentState = appStateData.app_state;
      });

      // TODO: see above - this request just populates the value of `currentState`
      // when the module is first initialized. Would be better to get rid of the
      // prop and expose `getCurrentAppState` method directly.
      // $FlowExpectedError[incompatible-call]
      NativeAppState.getCurrentAppState(appStateData => {
        // It's possible that the state will have changed here & listeners need to be notified
        if (!eventUpdated && this.currentState !== appStateData.app_state) {
          this.currentState = appStateData.app_state;
          // $FlowFixMe[incompatible-call]
          emitter.emit('appStateDidChange', appStateData);
        }
      }, logError);
    }
  }

  /**
   * Add a handler to AppState changes by listening to the `change` event type
   * and providing the handler.
   *
   * See https://reactnative.dev/docs/appstate#addeventlistener
   */
  addEventListener<K: $Keys<AppStateEventDefinitions>>(
    type: K,
    handler: (...$ElementType<AppStateEventDefinitions, K>) => void,
  ): EventSubscription {
    const emitter = this._emitter;
    if (emitter == null) {
      throw new Error('Cannot use AppState when `isAvailable` is false.');
    }
    switch (type) {
      case 'change':
        // $FlowIssue[invalid-tuple-arity] Flow cannot refine handler based on the event type
        const changeHandler: AppStateValues => void = handler;
        return emitter.addListener('appStateDidChange', appStateData => {
          changeHandler(appStateData.app_state);
        });
      case 'memoryWarning':
        // $FlowIssue[invalid-tuple-arity] Flow cannot refine handler based on the event type
        const memoryWarningHandler: () => void = handler;
        return emitter.addListener('memoryWarning', memoryWarningHandler);
      case 'blur':
      case 'focus':
        // $FlowIssue[invalid-tuple-arity] Flow cannot refine handler based on the event type
        const focusOrBlurHandler: () => void = handler;
        return emitter.addListener('appStateFocusChange', hasFocus => {
          if (type === 'blur' && !hasFocus) {
            focusOrBlurHandler();
          }
          if (type === 'focus' && hasFocus) {
            focusOrBlurHandler();
          }
        });
    }
    throw new Error('Trying to subscribe to unknown event: ' + type);
  }
}

module.exports = (new AppState(): AppState);
