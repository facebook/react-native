/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<f350f756268554418a046d0793ee0146>>
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

import androidx.annotation.VisibleForTesting

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
   * Enable emitting of InteractionEntry live metrics to the debugger. Requires `enableBridgelessArchitecture`.
   */
  @JvmStatic
  public fun cdpInteractionMetricsEnabled(): Boolean = accessor.cdpInteractionMetricsEnabled()

  /**
   * Use a C++ implementation of Native Animated instead of the platform implementation.
   */
  @JvmStatic
  public fun cxxNativeAnimatedEnabled(): Boolean = accessor.cxxNativeAnimatedEnabled()

  /**
   * Removes JS sync at end of native animation
   */
  @JvmStatic
  public fun cxxNativeAnimatedRemoveJsSync(): Boolean = accessor.cxxNativeAnimatedRemoveJsSync()

  /**
   * Dispatch view commands in mount item order.
   */
  @JvmStatic
  public fun disableEarlyViewCommandExecution(): Boolean = accessor.disableEarlyViewCommandExecution()

  /**
   * Prevents use of Fabric commit in C++ Animated implementation
   */
  @JvmStatic
  public fun disableFabricCommitInCXXAnimated(): Boolean = accessor.disableFabricCommitInCXXAnimated()

  /**
   * Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread
   */
  @JvmStatic
  public fun disableMountItemReorderingAndroid(): Boolean = accessor.disableMountItemReorderingAndroid()

  /**
   * Disable some workarounds for old Android versions in TextLayoutManager logic for retrieving attachment metrics
   */
  @JvmStatic
  public fun disableOldAndroidAttachmentMetricsWorkarounds(): Boolean = accessor.disableOldAndroidAttachmentMetricsWorkarounds()

  /**
   * Turns off the global measurement cache used by TextLayoutManager on Android.
   */
  @JvmStatic
  public fun disableTextLayoutManagerCacheAndroid(): Boolean = accessor.disableTextLayoutManagerCacheAndroid()

  /**
   * When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.
   */
  @JvmStatic
  public fun enableAccessibilityOrder(): Boolean = accessor.enableAccessibilityOrder()

  /**
   * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
   */
  @JvmStatic
  public fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean = accessor.enableAccumulatedUpdatesInRawPropsAndroid()

  /**
   * Enables linear text rendering on Android wherever subpixel text rendering is enabled
   */
  @JvmStatic
  public fun enableAndroidLinearText(): Boolean = accessor.enableAndroidLinearText()

  /**
   * Enables various optimizations throughout the path of measuring text on Android.
   */
  @JvmStatic
  public fun enableAndroidTextMeasurementOptimizations(): Boolean = accessor.enableAndroidTextMeasurementOptimizations()

  /**
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer`.
   */
  @JvmStatic
  public fun enableBridgelessArchitecture(): Boolean = accessor.enableBridgelessArchitecture()

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  @JvmStatic
  public fun enableCppPropsIteratorSetter(): Boolean = accessor.enableCppPropsIteratorSetter()

  /**
   * This enables the fabric implementation of focus search so that we can focus clipped elements
   */
  @JvmStatic
  public fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean = accessor.enableCustomFocusSearchOnClippedElementsAndroid()

  /**
   * Enables destructor calls for ShadowTreeRevision in the background to reduce UI thread work.
   */
  @JvmStatic
  public fun enableDestroyShadowTreeRevisionAsync(): Boolean = accessor.enableDestroyShadowTreeRevisionAsync()

  /**
   * When enabled a subset of components will avoid double measurement on Android.
   */
  @JvmStatic
  public fun enableDoubleMeasurementFixAndroid(): Boolean = accessor.enableDoubleMeasurementFixAndroid()

  /**
   * This infra allows native modules to initialize on the main thread, during React Native init.
   */
  @JvmStatic
  public fun enableEagerMainQueueModulesOnIOS(): Boolean = accessor.enableEagerMainQueueModulesOnIOS()

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
   * Enables font scale changes updating layout for measurable nodes.
   */
  @JvmStatic
  public fun enableFontScaleChangesUpdatingLayout(): Boolean = accessor.enableFontScaleChangesUpdatingLayout()

  /**
   * Applies base offset for each line of text separately on iOS.
   */
  @JvmStatic
  public fun enableIOSTextBaselineOffsetPerLine(): Boolean = accessor.enableIOSTextBaselineOffsetPerLine()

  /**
   * iOS Views will clip to their padding box vs border box
   */
  @JvmStatic
  public fun enableIOSViewClipToPaddingBox(): Boolean = accessor.enableIOSViewClipToPaddingBox()

  /**
   * When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout
   */
  @JvmStatic
  public fun enableImagePrefetchingAndroid(): Boolean = accessor.enableImagePrefetchingAndroid()

  /**
   * When enabled, Android will initiate image prefetch requested on ImageShadowNode::layout on the UI thread
   */
  @JvmStatic
  public fun enableImagePrefetchingOnUiThreadAndroid(): Boolean = accessor.enableImagePrefetchingOnUiThreadAndroid()

  /**
   * Dispatches state updates for content offset changes synchronously on the main thread.
   */
  @JvmStatic
  public fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean = accessor.enableImmediateUpdateModeForContentOffsetChanges()

  /**
   * Enable ref.focus() and ref.blur() for all views, not just TextInput.
   */
  @JvmStatic
  public fun enableImperativeFocus(): Boolean = accessor.enableImperativeFocus()

  /**
   * This is to fix the issue with interop view manager where component descriptor lookup is causing ViewManager to preload.
   */
  @JvmStatic
  public fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean = accessor.enableInteropViewManagerClassLookUpOptimizationIOS()

  /**
   * Enables the IntersectionObserver Web API in React Native.
   */
  @JvmStatic
  public fun enableIntersectionObserverByDefault(): Boolean = accessor.enableIntersectionObserverByDefault()

  /**
   * Enables key up/down/press events to be sent to JS from components
   */
  @JvmStatic
  public fun enableKeyEvents(): Boolean = accessor.enableKeyEvents()

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
   * Make RCTUnsafeExecuteOnMainQueueSync less likely to deadlock, when used in conjuction with sync rendering/events.
   */
  @JvmStatic
  public fun enableMainQueueCoordinatorOnIOS(): Boolean = accessor.enableMainQueueCoordinatorOnIOS()

  /**
   * Enable NSNull conversion when handling module arguments on iOS
   */
  @JvmStatic
  public fun enableModuleArgumentNSNullConversionIOS(): Boolean = accessor.enableModuleArgumentNSNullConversionIOS()

  /**
   * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
   */
  @JvmStatic
  public fun enableNativeCSSParsing(): Boolean = accessor.enableNativeCSSParsing()

  /**
   * Enable network event reporting hooks in each native platform through `NetworkReporter`. This flag should be combined with `enableResourceTimingAPI` and `fuseboxNetworkInspectionEnabled` to enable end-to-end reporting behaviour via the Web Performance API and CDP debugging respectively.
   */
  @JvmStatic
  public fun enableNetworkEventReporting(): Boolean = accessor.enableNetworkEventReporting()

  /**
   * Enables caching text layout artifacts for later reuse
   */
  @JvmStatic
  public fun enablePreparedTextLayout(): Boolean = accessor.enablePreparedTextLayout()

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  @JvmStatic
  public fun enablePropsUpdateReconciliationAndroid(): Boolean = accessor.enablePropsUpdateReconciliationAndroid()

  /**
   * Enables the reporting of network resource timings through `PerformanceObserver`.
   */
  @JvmStatic
  public fun enableResourceTimingAPI(): Boolean = accessor.enableResourceTimingAPI()

  /**
   * When enabled, it will use SwiftUI for filter effects like blur on iOS.
   */
  @JvmStatic
  public fun enableSwiftUIBasedFilters(): Boolean = accessor.enableSwiftUIBasedFilters()

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
   * Enables View Recycling for <Image> via ReactViewGroup/ReactViewManager.
   */
  @JvmStatic
  public fun enableViewRecyclingForImage(): Boolean = accessor.enableViewRecyclingForImage()

  /**
   * Enables View Recycling for <ScrollView> via ReactViewGroup/ReactViewManager.
   */
  @JvmStatic
  public fun enableViewRecyclingForScrollView(): Boolean = accessor.enableViewRecyclingForScrollView()

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
   * Set clipping to drawingRect of ScrollView.
   */
  @JvmStatic
  public fun enableVirtualViewClippingWithoutScrollViewClipping(): Boolean = accessor.enableVirtualViewClippingWithoutScrollViewClipping()

  /**
   * Enables the experimental version of `VirtualViewContainerState`.
   */
  @JvmStatic
  public fun enableVirtualViewContainerStateExperimental(): Boolean = accessor.enableVirtualViewContainerStateExperimental()

  /**
   * Enables VirtualView debug features such as logging and overlays.
   */
  @JvmStatic
  public fun enableVirtualViewDebugFeatures(): Boolean = accessor.enableVirtualViewDebugFeatures()

  /**
   * Enables reading render state when dispatching VirtualView events.
   */
  @JvmStatic
  public fun enableVirtualViewRenderState(): Boolean = accessor.enableVirtualViewRenderState()

  /**
   * Enables window focus detection for prioritizing VirtualView events.
   */
  @JvmStatic
  public fun enableVirtualViewWindowFocusDetection(): Boolean = accessor.enableVirtualViewWindowFocusDetection()

  /**
   * Enable Web Performance APIs (Performance Timeline, User Timings, etc.) by default.
   */
  @JvmStatic
  public fun enableWebPerformanceAPIsByDefault(): Boolean = accessor.enableWebPerformanceAPIsByDefault()

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  @JvmStatic
  public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = accessor.fixMappingOfEventPrioritiesBetweenFabricAndReact()

  /**
   * Enable system assertion validating that Fusebox is configured with a single host. When set, the CDP backend will dynamically disable features (Perf and Network) in the event that multiple hosts are registered (undefined behaviour), and broadcast this over `ReactNativeApplication.systemStateChanged`.
   */
  @JvmStatic
  public fun fuseboxAssertSingleHostState(): Boolean = accessor.fuseboxAssertSingleHostState()

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun fuseboxEnabledRelease(): Boolean = accessor.fuseboxEnabledRelease()

  /**
   * Enable network inspection support in the React Native DevTools CDP backend. Requires `enableBridgelessArchitecture`. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun fuseboxNetworkInspectionEnabled(): Boolean = accessor.fuseboxNetworkInspectionEnabled()

  /**
   * Hides offscreen VirtualViews on iOS by setting hidden = YES to avoid extra cost of views
   */
  @JvmStatic
  public fun hideOffscreenVirtualViewsOnIOS(): Boolean = accessor.hideOffscreenVirtualViewsOnIOS()

  /**
   * Override props at mounting with synchronously mounted (i.e. direct manipulation) props from Native Animated.
   */
  @JvmStatic
  public fun overrideBySynchronousMountPropsAtMountingAndroid(): Boolean = accessor.overrideBySynchronousMountPropsAtMountingAndroid()

  /**
   * Enable reporting Performance Issues (`detail.rnPerfIssue`). Displayed in the V2 Performance Monitor and the "Performance Issues" sub-panel in DevTools.
   */
  @JvmStatic
  public fun perfIssuesEnabled(): Boolean = accessor.perfIssuesEnabled()

  /**
   * Enable the V2 in-app Performance Monitor. This flag is global and should not be changed across React Host lifetimes.
   */
  @JvmStatic
  public fun perfMonitorV2Enabled(): Boolean = accessor.perfMonitorV2Enabled()

  /**
   * Number cached PreparedLayouts in TextLayoutManager cache
   */
  @JvmStatic
  public fun preparedTextCacheSize(): Double = accessor.preparedTextCacheSize()

  /**
   * Enables a new mechanism in ShadowTree to prevent problems caused by multiple threads trying to commit concurrently. If a thread tries to commit a few times unsuccessfully, it will acquire a lock and try again.
   */
  @JvmStatic
  public fun preventShadowTreeCommitExhaustion(): Boolean = accessor.preventShadowTreeCommitExhaustion()

  /**
   * Function used to enable / disable Pressibility from using W3C Pointer Events for its hover callbacks
   */
  @JvmStatic
  public fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean = accessor.shouldPressibilityUseW3CPointerEventsForHover()

  /**
   * Do not emit touchcancel from Android ScrollView, instead native topScroll event will trigger responder transfer and terminate in RN renderer.
   */
  @JvmStatic
  public fun shouldTriggerResponderTransferOnScrollAndroid(): Boolean = accessor.shouldTriggerResponderTransferOnScrollAndroid()

  /**
   * Skip activity identity assertion in ReactHostImpl::onHostPause()
   */
  @JvmStatic
  public fun skipActivityIdentityAssertionOnHostPause(): Boolean = accessor.skipActivityIdentityAssertionOnHostPause()

  /**
   * A flag to tell Fabric to sweep active touches from JSTouchDispatcher in Android when a child native gesture is started.
   */
  @JvmStatic
  public fun sweepActiveTouchOnChildNativeGesturesAndroid(): Boolean = accessor.sweepActiveTouchOnChildNativeGesturesAndroid()

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
   * Use a native implementation of equals in NativeReadableArray.
   */
  @JvmStatic
  public fun useNativeEqualsInNativeReadableArrayAndroid(): Boolean = accessor.useNativeEqualsInNativeReadableArrayAndroid()

  /**
   * Use a native implementation of TransformHelper
   */
  @JvmStatic
  public fun useNativeTransformHelperAndroid(): Boolean = accessor.useNativeTransformHelperAndroid()

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
   * Use shared animation backend in C++ Animated
   */
  @JvmStatic
  public fun useSharedAnimatedBackend(): Boolean = accessor.useSharedAnimatedBackend()

  /**
   * Use Trait::hidden on Android
   */
  @JvmStatic
  public fun useTraitHiddenOnAndroid(): Boolean = accessor.useTraitHiddenOnAndroid()

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
   * Outset the culling context frame with the provided ratio. The culling context frame size will be outset by width * ratio on the left and right, and height * ratio on the top and bottom.
   */
  @JvmStatic
  public fun viewCullingOutsetRatio(): Double = accessor.viewCullingOutsetRatio()

  /**
   * Sets a hysteresis window for transition between prerender and hidden modes.
   */
  @JvmStatic
  public fun virtualViewHysteresisRatio(): Double = accessor.virtualViewHysteresisRatio()

  /**
   * Initial prerender ratio for VirtualView.
   */
  @JvmStatic
  public fun virtualViewPrerenderRatio(): Double = accessor.virtualViewPrerenderRatio()

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
   * could also cause a workflow to suddenly have different feature flags for
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
  @VisibleForTesting
  internal fun setAccessorProvider(newAccessorProvider: () -> ReactNativeFeatureFlagsAccessor) {
    accessorProvider = newAccessorProvider
    accessor = accessorProvider()
  }
}
