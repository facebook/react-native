/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const _backPressSubscriptions = new Set();

const BackHandler = {
  exitApp: jest.fn(),

  addEventListener: function(
    eventName: BackPressEventName,
    handler: Function,
  ): {remove: () => void} {
    _backPressSubscriptions.add(handler);
    return {
      remove: () => BackHandler.removeEventListener(eventName, handler),
    };
  },

  removeEventListener: function(
    eventName: BackPressEventName,
    handler: Function,
  ): void {
    _backPressSubscriptions.delete(handler);
  },

  mockPressBack: function() {
    let invokeDefault = true;
    const subscriptions = [..._backPressSubscriptions].reverse();
    for (let i = 0; i < subscriptions.length; ++i) {
      if (subscriptions[i]()) {
        invokeDefault = false;
        break;
      }
    }

    if (invokeDefault) {
      BackHandler.exitApp();
    }
  },
};

module.exports = BackHandler;
