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
        purpose: 'operational',
      },
    },
    commonTestFlagWithoutNativeImplementation: {
      defaultValue: false,
      metadata: {
        description:
          'Common flag for testing (without native implementation). Do NOT modify.',
        purpose: 'operational',
      },
      skipNativeAPI: true,
    },
  },
  jsOnly: {
    jsOnlyTestFlag: {
      defaultValue: false,
      metadata: {
        description: 'JS-only flag for testing. Do NOT modify.',
        purpose: 'operational',
      },
    },
  },
};

const definitions: FeatureFlagDefinitions = {
  common: {
    ...testDefinitions.common,
    completeReactInstanceCreationOnBgThreadOnAndroid: {
      defaultValue: true,
      metadata: {
        description:
          'Do not wait for a main-thread dispatch to complete init to start executing work on the JS thread on Android',
        purpose: 'release',
      },
    },
    disableEventLoopOnBridgeless: {
      defaultValue: false,
      metadata: {
        description:
          'The bridgeless architecture enables the event loop by default. This feature flag allows us to force disabling it in specific instances.',
        purpose: 'release',
      },
    },
    disableMountItemReorderingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-10-26',
        description:
          'Prevent FabricMountingManager from reordering mountitems, which may lead to invalid state on the UI thread',
        purpose: 'experimentation',
      },
    },
    enableAlignItemsBaselineOnFabricIOS: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-07-10',
        description:
          'Kill-switch to turn off support for aling-items:baseline on Fabric iOS.',
        purpose: 'experimentation',
      },
    },
    enableAndroidLineHeightCentering: {
      defaultValue: true,
      metadata: {
        description:
          'When enabled, custom line height calculation will be centered from top to bottom.',
        purpose: 'release',
      },
    },
    enableBridgelessArchitecture: {
      defaultValue: false,
      metadata: {
        description:
          'Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer.',
        purpose: 'release',
      },
    },
    enableCppPropsIteratorSetter: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-13',
        description:
          'Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).',
        purpose: 'experimentation',
      },
    },
    enableDeletionOfUnmountedViews: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-13',
        description:
          'Deletes views that were pre-allocated but never mounted on the screen.',
        purpose: 'experimentation',
      },
    },
    enableEagerRootViewAttachment: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-28',
        description:
          'Feature flag to configure eager attachment of the root view/initialisation of the JS code.',
        purpose: 'experimentation',
      },
    },
    enableEventEmitterRetentionDuringGesturesOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-08',
        description:
          'Enables the retention of EventEmitterWrapper on Android till the touch gesture is over to fix a bug on pressable (#44610)',
        purpose: 'experimentation',
      },
    },
    enableFabricLogs: {
      defaultValue: false,
      metadata: {
        description: 'This feature flag enables logs for Fabric.',
        purpose: 'operational',
      },
    },
    enableFabricRenderer: {
      defaultValue: false,
      metadata: {
        description: 'Enables the use of the Fabric renderer in the whole app.',
        purpose: 'release',
      },
    },
    enableFabricRendererExclusively: {
      defaultValue: false,
      metadata: {
        description:
          'When the app is completely migrated to Fabric, set this flag to true to disable parts of Paper infrastructure that are not needed anymore but consume memory and CPU. Specifically, UIViewOperationQueue and EventDispatcherImpl will no longer work as they will not subscribe to ReactChoreographer for updates.',
        purpose: 'release',
      },
    },
    enableFixForViewCommandRace: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-14',
        description:
          'Synchronise the view command dispatching with mounting of new transaction',
        purpose: 'experimentation',
      },
    },
    enableGranularShadowTreeStateReconciliation: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-05-01',
        description:
          'When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.',
        purpose: 'experimentation',
      },
    },
    enableIOSViewClipToPaddingBox: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-30',
        description: 'iOS Views will clip to their padding box vs border box',
        purpose: 'experimentation',
      },
    },
    enableLayoutAnimationsOnAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled, LayoutAnimations API will animate state changes on Android.',
        purpose: 'release',
      },
    },
    enableLayoutAnimationsOnIOS: {
      defaultValue: true,
      metadata: {
        description:
          'When enabled, LayoutAnimations API will animate state changes on iOS.',
        purpose: 'release',
      },
    },
    enableLongTaskAPI: {
      defaultValue: false,
      metadata: {
        description:
          'Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.',
        purpose: 'release',
      },
    },
    enableNewBackgroundAndBorderDrawables: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-24',
        description:
          'Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable',
        purpose: 'experimentation',
      },
    },
    enablePreciseSchedulingForPremountItemsOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-19',
        description:
          'Moves execution of pre-mount items to outside the choregrapher in the main thread, so we can estimate idle time more precisely (Android only).',
        purpose: 'experimentation',
      },
    },
    enablePropsUpdateReconciliationAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-12',
        description:
          'When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.',
        purpose: 'experimentation',
      },
    },
    enableReportEventPaintTime: {
      defaultValue: false,
      metadata: {
        description:
          'Report paint time inside the Event Timing API implementation (PerformanceObserver).',
        purpose: 'release',
      },
    },
    enableSynchronousStateUpdates: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-25',
        description:
          'Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).',
        purpose: 'experimentation',
      },
    },
    enableUIConsistency: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-25',
        description:
          'Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).',
        purpose: 'experimentation',
      },
    },
    enableViewRecycling: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-31',
        description:
          'Enables View Recycling. When enabled, individual ViewManagers must still opt-in.',
        purpose: 'experimentation',
      },
    },
    excludeYogaFromRawProps: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-22',
        description:
          'When enabled, rawProps in Props will not include Yoga specific props.',
        purpose: 'experimentation',
      },
    },
    fixMappingOfEventPrioritiesBetweenFabricAndReact: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-06-18',
        description:
          'Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.',
        purpose: 'experimentation',
      },
    },
    fixMountingCoordinatorReportedPendingTransactionsOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-27',
        description:
          'Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.',
        purpose: 'experimentation',
      },
    },
    fuseboxEnabledDebug: {
      defaultValue: true,
      metadata: {
        description:
          'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.',
        purpose: 'release',
      },
    },
    fuseboxEnabledRelease: {
      defaultValue: false,
      metadata: {
        description:
          'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.',
        purpose: 'release',
      },
    },
    initEagerTurboModulesOnNativeModulesQueueAndroid: {
      defaultValue: true,
      metadata: {
        description:
          'Construct modules that requires eager init on the dedicate native modules thread',
        purpose: 'release',
      },
    },
    lazyAnimationCallbacks: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-05-01',
        description:
          'Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.',
        purpose: 'experimentation',
      },
    },
    loadVectorDrawablesOnImages: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-12',
        description:
          'Adds support for loading vector drawable assets in the Image component (only on Android)',
        purpose: 'experimentation',
      },
    },
    traceTurboModulePromiseRejectionsOnAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.',
        purpose: 'operational',
      },
    },
    useAlwaysAvailableJSErrorHandling: {
      defaultValue: false,
      metadata: {
        description:
          'In Bridgeless mode, use the always available javascript error reporting pipeline.',
        purpose: 'release',
      },
    },
    useFabricInterop: {
      defaultValue: false,
      metadata: {
        description:
          'Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.',
        purpose: 'release',
      },
    },
    useImmediateExecutorInAndroidBridgeless: {
      defaultValue: true,
      metadata: {
        description:
          'Invoke callbacks immediately on the ReactInstance rather than going through a background thread for synchronization',
        purpose: 'release',
      },
    },
    useNativeViewConfigsInBridgelessMode: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-03',
        description:
          'When enabled, the native view configs are used in bridgeless mode.',
        purpose: 'experimentation',
      },
    },
    useOptimisedViewPreallocationOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-23',
        description:
          'Moves more of the work in view preallocation to the main thread to free up JS thread.',
        purpose: 'experimentation',
      },
    },
    useOptimizedEventBatchingOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-29',
        description:
          'Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.',
        purpose: 'experimentation',
      },
    },
    useRuntimeShadowNodeReferenceUpdate: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-06-03',
        description:
          'When enabled, cloning shadow nodes within react native will update the reference held by the current JS fiber tree.',
        purpose: 'experimentation',
      },
    },
    useTurboModuleInterop: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-28',
        description:
          'In Bridgeless mode, should legacy NativeModules use the TurboModule system?',
        purpose: 'experimentation',
      },
    },
    useTurboModules: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled, NativeModules will be executed by using the TurboModule system',
        purpose: 'release',
      },
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
        purpose: 'experimentation',
      },
    },
    animatedShouldUseSingleOp: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.',
        purpose: 'experimentation',
      },
    },
    disableInteractionManager: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-06',
        description:
          'Disables InteractionManager and replaces its scheduler with `setImmediate`.',
        purpose: 'experimentation',
      },
    },
    disableInteractionManagerInBatchinator: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-18',
        description:
          'Skips InteractionManager in `Batchinator` and invokes callbacks synchronously.',
        purpose: 'experimentation',
      },
    },
    enableAccessToHostTreeInFabric: {
      defaultValue: false,
      metadata: {
        description:
          'Enables access to the host tree in Fabric using DOM-compatible APIs.',
        purpose: 'release',
      },
    },
    enableAnimatedAllowlist: {
      defaultValue: true,
      metadata: {
        description:
          'Enables Animated to skip non-allowlisted props and styles.',
        purpose: 'release',
      },
    },
    enableAnimatedClearImmediateFix: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-09-17',
        description:
          'Enables an experimental to use the proper clearIntermediate instead of calling the wrong clearTimeout and canceling another timer.',
        purpose: 'experimentation',
      },
    },
    enableAnimatedPropsMemo: {
      defaultValue: true,
      metadata: {
        description:
          'Enables Animated to analyze props to minimize invalidating `AnimatedProps`.',
        purpose: 'release',
      },
    },
    isLayoutAnimationEnabled: {
      defaultValue: true,
      metadata: {
        description:
          'Function used to enable / disabled Layout Animations in React Native.',
        purpose: 'release',
      },
    },
    shouldSkipStateUpdatesForLoopingAnimations: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-25',
        description:
          'If the animation is within Animated.loop, we do not send state updates to React.',
        purpose: 'experimentation',
      },
    },
    shouldUseAnimatedObjectForTransform: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables use of AnimatedObject for animating transform values.',
        purpose: 'experimentation',
      },
    },
    shouldUseRemoveClippedSubviewsAsDefaultOnIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android',
        purpose: 'experimentation',
      },
    },
    shouldUseSetNativePropsInFabric: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-03-05',
        description: 'Enables use of setNativeProps in JS driven animations.',
        purpose: 'experimentation',
      },
    },
    useInsertionEffectsForAnimations: {
      defaultValue: false,
      metadata: {
        description:
          'Changes construction of the animation graph to `useInsertionEffect` instead of `useLayoutEffect`.',
        purpose: 'release',
      },
    },
    useRefsForTextInputState: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-08',
        description:
          'Enable a variant of TextInput that moves some state to refs to avoid unnecessary re-renders',
        purpose: 'experimentation',
      },
    },
  },
};

// Keep it as a CommonJS module so we can easily import it from Node.js
module.exports = definitions;
