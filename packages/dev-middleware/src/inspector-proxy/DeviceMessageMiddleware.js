/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DebuggerInfo} from './Device';
import type {
  MessageFromDevice,
  MessageToDevice,
  Page,
  TargetCapabilityFlags,
} from './types';
import type WS from 'ws';

type ExposedDeviceInfo = $ReadOnly<{
  deviceId: string,
  deviceName: string,
  deviceSocket: WS,
  appId: string,
  pageHasCapability: (
    page: Page,
    capability: $Keys<TargetCapabilityFlags>,
  ) => boolean,
}>;

type ExposedDebuggerInfo = $ReadOnly<{
  debuggerSocket: $ElementType<DebuggerInfo, 'socket'>,
  debuggerUserAgent: $ElementType<DebuggerInfo, 'userAgent'>,
  prependedFilePrefix: $ElementType<DebuggerInfo, 'prependedFilePrefix'>,
  originalSourceURLAddress: $ElementType<
    DebuggerInfo,
    'originalSourceURLAddress',
  >,
}>;

export type createDeviceMessageMiddleware = (
  deviceInfo: ExposedDeviceInfo,
) => DeviceMessageMiddleware;

/**
 * The device message middleware allows implementers to handle unsupported CDP messages.
 * It is instantiated per device and may contain state that is specific to that device.
 * The middleware can also mark messages from the device or debugger as handled, which stops propagating.
 */
export interface DeviceMessageMiddleware {
  /**
   * Handle a CDP message coming from the device.
   * This is invoked before the message is sent to the debugger.
   * When returning true, the message is considered handled and will not be sent to the debugger.
   */
  handleDeviceMessage(
    message: MessageFromDevice,
    page: ?Page,
    debuggerInfo: ?ExposedDebuggerInfo,
  ): true | void;

  /**
   * Handle a CDP message coming from the debugger.
   * This is invoked before the message is sent to the device.
   * When reeturning true, the message is considered handled and will not be sent to the device.
   */
  handleDebuggerMessage(
    message: MessageToDevice,
    page: ?Page,
    debuggerInfo: ExposedDebuggerInfo,
  ): true | void;
}

export function createMiddlewareDebuggerInfo(
  debuggerInfo: DebuggerInfo,
): ExposedDebuggerInfo {
  return {
    debuggerSocket: debuggerInfo.socket,
    debuggerUserAgent: debuggerInfo.userAgent,
    prependedFilePrefix: debuggerInfo.prependedFilePrefix,
    originalSourceURLAddress: debuggerInfo.originalSourceURLAddress,
  };
}
