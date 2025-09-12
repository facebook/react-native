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
 * This module provides helpers for classes to implement event handler IDL
 * attributes, as defined in https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-idl-attributes.
 *
 * Expected usage:
 * ```
 * import {getEventHandlerAttribute, setEventHandlerAttribute} from '../path/to/EventHandlerAttributes';
 *
 * class EventTargetSubclass extends EventTarget {
 *   get oncustomevent(): EventListener | null {
 *     return getEventHandlerAttribute(this, 'customEvent');
 *   }
 *
 *   set oncustomevent(listener: EventListener | null) {
 *     setEventHandlerAttribute(this, 'customEvent', listener);
 *   }
 * }
 *
 * const eventTargetInstance = new EventTargetSubclass();
 *
 * eventTargetInstance.oncustomevent = (event: Event) => {
 *   console.log('custom event received');
 * };
 * eventTargetInstance.dispatchEvent(new Event('customEvent'));
 * // Logs 'custom event received' to the console.
 *
 * eventTargetInstance.oncustomevent = null;
 * eventTargetInstance.dispatchEvent(new Event('customEvent'));
 * // Does not log anything to the console.
 * ```
 */

import type Event from './Event';
import type EventTarget from './EventTarget';
import type {EventCallback, GenericEventMap} from './EventTarget';

type EventHandler<EventTypes: Event> = $ReadOnly<{
  handleEvent: EventCallback<EventTypes>,
}>;

type EventHandlerAttributeMap<EventTypes: GenericEventMap> = Map<
  $Keys<EventTypes>,
  EventHandler<$Values<EventTypes>> | null,
>;

const EVENT_HANDLER_CONTENT_ATTRIBUTE_MAP_KEY = Symbol(
  'eventHandlerAttributeMap',
);

function getEventHandlerAttributeMap<EventTypes: GenericEventMap>(
  target: EventTarget<EventTypes>,
): ?EventHandlerAttributeMap<EventTypes> {
  // $FlowExpectedError[prop-missing]
  return target[EVENT_HANDLER_CONTENT_ATTRIBUTE_MAP_KEY];
}

function setEventHandlerAttributeMap<EventTypes: GenericEventMap>(
  target: EventTarget<EventTypes>,
  map: ?EventHandlerAttributeMap<EventTypes>,
) {
  // $FlowExpectedError[prop-missing]
  target[EVENT_HANDLER_CONTENT_ATTRIBUTE_MAP_KEY] = map;
}

/**
 * Returns the event listener registered as an event handler IDL attribute for
 * the given target and type.
 *
 * Should be used to get the current value for `target.on{type}`.
 */
export function getEventHandlerAttribute<
  EventTypes: GenericEventMap,
  EventType: $Keys<EventTypes>,
>(
  target: EventTarget<EventTypes>,
  type: EventType,
): EventCallback<EventTypes[EventType]> | null {
  const listener = getEventHandlerAttributeMap(target)?.get(type);
  return listener != null ? listener.handleEvent : null;
}

/**
 * Sets the event listener registered as an event handler IDL attribute for
 * the given target and type.
 *
 * Should be used to set a value for `target.on{type}`.
 */
export function setEventHandlerAttribute<
  EventTypes: GenericEventMap,
  EventName: $Keys<EventTypes>,
>(
  target: EventTarget<EventTypes>,
  type: EventName,
  callback: ?EventCallback<EventTypes[EventName]>,
): void {
  let map = getEventHandlerAttributeMap(target);
  if (map != null) {
    const currentListener = map.get(type);
    if (currentListener) {
      target.removeEventListener(type, currentListener);
      map.delete(type);
    }
  }

  if (
    callback != null &&
    (typeof callback === 'function' || typeof callback === 'object')
  ) {
    // Register the listener as a different object in the target so it
    // occupies its own slot and cannot be removed via `removeEventListener`.
    const listener = {
      handleEvent: callback,
    };

    try {
      target.addEventListener(type, listener);
      // If adding the listener fails, we don't store the value
      if (map == null) {
        map = new Map();
        setEventHandlerAttributeMap(target, map);
      }
      map.set(type, listener);
    } catch (e) {
      // Assigning incorrect listener does not throw in setters.
    }
  }

  if (map != null && map.size === 0) {
    setEventHandlerAttributeMap(target, null);
  }
}
