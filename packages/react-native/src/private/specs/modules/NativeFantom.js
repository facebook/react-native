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

// match RawEvent.h
export enum NativeEventCategory {
  /*
   * Start of a continuous event. To be used with touchStart.
   */
  ContinuousStart = 0,

  /*
   * End of a continuous event. To be used with touchEnd.
   */
  ContinuousEnd = 1,

  /*
   * Priority for this event will be determined from other events in the
   * queue. If it is triggered by continuous event, its priority will be
   * default. If it is not triggered by continuous event, its priority will be
   * discrete.
   */
  Unspecified = 2,

  /*
   * Forces discrete type for the event. Regardless if continuous event is
   * ongoing.
   */
  Discrete = 3,

  /*
   * Forces continuous type for the event. Regardless if continuous event
   * isn't ongoing.
   */
  Continuous = 4,
}

export type ScrollOptions = {
  x: number,
  y: number,
  zoomScale?: number,
};

interface Spec extends TurboModule {
  startSurface: (
    surfaceId: number,
    viewportWidth: number,
    viewportHeight: number,
    devicePixelRatio: number,
  ) => void;
  stopSurface: (surfaceId: number) => void;
  dispatchNativeEvent: (
    shadowNode: mixed /* ShadowNode */,
    type: string,
    payload?: mixed,
    category?: NativeEventCategory,
    isUnique?: boolean,
  ) => void;
  scrollTo: (
    shadowNode: mixed /* ShadowNode */,
    options: ScrollOptions,
  ) => void;
  getMountingManagerLogs: (surfaceId: number) => Array<string>;
  flushMessageQueue: () => void;
  flushEventQueue: () => void;
  getRenderedOutput: (surfaceId: number, config: RenderFormatOptions) => string;
  reportTestSuiteResultsJSON: (results: string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeFantomCxx',
) as Spec;
