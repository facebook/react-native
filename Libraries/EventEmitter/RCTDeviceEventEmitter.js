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

const EventEmitter = require('../vendor/emitter/EventEmitter');
const EventSubscriptionVendor = require('../vendor/emitter/EventSubscriptionVendor');

import type EmitterSubscription from '../vendor/emitter/EmitterSubscription';

function checkNativeEventModule(eventType: ?string) {
  if (eventType) {
    if (eventType.lastIndexOf('statusBar', 0) === 0) {
      throw new Error(
        '`' +
          eventType +
          '` event should be registered via the StatusBarIOS module',
      );
    }
    if (eventType.lastIndexOf('keyboard', 0) === 0) {
      throw new Error(
        '`' +
          eventType +
          '` event should be registered via the Keyboard module',
      );
    }
    if (eventType === 'appStateDidChange' || eventType === 'memoryWarning') {
      throw new Error(
        '`' +
          eventType +
          '` event should be registered via the AppState module',
      );
    }
  }
}

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTDeviceEventEmitter.
 */
class RCTDeviceEventEmitter extends EventEmitter {
  sharedSubscriber: EventSubscriptionVendor;

  constructor() {
    const sharedSubscriber = new EventSubscriptionVendor();
    super(sharedSubscriber);
    this.sharedSubscriber = sharedSubscriber;
  }

  addListener(
    eventType: string,
    listener: Function,
    context: ?Object,
  ): EmitterSubscription {
    if (__DEV__) {
      checkNativeEventModule(eventType);
    }
    return super.addListener(eventType, listener, context);
  }

  removeAllListeners(eventType: ?string) {
    if (__DEV__) {
      checkNativeEventModule(eventType);
    }
    super.removeAllListeners(eventType);
  }

  removeSubscription(subscription: EmitterSubscription) {
    if (subscription.emitter !== this) {
      subscription.emitter.removeSubscription(subscription);
    } else {
      super.removeSubscription(subscription);
    }
  }
}

module.exports = (new RCTDeviceEventEmitter(): RCTDeviceEventEmitter);
