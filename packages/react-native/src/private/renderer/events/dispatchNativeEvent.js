/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type EventTarget from '../../webapis/dom/events/EventTarget';

import {
  customBubblingEventTypes,
  customDirectEventTypes,
} from '../../../../Libraries/Renderer/shims/ReactNativeViewConfigRegistry';
import {setEventInitTimeStamp} from '../../webapis/dom/events/internals/EventInternals';
import {dispatchTrustedEvent} from '../../webapis/dom/events/internals/EventTargetInternals';
import LegacySyntheticEvent from './LegacySyntheticEvent';
import {topLevelTypeToEventType} from './ReactNativeEventTypeMapping';
import {
  processResponderEvent,
  rethrowCaughtError,
} from './ReactNativeResponder';

/**
 * Dispatches a native event through the EventTarget-based dispatch system.
 * This handles:
 * 1. Responder negotiation (touch handling, grant/release lifecycle)
 * 2. Normal event dispatch via dispatchTrustedEvent (capture/bubble phases)
 *
 * Called from the React renderer's dispatchEvent when
 * enableNativeEventTargetEventDispatching is enabled.
 */
export default function dispatchNativeEvent(
  target: EventTarget,
  type: string,
  payload: {[string]: unknown},
): void {
  // Process responder events before normal event dispatch.
  processResponderEvent(type, target, payload);

  // Normal EventTarget dispatch
  const bubbleConfig = customBubblingEventTypes[type];
  const directConfig = customDirectEventTypes[type];
  const bubbles = bubbleConfig != null;

  // Skip events that are not registered in the view config
  if (bubbles || directConfig != null) {
    const eventType = topLevelTypeToEventType(type);
    const options: {bubbles: boolean, cancelable: boolean} = {
      bubbles,
      cancelable: true,
    };

    // Preserve the native event timestamp for backwards compatibility.
    const nativeTimestamp = payload.timeStamp ?? payload.timestamp;
    if (typeof nativeTimestamp === 'number') {
      setEventInitTimeStamp(options, nativeTimestamp);
    }

    const syntheticEvent = new LegacySyntheticEvent(
      eventType,
      options,
      payload,
      bubbleConfig ?? directConfig,
    );
    dispatchTrustedEvent(target, syntheticEvent);
  }

  // Rethrow the first error caught during responder lifecycle dispatch,
  // after all dispatching is complete. This matches the old system's
  // runEventsInBatch → rethrowCaughtError pattern.
  rethrowCaughtError();
}
