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
 * This module implements the `MessageEvent` interface from the HTML spec.
 * See https://html.spec.whatwg.org/multipage/comms.html#messageevent.
 */

// flowlint unsafe-getters-setters:off

import type {EventInit} from '../../dom/events/Event';

import Event from '../../dom/events/Event';

export type MessageEventInit = $ReadOnly<{
  ...EventInit,
  data?: mixed,
  origin?: string,
  lastEventId?: string,
  // Unsupported
  // source?: MessageEventSource,
  // Unsupported
  // ports?: Array<MessagePort>,
}>;

export default class MessageEvent extends Event {
  _data: mixed;
  _origin: string;
  _lastEventId: string;

  constructor(type: string, options?: ?MessageEventInit) {
    const {
      data,
      origin = '',
      lastEventId = '',
      ...eventOptions
    } = options ?? {};
    super(type, eventOptions);

    this._data = data;
    this._origin = String(origin);
    this._lastEventId = String(lastEventId);
  }

  get data(): mixed {
    return this._data;
  }

  get origin(): string {
    return this._origin;
  }

  get lastEventId(): string {
    return this._lastEventId;
  }
}
