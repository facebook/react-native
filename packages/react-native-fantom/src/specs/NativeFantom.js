/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import {TurboModuleRegistry} from 'react-native';

// match RenderFormatOptions.h
export type RenderFormatOptions = {
  includeRoot: boolean,
  includeLayoutMetrics: boolean,
};

interface Spec extends TurboModule {
  startSurface: (surfaceId: number) => void;
  stopSurface: (surfaceId: number) => void;
  getMountingManagerLogs: (surfaceId: number) => Array<string>;
  flushMessageQueue: () => void;
  getRenderedOutput: (surfaceId: number, config: RenderFormatOptions) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeFantomCxx',
) as Spec;
