/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ee6090277aad4b98818b1a3ecb913a23>>
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
  batchRenderingUpdatesInEventLoop: Getter<boolean>,
  enableBackgroundExecutor: Getter<boolean>,
  enableCleanTextInputYogaNode: Getter<boolean>,
  enableCustomDrawOrderFabric: Getter<boolean>,
  enableFixForClippedSubviewsCrash: Getter<boolean>,
  enableMicrotasks: Getter<boolean>,
  enableMountHooksAndroid: Getter<boolean>,
  enableSpannableBuildingUnification: Getter<boolean>,
  enableSynchronousStateUpdates: Getter<boolean>,
  enableUIConsistency: Getter<boolean>,
  inspectorEnableCxxInspectorPackagerConnection: Getter<boolean>,
  inspectorEnableModernCDPRegistry: Getter<boolean>,
  useModernRuntimeScheduler: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
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
 * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
 */
export const batchRenderingUpdatesInEventLoop: Getter<boolean> = createNativeFlagGetter('batchRenderingUpdatesInEventLoop', false);
/**
 * Enables the use of a background executor to compute layout and commit updates on Fabric (this system is deprecated and should not be used).
 */
export const enableBackgroundExecutor: Getter<boolean> = createNativeFlagGetter('enableBackgroundExecutor', false);
/**
 * Clean yoga node when <TextInput /> does not change.
 */
export const enableCleanTextInputYogaNode: Getter<boolean> = createNativeFlagGetter('enableCleanTextInputYogaNode', false);
/**
 * When enabled, Fabric will use customDrawOrder in ReactViewGroup (similar to old architecture).
 */
export const enableCustomDrawOrderFabric: Getter<boolean> = createNativeFlagGetter('enableCustomDrawOrderFabric', false);
/**
 * Attempt at fixing a crash related to subview clipping on Android. This is a kill switch for the fix
 */
export const enableFixForClippedSubviewsCrash: Getter<boolean> = createNativeFlagGetter('enableFixForClippedSubviewsCrash', false);
/**
 * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
 */
export const enableMicrotasks: Getter<boolean> = createNativeFlagGetter('enableMicrotasks', false);
/**
 * Enables the notification of mount operations to mount hooks on Android.
 */
export const enableMountHooksAndroid: Getter<boolean> = createNativeFlagGetter('enableMountHooksAndroid', false);
/**
 * Uses new, deduplicated logic for constructing Android Spannables from text fragments
 */
export const enableSpannableBuildingUnification: Getter<boolean> = createNativeFlagGetter('enableSpannableBuildingUnification', false);
/**
 * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
 */
export const enableSynchronousStateUpdates: Getter<boolean> = createNativeFlagGetter('enableSynchronousStateUpdates', false);
/**
 * Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).
 */
export const enableUIConsistency: Getter<boolean> = createNativeFlagGetter('enableUIConsistency', false);
/**
 * Flag determining if the C++ implementation of InspectorPackagerConnection should be used instead of the per-platform one. This flag is global and should not be changed across React Host lifetimes.
 */
export const inspectorEnableCxxInspectorPackagerConnection: Getter<boolean> = createNativeFlagGetter('inspectorEnableCxxInspectorPackagerConnection', false);
/**
 * Flag determining if the modern CDP backend should be enabled. This flag is global and should not be changed across React Host lifetimes.
 */
export const inspectorEnableModernCDPRegistry: Getter<boolean> = createNativeFlagGetter('inspectorEnableModernCDPRegistry', false);
/**
 * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
 */
export const useModernRuntimeScheduler: Getter<boolean> = createNativeFlagGetter('useModernRuntimeScheduler', false);
/**
 * When enabled, the native view configs are used in bridgeless mode.
 */
export const useNativeViewConfigsInBridgelessMode: Getter<boolean> = createNativeFlagGetter('useNativeViewConfigsInBridgelessMode', false);

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
