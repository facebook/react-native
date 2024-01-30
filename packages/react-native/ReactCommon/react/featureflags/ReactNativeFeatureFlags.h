/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ea6c88fb2c3fcaa35b5886b8f8ceb769>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>

namespace facebook::react {

/**
 * This class provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe if you handle `override` correctly.
 */
class ReactNativeFeatureFlags {
 public:
  /**
   * Common flag for testing. Do NOT modify.
   */
  static bool commonTestFlag();

  /**
   * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
   */
  static bool useModernRuntimeScheduler();

  /**
   * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
   */
  static bool enableMicrotasks();

  /**
   * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
   */
  static bool batchRenderingUpdatesInEventLoop();

  /**
   * Uses new, deduplicated logic for constructing Android Spannables from text fragments
   */
  static bool enableSpannableBuildingUnification();

  /**
   * Overrides the feature flags with the ones provided by the given provider
   * (generally one that extends `ReactNativeFeatureFlagsDefaults`).
   *
   * This method must be called before you initialize the React Native runtime.
   *
   * @example
   *
   * ```
   * class MyReactNativeFeatureFlags : public ReactNativeFeatureFlagsDefaults {
   *  public:
   *   bool someFlag() override;
   * };
   *
   * ReactNativeFeatureFlags.override(
   *     std::make_unique<MyReactNativeFeatureFlags>());
   * ```
   */
  static void override(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

  /**
   * Removes the overridden feature flags and makes the API return default
   * values again.
   *
   * This is **dangerous**. Use it only if you really understand the
   * implications of this method.
   *
   * This should only be called if you destroy the React Native runtime and
   * need to create a new one with different overrides. In that case,
   * call `dangerouslyReset` after destroying the runtime and `override` again
   * before initializing the new one.
   */
  static void dangerouslyReset();

 private:
  ReactNativeFeatureFlags() = delete;
  static ReactNativeFeatureFlagsAccessor& getAccessor(bool reset = false);
};

} // namespace facebook::react
