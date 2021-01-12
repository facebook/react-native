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

import EventEmitter from '../../vendor/emitter/EventEmitter';
import RCTDeviceEventEmitter from '../RCTDeviceEventEmitter';

/**
 * Mock the NativeEventEmitter as a normal JS EventEmitter.
 */
export default class NativeEventEmitter<
  EventDefinitions: {...},
> extends EventEmitter<EventDefinitions> {
  constructor() {
    super(RCTDeviceEventEmitter.sharedSubscriber);
  }
}
