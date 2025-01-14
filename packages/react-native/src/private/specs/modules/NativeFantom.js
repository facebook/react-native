/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

// match RenderFormatOptions.h
export type RenderFormatOptions = {
  includeRoot: boolean,
  includeLayoutMetrics: boolean,
};

interface Spec extends TurboModule {
  startSurface: (
    surfaceId: number,
    viewportWidth: number,
    viewportHeight: number,
    devicePixelRatio: number,
  ) => void;
  stopSurface: (surfaceId: number) => void;
  getMountingManagerLogs: (surfaceId: number) => Array<string>;
  flushMessageQueue: () => void;
  getRenderedOutput: (surfaceId: number, config: RenderFormatOptions) => string;
  reportTestSuiteResultsJSON: (results: string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeFantomCxx',
) as Spec;
