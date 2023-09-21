/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';

import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export type PlatformConstantsIOS = {|
  isTesting: boolean,
  isDisableAnimations?: boolean,
  reactNativeVersion: {|
    major: number,
    minor: number,
    patch: number,
    prerelease: ?number,
  |},
  forceTouchAvailable: boolean,
  osVersion: string,
  systemName: string,
  interfaceIdiom: string,
|};

export interface Spec extends TurboModule {
  +getConstants: () => PlatformConstantsIOS;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'PlatformConstants',
): Spec);
