/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * This method contains internal implementation details for the `EventTarget`
 * module and it is defined in a separate module to keep the exports in
 * the original module clean (only with public exports).
 */

import type Event from '../Event';
import type EventTarget from '../EventTarget';

import {setIsTrusted} from './EventInternals';

/**
 * Use this symbol as key for a method to implement the "get the parent"
 * algorithm in an `EventTarget` subclass.
 */
export const EVENT_TARGET_GET_THE_PARENT_KEY: symbol = Symbol(
  'EventTarget[get the parent]',
);

/**
 * This is only exposed to implement the method in `EventTarget`.
 * Do NOT use this directly (use the `dispatchTrustedEvent` method instead).
 */
export const INTERNAL_DISPATCH_METHOD_KEY: symbol = Symbol(
  'EventTarget[dispatch]',
);

/**
 * Dispatches a trusted event to the given event target.
 *
 * This should only be used by the runtime to dispatch native events to
 * JavaScript.
 */
export function dispatchTrustedEvent(
  eventTarget: EventTarget,
  event: Event,
): void {
  setIsTrusted(event, true);

  // $FlowExpectedError[prop-missing]
  return eventTarget[INTERNAL_DISPATCH_METHOD_KEY](event);
}
