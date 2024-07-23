/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<4a2baeeff0b03f07a259028cf4446455>>
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
   * When enabled, insert of views on Android will be moved from the beginning of the IntBufferBatchMountItem to be after layout updates.
   */
  @JvmStatic
  public fun changeOrderOfMountingInstructionsOnAndroid(): Boolean = accessor.changeOrderOfMountingInstructionsOnAndroid()

  /**
   * Do not wait for a main-thread dispatch to complete init to start executing work on the JS thread on Android
   */
  @JvmStatic
  public fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean = accessor.completeReactInstanceCreationOnBgThreadOnAndroid()

  /**
   * When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().
   */
  @JvmStatic
  public fun destroyFabricSurfacesInReactInstanceManager(): Boolean = accessor.destroyFabricSurfacesInReactInstanceManager()

  /**
   * Kill-switch to turn off support for aling-items:baseline on Fabric iOS.
   */
  @JvmStatic
  public fun enableAlignItemsBaselineOnFabricIOS(): Boolean = accessor.enableAlignItemsBaselineOnFabricIOS()

  /**
   * Clean yoga node when <TextInput /> does not change.
   */
  @JvmStatic
  public fun enableCleanTextInputYogaNode(): Boolean = accessor.enableCleanTextInputYogaNode()

  /**
   * When the app is completely migrated to Fabric, set this flag to true to disable parts of Paper infrastructure that are not needed anymore but consume memory and CPU. Specifically, UIViewOperationQueue and EventDispatcherImpl will no longer work as they will not subscribe to ReactChoreographer for updates.
   */
  @JvmStatic
  public fun enableFabricRendererExclusively(): Boolean = accessor.enableFabricRendererExclusively()

  /**
   * When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.
   */
  @JvmStatic
  public fun enableGranularShadowTreeStateReconciliation(): Boolean = accessor.enableGranularShadowTreeStateReconciliation()

  /**
   * Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.
   */
  @JvmStatic
  public fun enableLongTaskAPI(): Boolean = accessor.enableLongTaskAPI()

  /**
   * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
   */
  @JvmStatic
  public fun enableMicrotasks(): Boolean = accessor.enableMicrotasks()

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  @JvmStatic
  public fun enablePropsUpdateReconciliationAndroid(): Boolean = accessor.enablePropsUpdateReconciliationAndroid()

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
   * When enabled, rawProps in Props will not include Yoga specific props.
   */
  @JvmStatic
  public fun excludeYogaFromRawProps(): Boolean = accessor.excludeYogaFromRawProps()

  /**
   * Start image fetching during view preallocation instead of waiting for layout pass
   */
  @JvmStatic
  public fun fetchImagesInViewPreallocation(): Boolean = accessor.fetchImagesInViewPreallocation()

  /**
   * When doing a smooth scroll animation, it stops setting the state with the final scroll position in Fabric before the animation starts.
   */
  @JvmStatic
  public fun fixIncorrectScrollViewStateUpdateOnAndroid(): Boolean = accessor.fixIncorrectScrollViewStateUpdateOnAndroid()

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  @JvmStatic
  public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = accessor.fixMappingOfEventPrioritiesBetweenFabricAndReact()

  /**
   * Enables a fix to prevent the possibility of state updates in Fabric being missed due to race conditions with previous state updates.
   */
  @JvmStatic
  public fun fixMissedFabricStateUpdatesOnAndroid(): Boolean = accessor.fixMissedFabricStateUpdatesOnAndroid()

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
   * Construct modules that requires eager init on the dedicate native modules thread
   */
  @JvmStatic
  public fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean = accessor.initEagerTurboModulesOnNativeModulesQueueAndroid()

  /**
   * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
   */
  @JvmStatic
  public fun lazyAnimationCallbacks(): Boolean = accessor.lazyAnimationCallbacks()

  /**
   * Adds support for loading vector drawable assets in the Image component (only on Android)
   */
  @JvmStatic
  public fun loadVectorDrawablesOnImages(): Boolean = accessor.loadVectorDrawablesOnImages()

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
   * Use shared background drawing code for ReactImageView instead of using Fresco to manipulate the bitmap
   */
  @JvmStatic
  public fun useNewReactImageViewBackgroundDrawing(): Boolean = accessor.useNewReactImageViewBackgroundDrawing()

  /**
   * Moves more of the work in view preallocation to the main thread to free up JS thread.
   */
  @JvmStatic
  public fun useOptimisedViewPreallocationOnAndroid(): Boolean = accessor.useOptimisedViewPreallocationOnAndroid()

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
