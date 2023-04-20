/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {EventSender} from './InspectorAgent';

interface Agent {
  constructor(eventSender: EventSender): void;
}

// Flow doesn't support static declarations in interface
type AgentClass = Class<Agent> & {DOMAIN: string, ...};

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
