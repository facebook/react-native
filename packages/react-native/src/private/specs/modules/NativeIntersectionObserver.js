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

export type NativeIntersectionObserverEntry = {
  intersectionObserverId: number,
  targetInstanceHandle: mixed,
  targetRect: $ReadOnlyArray<number>, // It's actually a tuple with x, y, width and height
  rootRect: $ReadOnlyArray<number>, // It's actually a tuple with x, y, width and height
  intersectionRect: ?$ReadOnlyArray<number>, // It's actually a tuple with x, y, width and height
  isIntersectingAboveThresholds: boolean,
  time: number,
};

export type NativeIntersectionObserverObserveOptions = {
  intersectionObserverId: number,
  targetShadowNode: mixed,
  thresholds: $ReadOnlyArray<number>,
};

export interface Spec extends TurboModule {
  +observe: (options: NativeIntersectionObserverObserveOptions) => void;
  +unobserve: (intersectionObserverId: number, targetShadowNode: mixed) => void;
  +connect: (notifyIntersectionObserversCallback: () => void) => void;
  +disconnect: () => void;
  +takeRecords: () => $ReadOnlyArray<NativeIntersectionObserverEntry>;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativeIntersectionObserverCxx',
): ?Spec);
