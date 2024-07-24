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
    changeOrderOfMountingInstructionsOnAndroid: {
      defaultValue: false,
      description:
        'When enabled, insert of views on Android will be moved from the beginning of the IntBufferBatchMountItem to be after layout updates.',
    },
    completeReactInstanceCreationOnBgThreadOnAndroid: {
      defaultValue: false,
      description:
        'Do not wait for a main-thread dispatch to complete init to start executing work on the JS thread on Android',
    },
    destroyFabricSurfacesInReactInstanceManager: {
      defaultValue: false,
      description:
        'When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().',
    },
    enableAlignItemsBaselineOnFabricIOS: {
      defaultValue: true,
      description:
        'Kill-switch to turn off support for aling-items:baseline on Fabric iOS.',
    },
    enableCleanTextInputYogaNode: {
      defaultValue: false,
      description: 'Clean yoga node when <TextInput /> does not change.',
    },
    enableCppPropsIteratorSetter: {
      defaultValue: false,
      description:
        'Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).',
    },
    enableEagerRootViewAttachment: {
      defaultValue: false,
      description:
        'Feature flag to configure eager attachment of the root view/initialisation of the JS code.',
    },
    enableFabricLogs: {
      defaultValue: false,
      description: 'This feature flag enables logs for Fabric.',
    },
    enableFabricRendererExclusively: {
      defaultValue: false,
      description:
        'When the app is completely migrated to Fabric, set this flag to true to disable parts of Paper infrastructure that are not needed anymore but consume memory and CPU. Specifically, UIViewOperationQueue and EventDispatcherImpl will no longer work as they will not subscribe to ReactChoreographer for updates.',
    },
    enableGranularScrollViewStateUpdatesIOS: {
      defaultValue: false,
      description:
        'When enabled, RCTScrollViewComponentView will trigger ShadowTree state updates for all changes in scroll position.',
    },
    enableGranularShadowTreeStateReconciliation: {
      defaultValue: false,
      description:
        'When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.',
    },
    enableLongTaskAPI: {
      defaultValue: false,
      description:
        'Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.',
    },
    enableMicrotasks: {
      defaultValue: false,
      description:
        'Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).',
    },
    enablePropsUpdateReconciliationAndroid: {
      defaultValue: false,
      description:
        'When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.',
    },
    enableReportEventPaintTime: {
      defaultValue: false,
      description:
        'Report paint time inside the Event Timing API implementation (PerformanceObserver).',
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
    excludeYogaFromRawProps: {
      defaultValue: false,
      description:
        'When enabled, rawProps in Props will not include Yoga specific props.',
    },
    fetchImagesInViewPreallocation: {
      defaultValue: false,
      description:
        'Start image fetching during view preallocation instead of waiting for layout pass',
    },
    fixIncorrectScrollViewStateUpdateOnAndroid: {
      defaultValue: false,
      description:
        'When doing a smooth scroll animation, it stops setting the state with the final scroll position in Fabric before the animation starts.',
    },
    fixMappingOfEventPrioritiesBetweenFabricAndReact: {
      defaultValue: false,
      description:
        'Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.',
    },
    fixMissedFabricStateUpdatesOnAndroid: {
      defaultValue: false,
      description:
        'Enables a fix to prevent the possibility of state updates in Fabric being missed due to race conditions with previous state updates.',
    },
    forceBatchingMountItemsOnAndroid: {
      defaultValue: false,
      description:
        'Forces the mounting layer on Android to always batch mount items instead of dispatching them immediately. This might fix some crashes related to synchronous state updates, where some views dispatch state updates during mount.',
    },
    fuseboxEnabledDebug: {
      defaultValue: true,
      description:
        'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.',
    },
    fuseboxEnabledRelease: {
      defaultValue: false,
      description:
        'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.',
    },
    initEagerTurboModulesOnNativeModulesQueueAndroid: {
      defaultValue: false,
      description:
        'Construct modules that requires eager init on the dedicate native modules thread',
    },
    lazyAnimationCallbacks: {
      defaultValue: false,
      description:
        'Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.',
    },
    loadVectorDrawablesOnImages: {
      defaultValue: false,
      description:
        'Adds support for loading vector drawable assets in the Image component (only on Android)',
    },
    setAndroidLayoutDirection: {
      defaultValue: true,
      description: 'Propagate layout direction to Android views.',
    },
    traceTurboModulePromiseRejectionsOnAndroid: {
      defaultValue: false,
      description:
        'Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.',
    },
    unstable_enableTurboModuleSyncVoidMethods: {
      defaultValue: false,
      description:
        'By default, native module methods that return void run asynchronously. This flag will make execution of void methods in TurboModules stay on the JS thread.',
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
    useNewReactImageViewBackgroundDrawing: {
      defaultValue: false,
      description:
        'Use shared background drawing code for ReactImageView instead of using Fresco to manipulate the bitmap',
    },
    useOptimisedViewPreallocationOnAndroid: {
      defaultValue: false,
      description:
        'Moves more of the work in view preallocation to the main thread to free up JS thread.',
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
    shouldUseSetNativePropsInNativeAnimationsInFabric: {
      defaultValue: false,
      description:
        'Enables use of setNativeProps in Native driven animations in Fabric.',
    },
    usePassiveEffectsForAnimations: {
      defaultValue: false,
      description:
        'Enable a variant of useAnimatedPropsLifecycle hook that constructs the animation graph in passive effect instead of layout effect',
    },
    useRefsForTextInputState: {
      defaultValue: false,
      description:
        'Enable a variant of TextInput that moves some state to refs to avoid unnecessary re-renders',
    },
  },
};

export default definitions;
