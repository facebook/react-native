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

export type NativeIntersectionObserverEntry = {
  intersectionObserverId: number,
  targetInstanceHandle: mixed,
  targetRect: $ReadOnlyArray<number>, // It's actually a tuple with x, y, width and height
  rootRect: $ReadOnlyArray<number>, // It's actually a tuple with x, y, width and height
  // TODO(T209328432) - Remove optionality of intersectionRect when native changes are released
  intersectionRect: ?$ReadOnlyArray<number>, // It's actually a tuple with x, y, width and height
  isIntersectingAboveThresholds: boolean,
  time: number,
};

export type NativeIntersectionObserverObserveOptions = {
  intersectionObserverId: number,
  rootShadowNode?: ?mixed,
  targetShadowNode: mixed,
  thresholds: $ReadOnlyArray<number>,
  rootThresholds?: ?$ReadOnlyArray<number>,
};

export opaque type NativeIntersectionObserverToken = mixed;

export interface Spec extends TurboModule {
  // TODO(T223605846): Remove legacy observe method
  +observe: (options: NativeIntersectionObserverObserveOptions) => void;
  // TODO(T223605846): Remove legacy unobserve method
  +unobserve: (intersectionObserverId: number, targetShadowNode: mixed) => void;
  +observeV2?: (
    options: NativeIntersectionObserverObserveOptions,
  ) => NativeIntersectionObserverToken;
  +unobserveV2?: (
    intersectionObserverId: number,
    token: NativeIntersectionObserverToken,
  ) => void;
  +connect: (notifyIntersectionObserversCallback: () => void) => void;
  +disconnect: () => void;
  +takeRecords: () => $ReadOnlyArray<NativeIntersectionObserverEntry>;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativeIntersectionObserverCxx',
): ?Spec);
