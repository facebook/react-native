/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<870e25c844e692bb04ee49fe20cd3baf>>
 * @flow strict-local
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
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = {
  jsOnlyTestFlag: Getter<boolean>,
  animatedShouldDebounceQueueFlush: Getter<boolean>,
  animatedShouldUseSingleOp: Getter<boolean>,
  enableAccessToHostTreeInFabric: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
};

export type ReactNativeFeatureFlagsJsOnlyOverrides = Partial<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = {
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  allowCollapsableChildren: Getter<boolean>,
  allowRecursiveCommitsWithSynchronousMountOnAndroid: Getter<boolean>,
  batchRenderingUpdatesInEventLoop: Getter<boolean>,
  destroyFabricSurfacesInReactInstanceManager: Getter<boolean>,
  enableBackgroundExecutor: Getter<boolean>,
  enableCleanTextInputYogaNode: Getter<boolean>,
  enableGranularShadowTreeStateReconciliation: Getter<boolean>,
  enableMicrotasks: Getter<boolean>,
  enableSynchronousStateUpdates: Getter<boolean>,
  enableUIConsistency: Getter<boolean>,
  fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak: Getter<boolean>,
  forceBatchingMountItemsOnAndroid: Getter<boolean>,
  fuseboxEnabledDebug: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  lazyAnimationCallbacks: Getter<boolean>,
  preventDoubleTextMeasure: Getter<boolean>,
  setAndroidLayoutDirection: Getter<boolean>,
  useImmediateExecutorInAndroidBridgeless: Getter<boolean>,
  useModernRuntimeScheduler: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
  useRuntimeShadowNodeReferenceUpdate: Getter<boolean>,
  useRuntimeShadowNodeReferenceUpdateOnLayout: Getter<boolean>,
  useStateAlignmentMechanism: Getter<boolean>,
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
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * Enables the differentiator to understand the "collapsableChildren" prop
 */
export const allowCollapsableChildren: Getter<boolean> = createNativeFlagGetter('allowCollapsableChildren', true);
/**
 * Adds support for recursively processing commits that mount synchronously (Android only).
 */
export const allowRecursiveCommitsWithSynchronousMountOnAndroid: Getter<boolean> = createNativeFlagGetter('allowRecursiveCommitsWithSynchronousMountOnAndroid', false);
/**
 * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
 */
export const batchRenderingUpdatesInEventLoop: Getter<boolean> = createNativeFlagGetter('batchRenderingUpdatesInEventLoop', false);
/**
 * When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().
 */
export const destroyFabricSurfacesInReactInstanceManager: Getter<boolean> = createNativeFlagGetter('destroyFabricSurfacesInReactInstanceManager', false);
/**
 * Enables the use of a background executor to compute layout and commit updates on Fabric (this system is deprecated and should not be used).
 */
export const enableBackgroundExecutor: Getter<boolean> = createNativeFlagGetter('enableBackgroundExecutor', false);
/**
 * Clean yoga node when <TextInput /> does not change.
 */
export const enableCleanTextInputYogaNode: Getter<boolean> = createNativeFlagGetter('enableCleanTextInputYogaNode', false);
/**
 * When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.
 */
export const enableGranularShadowTreeStateReconciliation: Getter<boolean> = createNativeFlagGetter('enableGranularShadowTreeStateReconciliation', false);
/**
 * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
 */
export const enableMicrotasks: Getter<boolean> = createNativeFlagGetter('enableMicrotasks', false);
/**
 * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
 */
export const enableSynchronousStateUpdates: Getter<boolean> = createNativeFlagGetter('enableSynchronousStateUpdates', false);
/**
 * Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).
 */
export const enableUIConsistency: Getter<boolean> = createNativeFlagGetter('enableUIConsistency', false);
/**
 * Fixes a leak in SurfaceMountingManager.mRemoveDeleteTreeUIFrameCallback
 */
export const fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak: Getter<boolean> = createNativeFlagGetter('fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak', false);
/**
 * Forces the mounting layer on Android to always batch mount items instead of dispatching them immediately. This might fix some crashes related to synchronous state updates, where some views dispatch state updates during mount.
 */
export const forceBatchingMountItemsOnAndroid: Getter<boolean> = createNativeFlagGetter('forceBatchingMountItemsOnAndroid', false);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledDebug: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledDebug', false);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledRelease: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledRelease', false);
/**
 * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
 */
export const lazyAnimationCallbacks: Getter<boolean> = createNativeFlagGetter('lazyAnimationCallbacks', false);
/**
 * When enabled, ParagraphShadowNode will no longer call measure twice.
 */
export const preventDoubleTextMeasure: Getter<boolean> = createNativeFlagGetter('preventDoubleTextMeasure', true);
/**
 * Propagate layout direction to Android views.
 */
export const setAndroidLayoutDirection: Getter<boolean> = createNativeFlagGetter('setAndroidLayoutDirection', false);
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
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
