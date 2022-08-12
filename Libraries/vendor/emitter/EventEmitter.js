/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  EventSubscription,
  IEventEmitter,
} from '@react-native/event-emitter';
import EventEmitter from '@react-native/event-emitter';

export type {EventSubscription, IEventEmitter};
export default EventEmitter;
