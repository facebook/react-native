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
 * This module implements the `CloseEvent` interface from `WebSocket`.
 * See https://websockets.spec.whatwg.org/#the-closeevent-interface.
 */

// flowlint unsafe-getters-setters:off

import type {EventInit} from '../../dom/events/Event';

import Event from '../../dom/events/Event';

export type CloseEventInit = $ReadOnly<{
  ...EventInit,
  wasClean?: boolean,
  code?: number,
  reason?: string,
}>;

export default class CloseEvent extends Event {
  _wasClean: boolean;
  _code: number;
  _reason: string;

  constructor(type: string, options?: ?CloseEventInit) {
    const {wasClean, code, reason, ...eventOptions} = options ?? {};
    super(type, eventOptions);

    this._wasClean = Boolean(wasClean);
    this._code = Number(code) || 0;
    this._reason = reason != null ? String(reason) : '';
  }

  get wasClean(): boolean {
    return this._wasClean;
  }

  get code(): number {
    return this._code;
  }

  get reason(): string {
    return this._reason;
  }
}
