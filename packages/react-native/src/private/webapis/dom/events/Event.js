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
 * This module implements the `Event` interface from the DOM.
 * See https://dom.spec.whatwg.org/#interface-event.
 */

// flowlint unsafe-getters-setters:off

import type EventTarget from './EventTarget';

import {
  COMPOSED_PATH_KEY,
  CURRENT_TARGET_KEY,
  EVENT_PHASE_KEY,
  IN_PASSIVE_LISTENER_FLAG_KEY,
  IS_TRUSTED_KEY,
  STOP_IMMEDIATE_PROPAGATION_FLAG_KEY,
  STOP_PROPAGATION_FLAG_KEY,
  TARGET_KEY,
  getComposedPath,
  getCurrentTarget,
  getEventPhase,
  getInPassiveListenerFlag,
  getIsTrusted,
  getTarget,
  setStopImmediatePropagationFlag,
  setStopPropagationFlag,
} from './internals/EventInternals';

type EventInit = {
  bubbles?: boolean,
  cancelable?: boolean,
  composed?: boolean,
};

export default class Event {
  static NONE: 0 = 0;
  static CAPTURING_PHASE: 1 = 1;
  static AT_TARGET: 2 = 2;
  static BUBBLING_PHASE: 3 = 3;

  _bubbles: boolean;
  _cancelable: boolean;
  _composed: boolean;
  _type: string;

  _defaultPrevented: boolean = false;
  _timeStamp: number = performance.now();

  // $FlowExpectedError[unsupported-syntax]
  [COMPOSED_PATH_KEY]: boolean = [];

  // $FlowExpectedError[unsupported-syntax]
  [CURRENT_TARGET_KEY]: EventTarget | null = null;

  // $FlowExpectedError[unsupported-syntax]
  [EVENT_PHASE_KEY]: boolean = Event.NONE;

  // $FlowExpectedError[unsupported-syntax]
  [IN_PASSIVE_LISTENER_FLAG_KEY]: boolean = false;

  // $FlowExpectedError[unsupported-syntax]
  [IS_TRUSTED_KEY]: boolean = false;

  // $FlowExpectedError[unsupported-syntax]
  [STOP_IMMEDIATE_PROPAGATION_FLAG_KEY]: boolean = false;

  // $FlowExpectedError[unsupported-syntax]
  [STOP_PROPAGATION_FLAG_KEY]: boolean = false;

  // $FlowExpectedError[unsupported-syntax]
  [TARGET_KEY]: EventTarget | null = null;

  constructor(type: string, options?: ?EventInit) {
    if (arguments.length < 1) {
      throw new TypeError(
        "Failed to construct 'Event': 1 argument required, but only 0 present.",
      );
    }

    const typeOfOptions = typeof options;

    if (
      options != null &&
      typeOfOptions !== 'object' &&
      typeOfOptions !== 'function'
    ) {
      throw new TypeError(
        "Failed to construct 'Event': The provided value is not of type 'EventInit'.",
      );
    }

    this._type = String(type);
    this._bubbles = Boolean(options?.bubbles);
    this._cancelable = Boolean(options?.cancelable);
    this._composed = Boolean(options?.composed);
  }

  get bubbles(): boolean {
    return this._bubbles;
  }

  get cancelable(): boolean {
    return this._cancelable;
  }

  get composed(): boolean {
    return this._composed;
  }

  get currentTarget(): EventTarget | null {
    return getCurrentTarget(this);
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  get eventPhase(): EventPhase {
    return getEventPhase(this);
  }

  get isTrusted(): boolean {
    return getIsTrusted(this);
  }

  get target(): EventTarget | null {
    return getTarget(this);
  }

  get timeStamp(): number {
    return this._timeStamp;
  }

  get type(): string {
    return this._type;
  }

  composedPath(): $ReadOnlyArray<EventTarget> {
    return getComposedPath(this).slice();
  }

  preventDefault(): void {
    if (!this._cancelable) {
      return;
    }

    if (getInPassiveListenerFlag(this)) {
      console.error(
        new Error(
          'Unable to preventDefault inside passive event listener invocation.',
        ),
      );
      return;
    }

    this._defaultPrevented = true;
  }

  stopImmediatePropagation(): void {
    setStopPropagationFlag(this, true);
    setStopImmediatePropagationFlag(this, true);
  }

  stopPropagation(): void {
    setStopPropagationFlag(this, true);
  }
}

export type EventPhase =
  | (typeof Event)['NONE']
  | (typeof Event)['CAPTURING_PHASE']
  | (typeof Event)['AT_TARGET']
  | (typeof Event)['BUBBLING_PHASE'];
