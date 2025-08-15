/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export opaque type IdleCallbackID = mixed;

export type RequestIdleCallbackOptions = {
  timeout?: number,
};

export type IdleDeadline = {
  didTimeout: boolean,
  timeRemaining: () => mixed,
};

export interface Spec extends TurboModule {
  +requestIdleCallback: (
    callback: (idleDeadline: IdleDeadline) => mixed,
    options?: RequestIdleCallbackOptions,
  ) => IdleCallbackID;
  +cancelIdleCallback: (handle: IdleCallbackID) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'NativeIdleCallbacksCxx',
): Spec);
