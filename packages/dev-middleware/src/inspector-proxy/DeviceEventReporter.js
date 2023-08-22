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
  metadata: RequestMetadata,
};

type DeviceMetadata = $ReadOnly<{
  appId: string,
  deviceId: string,
  deviceName: string,
}>;

type RequestMetadata = $ReadOnly<{
  pageId: string | null,
  frontendUserAgent: string | null,
}>;

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

  _metadata: DeviceMetadata;

  constructor(eventReporter: EventReporter, metadata: DeviceMetadata) {
    this._eventReporter = eventReporter;
    this._metadata = metadata;
  }

  logRequest(
    req: $ReadOnly<{id: number, method: string, ...}>,
    origin: 'debugger' | 'proxy',
    metadata: RequestMetadata,
  ): void {
    this._pendingCommands.set(req.id, {
      method: req.method,
      requestOrigin: origin,
      requestTime: Date.now(),
      metadata,
    });
  }

  logResponse(
    res: $ReadOnly<{
      id: number,
      error?: {message: string, data?: mixed},
      ...
    }>,
    origin: 'device' | 'proxy',
    metadata: $ReadOnly<{
      pageId: string | null,
      frontendUserAgent: string | null,
    }>,
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
        appId: this._metadata.appId,
        deviceId: this._metadata.deviceId,
        deviceName: this._metadata.deviceName,
        pageId: metadata.pageId,
        frontendUserAgent: metadata.frontendUserAgent,
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
        appId: this._metadata.appId,
        deviceId: this._metadata.deviceId,
        deviceName: this._metadata.deviceName,
        pageId: pendingCommand.metadata.pageId,
        frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
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
      appId: this._metadata.appId,
      deviceId: this._metadata.deviceId,
      deviceName: this._metadata.deviceName,
      pageId: pendingCommand.metadata.pageId,
      frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
    });
  }

  logConnection(
    connectedEntity: 'debugger',
    metadata: $ReadOnly<{
      pageId: string,
      frontendUserAgent: string | null,
    }>,
  ) {
    this._eventReporter.logEvent({
      type: 'connect_debugger_frontend',
      status: 'success',
      appId: this._metadata.appId,
      deviceName: this._metadata.deviceName,
      deviceId: this._metadata.deviceId,
      pageId: metadata.pageId,
      frontendUserAgent: metadata.frontendUserAgent,
    });
  }

  logDisconnection(disconnectedEntity: 'device' | 'debugger') {
    const eventReporter = this._eventReporter;
    if (!eventReporter) {
      return;
    }
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
        appId: this._metadata.appId,
        deviceId: this._metadata.deviceId,
        deviceName: this._metadata.deviceName,
        pageId: pendingCommand.metadata.pageId,
        frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
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
      appId: this._metadata.appId,
      deviceId: this._metadata.deviceId,
      deviceName: this._metadata.deviceName,
      pageId: pendingCommand.metadata.pageId,
      frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
    });
  }
}

export default DeviceEventReporter;
