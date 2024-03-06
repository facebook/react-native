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
import type {MessageFromDevice, MessageToDevice, Page} from './types';
import type WS from 'ws';

type ExposedDeviceInfo = $ReadOnly<{
  appId: string,
  id: string,
  name: string,
  socket: WS,
}>;

type ExposedDebuggerInfo = $ReadOnly<{
  socket: $ElementType<DebuggerInfo, 'socket'>,
  userAgent: $ElementType<DebuggerInfo, 'userAgent'>,
}>;

export type CreateDeviceMessageMiddlewareFn = (connection: {
  page: Page,
  deviceInfo: ExposedDeviceInfo,
  debuggerInfo: ExposedDebuggerInfo,
}) => ?DeviceMessageMiddleware;

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
  handleDeviceMessage(message: MessageFromDevice): true | void;

  /**
   * Handle a CDP message coming from the debugger.
   * This is invoked before the message is sent to the device.
   * When reeturning true, the message is considered handled and will not be sent to the device.
   */
  handleDebuggerMessage(message: MessageToDevice): true | void;
}

export function createMiddlewareDebuggerInfo(
  debuggerInfo: DebuggerInfo,
): ExposedDebuggerInfo {
  return {
    socket: debuggerInfo.socket,
    userAgent: debuggerInfo.userAgent,
  };
}
