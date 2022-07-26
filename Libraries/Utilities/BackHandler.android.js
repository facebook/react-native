/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeDeviceEventManager from '../../Libraries/NativeModules/specs/NativeDeviceEventManager';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';

const DEVICE_BACK_EVENT = 'hardwareBackPress';

type BackPressEventName = 'backPress' | 'hardwareBackPress';

const _backPressSubscriptions = [];

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function () {
  for (let i = _backPressSubscriptions.length - 1; i >= 0; i--) {
    if (_backPressSubscriptions[i]()) {
      return;
    }
  }

  BackHandler.exitApp();
});

/**
 * Detect hardware button presses for back navigation.
 *
 * Android: Detect hardware back button presses, and programmatically invoke the default back button
 * functionality to exit the app if there are no listeners or if none of the listeners return true.
 *
 * iOS: Not applicable.
 *
 * The event subscriptions are called in reverse order (i.e. last registered subscription first),
 * and if one subscription returns true then subscriptions registered earlier will not be called.
 *
 * Example:
 *
 * ```javascript
 * BackHandler.addEventListener('hardwareBackPress', function() {
 *  // this.onMainScreen and this.goBack are just examples, you need to use your own implementation here
 *  // Typically you would use the navigator here to go to the last state.
 *
 *  if (!this.onMainScreen()) {
 *    this.goBack();
 *    return true;
 *  }
 *  return false;
 * });
 * ```
 */
type TBackHandler = {|
  +exitApp: () => void,
  +addEventListener: (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ) => {remove: () => void, ...},
  +removeEventListener: (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ) => void,
|};
const BackHandler: TBackHandler = {
  exitApp: function (): void {
    if (!NativeDeviceEventManager) {
      return;
    }

    NativeDeviceEventManager.invokeDefaultBackPressHandler();
  },

  /**
   * Adds an event handler. Supported events:
   *
   * - `hardwareBackPress`: Fires when the Android hardware back button is pressed.
   */
  addEventListener: function (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ): {remove: () => void, ...} {
    if (_backPressSubscriptions.indexOf(handler) === -1) {
      _backPressSubscriptions.push(handler);
    }
    return {
      remove: (): void => BackHandler.removeEventListener(eventName, handler),
    };
  },

  /**
   * Removes the event handler.
   */
  removeEventListener: function (
    eventName: BackPressEventName,
    handler: () => ?boolean,
  ): void {
    const index = _backPressSubscriptions.indexOf(handler);
    if (index !== -1) {
      _backPressSubscriptions.splice(index, 1);
    }
  },
};

module.exports = BackHandler;
