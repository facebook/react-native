/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * On Apple TV, this implements back navigation using the TV remote's menu button.
 * On iOS, this just implements a stub.
 *
 * @providesModule BackHandler
 */

'use strict';

const Platform = require('Platform');
const TVEventHandler = require('TVEventHandler');

type BackPressEventName = $Enum<{
  backPress: string,
}>;

function emptyFunction() {}

/**
 * Detect hardware button presses for back navigation.
 *
 * Android: Detect hardware back button presses, and programmatically invoke the default back button
 * functionality to exit the app if there are no listeners or if none of the listeners return true.
 *
 * tvOS: Detect presses of the menu button on the TV remote.  (Still to be implemented:
 * programmatically disable menu button handling
 * functionality to exit the app if there are no listeners or if none of the listeners return true.)
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
let BackHandler;

if (Platform.isTVOS) {
  const _tvEventHandler = new TVEventHandler();
  var _backPressSubscriptions = new Set();

  _tvEventHandler.enable(this, function(cmp, evt) {
    if (evt && evt.eventType === 'menu') {
      var backPressSubscriptions = new Set(_backPressSubscriptions);
      var invokeDefault = true;
      var subscriptions = [...backPressSubscriptions].reverse();
      for (var i = 0; i < subscriptions.length; ++i) {
        if (subscriptions[i]()) {
          invokeDefault = false;
          break;
        }
      }

      if (invokeDefault) {
        BackHandler.exitApp();
      }
    }
  });

  BackHandler = {
    exitApp: emptyFunction,

    addEventListener: function (
      eventName: BackPressEventName,
      handler: Function
    ): {remove: () => void} {
      _backPressSubscriptions.add(handler);
      return {
        remove: () => BackHandler.removeEventListener(eventName, handler),
      };
    },

    removeEventListener: function(
      eventName: BackPressEventName,
      handler: Function
    ): void {
      _backPressSubscriptions.delete(handler);
    },

  };

} else {

  BackHandler = {
    exitApp: emptyFunction,
    addEventListener() {
      return {
        remove: emptyFunction,
      };
    },
    removeEventListener: emptyFunction,
  };

}

module.exports = BackHandler;
