/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type FeatureFlags = {|
  /**
   * Function used to enable / disable W3C pointer event emitting in React Native.
   * If enabled you must also flip the equivalent native flags on each platform:
   * iOS -> RCTSetDispatchW3CPointerEvents
   * Android -> ReactFeatureFlags.dispatchPointerEvents
   */
  shouldEmitW3CPointerEvents: () => boolean,
  /**
   * Function used to enable / disable Pressibility from using W3C Pointer Events
   * for its hover callbacks
   */
  shouldPressibilityUseW3CPointerEventsForHover: () => boolean,
|};

const ReactNativeFeatureFlags: FeatureFlags = {
  shouldEmitW3CPointerEvents: () => false,
  shouldPressibilityUseW3CPointerEventsForHover: () => false,
};

module.exports = ReactNativeFeatureFlags;
