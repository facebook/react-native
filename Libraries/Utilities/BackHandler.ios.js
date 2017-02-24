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

var Platform = require('Platform');
var TVEventHandler = require('TVEventHandler');

type BackPressEventName = $Enum<{
  backPress: string,
}>;

function emptyFunction() {}

var BackHandler;

if (Platform.isTVOS) {

  var _tvEventHandler = new TVEventHandler();

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

