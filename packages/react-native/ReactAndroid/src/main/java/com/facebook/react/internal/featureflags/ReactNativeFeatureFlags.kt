/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<177f05d7b2fadcfffa32cb5a7a21c76b>>
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
   * Enables the differentiator to understand the "collapsableChildren" prop
   */
  @JvmStatic
  public fun allowCollapsableChildren(): Boolean = accessor.allowCollapsableChildren()

  /**
   * Adds support for recursively processing commits that mount synchronously (Android only).
   */
  @JvmStatic
  public fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean = accessor.allowRecursiveCommitsWithSynchronousMountOnAndroid()

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
   * Clean yoga node when <TextInput /> does not change.
   */
  @JvmStatic
  public fun enableCleanTextInputYogaNode(): Boolean = accessor.enableCleanTextInputYogaNode()

  /**
   * When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.
   */
  @JvmStatic
  public fun enableGranularShadowTreeStateReconciliation(): Boolean = accessor.enableGranularShadowTreeStateReconciliation()

  /**
   * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
   */
  @JvmStatic
  public fun enableMicrotasks(): Boolean = accessor.enableMicrotasks()

  /**
   * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
   */
  @JvmStatic
  public fun enableSynchronousStateUpdates(): Boolean = accessor.enableSynchronousStateUpdates()

  /**
   * Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).
   */
  @JvmStatic
  public fun enableUIConsistency(): Boolean = accessor.enableUIConsistency()

  /**
   * Fixes a leak in SurfaceMountingManager.mRemoveDeleteTreeUIFrameCallback
   */
  @JvmStatic
  public fun fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(): Boolean = accessor.fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak()

  /**
   * Forces the mounting layer on Android to always batch mount items instead of dispatching them immediately. This might fix some crashes related to synchronous state updates, where some views dispatch state updates during mount.
   */
  @JvmStatic
  public fun forceBatchingMountItemsOnAndroid(): Boolean = accessor.forceBatchingMountItemsOnAndroid()

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun fuseboxEnabledDebug(): Boolean = accessor.fuseboxEnabledDebug()

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun fuseboxEnabledRelease(): Boolean = accessor.fuseboxEnabledRelease()

  /**
   * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
   */
  @JvmStatic
  public fun lazyAnimationCallbacks(): Boolean = accessor.lazyAnimationCallbacks()

  /**
   * When enabled, ParagraphShadowNode will no longer call measure twice.
   */
  @JvmStatic
  public fun preventDoubleTextMeasure(): Boolean = accessor.preventDoubleTextMeasure()

  /**
   * Propagate layout direction to Android views.
   */
  @JvmStatic
  public fun setAndroidLayoutDirection(): Boolean = accessor.setAndroidLayoutDirection()

  /**
   * Invoke callbacks immediately on the ReactInstance rather than going through a background thread for synchronization
   */
  @JvmStatic
  public fun useImmediateExecutorInAndroidBridgeless(): Boolean = accessor.useImmediateExecutorInAndroidBridgeless()

  /**
   * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
   */
  @JvmStatic
  public fun useModernRuntimeScheduler(): Boolean = accessor.useModernRuntimeScheduler()

  /**
   * When enabled, the native view configs are used in bridgeless mode.
   */
  @JvmStatic
  public fun useNativeViewConfigsInBridgelessMode(): Boolean = accessor.useNativeViewConfigsInBridgelessMode()

  /**
   * When enabled, cloning shadow nodes within react native will update the reference held by the current JS fiber tree.
   */
  @JvmStatic
  public fun useRuntimeShadowNodeReferenceUpdate(): Boolean = accessor.useRuntimeShadowNodeReferenceUpdate()

  /**
   * When enabled, cloning shadow nodes during layout will update the reference held by the current JS fiber tree.
   */
  @JvmStatic
  public fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean = accessor.useRuntimeShadowNodeReferenceUpdateOnLayout()

  /**
   * When enabled, it uses optimised state reconciliation algorithm.
   */
  @JvmStatic
  public fun useStateAlignmentMechanism(): Boolean = accessor.useStateAlignmentMechanism()

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
