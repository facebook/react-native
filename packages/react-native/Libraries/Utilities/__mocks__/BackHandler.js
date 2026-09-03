/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BackPressEventName, PredictiveBackEvent} from '../BackHandler';
import type {HardwareBackPressEvent} from '../HardwareBackPressEvent';

import {HardwareBackPressEvent as HardwareBackPressEventClass} from '../HardwareBackPressEvent';

const _backPressSubscriptions = new Set<
  (event: HardwareBackPressEvent) => ?boolean,
>();
const _predictiveBackSubscriptions = new Set<
  (event: PredictiveBackEvent) => void,
>();

const BackHandler = {
  exitApp: jest.fn() as () => void,
  setInterceptEnabled: jest.fn() as (enabled: boolean) => void,

  addPredictiveBackListener: function (
    handler: (event: PredictiveBackEvent) => void,
  ): {remove: () => void, ...} {
    _predictiveBackSubscriptions.add(handler);
    return {
      remove: () => {
        _predictiveBackSubscriptions.delete(handler);
      },
    };
  },

  addEventListener: function (
    eventName: BackPressEventName,
    handler: (event: HardwareBackPressEvent) => ?boolean,
  ): {remove: () => void, ...} {
    _backPressSubscriptions.add(handler);
    return {
      remove: () => {
        _backPressSubscriptions.delete(handler);
      },
    };
  },

  mockPressBack: function () {
    const event = new HardwareBackPressEventClass();
    let invokeDefault = true;
    const subscriptions = [..._backPressSubscriptions].reverse();
    for (let i = 0; i < subscriptions.length; ++i) {
      if (subscriptions[i](event)) {
        invokeDefault = false;
        break;
      }
    }

    if (invokeDefault) {
      BackHandler.exitApp();
    }
  },
};

export default BackHandler;
