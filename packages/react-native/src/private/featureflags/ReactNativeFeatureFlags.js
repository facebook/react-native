/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<a28a3b729eaeee7ba3b1c2105d277286>>
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
  enableAnimatedClearImmediateFix: Getter<boolean>,
  enableDOMDocumentAPI: Getter<boolean>,
  fixVirtualizeListCollapseWindowSize: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  scheduleAnimatedCleanupInMicrotask: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
  useRefsForTextInputState: Getter<boolean>,
}>;

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = $ReadOnly<{
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  commonTestFlagWithoutNativeImplementation: Getter<boolean>,
  disableMountItemReorderingAndroid: Getter<boolean>,
  enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean>,
  enableBridgelessArchitecture: Getter<boolean>,
  enableCppPropsIteratorSetter: Getter<boolean>,
  enableEagerRootViewAttachment: Getter<boolean>,
  enableFabricLogs: Getter<boolean>,
  enableFabricRenderer: Getter<boolean>,
  enableIOSViewClipToPaddingBox: Getter<boolean>,
  enableImagePrefetchingAndroid: Getter<boolean>,
  enableJSRuntimeGCOnMemoryPressureOnIOS: Getter<boolean>,
  enableLayoutAnimationsOnAndroid: Getter<boolean>,
  enableLayoutAnimationsOnIOS: Getter<boolean>,
  enableLongTaskAPI: Getter<boolean>,
  enableNativeCSSParsing: Getter<boolean>,
  enableNewBackgroundAndBorderDrawables: Getter<boolean>,
  enablePreciseSchedulingForPremountItemsOnAndroid: Getter<boolean>,
  enablePropsUpdateReconciliationAndroid: Getter<boolean>,
  enableReportEventPaintTime: Getter<boolean>,
  enableSynchronousStateUpdates: Getter<boolean>,
  enableUIConsistency: Getter<boolean>,
  enableViewCulling: Getter<boolean>,
  enableViewRecycling: Getter<boolean>,
  enableViewRecyclingForText: Getter<boolean>,
  enableViewRecyclingForView: Getter<boolean>,
  excludeYogaFromRawProps: Getter<boolean>,
  fixDifferentiatorEmittingUpdatesWithWrongParentTag: Getter<boolean>,
  fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean>,
  fixMountingCoordinatorReportedPendingTransactionsOnAndroid: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  fuseboxNetworkInspectionEnabled: Getter<boolean>,
  lazyAnimationCallbacks: Getter<boolean>,
  removeTurboModuleManagerDelegateMutex: Getter<boolean>,
  throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS: Getter<boolean>,
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
export const disableInteractionManager: Getter<boolean> = createJavaScriptFlagGetter('disableInteractionManager', false);

/**
 * Enables access to the host tree in Fabric using DOM-compatible APIs.
 */
export const enableAccessToHostTreeInFabric: Getter<boolean> = createJavaScriptFlagGetter('enableAccessToHostTreeInFabric', false);

/**
 * Enables an experimental to use the proper clearIntermediate instead of calling the wrong clearTimeout and canceling another timer.
 */
export const enableAnimatedClearImmediateFix: Getter<boolean> = createJavaScriptFlagGetter('enableAnimatedClearImmediateFix', true);

/**
 * Enables the DOM Document API, exposing instaces of document through `getRootNode` and `ownerDocument`, and providing access to the `documentElement` representing the root node. This flag will be short-lived, only to test the Document API specifically, and then it will be collapsed into the enableAccessToHostTreeInFabric flag.
 */
export const enableDOMDocumentAPI: Getter<boolean> = createJavaScriptFlagGetter('enableDOMDocumentAPI', false);

/**
 * Fixing an edge case where the current window size is not properly calculated with fast scrolling. Window size collapsed to 1 element even if windowSize more than the current amount of elements
 */
export const fixVirtualizeListCollapseWindowSize: Getter<boolean> = createJavaScriptFlagGetter('fixVirtualizeListCollapseWindowSize', false);

/**
 * Function used to enable / disabled Layout Animations in React Native.
 */
export const isLayoutAnimationEnabled: Getter<boolean> = createJavaScriptFlagGetter('isLayoutAnimationEnabled', true);

/**
 * Changes the cleanup of`AnimatedProps` to occur in a microtask instead of synchronously during effect cleanup (for unmount) or subsequent mounts (for updates).
 */
export const scheduleAnimatedCleanupInMicrotask: Getter<boolean> = createJavaScriptFlagGetter('scheduleAnimatedCleanupInMicrotask', false);

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
 * Enable a variant of TextInput that moves some state to refs to avoid unnecessary re-renders
 */
export const useRefsForTextInputState: Getter<boolean> = createJavaScriptFlagGetter('useRefsForTextInputState', false);

/**
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * Common flag for testing (without native implementation). Do NOT modify.
 */
export const commonTestFlagWithoutNativeImplementation: Getter<boolean> = createNativeFlagGetter('commonTestFlagWithoutNativeImplementation', false);
/**
 * Prevent FabricMountingManager from reordering mountitems, which may lead to invalid state on the UI thread
 */
export const disableMountItemReorderingAndroid: Getter<boolean> = createNativeFlagGetter('disableMountItemReorderingAndroid', false);
/**
 * When enabled, Andoid will accumulate updates in rawProps to reduce the number of mounting instructions for cascading rerenders.
 */
export const enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean> = createNativeFlagGetter('enableAccumulatedUpdatesInRawPropsAndroid', false);
/**
 * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer.
 */
export const enableBridgelessArchitecture: Getter<boolean> = createNativeFlagGetter('enableBridgelessArchitecture', false);
/**
 * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
 */
export const enableCppPropsIteratorSetter: Getter<boolean> = createNativeFlagGetter('enableCppPropsIteratorSetter', false);
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
 * iOS Views will clip to their padding box vs border box
 */
export const enableIOSViewClipToPaddingBox: Getter<boolean> = createNativeFlagGetter('enableIOSViewClipToPaddingBox', false);
/**
 * When enabled, Andoid will build and initiate image prefetch requests on ImageShadowNode::layout
 */
export const enableImagePrefetchingAndroid: Getter<boolean> = createNativeFlagGetter('enableImagePrefetchingAndroid', false);
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
 * Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.
 */
export const enableLongTaskAPI: Getter<boolean> = createNativeFlagGetter('enableLongTaskAPI', false);
/**
 * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
 */
export const enableNativeCSSParsing: Getter<boolean> = createNativeFlagGetter('enableNativeCSSParsing', false);
/**
 * Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable
 */
export const enableNewBackgroundAndBorderDrawables: Getter<boolean> = createNativeFlagGetter('enableNewBackgroundAndBorderDrawables', false);
/**
 * Moves execution of pre-mount items to outside the choregrapher in the main thread, so we can estimate idle time more precisely (Android only).
 */
export const enablePreciseSchedulingForPremountItemsOnAndroid: Getter<boolean> = createNativeFlagGetter('enablePreciseSchedulingForPremountItemsOnAndroid', false);
/**
 * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
 */
export const enablePropsUpdateReconciliationAndroid: Getter<boolean> = createNativeFlagGetter('enablePropsUpdateReconciliationAndroid', false);
/**
 * Report paint time inside the Event Timing API implementation (PerformanceObserver).
 */
export const enableReportEventPaintTime: Getter<boolean> = createNativeFlagGetter('enableReportEventPaintTime', false);
/**
 * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
 */
export const enableSynchronousStateUpdates: Getter<boolean> = createNativeFlagGetter('enableSynchronousStateUpdates', false);
/**
 * Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).
 */
export const enableUIConsistency: Getter<boolean> = createNativeFlagGetter('enableUIConsistency', false);
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
 * When enabled, rawProps in Props will not include Yoga specific props.
 */
export const excludeYogaFromRawProps: Getter<boolean> = createNativeFlagGetter('excludeYogaFromRawProps', false);
/**
 * Fixes a bug in Differentiator where parent views may be referenced before they're created
 */
export const fixDifferentiatorEmittingUpdatesWithWrongParentTag: Getter<boolean> = createNativeFlagGetter('fixDifferentiatorEmittingUpdatesWithWrongParentTag', true);
/**
 * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
 */
export const fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean> = createNativeFlagGetter('fixMappingOfEventPrioritiesBetweenFabricAndReact', false);
/**
 * Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.
 */
export const fixMountingCoordinatorReportedPendingTransactionsOnAndroid: Getter<boolean> = createNativeFlagGetter('fixMountingCoordinatorReportedPendingTransactionsOnAndroid', false);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledRelease: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledRelease', false);
/**
 * Enable network inspection support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxNetworkInspectionEnabled: Getter<boolean> = createNativeFlagGetter('fuseboxNetworkInspectionEnabled', false);
/**
 * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
 */
export const lazyAnimationCallbacks: Getter<boolean> = createNativeFlagGetter('lazyAnimationCallbacks', false);
/**
 * When enabled, mutex _turboModuleManagerDelegateMutex in RCTTurboModuleManager will not be used
 */
export const removeTurboModuleManagerDelegateMutex: Getter<boolean> = createNativeFlagGetter('removeTurboModuleManagerDelegateMutex', false);
/**
 * Throw an exception instead of deadlocking when a TurboModule that requires main queue setup is initialized during a synchronous render on iOS.
 */
export const throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS: Getter<boolean> = createNativeFlagGetter('throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS', false);
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
export const useFabricInterop: Getter<boolean> = createNativeFlagGetter('useFabricInterop', false);
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
