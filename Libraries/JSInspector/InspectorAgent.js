/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

export type EventSender = (name: string, params: mixed) => void;

class InspectorAgent {
  _eventSender: EventSender;

  constructor(eventSender: EventSender) {
    this._eventSender = eventSender;
  }

  sendEvent(name: string, params: mixed) {
    this._eventSender(name, params);
  }
}

module.exports = InspectorAgent;
