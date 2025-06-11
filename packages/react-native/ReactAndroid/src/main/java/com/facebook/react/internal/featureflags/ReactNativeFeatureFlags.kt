/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<fa641112b3a8888ba2b24cf8829e9382>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
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
   * Prevent FabricMountingManager from reordering mountitems, which may lead to invalid state on the UI thread
   */
  @JvmStatic
  public fun disableMountItemReorderingAndroid(): Boolean = accessor.disableMountItemReorderingAndroid()

  /**
   * When enabled, Andoid will accumulate updates in rawProps to reduce the number of mounting instructions for cascading rerenders.
   */
  @JvmStatic
  public fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean = accessor.enableAccumulatedUpdatesInRawPropsAndroid()

  /**
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer.
   */
  @JvmStatic
  public fun enableBridgelessArchitecture(): Boolean = accessor.enableBridgelessArchitecture()

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  @JvmStatic
  public fun enableCppPropsIteratorSetter(): Boolean = accessor.enableCppPropsIteratorSetter()

  /**
   * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
   */
  @JvmStatic
  public fun enableEagerRootViewAttachment(): Boolean = accessor.enableEagerRootViewAttachment()

  /**
   * This feature flag enables logs for Fabric.
   */
  @JvmStatic
  public fun enableFabricLogs(): Boolean = accessor.enableFabricLogs()

  /**
   * Enables the use of the Fabric renderer in the whole app.
   */
  @JvmStatic
  public fun enableFabricRenderer(): Boolean = accessor.enableFabricRenderer()

  /**
   * iOS Views will clip to their padding box vs border box
   */
  @JvmStatic
  public fun enableIOSViewClipToPaddingBox(): Boolean = accessor.enableIOSViewClipToPaddingBox()

  /**
   * When enabled, Andoid will build and initiate image prefetch requests on ImageShadowNode::layout
   */
  @JvmStatic
  public fun enableImagePrefetchingAndroid(): Boolean = accessor.enableImagePrefetchingAndroid()

  /**
   * Trigger JS runtime GC on memory pressure event on iOS
   */
  @JvmStatic
  public fun enableJSRuntimeGCOnMemoryPressureOnIOS(): Boolean = accessor.enableJSRuntimeGCOnMemoryPressureOnIOS()

  /**
   * When enabled, LayoutAnimations API will animate state changes on Android.
   */
  @JvmStatic
  public fun enableLayoutAnimationsOnAndroid(): Boolean = accessor.enableLayoutAnimationsOnAndroid()

  /**
   * When enabled, LayoutAnimations API will animate state changes on iOS.
   */
  @JvmStatic
  public fun enableLayoutAnimationsOnIOS(): Boolean = accessor.enableLayoutAnimationsOnIOS()

  /**
   * Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.
   */
  @JvmStatic
  public fun enableLongTaskAPI(): Boolean = accessor.enableLongTaskAPI()

  /**
   * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
   */
  @JvmStatic
  public fun enableNativeCSSParsing(): Boolean = accessor.enableNativeCSSParsing()

  /**
   * Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable
   */
  @JvmStatic
  public fun enableNewBackgroundAndBorderDrawables(): Boolean = accessor.enableNewBackgroundAndBorderDrawables()

  /**
   * Moves execution of pre-mount items to outside the choregrapher in the main thread, so we can estimate idle time more precisely (Android only).
   */
  @JvmStatic
  public fun enablePreciseSchedulingForPremountItemsOnAndroid(): Boolean = accessor.enablePreciseSchedulingForPremountItemsOnAndroid()

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  @JvmStatic
  public fun enablePropsUpdateReconciliationAndroid(): Boolean = accessor.enablePropsUpdateReconciliationAndroid()

  /**
   * Report paint time inside the Event Timing API implementation (PerformanceObserver).
   */
  @JvmStatic
  public fun enableReportEventPaintTime(): Boolean = accessor.enableReportEventPaintTime()

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
   * Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.
   */
  @JvmStatic
  public fun enableViewCulling(): Boolean = accessor.enableViewCulling()

  /**
   * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
   */
  @JvmStatic
  public fun enableViewRecycling(): Boolean = accessor.enableViewRecycling()

  /**
   * Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.
   */
  @JvmStatic
  public fun enableViewRecyclingForText(): Boolean = accessor.enableViewRecyclingForText()

  /**
   * Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.
   */
  @JvmStatic
  public fun enableViewRecyclingForView(): Boolean = accessor.enableViewRecyclingForView()

  /**
   * When enabled, rawProps in Props will not include Yoga specific props.
   */
  @JvmStatic
  public fun excludeYogaFromRawProps(): Boolean = accessor.excludeYogaFromRawProps()

  /**
   * Fixes a bug in Differentiator where parent views may be referenced before they're created
   */
  @JvmStatic
  public fun fixDifferentiatorEmittingUpdatesWithWrongParentTag(): Boolean = accessor.fixDifferentiatorEmittingUpdatesWithWrongParentTag()

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  @JvmStatic
  public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = accessor.fixMappingOfEventPrioritiesBetweenFabricAndReact()

  /**
   * Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.
   */
  @JvmStatic
  public fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean = accessor.fixMountingCoordinatorReportedPendingTransactionsOnAndroid()

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun fuseboxEnabledRelease(): Boolean = accessor.fuseboxEnabledRelease()

  /**
   * Enable network inspection support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun fuseboxNetworkInspectionEnabled(): Boolean = accessor.fuseboxNetworkInspectionEnabled()

  /**
   * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
   */
  @JvmStatic
  public fun lazyAnimationCallbacks(): Boolean = accessor.lazyAnimationCallbacks()

  /**
   * When enabled, mutex _turboModuleManagerDelegateMutex in RCTTurboModuleManager will not be used
   */
  @JvmStatic
  public fun removeTurboModuleManagerDelegateMutex(): Boolean = accessor.removeTurboModuleManagerDelegateMutex()

  /**
   * Throw an exception instead of deadlocking when a TurboModule that requires main queue setup is initialized during a synchronous render on iOS.
   */
  @JvmStatic
  public fun throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS(): Boolean = accessor.throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS()

  /**
   * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
   */
  @JvmStatic
  public fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean = accessor.traceTurboModulePromiseRejectionsOnAndroid()

  /**
   * When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.
   */
  @JvmStatic
  public fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean = accessor.updateRuntimeShadowNodeReferencesOnCommit()

  /**
   * In Bridgeless mode, use the always available javascript error reporting pipeline.
   */
  @JvmStatic
  public fun useAlwaysAvailableJSErrorHandling(): Boolean = accessor.useAlwaysAvailableJSErrorHandling()

  /**
   * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
   */
  @JvmStatic
  public fun useFabricInterop(): Boolean = accessor.useFabricInterop()

  /**
   * When enabled, the native view configs are used in bridgeless mode.
   */
  @JvmStatic
  public fun useNativeViewConfigsInBridgelessMode(): Boolean = accessor.useNativeViewConfigsInBridgelessMode()

  /**
   * Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.
   */
  @JvmStatic
  public fun useOptimizedEventBatchingOnAndroid(): Boolean = accessor.useOptimizedEventBatchingOnAndroid()

  /**
   * Instead of using folly::dynamic as internal representation in RawProps and RawValue, use jsi::Value
   */
  @JvmStatic
  public fun useRawPropsJsiValue(): Boolean = accessor.useRawPropsJsiValue()

  /**
   * Use the state stored on the source shadow node when cloning it instead of reading in the most recent state on the shadow node family.
   */
  @JvmStatic
  public fun useShadowNodeStateOnClone(): Boolean = accessor.useShadowNodeStateOnClone()

  /**
   * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
   */
  @JvmStatic
  public fun useTurboModuleInterop(): Boolean = accessor.useTurboModuleInterop()

  /**
   * When enabled, NativeModules will be executed by using the TurboModule system
   */
  @JvmStatic
  public fun useTurboModules(): Boolean = accessor.useTurboModules()

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
   * This is a combination of `dangerouslyReset` and `override` that reduces
   * the likeliness of a race condition between the two calls.
   *
   * This is **dangerous** because it can introduce consistency issues that will
   * be much harder to debug. For example, it could hide the fact that feature
   * flags are read before you set the values you want to use everywhere. It
   * could also cause a workflow to suddently have different feature flags for
   * behaviors that were configured with different values before.
   *
   * It returns a string that contains the feature flags that were accessed
   * before this call (or between the last call to `dangerouslyReset` and this
   * call). If you are using this method, you do not want the hard crash that
   * you would get from using `dangerouslyReset` and `override` separately,
   * but you should still log this somehow.
   *
   * Please see the documentation of `dangerouslyReset` for additional details.
   */
  @JvmStatic
  public fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String? {
    val newAccessor = accessorProvider()
    val previouslyAccessedFlags = newAccessor.dangerouslyForceOverride(provider)
    accessor = newAccessor
    return previouslyAccessedFlags
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
