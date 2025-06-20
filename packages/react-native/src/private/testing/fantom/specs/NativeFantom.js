/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  RootTag,
  TurboModule,
} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

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

  /*
   * Priority for events that can be processed in idle times or in the
   * background.
   */
  Idle = 5,
}

export type ScrollOptions = {
  x: number,
  y: number,
  zoomScale?: number,
};

interface Spec extends TurboModule {
  startSurface: (
    viewportWidth: number,
    viewportHeight: number,
    devicePixelRatio: number,
    viewportOffsetX?: number,
    viewportOffsetY?: number,
  ) => RootTag;
  stopSurface: (surfaceId: RootTag) => void;
  enqueueNativeEvent: (
    shadowNode: mixed /* ShadowNode */,
    type: string,
    payload?: mixed,
    category?: NativeEventCategory,
    isUnique?: boolean,
  ) => void;
  enqueueScrollEvent: (
    shadowNode: mixed /* ShadowNode */,
    options: ScrollOptions,
  ) => void;
  enqueueModalSizeUpdate: (
    shadowNode: mixed /* ShadowNode */,
    height: number,
    width: number,
  ) => void;
  takeMountingManagerLogs: (surfaceId: RootTag) => Array<string>;
  getDirectManipulationProps: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnly<{
    [string]: mixed,
  }>;
  flushMessageQueue: () => void;
  flushEventQueue: () => void;
  produceFramesForDuration: (miliseconds: number) => void;
  validateEmptyMessageQueue: () => void;
  getRenderedOutput: (
    surfaceId: RootTag,
    config: RenderFormatOptions,
  ) => string;
  reportTestSuiteResultsJSON: (results: string) => void;
  createShadowNodeReferenceCounter(
    shadowNode: mixed /* ShadowNode */,
  ): () => number;
  createShadowNodeRevisionGetter(
    shadowNode: mixed /* ShadowNode */,
  ): () => ?number;
  saveJSMemoryHeapSnapshot: (filePath: string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeFantomCxx',
) as Spec;
