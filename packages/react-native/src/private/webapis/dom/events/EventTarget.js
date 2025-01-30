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
 * This module implements the `EventTarget` and related interfaces from the DOM.
 * See https://dom.spec.whatwg.org/#interface-eventtarget.
 */

import type {EventPhase} from './Event';

import Event from './Event';
import {
  getStopImmediatePropagationFlag,
  getStopPropagationFlag,
  setComposedPath,
  setCurrentTarget,
  setEventPhase,
  setInPassiveListenerFlag,
  setIsTrusted,
  setStopImmediatePropagationFlag,
  setStopPropagationFlag,
  setTarget,
} from './internals/EventInternals';
import {
  EVENT_TARGET_GET_THE_PARENT_KEY,
  INTERNAL_DISPATCH_METHOD_KEY,
} from './internals/EventTargetInternals';

export type EventCallback = (event: Event) => void;
export type EventHandler = interface {
  handleEvent(event: Event): void,
};
export type EventListener = EventCallback | EventHandler;

export type EventListenerOptions = $ReadOnly<{
  capture?: boolean,
}>;

export type AddEventListenerOptions = $ReadOnly<{
  ...EventListenerOptions,
  passive?: boolean,
  once?: boolean,
  signal?: AbortSignal,
}>;

type EventListenerRegistration = {
  +callback: EventListener,
  +passive: boolean,
  +once: boolean,
  removed: boolean,
};

type ListenersMap = Map<string, Map<EventListener, EventListenerRegistration>>;

export default class EventTarget {
  addEventListener(
    type: string,
    callback: EventListener | null,
    optionsOrUseCapture?: AddEventListenerOptions | boolean = {},
  ): void {
    if (arguments.length < 2) {
      throw new TypeError(
        `Failed to execute 'addEventListener' on 'EventTarget': 2 arguments required, but only ${arguments.length} present.`,
      );
    }

    if (callback == null) {
      return;
    }

    validateCallback(callback, 'addEventListener');

    const processedType = String(type);

    let capture;
    let passive;
    let once;
    let signal;

    if (
      optionsOrUseCapture != null &&
      (typeof optionsOrUseCapture === 'object' ||
        typeof optionsOrUseCapture === 'function')
    ) {
      capture = Boolean(optionsOrUseCapture.capture);
      passive =
        optionsOrUseCapture.passive == null
          ? getDefaultPassiveValue(processedType, this)
          : Boolean(optionsOrUseCapture.passive);
      once = Boolean(optionsOrUseCapture.once);
      signal = optionsOrUseCapture.signal;
      if (signal !== undefined && !(signal instanceof AbortSignal)) {
        throw new TypeError(
          "Failed to execute 'addEventListener' on 'EventTarget': Failed to read the 'signal' property from 'AddEventListenerOptions': Failed to convert value to 'AbortSignal'.",
        );
      }
    } else {
      capture = Boolean(optionsOrUseCapture);
      passive = false;
      once = false;
      signal = null;
    }

    if (signal?.aborted) {
      return;
    }

    let listenersByType = getListenersForPhase(this, capture);
    let listeners = listenersByType?.get(processedType);
    if (listeners == null) {
      if (listenersByType == null) {
        listenersByType = new Map();
        setListenersMap(this, capture, listenersByType);
      }
      listeners = new Map();
      listenersByType.set(processedType, listeners);
    } else if (listeners.has(callback)) {
      return;
    }

    const listener: EventListenerRegistration = {
      callback,
      passive,
      once,
      removed: false,
    };
    listeners.set(callback, listener);

    const nonNullListeners = listeners;

    if (signal != null) {
      signal.addEventListener(
        'abort',
        () => {
          listener.removed = true;
          if (nonNullListeners.get(callback) === listener) {
            nonNullListeners.delete(callback);
          }
        },
        {
          once: true,
        },
      );
    }
  }

  removeEventListener(
    type: string,
    callback: EventListener,
    optionsOrUseCapture?: EventListenerOptions | boolean = {},
  ): void {
    if (arguments.length < 2) {
      throw new TypeError(
        `Failed to execute 'removeEventListener' on 'EventTarget': 2 arguments required, but only ${arguments.length} present.`,
      );
    }

    if (callback == null) {
      return;
    }

    validateCallback(callback, 'removeEventListener');

    const processedType = String(type);

    const capture =
      typeof optionsOrUseCapture === 'boolean'
        ? optionsOrUseCapture
        : Boolean(optionsOrUseCapture.capture);

    const listenersByType = getListenersForPhase(this, capture);
    const listeners = listenersByType?.get(processedType);
    if (listeners == null) {
      return;
    }

    const listener = listeners.get(callback);
    if (listener != null) {
      listener.removed = true;
      listeners.delete(callback);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (!(event instanceof Event)) {
      throw new TypeError(
        "Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.",
      );
    }

    if (getEventDispatchFlag(event)) {
      throw new Error(
        "Failed to execute 'dispatchEvent' on 'EventTarget': The event is already being dispatched.",
      );
    }

    setIsTrusted(event, false);

    dispatch(this, event);

    return !event.defaultPrevented;
  }

  /**
   * This a "protected" method to be overridden by a subclass to allow event
   * propagation.
   *
   * Should implement the "get the parent" algorithm
   * (see https://dom.spec.whatwg.org/#get-the-parent).
   */
  // $FlowExpectedError[unsupported-syntax]
  [EVENT_TARGET_GET_THE_PARENT_KEY](): EventTarget | null {
    return null;
  }

  /**
   * This is "protected" method to dispatch trusted events.
   */
  // $FlowExpectedError[unsupported-syntax]
  [INTERNAL_DISPATCH_METHOD_KEY](event: Event): void {
    dispatch(this, event);
  }
}

function validateCallback(callback: EventListener, methodName: string): void {
  if (typeof callback !== 'function' && typeof callback !== 'object') {
    throw new TypeError(
      `Failed to execute '${methodName}' on 'EventTarget': parameter 2 is not of type 'Object'.`,
    );
  }
}

function getDefaultPassiveValue(
  type: string,
  eventTarget: EventTarget,
): boolean {
  return false;
}

/**
 * This internal version of `dispatchEvent` does not validate the input and
 * does not reset the `isTrusted` flag, so it can be used for both trusted
 * and not trusted events.
 *
 * Implements the "event dispatch" concept
 * (see https://dom.spec.whatwg.org/#concept-event-dispatch).
 */
function dispatch(eventTarget: EventTarget, event: Event): void {
  setEventDispatchFlag(event, true);

  const eventPath = getEventPath(eventTarget, event);
  setComposedPath(event, eventPath);
  setTarget(event, eventTarget);

  for (let i = eventPath.length - 1; i >= 0; i--) {
    if (getStopPropagationFlag(event)) {
      break;
    }

    const target = eventPath[i];
    setEventPhase(
      event,
      target === eventTarget ? Event.AT_TARGET : Event.CAPTURING_PHASE,
    );
    invoke(target, event, Event.CAPTURING_PHASE);
  }

  for (const target of eventPath) {
    if (getStopPropagationFlag(event)) {
      break;
    }

    // If the event does NOT bubble, we only dispatch the event to the
    // target in the bubbling phase.
    if (!event.bubbles && target !== eventTarget) {
      break;
    }

    setEventPhase(
      event,
      target === eventTarget ? Event.AT_TARGET : Event.BUBBLING_PHASE,
    );
    invoke(target, event, Event.BUBBLING_PHASE);
  }

  setEventPhase(event, Event.NONE);
  setCurrentTarget(event, null);
  setComposedPath(event, []);

  setEventDispatchFlag(event, false);
  setStopImmediatePropagationFlag(event, false);
  setStopPropagationFlag(event, false);
}

/**
 * Builds the event path for an event about to be dispatched in this target
 * (see https://dom.spec.whatwg.org/#event-path).
 *
 * The return value is also set as `composedPath` for the event.
 */
function getEventPath(
  eventTarget: EventTarget,
  event: Event,
): $ReadOnlyArray<EventTarget> {
  const path = [];
  let target: EventTarget | null = eventTarget;

  while (target != null) {
    path.push(target);
    // $FlowExpectedError[prop-missing]
    target = target[EVENT_TARGET_GET_THE_PARENT_KEY]();
  }

  return path;
}

/**
 * Implements the event listener invoke concept
 * (see https://dom.spec.whatwg.org/#concept-event-listener-invoke).
 */
function invoke(
  eventTarget: EventTarget,
  event: Event,
  eventPhase: EventPhase,
) {
  const listenersByType = getListenersForPhase(
    eventTarget,
    eventPhase === Event.CAPTURING_PHASE,
  );

  setCurrentTarget(event, eventTarget);

  const maybeListeners = listenersByType?.get(event.type);
  if (maybeListeners == null) {
    return;
  }

  // This is a copy so listeners added during dispatch are NOT executed.
  // Note that `maybeListeners.values()` is a live view of the map instead of an
  // immutable copy.
  const listeners = Array.from(maybeListeners.values());

  setCurrentTarget(event, eventTarget);

  for (const listener of listeners) {
    if (listener.removed) {
      continue;
    }

    if (listener.once) {
      eventTarget.removeEventListener(
        event.type,
        listener.callback,
        eventPhase === Event.CAPTURING_PHASE,
      );
    }

    if (listener.passive) {
      setInPassiveListenerFlag(event, true);
    }

    const currentEvent = global.event;
    global.event = event;

    const callback = listener.callback;

    try {
      if (typeof callback === 'function') {
        callback.call(eventTarget, event);
        // $FlowExpectedError[method-unbinding]
      } else if (typeof callback.handleEvent === 'function') {
        callback.handleEvent(event);
      }
    } catch (error) {
      // TODO: replace with `reportError` when it's available.
      console.error(error);
    }

    if (listener.passive) {
      setInPassiveListenerFlag(event, false);
    }

    global.event = currentEvent;

    if (getStopImmediatePropagationFlag(event)) {
      break;
    }
  }
}

const CAPTURING_LISTENERS_KEY = Symbol('capturingListeners');
const BUBBLING_LISTENERS_KEY = Symbol('bubblingListeners');

function getListenersForPhase(
  eventTarget: EventTarget,
  isCapture: boolean,
): ?ListenersMap {
  return isCapture
    ? // $FlowExpectedError[prop-missing]
      eventTarget[CAPTURING_LISTENERS_KEY]
    : // $FlowExpectedError[prop-missing]
      eventTarget[BUBBLING_LISTENERS_KEY];
}

function setListenersMap(
  eventTarget: EventTarget,
  isCapture: boolean,
  listenersMap: ListenersMap,
): void {
  if (isCapture) {
    // $FlowExpectedError[prop-missing]
    eventTarget[CAPTURING_LISTENERS_KEY] = listenersMap;
  } else {
    // $FlowExpectedError[prop-missing]
    eventTarget[BUBBLING_LISTENERS_KEY] = listenersMap;
  }
}

const EVENT_DISPATCH_FLAG = Symbol('Event.dispatch');

function getEventDispatchFlag(event: Event): boolean {
  // $FlowExpectedError[prop-missing]
  return event[EVENT_DISPATCH_FLAG];
}

function setEventDispatchFlag(event: Event, value: boolean): void {
  // $FlowExpectedError[prop-missing]
  event[EVENT_DISPATCH_FLAG] = value;
}
