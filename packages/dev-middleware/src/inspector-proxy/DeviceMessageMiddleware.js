/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type DeviceInfo = $ReadOnly<{}>; // TODO

export type createDeviceMessageMiddleware = (
  info: DeviceInfo,
) => DeviceMessageMiddleware;

/**
 * The device message middleware allows implementers to handle unsupported CDP messages.
 * It is instantiated per device and may contain state that is specific to that device.
 * The middleware can also mark messages from the device or debugger as handled, which stops propagating.
 */
export interface DeviceMessageMiddleware {
  onDeviceMessage(): void; // TODO
  onDebuggerMessage(): void; // TODO
}
