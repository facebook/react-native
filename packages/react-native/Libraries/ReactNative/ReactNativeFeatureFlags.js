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
  /**
   * Function used to enable / disable Pressibility from using W3C Pointer Events
   * for its hover callbacks
   */
  shouldPressibilityUseW3CPointerEventsForHover: () => boolean,
  /**
   * Enables an experimental flush-queue debouncing in Animated.js.
   */
  animatedShouldDebounceQueueFlush: () => boolean,
  /**
   * Enables an experimental mega-operation for Animated.js that replaces
   * many calls to native with a single call into native, to reduce JSI/JNI
   * traffic.
   */
  animatedShouldUseSingleOp: () => boolean,
  /**
   * Enables GlobalPerformanceLogger replacement with a WebPerformance API based
   * implementation
   */
  isGlobalWebPerformanceLoggerEnabled: () => boolean,
  /**
   * Enables access to the host tree in Fabric using DOM-compatible APIs.
   */
  enableAccessToHostTreeInFabric: () => boolean,
|};

const ReactNativeFeatureFlags: FeatureFlags = {
  isLayoutAnimationEnabled: () => true,
  shouldEmitW3CPointerEvents: () => false,
  shouldPressibilityUseW3CPointerEventsForHover: () => false,
  animatedShouldDebounceQueueFlush: () => false,
  animatedShouldUseSingleOp: () => false,
  isGlobalWebPerformanceLoggerEnabled: () => false,
  enableAccessToHostTreeInFabric: () => false,
};

module.exports = ReactNativeFeatureFlags;
