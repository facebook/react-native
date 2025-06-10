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
 *   yarn featureflags --update
 */

// These flags are only used in tests for the feature flags system
const testDefinitions: FeatureFlagDefinitions = {
  common: {
    commonTestFlag: {
      defaultValue: false,
      metadata: {
        description: 'Common flag for testing. Do NOT modify.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    commonTestFlagWithoutNativeImplementation: {
      defaultValue: false,
      metadata: {
        description:
          'Common flag for testing (without native implementation). Do NOT modify.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
      skipNativeAPI: true,
    },
  },
  jsOnly: {
    jsOnlyTestFlag: {
      defaultValue: false,
      metadata: {
        description: 'JS-only flag for testing. Do NOT modify.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
  },
};

const definitions: FeatureFlagDefinitions = {
  common: {
    ...testDefinitions.common,
    disableMountItemReorderingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-10-26',
        description:
          'Prevent FabricMountingManager from reordering mountitems, which may lead to invalid state on the UI thread',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableAccumulatedUpdatesInRawPropsAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-12-10',
        description:
          'When enabled, Andoid will accumulate updates in rawProps to reduce the number of mounting instructions for cascading rerenders.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableBridgelessArchitecture: {
      defaultValue: false,
      metadata: {
        description:
          'Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    enableCppPropsIteratorSetter: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-13',
        description:
          'Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableEagerRootViewAttachment: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-28',
        description:
          'Feature flag to configure eager attachment of the root view/initialisation of the JS code.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableFabricLogs: {
      defaultValue: false,
      metadata: {
        description: 'This feature flag enables logs for Fabric.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    enableFabricRenderer: {
      defaultValue: false,
      metadata: {
        description: 'Enables the use of the Fabric renderer in the whole app.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    enableIOSViewClipToPaddingBox: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-30',
        description: 'iOS Views will clip to their padding box vs border box',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableImagePrefetchingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-19',
        description:
          'When enabled, Andoid will build and initiate image prefetch requests on ImageShadowNode::layout',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableJSRuntimeGCOnMemoryPressureOnIOS: {
      defaultValue: false,
      metadata: {
        description: 'Trigger JS runtime GC on memory pressure event on iOS',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableLayoutAnimationsOnAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled, LayoutAnimations API will animate state changes on Android.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableLayoutAnimationsOnIOS: {
      defaultValue: true,
      metadata: {
        description:
          'When enabled, LayoutAnimations API will animate state changes on iOS.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableLongTaskAPI: {
      defaultValue: false,
      metadata: {
        description:
          'Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableNativeCSSParsing: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-02-07',
        description:
          'Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableNewBackgroundAndBorderDrawables: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-24',
        description:
          'Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enablePreciseSchedulingForPremountItemsOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-19',
        description:
          'Moves execution of pre-mount items to outside the choregrapher in the main thread, so we can estimate idle time more precisely (Android only).',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enablePropsUpdateReconciliationAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-12',
        description:
          'When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableReportEventPaintTime: {
      defaultValue: false,
      metadata: {
        description:
          'Report paint time inside the Event Timing API implementation (PerformanceObserver).',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableSynchronousStateUpdates: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-25',
        description:
          'Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableUIConsistency: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-25',
        description:
          'Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewCulling: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-01-27',
        description:
          'Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecycling: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-31',
        description:
          'Enables View Recycling. When enabled, individual ViewManagers must still opt-in.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecyclingForText: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-02-05',
        description:
          'Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecyclingForView: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-02-05',
        description:
          'Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    excludeYogaFromRawProps: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-22',
        description:
          'When enabled, rawProps in Props will not include Yoga specific props.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fixDifferentiatorEmittingUpdatesWithWrongParentTag: {
      defaultValue: true,
      metadata: {
        description:
          "Fixes a bug in Differentiator where parent views may be referenced before they're created",
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    fixMappingOfEventPrioritiesBetweenFabricAndReact: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-06-18',
        description:
          'Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fixMountingCoordinatorReportedPendingTransactionsOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-27',
        description:
          'Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fuseboxEnabledRelease: {
      defaultValue: false,
      metadata: {
        description:
          'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    fuseboxNetworkInspectionEnabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-01-31',
        description:
          'Enable network inspection support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    lazyAnimationCallbacks: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-05-01',
        description:
          'Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    removeTurboModuleManagerDelegateMutex: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-02-24',
        description:
          'When enabled, mutex _turboModuleManagerDelegateMutex in RCTTurboModuleManager will not be used',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-02-18',
        description:
          'Throw an exception instead of deadlocking when a TurboModule that requires main queue setup is initialized during a synchronous render on iOS.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    traceTurboModulePromiseRejectionsOnAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    updateRuntimeShadowNodeReferencesOnCommit: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-04-15',
        description:
          'When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useAlwaysAvailableJSErrorHandling: {
      defaultValue: false,
      metadata: {
        description:
          'In Bridgeless mode, use the always available javascript error reporting pipeline.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    useFabricInterop: {
      defaultValue: false,
      metadata: {
        description:
          'Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    useNativeViewConfigsInBridgelessMode: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-03',
        description:
          'When enabled, the native view configs are used in bridgeless mode.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'canary',
    },
    useOptimizedEventBatchingOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-29',
        description:
          'Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useRawPropsJsiValue: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-12-02',
        description:
          'Instead of using folly::dynamic as internal representation in RawProps and RawValue, use jsi::Value',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useShadowNodeStateOnClone: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-04-16',
        description:
          'Use the state stored on the source shadow node when cloning it instead of reading in the most recent state on the shadow node family.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useTurboModuleInterop: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-28',
        description:
          'In Bridgeless mode, should legacy NativeModules use the TurboModule system?',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'canary',
    },
    useTurboModules: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled, NativeModules will be executed by using the TurboModule system',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
  },

  jsOnly: {
    ...testDefinitions.jsOnly,

    animatedShouldDebounceQueueFlush: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables an experimental flush-queue debouncing in Animated.js.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    animatedShouldUseSingleOp: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    avoidStateUpdateInAnimatedPropsMemo: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-02-05',
        description:
          'Changes `useAnimatedPropsMemo` to avoid state updates to invalidate the cached `AnimatedProps`.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableInteractionManager: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-06',
        description:
          'Disables InteractionManager and replaces its scheduler with `setImmediate`.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableAccessToHostTreeInFabric: {
      defaultValue: false,
      metadata: {
        description:
          'Enables access to the host tree in Fabric using DOM-compatible APIs.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableAnimatedClearImmediateFix: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-09-17',
        description:
          'Enables an experimental to use the proper clearIntermediate instead of calling the wrong clearTimeout and canceling another timer.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableDOMDocumentAPI: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-01-28',
        description:
          'Enables the DOM Document API, exposing instaces of document through `getRootNode` and `ownerDocument`, and providing access to the `documentElement` representing the root node. ' +
          'This flag will be short-lived, only to test the Document API specifically, and then it will be collapsed into the enableAccessToHostTreeInFabric flag.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fixVirtualizeListCollapseWindowSize: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-22',
        description:
          'Fixing an edge case where the current window size is not properly calculated with fast scrolling. Window size collapsed to 1 element even if windowSize more than the current amount of elements',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    isLayoutAnimationEnabled: {
      defaultValue: true,
      metadata: {
        description:
          'Function used to enable / disabled Layout Animations in React Native.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    scheduleAnimatedCleanupInMicrotask: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-01-22',
        description:
          'Changes the cleanup of`AnimatedProps` to occur in a microtask instead of synchronously during effect cleanup (for unmount) or subsequent mounts (for updates).',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    shouldUseAnimatedObjectForTransform: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables use of AnimatedObject for animating transform values.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    shouldUseRemoveClippedSubviewsAsDefaultOnIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    shouldUseSetNativePropsInFabric: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-03-05',
        description: 'Enables use of setNativeProps in JS driven animations.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useRefsForTextInputState: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-08',
        description:
          'Enable a variant of TextInput that moves some state to refs to avoid unnecessary re-renders',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
  },
};

// Keep it as a CommonJS module so we can easily import it from Node.js
module.exports = definitions;
