/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CallInfo
 * @flow
 */
'use strict';

const Map = require('Map');
const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const Platform = require('Platform');
const RCTCallInfo = NativeModules.CallInfo;

const CallInfoEventEmitter = new NativeEventEmitter(RCTCallInfo);

const CALL_STATE_EVENT = 'callStateDidChange';

const _subscriptions = new Map();

/**
 * CallInfo exposes info about call status
 */
const CallInfo = {
  /**
   * Adds an event handler
   */
  addEventListener(
    eventName: string,
    handler: Function
  ): {remove: () => void} {
    let listener;
    if (eventName === 'change') {
      listener = CallInfoEventEmitter.addListener(
        CALL_STATE_EVENT,
        (appStateData) => {
          handler(appStateData.phone_state);
        }
      );
    } else {
      console.warn('Trying to subscribe to unknown event: "' + eventName + '"');
      return {
        remove: () => {}
      };
    }

    _subscriptions.set(handler, listener);
    return {
      remove: () => CallInfo.removeEventListener(eventName, handler)
    };
  },

  /**
   * Removes the listener for call status changes.
   */
  removeEventListener(
    eventName: string,
    handler: Function
  ): void {
    const listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  }
};

module.exports = CallInfo;
