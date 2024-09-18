/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<0bc6eb9982c84fc359957413cc26dd12>>
 * @flow strict
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

import {
  type Getter,
  type OverridesFor,
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = {
  jsOnlyTestFlag: Getter<boolean>,
  animatedShouldDebounceQueueFlush: Getter<boolean>,
  animatedShouldUseSingleOp: Getter<boolean>,
  enableAccessToHostTreeInFabric: Getter<boolean>,
  enableAnimatedAllowlist: Getter<boolean>,
  enableAnimatedClearImmediateFix: Getter<boolean>,
  enableAnimatedPropsMemo: Getter<boolean>,
  enableOptimisedVirtualizedCells: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
  shouldUseSetNativePropsInNativeAnimationsInFabric: Getter<boolean>,
  useInsertionEffectsForAnimations: Getter<boolean>,
  useRefsForTextInputState: Getter<boolean>,
};

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = {
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  allowRecursiveCommitsWithSynchronousMountOnAndroid: Getter<boolean>,
  batchRenderingUpdatesInEventLoop: Getter<boolean>,
  completeReactInstanceCreationOnBgThreadOnAndroid: Getter<boolean>,
  destroyFabricSurfacesInReactInstanceManager: Getter<boolean>,
  enableAlignItemsBaselineOnFabricIOS: Getter<boolean>,
  enableAndroidLineHeightCentering: Getter<boolean>,
  enableAndroidMixBlendModeProp: Getter<boolean>,
  enableBackgroundStyleApplicator: Getter<boolean>,
  enableCleanTextInputYogaNode: Getter<boolean>,
  enableDeletionOfUnmountedViews: Getter<boolean>,
  enableEagerRootViewAttachment: Getter<boolean>,
  enableEventEmitterRetentionDuringGesturesOnAndroid: Getter<boolean>,
  enableFabricLogs: Getter<boolean>,
  enableFabricRendererExclusively: Getter<boolean>,
  enableGranularShadowTreeStateReconciliation: Getter<boolean>,
  enableIOSViewClipToPaddingBox: Getter<boolean>,
  enableLayoutAnimationsOnIOS: Getter<boolean>,
  enableLongTaskAPI: Getter<boolean>,
  enableMicrotasks: Getter<boolean>,
  enablePropsUpdateReconciliationAndroid: Getter<boolean>,
  enableReportEventPaintTime: Getter<boolean>,
  enableSynchronousStateUpdates: Getter<boolean>,
  enableTextPreallocationOptimisation: Getter<boolean>,
  enableUIConsistency: Getter<boolean>,
  enableViewRecycling: Getter<boolean>,
  excludeYogaFromRawProps: Getter<boolean>,
  fetchImagesInViewPreallocation: Getter<boolean>,
  fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean>,
  fixMountingCoordinatorReportedPendingTransactionsOnAndroid: Getter<boolean>,
  forceBatchingMountItemsOnAndroid: Getter<boolean>,
  fuseboxEnabledDebug: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  initEagerTurboModulesOnNativeModulesQueueAndroid: Getter<boolean>,
  lazyAnimationCallbacks: Getter<boolean>,
  loadVectorDrawablesOnImages: Getter<boolean>,
  removeNestedCallsToDispatchMountItemsOnAndroid: Getter<boolean>,
  setAndroidLayoutDirection: Getter<boolean>,
  traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean>,
  useFabricInterop: Getter<boolean>,
  useImmediateExecutorInAndroidBridgeless: Getter<boolean>,
  useModernRuntimeScheduler: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
  useNewReactImageViewBackgroundDrawing: Getter<boolean>,
  useOptimisedViewPreallocationOnAndroid: Getter<boolean>,
  useOptimizedEventBatchingOnAndroid: Getter<boolean>,
  useRuntimeShadowNodeReferenceUpdate: Getter<boolean>,
  useRuntimeShadowNodeReferenceUpdateOnLayout: Getter<boolean>,
  useStateAlignmentMechanism: Getter<boolean>,
  useTurboModuleInterop: Getter<boolean>,
}

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
 * Enables access to the host tree in Fabric using DOM-compatible APIs.
 */
export const enableAccessToHostTreeInFabric: Getter<boolean> = createJavaScriptFlagGetter('enableAccessToHostTreeInFabric', false);

/**
 * Enables Animated to skip non-allowlisted props and styles.
 */
export const enableAnimatedAllowlist: Getter<boolean> = createJavaScriptFlagGetter('enableAnimatedAllowlist', false);

/**
 * Enables an experimental to use the proper clearIntermediate instead of calling the wrong clearTimeout and canceling another timer.
 */
export const enableAnimatedClearImmediateFix: Getter<boolean> = createJavaScriptFlagGetter('enableAnimatedClearImmediateFix', true);

/**
 * Enables Animated to analyze props to minimize invalidating `AnimatedProps`.
 */
export const enableAnimatedPropsMemo: Getter<boolean> = createJavaScriptFlagGetter('enableAnimatedPropsMemo', false);

/**
 * Removing unnecessary rerenders Virtualized cells after any rerenders of Virualized list. Works with strict=true option
 */
export const enableOptimisedVirtualizedCells: Getter<boolean> = createJavaScriptFlagGetter('enableOptimisedVirtualizedCells', false);

/**
 * Function used to enable / disabled Layout Animations in React Native.
 */
export const isLayoutAnimationEnabled: Getter<boolean> = createJavaScriptFlagGetter('isLayoutAnimationEnabled', true);

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
 * Enables use of setNativeProps in Native driven animations in Fabric.
 */
export const shouldUseSetNativePropsInNativeAnimationsInFabric: Getter<boolean> = createJavaScriptFlagGetter('shouldUseSetNativePropsInNativeAnimationsInFabric', false);

/**
 * Changes construction of the animation graph to `useInsertionEffect` instead of `useLayoutEffect`.
 */
export const useInsertionEffectsForAnimations: Getter<boolean> = createJavaScriptFlagGetter('useInsertionEffectsForAnimations', false);

/**
 * Enable a variant of TextInput that moves some state to refs to avoid unnecessary re-renders
 */
export const useRefsForTextInputState: Getter<boolean> = createJavaScriptFlagGetter('useRefsForTextInputState', false);

/**
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * Adds support for recursively processing commits that mount synchronously (Android only).
 */
export const allowRecursiveCommitsWithSynchronousMountOnAndroid: Getter<boolean> = createNativeFlagGetter('allowRecursiveCommitsWithSynchronousMountOnAndroid', false);
/**
 * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
 */
export const batchRenderingUpdatesInEventLoop: Getter<boolean> = createNativeFlagGetter('batchRenderingUpdatesInEventLoop', false);
/**
 * Do not wait for a main-thread dispatch to complete init to start executing work on the JS thread on Android
 */
export const completeReactInstanceCreationOnBgThreadOnAndroid: Getter<boolean> = createNativeFlagGetter('completeReactInstanceCreationOnBgThreadOnAndroid', false);
/**
 * When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().
 */
export const destroyFabricSurfacesInReactInstanceManager: Getter<boolean> = createNativeFlagGetter('destroyFabricSurfacesInReactInstanceManager', false);
/**
 * Kill-switch to turn off support for aling-items:baseline on Fabric iOS.
 */
export const enableAlignItemsBaselineOnFabricIOS: Getter<boolean> = createNativeFlagGetter('enableAlignItemsBaselineOnFabricIOS', true);
/**
 * When enabled, custom line height calculation will be centered from top to bottom.
 */
export const enableAndroidLineHeightCentering: Getter<boolean> = createNativeFlagGetter('enableAndroidLineHeightCentering', false);
/**
 * Enables mix-blend-mode prop on Android.
 */
export const enableAndroidMixBlendModeProp: Getter<boolean> = createNativeFlagGetter('enableAndroidMixBlendModeProp', false);
/**
 * Use BackgroundStyleApplicator in place of other background/border drawing code
 */
export const enableBackgroundStyleApplicator: Getter<boolean> = createNativeFlagGetter('enableBackgroundStyleApplicator', true);
/**
 * Clean yoga node when <TextInput /> does not change.
 */
export const enableCleanTextInputYogaNode: Getter<boolean> = createNativeFlagGetter('enableCleanTextInputYogaNode', false);
/**
 * Deletes views that were pre-allocated but never mounted on the screen.
 */
export const enableDeletionOfUnmountedViews: Getter<boolean> = createNativeFlagGetter('enableDeletionOfUnmountedViews', false);
/**
 * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
 */
export const enableEagerRootViewAttachment: Getter<boolean> = createNativeFlagGetter('enableEagerRootViewAttachment', false);
/**
 * Enables the retention of EventEmitterWrapper on Android till the touch gesture is over to fix a bug on pressable (#44610)
 */
export const enableEventEmitterRetentionDuringGesturesOnAndroid: Getter<boolean> = createNativeFlagGetter('enableEventEmitterRetentionDuringGesturesOnAndroid', false);
/**
 * This feature flag enables logs for Fabric.
 */
export const enableFabricLogs: Getter<boolean> = createNativeFlagGetter('enableFabricLogs', false);
/**
 * When the app is completely migrated to Fabric, set this flag to true to disable parts of Paper infrastructure that are not needed anymore but consume memory and CPU. Specifically, UIViewOperationQueue and EventDispatcherImpl will no longer work as they will not subscribe to ReactChoreographer for updates.
 */
export const enableFabricRendererExclusively: Getter<boolean> = createNativeFlagGetter('enableFabricRendererExclusively', false);
/**
 * When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.
 */
export const enableGranularShadowTreeStateReconciliation: Getter<boolean> = createNativeFlagGetter('enableGranularShadowTreeStateReconciliation', false);
/**
 * iOS Views will clip to their padding box vs border box
 */
export const enableIOSViewClipToPaddingBox: Getter<boolean> = createNativeFlagGetter('enableIOSViewClipToPaddingBox', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on iOS.
 */
export const enableLayoutAnimationsOnIOS: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnIOS', true);
/**
 * Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.
 */
export const enableLongTaskAPI: Getter<boolean> = createNativeFlagGetter('enableLongTaskAPI', false);
/**
 * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
 */
export const enableMicrotasks: Getter<boolean> = createNativeFlagGetter('enableMicrotasks', false);
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
 * Text preallocation optimisation where unnecessary work is removed.
 */
export const enableTextPreallocationOptimisation: Getter<boolean> = createNativeFlagGetter('enableTextPreallocationOptimisation', false);
/**
 * Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).
 */
export const enableUIConsistency: Getter<boolean> = createNativeFlagGetter('enableUIConsistency', false);
/**
 * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
 */
export const enableViewRecycling: Getter<boolean> = createNativeFlagGetter('enableViewRecycling', false);
/**
 * When enabled, rawProps in Props will not include Yoga specific props.
 */
export const excludeYogaFromRawProps: Getter<boolean> = createNativeFlagGetter('excludeYogaFromRawProps', false);
/**
 * Start image fetching during view preallocation instead of waiting for layout pass
 */
export const fetchImagesInViewPreallocation: Getter<boolean> = createNativeFlagGetter('fetchImagesInViewPreallocation', false);
/**
 * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
 */
export const fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean> = createNativeFlagGetter('fixMappingOfEventPrioritiesBetweenFabricAndReact', false);
/**
 * Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.
 */
export const fixMountingCoordinatorReportedPendingTransactionsOnAndroid: Getter<boolean> = createNativeFlagGetter('fixMountingCoordinatorReportedPendingTransactionsOnAndroid', false);
/**
 * Forces the mounting layer on Android to always batch mount items instead of dispatching them immediately. This might fix some crashes related to synchronous state updates, where some views dispatch state updates during mount.
 */
export const forceBatchingMountItemsOnAndroid: Getter<boolean> = createNativeFlagGetter('forceBatchingMountItemsOnAndroid', false);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledDebug: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledDebug', true);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledRelease: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledRelease', false);
/**
 * Construct modules that requires eager init on the dedicate native modules thread
 */
export const initEagerTurboModulesOnNativeModulesQueueAndroid: Getter<boolean> = createNativeFlagGetter('initEagerTurboModulesOnNativeModulesQueueAndroid', false);
/**
 * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
 */
export const lazyAnimationCallbacks: Getter<boolean> = createNativeFlagGetter('lazyAnimationCallbacks', false);
/**
 * Adds support for loading vector drawable assets in the Image component (only on Android)
 */
export const loadVectorDrawablesOnImages: Getter<boolean> = createNativeFlagGetter('loadVectorDrawablesOnImages', false);
/**
 * Removes nested calls to MountItemDispatcher.dispatchMountItems on Android, so we do less work per frame on the UI thread.
 */
export const removeNestedCallsToDispatchMountItemsOnAndroid: Getter<boolean> = createNativeFlagGetter('removeNestedCallsToDispatchMountItemsOnAndroid', false);
/**
 * Propagate layout direction to Android views.
 */
export const setAndroidLayoutDirection: Getter<boolean> = createNativeFlagGetter('setAndroidLayoutDirection', false);
/**
 * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
 */
export const traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean> = createNativeFlagGetter('traceTurboModulePromiseRejectionsOnAndroid', false);
/**
 * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
 */
export const useFabricInterop: Getter<boolean> = createNativeFlagGetter('useFabricInterop', false);
/**
 * Invoke callbacks immediately on the ReactInstance rather than going through a background thread for synchronization
 */
export const useImmediateExecutorInAndroidBridgeless: Getter<boolean> = createNativeFlagGetter('useImmediateExecutorInAndroidBridgeless', false);
/**
 * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
 */
export const useModernRuntimeScheduler: Getter<boolean> = createNativeFlagGetter('useModernRuntimeScheduler', false);
/**
 * When enabled, the native view configs are used in bridgeless mode.
 */
export const useNativeViewConfigsInBridgelessMode: Getter<boolean> = createNativeFlagGetter('useNativeViewConfigsInBridgelessMode', false);
/**
 * Use shared background drawing code for ReactImageView instead of using Fresco to manipulate the bitmap
 */
export const useNewReactImageViewBackgroundDrawing: Getter<boolean> = createNativeFlagGetter('useNewReactImageViewBackgroundDrawing', false);
/**
 * Moves more of the work in view preallocation to the main thread to free up JS thread.
 */
export const useOptimisedViewPreallocationOnAndroid: Getter<boolean> = createNativeFlagGetter('useOptimisedViewPreallocationOnAndroid', false);
/**
 * Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.
 */
export const useOptimizedEventBatchingOnAndroid: Getter<boolean> = createNativeFlagGetter('useOptimizedEventBatchingOnAndroid', false);
/**
 * When enabled, cloning shadow nodes within react native will update the reference held by the current JS fiber tree.
 */
export const useRuntimeShadowNodeReferenceUpdate: Getter<boolean> = createNativeFlagGetter('useRuntimeShadowNodeReferenceUpdate', false);
/**
 * When enabled, cloning shadow nodes during layout will update the reference held by the current JS fiber tree.
 */
export const useRuntimeShadowNodeReferenceUpdateOnLayout: Getter<boolean> = createNativeFlagGetter('useRuntimeShadowNodeReferenceUpdateOnLayout', false);
/**
 * When enabled, it uses optimised state reconciliation algorithm.
 */
export const useStateAlignmentMechanism: Getter<boolean> = createNativeFlagGetter('useStateAlignmentMechanism', false);
/**
 * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
 */
export const useTurboModuleInterop: Getter<boolean> = createNativeFlagGetter('useTurboModuleInterop', false);

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
