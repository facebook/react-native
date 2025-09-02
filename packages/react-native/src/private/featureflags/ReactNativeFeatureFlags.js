/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<5ba27aa5af4c69dedd733ca5ccb09fe3>>
 * @flow strict
 * @noformat
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

import {
  type Getter,
  type OverridesFor,
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = $ReadOnly<{
  jsOnlyTestFlag: Getter<boolean>,
  animatedShouldDebounceQueueFlush: Getter<boolean>,
  animatedShouldUseSingleOp: Getter<boolean>,
  deferFlatListFocusChangeRenderUpdate: Getter<boolean>,
  disableMaintainVisibleContentPosition: Getter<boolean>,
  enableAccessToHostTreeInFabric: Getter<boolean>,
  fixVirtualizeListCollapseWindowSize: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  reduceDefaultPropsInImage: Getter<boolean>,
  reduceDefaultPropsInText: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
  virtualViewActivityBehavior: Getter<string>,
}>;

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = $ReadOnly<{
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  commonTestFlagWithoutNativeImplementation: Getter<boolean>,
  cdpInteractionMetricsEnabled: Getter<boolean>,
  cxxNativeAnimatedEnabled: Getter<boolean>,
  cxxNativeAnimatedRemoveJsSync: Getter<boolean>,
  disableFabricCommitInCXXAnimated: Getter<boolean>,
  disableMountItemReorderingAndroid: Getter<boolean>,
  disableOldAndroidAttachmentMetricsWorkarounds: Getter<boolean>,
  disableTextLayoutManagerCacheAndroid: Getter<boolean>,
  enableAccessibilityOrder: Getter<boolean>,
  enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean>,
  enableAndroidTextMeasurementOptimizations: Getter<boolean>,
  enableBridgelessArchitecture: Getter<boolean>,
  enableCppPropsIteratorSetter: Getter<boolean>,
  enableCustomFocusSearchOnClippedElementsAndroid: Getter<boolean>,
  enableDestroyShadowTreeRevisionAsync: Getter<boolean>,
  enableDoubleMeasurementFixAndroid: Getter<boolean>,
  enableEagerMainQueueModulesOnIOS: Getter<boolean>,
  enableEagerRootViewAttachment: Getter<boolean>,
  enableFabricLogs: Getter<boolean>,
  enableFabricRenderer: Getter<boolean>,
  enableFontScaleChangesUpdatingLayout: Getter<boolean>,
  enableIOSTextBaselineOffsetPerLine: Getter<boolean>,
  enableIOSViewClipToPaddingBox: Getter<boolean>,
  enableImagePrefetchingAndroid: Getter<boolean>,
  enableImmediateUpdateModeForContentOffsetChanges: Getter<boolean>,
  enableInteropViewManagerClassLookUpOptimizationIOS: Getter<boolean>,
  enableLayoutAnimationsOnAndroid: Getter<boolean>,
  enableLayoutAnimationsOnIOS: Getter<boolean>,
  enableMainQueueCoordinatorOnIOS: Getter<boolean>,
  enableModuleArgumentNSNullConversionIOS: Getter<boolean>,
  enableNativeCSSParsing: Getter<boolean>,
  enableNetworkEventReporting: Getter<boolean>,
  enableNewBackgroundAndBorderDrawables: Getter<boolean>,
  enablePreparedTextLayout: Getter<boolean>,
  enablePropsUpdateReconciliationAndroid: Getter<boolean>,
  enableResourceTimingAPI: Getter<boolean>,
  enableViewCulling: Getter<boolean>,
  enableViewRecycling: Getter<boolean>,
  enableViewRecyclingForScrollView: Getter<boolean>,
  enableViewRecyclingForText: Getter<boolean>,
  enableViewRecyclingForView: Getter<boolean>,
  enableVirtualViewDebugFeatures: Getter<boolean>,
  enableVirtualViewRenderState: Getter<boolean>,
  enableVirtualViewWindowFocusDetection: Getter<boolean>,
  enableWebPerformanceAPIsByDefault: Getter<boolean>,
  fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  fuseboxNetworkInspectionEnabled: Getter<boolean>,
  hideOffscreenVirtualViewsOnIOS: Getter<boolean>,
  perfMonitorV2Enabled: Getter<boolean>,
  preparedTextCacheSize: Getter<number>,
  preventShadowTreeCommitExhaustion: Getter<boolean>,
  releaseImageDataWhenConsumed: Getter<boolean>,
  shouldPressibilityUseW3CPointerEventsForHover: Getter<boolean>,
  skipActivityIdentityAssertionOnHostPause: Getter<boolean>,
  sweepActiveTouchOnChildNativeGesturesAndroid: Getter<boolean>,
  traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean>,
  updateRuntimeShadowNodeReferencesOnCommit: Getter<boolean>,
  useAlwaysAvailableJSErrorHandling: Getter<boolean>,
  useFabricInterop: Getter<boolean>,
  useNativeEqualsInNativeReadableArrayAndroid: Getter<boolean>,
  useNativeTransformHelperAndroid: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
  useOptimizedEventBatchingOnAndroid: Getter<boolean>,
  useRawPropsJsiValue: Getter<boolean>,
  useShadowNodeStateOnClone: Getter<boolean>,
  useTurboModuleInterop: Getter<boolean>,
  useTurboModules: Getter<boolean>,
  virtualViewHysteresisRatio: Getter<number>,
  virtualViewPrerenderRatio: Getter<number>,
}>;

/**
 * JS-only flag for testing. Do NOT modify.
 */
export const jsOnlyTestFlag: Getter<boolean> = createJavaScriptFlagGetter('jsOnlyTestFlag', false);

/**
 * Enables an experimental flush-queue debouncing in Animated.js.
 */
export const animatedShouldDebounceQueueFlush: Getter<boolean> = createJavaScriptFlagGetter('animatedShouldDebounceQueueFlush', false);

/**
 * Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.
 */
export const animatedShouldUseSingleOp: Getter<boolean> = createJavaScriptFlagGetter('animatedShouldUseSingleOp', false);

/**
 * Use the deferred cell render update mechanism for focus change in FlatList.
 */
export const deferFlatListFocusChangeRenderUpdate: Getter<boolean> = createJavaScriptFlagGetter('deferFlatListFocusChangeRenderUpdate', false);

/**
 * Disable prop maintainVisibleContentPosition in ScrollView
 */
export const disableMaintainVisibleContentPosition: Getter<boolean> = createJavaScriptFlagGetter('disableMaintainVisibleContentPosition', false);

/**
 * Enables access to the host tree in Fabric using DOM-compatible APIs.
 */
export const enableAccessToHostTreeInFabric: Getter<boolean> = createJavaScriptFlagGetter('enableAccessToHostTreeInFabric', true);

/**
 * Fixing an edge case where the current window size is not properly calculated with fast scrolling. Window size collapsed to 1 element even if windowSize more than the current amount of elements
 */
export const fixVirtualizeListCollapseWindowSize: Getter<boolean> = createJavaScriptFlagGetter('fixVirtualizeListCollapseWindowSize', false);

/**
 * Function used to enable / disabled Layout Animations in React Native.
 */
export const isLayoutAnimationEnabled: Getter<boolean> = createJavaScriptFlagGetter('isLayoutAnimationEnabled', true);

/**
 * Optimize how default props are processed in Image to avoid unnecessary keys.
 */
export const reduceDefaultPropsInImage: Getter<boolean> = createJavaScriptFlagGetter('reduceDefaultPropsInImage', false);

/**
 * Optimize how default props are processed in Text to avoid unnecessary keys.
 */
export const reduceDefaultPropsInText: Getter<boolean> = createJavaScriptFlagGetter('reduceDefaultPropsInText', false);

/**
 * Enables use of AnimatedObject for animating transform values.
 */
export const shouldUseAnimatedObjectForTransform: Getter<boolean> = createJavaScriptFlagGetter('shouldUseAnimatedObjectForTransform', false);

/**
 * removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android
 */
export const shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean> = createJavaScriptFlagGetter('shouldUseRemoveClippedSubviewsAsDefaultOnIOS', false);

/**
 * Enables use of setNativeProps in JS driven animations.
 */
export const shouldUseSetNativePropsInFabric: Getter<boolean> = createJavaScriptFlagGetter('shouldUseSetNativePropsInFabric', true);

/**
 * Changes whether and how `VirtualView` uses `Activity`.
 */
export const virtualViewActivityBehavior: Getter<string> = createJavaScriptFlagGetter('virtualViewActivityBehavior', "no-activity");

/**
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * Common flag for testing (without native implementation). Do NOT modify.
 */
export const commonTestFlagWithoutNativeImplementation: Getter<boolean> = createNativeFlagGetter('commonTestFlagWithoutNativeImplementation', false);
/**
 * Enable emitting of InteractionEntry live metrics to the debugger. Requires `enableBridgelessArchitecture`.
 */
export const cdpInteractionMetricsEnabled: Getter<boolean> = createNativeFlagGetter('cdpInteractionMetricsEnabled', false);
/**
 * Use a C++ implementation of Native Animated instead of the platform implementation.
 */
export const cxxNativeAnimatedEnabled: Getter<boolean> = createNativeFlagGetter('cxxNativeAnimatedEnabled', false);
/**
 * Removes JS sync at end of native animation
 */
export const cxxNativeAnimatedRemoveJsSync: Getter<boolean> = createNativeFlagGetter('cxxNativeAnimatedRemoveJsSync', false);
/**
 * Prevents use of Fabric commit in C++ Animated implementation
 */
export const disableFabricCommitInCXXAnimated: Getter<boolean> = createNativeFlagGetter('disableFabricCommitInCXXAnimated', false);
/**
 * Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread
 */
export const disableMountItemReorderingAndroid: Getter<boolean> = createNativeFlagGetter('disableMountItemReorderingAndroid', false);
/**
 * Disable some workarounds for old Android versions in TextLayoutManager logic for retrieving attachment metrics
 */
export const disableOldAndroidAttachmentMetricsWorkarounds: Getter<boolean> = createNativeFlagGetter('disableOldAndroidAttachmentMetricsWorkarounds', true);
/**
 * Turns off the global measurement cache used by TextLayoutManager on Android.
 */
export const disableTextLayoutManagerCacheAndroid: Getter<boolean> = createNativeFlagGetter('disableTextLayoutManagerCacheAndroid', false);
/**
 * When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.
 */
export const enableAccessibilityOrder: Getter<boolean> = createNativeFlagGetter('enableAccessibilityOrder', false);
/**
 * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
 */
export const enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean> = createNativeFlagGetter('enableAccumulatedUpdatesInRawPropsAndroid', false);
/**
 * Enables various optimizations throughout the path of measuring text on Android.
 */
export const enableAndroidTextMeasurementOptimizations: Getter<boolean> = createNativeFlagGetter('enableAndroidTextMeasurementOptimizations', false);
/**
 * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer`.
 */
export const enableBridgelessArchitecture: Getter<boolean> = createNativeFlagGetter('enableBridgelessArchitecture', false);
/**
 * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
 */
export const enableCppPropsIteratorSetter: Getter<boolean> = createNativeFlagGetter('enableCppPropsIteratorSetter', false);
/**
 * This enables the fabric implementation of focus search so that we can focus clipped elements
 */
export const enableCustomFocusSearchOnClippedElementsAndroid: Getter<boolean> = createNativeFlagGetter('enableCustomFocusSearchOnClippedElementsAndroid', true);
/**
 * Enables destructor calls for ShadowTreeRevision in the background to reduce UI thread work.
 */
export const enableDestroyShadowTreeRevisionAsync: Getter<boolean> = createNativeFlagGetter('enableDestroyShadowTreeRevisionAsync', false);
/**
 * When enabled a subset of components will avoid double measurement on Android.
 */
export const enableDoubleMeasurementFixAndroid: Getter<boolean> = createNativeFlagGetter('enableDoubleMeasurementFixAndroid', false);
/**
 * This infra allows native modules to initialize on the main thread, during React Native init.
 */
export const enableEagerMainQueueModulesOnIOS: Getter<boolean> = createNativeFlagGetter('enableEagerMainQueueModulesOnIOS', false);
/**
 * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
 */
export const enableEagerRootViewAttachment: Getter<boolean> = createNativeFlagGetter('enableEagerRootViewAttachment', false);
/**
 * This feature flag enables logs for Fabric.
 */
export const enableFabricLogs: Getter<boolean> = createNativeFlagGetter('enableFabricLogs', false);
/**
 * Enables the use of the Fabric renderer in the whole app.
 */
export const enableFabricRenderer: Getter<boolean> = createNativeFlagGetter('enableFabricRenderer', false);
/**
 * Enables font scale changes updating layout for measurable nodes.
 */
export const enableFontScaleChangesUpdatingLayout: Getter<boolean> = createNativeFlagGetter('enableFontScaleChangesUpdatingLayout', true);
/**
 * Applies base offset for each line of text separately on iOS.
 */
export const enableIOSTextBaselineOffsetPerLine: Getter<boolean> = createNativeFlagGetter('enableIOSTextBaselineOffsetPerLine', false);
/**
 * iOS Views will clip to their padding box vs border box
 */
export const enableIOSViewClipToPaddingBox: Getter<boolean> = createNativeFlagGetter('enableIOSViewClipToPaddingBox', false);
/**
 * When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout
 */
export const enableImagePrefetchingAndroid: Getter<boolean> = createNativeFlagGetter('enableImagePrefetchingAndroid', false);
/**
 * Dispatches state updates for content offset changes synchronously on the main thread.
 */
export const enableImmediateUpdateModeForContentOffsetChanges: Getter<boolean> = createNativeFlagGetter('enableImmediateUpdateModeForContentOffsetChanges', false);
/**
 * This is to fix the issue with interop view manager where component descriptor lookup is causing ViewManager to preload.
 */
export const enableInteropViewManagerClassLookUpOptimizationIOS: Getter<boolean> = createNativeFlagGetter('enableInteropViewManagerClassLookUpOptimizationIOS', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on Android.
 */
export const enableLayoutAnimationsOnAndroid: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnAndroid', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on iOS.
 */
export const enableLayoutAnimationsOnIOS: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnIOS', true);
/**
 * Make RCTUnsafeExecuteOnMainQueueSync less likely to deadlock, when used in conjuction with sync rendering/events.
 */
export const enableMainQueueCoordinatorOnIOS: Getter<boolean> = createNativeFlagGetter('enableMainQueueCoordinatorOnIOS', false);
/**
 * Enable NSNull conversion when handling module arguments on iOS
 */
export const enableModuleArgumentNSNullConversionIOS: Getter<boolean> = createNativeFlagGetter('enableModuleArgumentNSNullConversionIOS', false);
/**
 * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
 */
export const enableNativeCSSParsing: Getter<boolean> = createNativeFlagGetter('enableNativeCSSParsing', false);
/**
 * Enable network event reporting hooks in each native platform through `NetworkReporter`. This flag should be combined with `enableResourceTimingAPI` and `fuseboxNetworkInspectionEnabled` to enable end-to-end reporting behaviour via the Web Performance API and CDP debugging respectively.
 */
export const enableNetworkEventReporting: Getter<boolean> = createNativeFlagGetter('enableNetworkEventReporting', false);
/**
 * Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable
 */
export const enableNewBackgroundAndBorderDrawables: Getter<boolean> = createNativeFlagGetter('enableNewBackgroundAndBorderDrawables', true);
/**
 * Enables caching text layout artifacts for later reuse
 */
export const enablePreparedTextLayout: Getter<boolean> = createNativeFlagGetter('enablePreparedTextLayout', false);
/**
 * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
 */
export const enablePropsUpdateReconciliationAndroid: Getter<boolean> = createNativeFlagGetter('enablePropsUpdateReconciliationAndroid', false);
/**
 * Enables the reporting of network resource timings through `PerformanceObserver`.
 */
export const enableResourceTimingAPI: Getter<boolean> = createNativeFlagGetter('enableResourceTimingAPI', false);
/**
 * Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.
 */
export const enableViewCulling: Getter<boolean> = createNativeFlagGetter('enableViewCulling', false);
/**
 * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
 */
export const enableViewRecycling: Getter<boolean> = createNativeFlagGetter('enableViewRecycling', false);
/**
 * Enables View Recycling for <ScrollView> via ReactViewGroup/ReactViewManager.
 */
export const enableViewRecyclingForScrollView: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForScrollView', false);
/**
 * Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.
 */
export const enableViewRecyclingForText: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForText', true);
/**
 * Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.
 */
export const enableViewRecyclingForView: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForView', true);
/**
 * Enables VirtualView debug features such as logging and overlays.
 */
export const enableVirtualViewDebugFeatures: Getter<boolean> = createNativeFlagGetter('enableVirtualViewDebugFeatures', false);
/**
 * Enables reading render state when dispatching VirtualView events.
 */
export const enableVirtualViewRenderState: Getter<boolean> = createNativeFlagGetter('enableVirtualViewRenderState', true);
/**
 * Enables window focus detection for prioritizing VirtualView events.
 */
export const enableVirtualViewWindowFocusDetection: Getter<boolean> = createNativeFlagGetter('enableVirtualViewWindowFocusDetection', false);
/**
 * Enable Web Performance APIs (Performance Timeline, User Timings, etc.) by default.
 */
export const enableWebPerformanceAPIsByDefault: Getter<boolean> = createNativeFlagGetter('enableWebPerformanceAPIsByDefault', false);
/**
 * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
 */
export const fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean> = createNativeFlagGetter('fixMappingOfEventPrioritiesBetweenFabricAndReact', false);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledRelease: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledRelease', false);
/**
 * Enable network inspection support in the React Native DevTools CDP backend. Requires `enableBridgelessArchitecture`. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxNetworkInspectionEnabled: Getter<boolean> = createNativeFlagGetter('fuseboxNetworkInspectionEnabled', false);
/**
 * Hides offscreen VirtualViews on iOS by setting hidden = YES to avoid extra cost of views
 */
export const hideOffscreenVirtualViewsOnIOS: Getter<boolean> = createNativeFlagGetter('hideOffscreenVirtualViewsOnIOS', false);
/**
 * Enable the V2 in-app Performance Monitor. This flag is global and should not be changed across React Host lifetimes.
 */
export const perfMonitorV2Enabled: Getter<boolean> = createNativeFlagGetter('perfMonitorV2Enabled', false);
/**
 * Number cached PreparedLayouts in TextLayoutManager cache
 */
export const preparedTextCacheSize: Getter<number> = createNativeFlagGetter('preparedTextCacheSize', 200);
/**
 * Enables a new mechanism in ShadowTree to prevent problems caused by multiple threads trying to commit concurrently. If a thread tries to commit a few times unsuccessfully, it will acquire a lock and try again.
 */
export const preventShadowTreeCommitExhaustion: Getter<boolean> = createNativeFlagGetter('preventShadowTreeCommitExhaustion', false);
/**
 * Releases the cached image data when it is consumed by the observers.
 */
export const releaseImageDataWhenConsumed: Getter<boolean> = createNativeFlagGetter('releaseImageDataWhenConsumed', false);
/**
 * Function used to enable / disable Pressibility from using W3C Pointer Events for its hover callbacks
 */
export const shouldPressibilityUseW3CPointerEventsForHover: Getter<boolean> = createNativeFlagGetter('shouldPressibilityUseW3CPointerEventsForHover', false);
/**
 * Skip activity identity assertion in ReactHostImpl::onHostPause()
 */
export const skipActivityIdentityAssertionOnHostPause: Getter<boolean> = createNativeFlagGetter('skipActivityIdentityAssertionOnHostPause', false);
/**
 * A flag to tell Fabric to sweep active touches from JSTouchDispatcher in Android when a child native gesture is started.
 */
export const sweepActiveTouchOnChildNativeGesturesAndroid: Getter<boolean> = createNativeFlagGetter('sweepActiveTouchOnChildNativeGesturesAndroid', false);
/**
 * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
 */
export const traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean> = createNativeFlagGetter('traceTurboModulePromiseRejectionsOnAndroid', false);
/**
 * When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.
 */
export const updateRuntimeShadowNodeReferencesOnCommit: Getter<boolean> = createNativeFlagGetter('updateRuntimeShadowNodeReferencesOnCommit', false);
/**
 * In Bridgeless mode, use the always available javascript error reporting pipeline.
 */
export const useAlwaysAvailableJSErrorHandling: Getter<boolean> = createNativeFlagGetter('useAlwaysAvailableJSErrorHandling', false);
/**
 * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
 */
export const useFabricInterop: Getter<boolean> = createNativeFlagGetter('useFabricInterop', true);
/**
 * Use a native implementation of equals in NativeReadableArray.
 */
export const useNativeEqualsInNativeReadableArrayAndroid: Getter<boolean> = createNativeFlagGetter('useNativeEqualsInNativeReadableArrayAndroid', true);
/**
 * Use a native implementation of TransformHelper
 */
export const useNativeTransformHelperAndroid: Getter<boolean> = createNativeFlagGetter('useNativeTransformHelperAndroid', true);
/**
 * When enabled, the native view configs are used in bridgeless mode.
 */
export const useNativeViewConfigsInBridgelessMode: Getter<boolean> = createNativeFlagGetter('useNativeViewConfigsInBridgelessMode', false);
/**
 * Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.
 */
export const useOptimizedEventBatchingOnAndroid: Getter<boolean> = createNativeFlagGetter('useOptimizedEventBatchingOnAndroid', false);
/**
 * Instead of using folly::dynamic as internal representation in RawProps and RawValue, use jsi::Value
 */
export const useRawPropsJsiValue: Getter<boolean> = createNativeFlagGetter('useRawPropsJsiValue', true);
/**
 * Use the state stored on the source shadow node when cloning it instead of reading in the most recent state on the shadow node family.
 */
export const useShadowNodeStateOnClone: Getter<boolean> = createNativeFlagGetter('useShadowNodeStateOnClone', false);
/**
 * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
 */
export const useTurboModuleInterop: Getter<boolean> = createNativeFlagGetter('useTurboModuleInterop', false);
/**
 * When enabled, NativeModules will be executed by using the TurboModule system
 */
export const useTurboModules: Getter<boolean> = createNativeFlagGetter('useTurboModules', false);
/**
 * Sets a hysteresis window for transition between prerender and hidden modes.
 */
export const virtualViewHysteresisRatio: Getter<number> = createNativeFlagGetter('virtualViewHysteresisRatio', 0);
/**
 * Initial prerender ratio for VirtualView.
 */
export const virtualViewPrerenderRatio: Getter<number> = createNativeFlagGetter('virtualViewPrerenderRatio', 5);

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
