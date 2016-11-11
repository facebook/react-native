/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InspectorAgent
 * @flow
 */
'use strict';

export type EventSender = (name: string, params: Object) => void;

class InspectorAgent {
  _eventSender: EventSender;

  constructor(eventSender: EventSender) {
    this._eventSender = eventSender;
  }

  sendEvent(name: string, params: Object) {
    this._eventSender(name, params);
  }
}

module.exports = InspectorAgent;
