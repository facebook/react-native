/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const EventEmitter = require('./_EventEmitter');

export default EventEmitter;

export interface EventSubscription {
  remove(): void;
}
