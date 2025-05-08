/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<6667fc8e4fdd2db0b54c908155b110cf>>
 * @flow strict
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
  avoidStateUpdateInAnimatedPropsMemo: Getter<boolean>,
  disableInteractionManager: Getter<boolean>,
  enableAccessToHostTreeInFabric: Getter<boolean>,
  fixVirtualizeListCollapseWindowSize: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  scheduleAnimatedCleanupInMicrotask: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
}>;

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = $ReadOnly<{
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  commonTestFlagWithoutNativeImplementation: Getter<boolean>,
  animatedShouldSignalBatch: Getter<boolean>,
  cxxNativeAnimatedEnabled: Getter<boolean>,
  disableMainQueueSyncDispatchIOS: Getter<boolean>,
  disableMountItemReorderingAndroid: Getter<boolean>,
  enableAccessibilityOrder: Getter<boolean>,
  enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean>,
  enableBridgelessArchitecture: Getter<boolean>,
  enableCppPropsIteratorSetter: Getter<boolean>,
  enableCustomFocusSearchOnClippedElementsAndroid: Getter<boolean>,
  enableDestroyShadowTreeRevisionAsync: Getter<boolean>,
  enableDoubleMeasurementFixAndroid: Getter<boolean>,
  enableEagerRootViewAttachment: Getter<boolean>,
  enableFabricLogs: Getter<boolean>,
  enableFabricRenderer: Getter<boolean>,
  enableFixForParentTagDuringReparenting: Getter<boolean>,
  enableFontScaleChangesUpdatingLayout: Getter<boolean>,
  enableIOSViewClipToPaddingBox: Getter<boolean>,
  enableJSRuntimeGCOnMemoryPressureOnIOS: Getter<boolean>,
  enableLayoutAnimationsOnAndroid: Getter<boolean>,
  enableLayoutAnimationsOnIOS: Getter<boolean>,
  enableMainQueueModulesOnIOS: Getter<boolean>,
  enableNativeCSSParsing: Getter<boolean>,
  enableNetworkEventReporting: Getter<boolean>,
  enableNewBackgroundAndBorderDrawables: Getter<boolean>,
  enablePreparedTextLayout: Getter<boolean>,
  enablePropsUpdateReconciliationAndroid: Getter<boolean>,
  enableResourceTimingAPI: Getter<boolean>,
  enableSynchronousStateUpdates: Getter<boolean>,
  enableViewCulling: Getter<boolean>,
  enableViewRecycling: Getter<boolean>,
  enableViewRecyclingForText: Getter<boolean>,
  enableViewRecyclingForView: Getter<boolean>,
  fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  fuseboxNetworkInspectionEnabled: Getter<boolean>,
  incorporateMaxLinesDuringAndroidLayout: Getter<boolean>,
  traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean>,
  updateRuntimeShadowNodeReferencesOnCommit: Getter<boolean>,
  useAlwaysAvailableJSErrorHandling: Getter<boolean>,
  useFabricInterop: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
  useOptimizedEventBatchingOnAndroid: Getter<boolean>,
  useRawPropsJsiValue: Getter<boolean>,
  useShadowNodeStateOnClone: Getter<boolean>,
  useTurboModuleInterop: Getter<boolean>,
  useTurboModules: Getter<boolean>,
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
 * Changes `useAnimatedPropsMemo` to avoid state updates to invalidate the cached `AnimatedProps`.
 */
export const avoidStateUpdateInAnimatedPropsMemo: Getter<boolean> = createJavaScriptFlagGetter('avoidStateUpdateInAnimatedPropsMemo', false);

/**
 * Disables InteractionManager and replaces its scheduler with `setImmediate`.
 */
export const disableInteractionManager: Getter<boolean> = createJavaScriptFlagGetter('disableInteractionManager', true);

/**
 * Enables access to the host tree in Fabric using DOM-compatible APIs.
 */
export const enableAccessToHostTreeInFabric: Getter<boolean> = createJavaScriptFlagGetter('enableAccessToHostTreeInFabric', false);

/**
 * Fixing an edge case where the current window size is not properly calculated with fast scrolling. Window size collapsed to 1 element even if windowSize more than the current amount of elements
 */
export const fixVirtualizeListCollapseWindowSize: Getter<boolean> = createJavaScriptFlagGetter('fixVirtualizeListCollapseWindowSize', false);

/**
 * Function used to enable / disabled Layout Animations in React Native.
 */
export const isLayoutAnimationEnabled: Getter<boolean> = createJavaScriptFlagGetter('isLayoutAnimationEnabled', true);

/**
 * Changes the cleanup of `AnimatedProps` to occur in a microtask instead of synchronously during effect cleanup (for unmount) or subsequent mounts (for updates).
 */
export const scheduleAnimatedCleanupInMicrotask: Getter<boolean> = createJavaScriptFlagGetter('scheduleAnimatedCleanupInMicrotask', true);

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
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * Common flag for testing (without native implementation). Do NOT modify.
 */
export const commonTestFlagWithoutNativeImplementation: Getter<boolean> = createNativeFlagGetter('commonTestFlagWithoutNativeImplementation', false);
/**
 * Enables start- and finishOperationBatch on any platform.
 */
export const animatedShouldSignalBatch: Getter<boolean> = createNativeFlagGetter('animatedShouldSignalBatch', false);
/**
 * Use a C++ implementation of Native Animated instead of the platform implementation.
 */
export const cxxNativeAnimatedEnabled: Getter<boolean> = createNativeFlagGetter('cxxNativeAnimatedEnabled', false);
/**
 * Disable sync dispatch on the main queue on iOS
 */
export const disableMainQueueSyncDispatchIOS: Getter<boolean> = createNativeFlagGetter('disableMainQueueSyncDispatchIOS', false);
/**
 * Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread
 */
export const disableMountItemReorderingAndroid: Getter<boolean> = createNativeFlagGetter('disableMountItemReorderingAndroid', false);
/**
 * When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.
 */
export const enableAccessibilityOrder: Getter<boolean> = createNativeFlagGetter('enableAccessibilityOrder', false);
/**
 * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
 */
export const enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean> = createNativeFlagGetter('enableAccumulatedUpdatesInRawPropsAndroid', false);
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
 * This feature flag enables a fix for reparenting fix in differentiator
 */
export const enableFixForParentTagDuringReparenting: Getter<boolean> = createNativeFlagGetter('enableFixForParentTagDuringReparenting', false);
/**
 * Enables font scale changes updating layout for measurable nodes.
 */
export const enableFontScaleChangesUpdatingLayout: Getter<boolean> = createNativeFlagGetter('enableFontScaleChangesUpdatingLayout', false);
/**
 * iOS Views will clip to their padding box vs border box
 */
export const enableIOSViewClipToPaddingBox: Getter<boolean> = createNativeFlagGetter('enableIOSViewClipToPaddingBox', false);
/**
 * Trigger JS runtime GC on memory pressure event on iOS
 */
export const enableJSRuntimeGCOnMemoryPressureOnIOS: Getter<boolean> = createNativeFlagGetter('enableJSRuntimeGCOnMemoryPressureOnIOS', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on Android.
 */
export const enableLayoutAnimationsOnAndroid: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnAndroid', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on iOS.
 */
export const enableLayoutAnimationsOnIOS: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnIOS', true);
/**
 * Makes modules requiring main queue setup initialize on the main thread, during React Native init.
 */
export const enableMainQueueModulesOnIOS: Getter<boolean> = createNativeFlagGetter('enableMainQueueModulesOnIOS', false);
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
 * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
 */
export const enableSynchronousStateUpdates: Getter<boolean> = createNativeFlagGetter('enableSynchronousStateUpdates', false);
/**
 * Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.
 */
export const enableViewCulling: Getter<boolean> = createNativeFlagGetter('enableViewCulling', false);
/**
 * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
 */
export const enableViewRecycling: Getter<boolean> = createNativeFlagGetter('enableViewRecycling', false);
/**
 * Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.
 */
export const enableViewRecyclingForText: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForText', true);
/**
 * Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.
 */
export const enableViewRecyclingForView: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForView', true);
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
 * Set maxLines and ellipsization during Android layout creation
 */
export const incorporateMaxLinesDuringAndroidLayout: Getter<boolean> = createNativeFlagGetter('incorporateMaxLinesDuringAndroidLayout', true);
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
export const useRawPropsJsiValue: Getter<boolean> = createNativeFlagGetter('useRawPropsJsiValue', false);
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
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
