/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<cbf10b0a7ed3d4892d53e5ae2319f4a8>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

/**
 * This class provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe (as long as the methods in the overridden
 * provider are).
 */
class ReactNativeFeatureFlags {
 public:
  /**
   * Common flag for testing. Do NOT modify.
   */
  RN_EXPORT static bool commonTestFlag();

  /**
   * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
   */
  RN_EXPORT static bool batchRenderingUpdatesInEventLoop();

  /**
   * Enables the use of a background executor to compute layout and commit updates on Fabric (this system is deprecated and should not be used).
   */
  RN_EXPORT static bool enableBackgroundExecutor();

  /**
   * When enabled, Fabric will use customDrawOrder in ReactViewGroup (similar to old architecture).
   */
  RN_EXPORT static bool enableCustomDrawOrderFabric();

  /**
   * Attempt at fixing a crash related to subview clipping on Android. This is a kill switch for the fix
   */
  RN_EXPORT static bool enableFixForClippedSubviewsCrash();

  /**
   * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
   */
  RN_EXPORT static bool enableMicrotasks();

  /**
   * Enables the notification of mount operations to mount hooks on Android.
   */
  RN_EXPORT static bool enableMountHooksAndroid();

  /**
   * Uses new, deduplicated logic for constructing Android Spannables from text fragments
   */
  RN_EXPORT static bool enableSpannableBuildingUnification();

  /**
   * Flag determining if the C++ implementation of InspectorPackagerConnection should be used instead of the per-platform one. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool inspectorEnableCxxInspectorPackagerConnection();

  /**
   * Flag determining if the modern CDP backend should be enabled. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool inspectorEnableModernCDPRegistry();

  /**
   * This is a temporary flag to disable part of the mount hooks pipeline to investigate a crash.
   */
  RN_EXPORT static bool skipMountHookNotifications();

  /**
   * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
   */
  RN_EXPORT static bool useModernRuntimeScheduler();

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
  RN_EXPORT static void override(
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
  RN_EXPORT static void dangerouslyReset();

 private:
  ReactNativeFeatureFlags() = delete;
  static ReactNativeFeatureFlagsAccessor& getAccessor(bool reset = false);
};

} // namespace facebook::react
