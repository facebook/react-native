/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

export type AccessibilityServiceInfo = $ReadOnly<{|
  id: string,
  packageNames?: string[],
  notificationTimeout: number,
  capabilities: string[],
  eventTypes: string[],
  feedbackType: string[],
  flags: string[],
|}>;
