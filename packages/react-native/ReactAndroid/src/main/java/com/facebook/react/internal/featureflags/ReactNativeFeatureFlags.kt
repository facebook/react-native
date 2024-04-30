/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b86e9fd5499308ce65b389342eb436a2>>
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

package com.facebook.react.internal.featureflags

/**
 * This object provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe if you handle `override` correctly.
 */
public object ReactNativeFeatureFlags {
  private var accessorProvider: () -> ReactNativeFeatureFlagsAccessor = { ReactNativeFeatureFlagsCxxAccessor() }
  private var accessor: ReactNativeFeatureFlagsAccessor = accessorProvider()

  /**
   * Common flag for testing. Do NOT modify.
   */
  @JvmStatic
  public fun commonTestFlag(): Boolean = accessor.commonTestFlag()

  /**
   * To be used with batchRenderingUpdatesInEventLoop. When enbled, the Android mounting layer will concatenate pending transactions to ensure they're applied atomatically
   */
  @JvmStatic
  public fun androidEnablePendingFabricTransactions(): Boolean = accessor.androidEnablePendingFabricTransactions()

  /**
   * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
   */
  @JvmStatic
  public fun batchRenderingUpdatesInEventLoop(): Boolean = accessor.batchRenderingUpdatesInEventLoop()

  /**
   * When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().
   */
  @JvmStatic
  public fun destroyFabricSurfacesInReactInstanceManager(): Boolean = accessor.destroyFabricSurfacesInReactInstanceManager()

  /**
   * Enables the use of a background executor to compute layout and commit updates on Fabric (this system is deprecated and should not be used).
   */
  @JvmStatic
  public fun enableBackgroundExecutor(): Boolean = accessor.enableBackgroundExecutor()

  /**
   * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
   */
  @JvmStatic
  public fun useModernRuntimeScheduler(): Boolean = accessor.useModernRuntimeScheduler()

  /**
   * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
   */
  @JvmStatic
  public fun enableMicrotasks(): Boolean = accessor.enableMicrotasks()

  /**
   * Uses new, deduplicated logic for constructing Android Spannables from text fragments
   */
  @JvmStatic
  public fun enableSpannableBuildingUnification(): Boolean = accessor.enableSpannableBuildingUnification()

  /**
   * When enabled, Fabric will use customDrawOrder in ReactViewGroup (similar to old architecture).
   */
  @JvmStatic
  public fun enableCustomDrawOrderFabric(): Boolean = accessor.enableCustomDrawOrderFabric()

  /**
   * Attempt at fixing a crash related to subview clipping on Android. This is a kill switch for the fix
   */
  @JvmStatic
  public fun enableFixForClippedSubviewsCrash(): Boolean = accessor.enableFixForClippedSubviewsCrash()

  /**
   * Flag determining if the C++ implementation of InspectorPackagerConnection should be used instead of the per-platform one. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun inspectorEnableCxxInspectorPackagerConnection(): Boolean = accessor.inspectorEnableCxxInspectorPackagerConnection()

  /**
   * Flag determining if the modern CDP backend should be enabled. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun inspectorEnableModernCDPRegistry(): Boolean = accessor.inspectorEnableModernCDPRegistry()

  /**
   * Overrides the feature flags with the ones provided by the given provider
   * (generally one that extends `ReactNativeFeatureFlagsDefaults`).
   *
   * This method must be called before you initialize the React Native runtime.
   *
   * @example
   *
   * ```
   * ReactNativeFeatureFlags.override(object : ReactNativeFeatureFlagsDefaults() {
   *   override fun someFlag(): Boolean = true // or a dynamic value
   * })
   * ```
   */
  @JvmStatic
  public fun override(provider: ReactNativeFeatureFlagsProvider): Unit = accessor.override(provider)

  /**
   * Removes the overridden feature flags and makes the API return default
   * values again.
   *
   * This should only be called if you destroy the React Native runtime and
   * need to create a new one with different overrides. In that case,
   * call `dangerouslyReset` after destroying the runtime and `override`
   * again before initializing the new one.
   */
  @JvmStatic
  public fun dangerouslyReset() {
    // This is necessary when the accessor interops with C++ and we need to
    // remove the overrides set there.
    accessor.dangerouslyReset()

    // This discards the cached values and the overrides set in the JVM.
    accessor = accessorProvider()
  }

  /**
   * This is just used to replace the default ReactNativeFeatureFlagsCxxAccessor
   * that uses JNI with a version that doesn't, to simplify testing.
   */
  internal fun setAccessorProvider(newAccessorProvider: () -> ReactNativeFeatureFlagsAccessor) {
    accessorProvider = newAccessorProvider
    accessor = accessorProvider()
  }
}
