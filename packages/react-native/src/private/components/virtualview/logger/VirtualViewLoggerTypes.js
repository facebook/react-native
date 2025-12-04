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

import type {ModeChangeEvent} from '../../../../..';

export interface IVirtualViewLogFunctions {
  logMount: () => void;
  logModeChange: (event: ModeChangeEvent) => void;
  logUnmount: () => void;
}
export interface IVirtualViewLogger {
  getVirtualViewLoggingCallbacks(
    initiallyHidden: boolean,
    nativeID?: string,
  ): IVirtualViewLogFunctions;
}
