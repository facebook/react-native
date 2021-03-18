/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type PressabilityTouchSignal =
  | 'DELAY'
  | 'RESPONDER_GRANT'
  | 'RESPONDER_RELEASE'
  | 'RESPONDER_TERMINATED'
  | 'ENTER_PRESS_RECT'
  | 'LEAVE_PRESS_RECT'
  | 'LONG_PRESS_DETECTED';
