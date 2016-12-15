/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSInspector
 * @flow
 */
'use strict';

import type EventSender from 'InspectorAgent';

interface Agent {
  constructor(eventSender: EventSender): void
}

// Flow doesn't support static declarations in interface
type AgentClass = Class<Agent> & { DOMAIN: string };

declare function __registerInspectorAgent(type: AgentClass): void;
declare function __inspectorTimestamp(): number;

const JSInspector = {
  registerAgent(type: AgentClass) {
    if (global.__registerInspectorAgent) {
      global.__registerInspectorAgent(type);
    }
  },
  getTimestamp(): number {
    return global.__inspectorTimestamp();
  },
};

module.exports = JSInspector;
