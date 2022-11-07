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
   * This feature flag enables an experimental render system that allows
   * to render react components driven by classes written in C++.
   */
  enableCppRenderSystem: () => boolean,

  removeListenersOnDetach: () => boolean,
|};

const ReactNativeFeatureFlags: FeatureFlags = {
  isLayoutAnimationEnabled: () => true,
  shouldEmitW3CPointerEvents: () => false,
  shouldPressibilityUseW3CPointerEventsForHover: () => false,
  animatedShouldDebounceQueueFlush: () => false,
  animatedShouldUseSingleOp: () => false,
  enableCppRenderSystem: () => false,
  removeListenersOnDetach: () => false,
};

module.exports = ReactNativeFeatureFlags;
