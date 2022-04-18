/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

export type FeatureFlags = {|
  /**
   * Function used to enable / disabled Layout Animations in React Native.
   * Default value = true.
   */
  isLayoutAnimationEnabled: () => boolean,
  /**
   * Function used to enable / disable W3C pointer event emitting in React Native.
   * If enabled you must also flip the equivalent native flags on each platform:
   * iOS -> RCTSetDispatchW3CPointerEvents
   * Android -> ReactFeatureFlags.dispatchPointerEvents
   */
  shouldEmitW3CPointerEvents: () => boolean,
|};

const ReactNativeFeatureFlags: FeatureFlags = {
  isLayoutAnimationEnabled: () => true,
  shouldEmitW3CPointerEvents: () => false,
};

module.exports = ReactNativeFeatureFlags;
