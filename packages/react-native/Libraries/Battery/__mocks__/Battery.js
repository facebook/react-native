/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

// Simple EventEmitter mock
class SimpleEventEmitter {
  constructor() {
    this._listeners = {};
  }

  addListener(eventName, callback) {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(callback);
    return {
      remove: () => {
        const index = this._listeners[eventName].indexOf(callback);
        if (index > -1) {
          this._listeners[eventName].splice(index, 1);
        }
      },
    };
  }

  removeAllListeners(eventName) {
    if (eventName) {
      delete this._listeners[eventName];
    } else {
      this._listeners = {};
    }
  }

  emit(eventName, ...args) {
    if (this._listeners[eventName]) {
      this._listeners[eventName].forEach(callback => callback(...args));
    }
  }
}

const mockBatteryState = {
  level: 100,
  isCharging: false,
  isLowPowerMode: false,
};

class BatteryMock {
  isAvailable = true;
  _emitter = new SimpleEventEmitter();

  async getBatteryState() {
    return mockBatteryState;
  }

  addChangeListener(callback) {
    return this._emitter.addListener('change', callback);
  }

  removeChangeListener(subscription) {
    subscription.remove();
  }

  removeAllListeners() {
    this._emitter.removeAllListeners('change');
  }
}

const mock = new BatteryMock();
module.exports = mock;
module.exports.default = mock;
