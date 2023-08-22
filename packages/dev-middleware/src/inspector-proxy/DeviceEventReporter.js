/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventReporter} from '../types/EventReporter';
import TTLCache from '@isaacs/ttlcache';

type PendingCommand = {
  method: string,
  requestOrigin: 'proxy' | 'debugger',
  requestTime: number,
};

class DeviceEventReporter {
  _eventReporter: EventReporter;

  _pendingCommands: TTLCache<number, PendingCommand> = new TTLCache({
    ttl: 10000,
    dispose: (
      command: PendingCommand,
      id: number,
      reason: 'evict' | 'set' | 'delete' | 'stale',
    ) => {
      if (reason === 'delete' || reason === 'set') {
        // TODO: Report clobbering ('set') using a dedicated error code
        return;
      }
      this._logExpiredCommand(command);
    },
  });

  constructor(eventReporter: EventReporter) {
    this._eventReporter = eventReporter;
  }

  logRequest(
    req: $ReadOnly<{id: number, method: string, ...}>,
    origin: 'debugger' | 'proxy',
  ): void {
    this._pendingCommands.set(req.id, {
      method: req.method,
      requestOrigin: origin,
      requestTime: Date.now(),
    });
  }

  logResponse(
    res: $ReadOnly<{
      id: number,
      error?: {message: string, data?: mixed},
      ...
    }>,
    origin: 'device' | 'proxy',
  ): void {
    const pendingCommand = this._pendingCommands.get(res.id);
    if (!pendingCommand) {
      this._eventReporter.logEvent({
        type: 'debugger_command',
        protocol: 'CDP',
        requestOrigin: null,
        method: null,
        status: 'coded_error',
        errorCode: 'UNMATCHED_REQUEST_ID',
        responseOrigin: 'proxy',
        timeSinceStart: null,
      });
      return;
    }
    const timeSinceStart = Date.now() - pendingCommand.requestTime;
    this._pendingCommands.delete(res.id);
    if (res.error) {
      let {message} = res.error;
      if ('data' in res.error) {
        message += ` (${String(res.error.data)})`;
      }
      this._eventReporter.logEvent({
        type: 'debugger_command',
        requestOrigin: pendingCommand.requestOrigin,
        method: pendingCommand.method,
        protocol: 'CDP',
        status: 'coded_error',
        errorCode: 'PROTOCOL_ERROR',
        errorDetails: message,
        responseOrigin: origin,
        timeSinceStart,
      });
      return;
    }
    this._eventReporter.logEvent({
      type: 'debugger_command',
      protocol: 'CDP',
      requestOrigin: pendingCommand.requestOrigin,
      method: pendingCommand.method,
      status: 'success',
      responseOrigin: origin,
      timeSinceStart,
    });
  }

  logConnection(connectedEntity: 'debugger') {
    this._eventReporter?.logEvent({
      type: 'connect_debugger_frontend',
      status: 'success',
    });
  }

  logDisconnection(disconnectedEntity: 'device' | 'debugger') {
    const errorCode =
      disconnectedEntity === 'device'
        ? 'DEVICE_DISCONNECTED'
        : 'DEBUGGER_DISCONNECTED';
    for (const pendingCommand of this._pendingCommands.values()) {
      this._eventReporter.logEvent({
        type: 'debugger_command',
        protocol: 'CDP',
        requestOrigin: pendingCommand.requestOrigin,
        method: pendingCommand.method,
        status: 'coded_error',
        errorCode,
        responseOrigin: 'proxy',
        timeSinceStart: Date.now() - pendingCommand.requestTime,
      });
    }
    this._pendingCommands.clear();
  }

  _logExpiredCommand(pendingCommand: PendingCommand): void {
    this._eventReporter.logEvent({
      type: 'debugger_command',
      protocol: 'CDP',
      requestOrigin: pendingCommand.requestOrigin,
      method: pendingCommand.method,
      status: 'coded_error',
      errorCode: 'TIMED_OUT',
      responseOrigin: 'proxy',
      timeSinceStart: Date.now() - pendingCommand.requestTime,
    });
  }
}

export default DeviceEventReporter;
