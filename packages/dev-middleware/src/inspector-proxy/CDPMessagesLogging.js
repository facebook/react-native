/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import type {Timeout} from 'timers';

// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import {setTimeout} from 'timers';
import util from 'util';

const debug = require('debug')('Metro:InspectorProxy');
const debugCDPMessages = require('debug')('Metro:InspectorProxyCDPMessages');

const CDP_MESSAGES_BATCH_DEBUGGING_THROTTLE_MS = 5000;

export type CDPMessageDestination =
  | 'DebuggerToProxy'
  | 'ProxyToDebugger'
  | 'DeviceToProxy'
  | 'ProxyToDevice';

function getCDPLogPrefix(destination: CDPMessageDestination): string {
  return util.format(
    '[(Debugger) %s (Proxy) %s (Device)]',
    destination === 'DebuggerToProxy'
      ? '->'
      : destination === 'ProxyToDebugger'
        ? '<-'
        : '  ',
    destination === 'ProxyToDevice'
      ? '->'
      : destination === 'DeviceToProxy'
        ? '<-'
        : '  ',
  );
}

export default class CDPMessagesLogging {
  #cdpMessagesLoggingBatchingFn: {
    [CDPMessageDestination]: () => void,
  } = {
    DebuggerToProxy: () => {},
    ProxyToDebugger: () => {},
    DeviceToProxy: () => {},
    ProxyToDevice: () => {},
  };

  constructor() {
    if (debug.enabled) {
      this.#initializeThrottledCDPMessageLogging();
    }
  }

  #initializeThrottledCDPMessageLogging(): void {
    const batchingCounters: {[CDPMessageDestination]: number} = {
      DebuggerToProxy: 0,
      ProxyToDebugger: 0,
      DeviceToProxy: 0,
      ProxyToDevice: 0,
    };

    Object.keys(batchingCounters).forEach(destination => {
      let timeout: Timeout | null = null;

      this.#cdpMessagesLoggingBatchingFn[destination] = () => {
        if (timeout == null) {
          timeout = setTimeout<$ReadOnlyArray<CDPMessageDestination>>(() => {
            debug(
              '%s %s CDP messages %s in the last %ss.',
              getCDPLogPrefix(destination),
              String(batchingCounters[destination]).padStart(5),
              destination.startsWith('Proxy') ? '  sent  ' : 'received',
              CDP_MESSAGES_BATCH_DEBUGGING_THROTTLE_MS / 1000,
            );
            batchingCounters[destination] = 0;
            timeout = null;
          }, CDP_MESSAGES_BATCH_DEBUGGING_THROTTLE_MS).unref();
        }
        batchingCounters[destination]++;
      };
    });
  }

  log(destination: CDPMessageDestination, message: string) {
    if (debugCDPMessages.enabled) {
      debugCDPMessages('%s message: %s', getCDPLogPrefix(destination), message);
    }
    if (debug.enabled) {
      this.#cdpMessagesLoggingBatchingFn[destination]();
    }
  }
}
