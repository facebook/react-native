/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/* eslint sort-keys: 'error' */

import type {FeatureFlagDefinitions} from './types';

/**
 * This is the source of truth for React Native feature flags.
 *
 * If you modify this file, you need to update all the generated files
 * running the following script from the repo root:
 *   yarn featureflags-update
 */

// These flags are only used in tests for the feature flags system
const testDefinitions: FeatureFlagDefinitions = {
  common: {
    commonTestFlag: {
      defaultValue: false,
      description: 'Common flag for testing. Do NOT modify.',
    },
  },
  jsOnly: {
    jsOnlyTestFlag: {
      defaultValue: false,
      description: 'JS-only flag for testing. Do NOT modify.',
    },
  },
};

const definitions: FeatureFlagDefinitions = {
  common: {
    ...testDefinitions.common,
    allowCollapsableChildren: {
      defaultValue: true,
      description:
        'Enables the differentiator to understand the "collapsableChildren" prop',
    },
    allowRecursiveCommitsWithSynchronousMountOnAndroid: {
      defaultValue: false,
      description:
        'Adds support for recursively processing commits that mount synchronously (Android only).',
    },
    batchRenderingUpdatesInEventLoop: {
      defaultValue: false,
      description:
        'When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.',
    },
    destroyFabricSurfacesInReactInstanceManager: {
      defaultValue: false,
      description:
        'When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().',
    },
    enableBackgroundExecutor: {
      defaultValue: false,
      description:
        'Enables the use of a background executor to compute layout and commit updates on Fabric (this system is deprecated and should not be used).',
    },
    enableCleanTextInputYogaNode: {
      defaultValue: false,
      description: 'Clean yoga node when <TextInput /> does not change.',
    },
    enableGranularShadowTreeStateReconciliation: {
      defaultValue: false,
      description:
        'When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.',
    },
    enableMicrotasks: {
      defaultValue: false,
      description:
        'Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).',
    },
    enableSynchronousStateUpdates: {
      defaultValue: false,
      description:
        'Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).',
    },
    enableUIConsistency: {
      defaultValue: false,
      description:
        'Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).',
    },
    fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak: {
      defaultValue: false,
      description:
        'Fixes a leak in SurfaceMountingManager.mRemoveDeleteTreeUIFrameCallback',
    },
    forceBatchingMountItemsOnAndroid: {
      defaultValue: false,
      description:
        'Forces the mounting layer on Android to always batch mount items instead of dispatching them immediately. This might fix some crashes related to synchronous state updates, where some views dispatch state updates during mount.',
    },
    fuseboxEnabledDebug: {
      defaultValue: false,
      description:
        'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.',
    },
    fuseboxEnabledRelease: {
      defaultValue: false,
      description:
        'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.',
    },
    lazyAnimationCallbacks: {
      defaultValue: false,
      description:
        'Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.',
    },
    preventDoubleTextMeasure: {
      defaultValue: true,
      description:
        'When enabled, ParagraphShadowNode will no longer call measure twice.',
    },
    setAndroidLayoutDirection: {
      defaultValue: false,
      description: 'Propagate layout direction to Android views.',
    },
    useImmediateExecutorInAndroidBridgeless: {
      defaultValue: false,
      description:
        'Invoke callbacks immediately on the ReactInstance rather than going through a background thread for synchronization',
    },
    useModernRuntimeScheduler: {
      defaultValue: false,
      description:
        'When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.',
    },
    useNativeViewConfigsInBridgelessMode: {
      defaultValue: false,
      description:
        'When enabled, the native view configs are used in bridgeless mode.',
    },
    useRuntimeShadowNodeReferenceUpdate: {
      defaultValue: false,
      description:
        'When enabled, cloning shadow nodes within react native will update the reference held by the current JS fiber tree.',
    },
    useRuntimeShadowNodeReferenceUpdateOnLayout: {
      defaultValue: false,
      description:
        'When enabled, cloning shadow nodes during layout will update the reference held by the current JS fiber tree.',
    },
    useStateAlignmentMechanism: {
      defaultValue: false,
      description:
        'When enabled, it uses optimised state reconciliation algorithm.',
    },
  },

  jsOnly: {
    ...testDefinitions.jsOnly,

    animatedShouldDebounceQueueFlush: {
      defaultValue: false,
      description:
        'Enables an experimental flush-queue debouncing in Animated.js.',
    },
    animatedShouldUseSingleOp: {
      defaultValue: false,
      description:
        'Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.',
    },
    enableAccessToHostTreeInFabric: {
      defaultValue: false,
      description:
        'Enables access to the host tree in Fabric using DOM-compatible APIs.',
    },
    isLayoutAnimationEnabled: {
      defaultValue: true,
      description:
        'Function used to enable / disabled Layout Animations in React Native.',
    },
    shouldUseAnimatedObjectForTransform: {
      defaultValue: false,
      description:
        'Enables use of AnimatedObject for animating transform values.',
    },
    shouldUseRemoveClippedSubviewsAsDefaultOnIOS: {
      defaultValue: false,
      description:
        'removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android',
    },
    shouldUseSetNativePropsInFabric: {
      defaultValue: true,
      description: 'Enables use of setNativeProps in JS driven animations.',
    },
  },
};

export default definitions;
