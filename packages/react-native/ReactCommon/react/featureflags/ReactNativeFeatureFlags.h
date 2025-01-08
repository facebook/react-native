/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<8c40f45357799de60f939b510f1d2ae5>>
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

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

/**
 * This class provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe (as long as the methods in the overridden
 * provider are).
 */
class ReactNativeFeatureFlags {
 public:
  /**
   * Common flag for testing. Do NOT modify.
   */
  RN_EXPORT static bool commonTestFlag();

  /**
   * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
   */
  RN_EXPORT static bool batchRenderingUpdatesInEventLoop();

  /**
   * Do not wait for a main-thread dispatch to complete init to start executing work on the JS thread on Android
   */
  RN_EXPORT static bool completeReactInstanceCreationOnBgThreadOnAndroid();

  /**
   * When enabled, ReactInstanceManager will clean up Fabric surfaces on destroy().
   */
  RN_EXPORT static bool destroyFabricSurfacesInReactInstanceManager();

  /**
   * Kill-switch to turn off support for aling-items:baseline on Fabric iOS.
   */
  RN_EXPORT static bool enableAlignItemsBaselineOnFabricIOS();

  /**
   * Enables mix-blend-mode prop on Android.
   */
  RN_EXPORT static bool enableAndroidMixBlendModeProp();

  /**
   * Use BackgroundStyleApplicator in place of other background/border drawing code
   */
  RN_EXPORT static bool enableBackgroundStyleApplicator();

  /**
   * Clean yoga node when <TextInput /> does not change.
   */
  RN_EXPORT static bool enableCleanTextInputYogaNode();

  /**
   * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
   */
  RN_EXPORT static bool enableEagerRootViewAttachment();

  /**
   * Enables the retention of EventEmitterWrapper on Android till the touch gesture is over to fix a bug on pressable (#44610)
   */
  RN_EXPORT static bool enableEventEmitterRetentionDuringGesturesOnAndroid();

  /**
   * This feature flag enables logs for Fabric.
   */
  RN_EXPORT static bool enableFabricLogs();

  /**
   * When the app is completely migrated to Fabric, set this flag to true to disable parts of Paper infrastructure that are not needed anymore but consume memory and CPU. Specifically, UIViewOperationQueue and EventDispatcherImpl will no longer work as they will not subscribe to ReactChoreographer for updates.
   */
  RN_EXPORT static bool enableFabricRendererExclusively();

  /**
   * When enabled, the renderer would only fail commits when they propagate state and the last commit that updated state changed before committing.
   */
  RN_EXPORT static bool enableGranularShadowTreeStateReconciliation();

  /**
   * iOS Views will clip to their padding box vs border box
   */
  RN_EXPORT static bool enableIOSViewClipToPaddingBox();

  /**
   * When enabled, LayoutAnimations API will animate state changes on iOS.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnIOS();

  /**
   * Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.
   */
  RN_EXPORT static bool enableLongTaskAPI();

  /**
   * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
   */
  RN_EXPORT static bool enableMicrotasks();

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  RN_EXPORT static bool enablePropsUpdateReconciliationAndroid();

  /**
   * Report paint time inside the Event Timing API implementation (PerformanceObserver).
   */
  RN_EXPORT static bool enableReportEventPaintTime();

  /**
   * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
   */
  RN_EXPORT static bool enableSynchronousStateUpdates();

  /**
   * Ensures that JavaScript always has a consistent view of the state of the UI (e.g.: commits done in other threads are not immediately propagated to JS during its execution).
   */
  RN_EXPORT static bool enableUIConsistency();

  /**
   * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
   */
  RN_EXPORT static bool enableViewRecycling();

  /**
   * When enabled, rawProps in Props will not include Yoga specific props.
   */
  RN_EXPORT static bool excludeYogaFromRawProps();

  /**
   * Start image fetching during view preallocation instead of waiting for layout pass
   */
  RN_EXPORT static bool fetchImagesInViewPreallocation();

  /**
   * When doing a smooth scroll animation, it stops setting the state with the final scroll position in Fabric before the animation starts.
   */
  RN_EXPORT static bool fixIncorrectScrollViewStateUpdateOnAndroid();

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  RN_EXPORT static bool fixMappingOfEventPrioritiesBetweenFabricAndReact();

  /**
   * Enables a fix to prevent the possibility of state updates in Fabric being missed due to race conditions with previous state updates.
   */
  RN_EXPORT static bool fixMissedFabricStateUpdatesOnAndroid();

  /**
   * Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.
   */
  RN_EXPORT static bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid();

  /**
   * Forces the mounting layer on Android to always batch mount items instead of dispatching them immediately. This might fix some crashes related to synchronous state updates, where some views dispatch state updates during mount.
   */
  RN_EXPORT static bool forceBatchingMountItemsOnAndroid();

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in debug builds. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxEnabledDebug();

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxEnabledRelease();

  /**
   * Construct modules that requires eager init on the dedicate native modules thread
   */
  RN_EXPORT static bool initEagerTurboModulesOnNativeModulesQueueAndroid();

  /**
   * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
   */
  RN_EXPORT static bool lazyAnimationCallbacks();

  /**
   * Adds support for loading vector drawable assets in the Image component (only on Android)
   */
  RN_EXPORT static bool loadVectorDrawablesOnImages();

  /**
   * Propagate layout direction to Android views.
   */
  RN_EXPORT static bool setAndroidLayoutDirection();

  /**
   * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
   */
  RN_EXPORT static bool traceTurboModulePromiseRejectionsOnAndroid();

  /**
   * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
   */
  RN_EXPORT static bool useFabricInterop();

  /**
   * Invoke callbacks immediately on the ReactInstance rather than going through a background thread for synchronization
   */
  RN_EXPORT static bool useImmediateExecutorInAndroidBridgeless();

  /**
   * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
   */
  RN_EXPORT static bool useModernRuntimeScheduler();

  /**
   * When enabled, the native view configs are used in bridgeless mode.
   */
  RN_EXPORT static bool useNativeViewConfigsInBridgelessMode();

  /**
   * Use shared background drawing code for ReactImageView instead of using Fresco to manipulate the bitmap
   */
  RN_EXPORT static bool useNewReactImageViewBackgroundDrawing();

  /**
   * Moves more of the work in view preallocation to the main thread to free up JS thread.
   */
  RN_EXPORT static bool useOptimisedViewPreallocationOnAndroid();

  /**
   * Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.
   */
  RN_EXPORT static bool useOptimizedEventBatchingOnAndroid();

  /**
   * When enabled, cloning shadow nodes within react native will update the reference held by the current JS fiber tree.
   */
  RN_EXPORT static bool useRuntimeShadowNodeReferenceUpdate();

  /**
   * When enabled, cloning shadow nodes during layout will update the reference held by the current JS fiber tree.
   */
  RN_EXPORT static bool useRuntimeShadowNodeReferenceUpdateOnLayout();

  /**
   * When enabled, it uses optimised state reconciliation algorithm.
   */
  RN_EXPORT static bool useStateAlignmentMechanism();

  /**
   * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
   */
  RN_EXPORT static bool useTurboModuleInterop();

  /**
   * Overrides the feature flags with the ones provided by the given provider
   * (generally one that extends `ReactNativeFeatureFlagsDefaults`).
   *
   * This method must be called before you initialize the React Native runtime.
   *
   * @example
   *
   * ```
   * class MyReactNativeFeatureFlags : public ReactNativeFeatureFlagsDefaults {
   *  public:
   *   bool someFlag() override;
   * };
   *
   * ReactNativeFeatureFlags.override(
   *     std::make_unique<MyReactNativeFeatureFlags>());
   * ```
   */
  RN_EXPORT static void override(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

  /**
   * Removes the overridden feature flags and makes the API return default
   * values again.
   *
   * This is **dangerous**. Use it only if you really understand the
   * implications of this method.
   *
   * This should only be called if you destroy the React Native runtime and
   * need to create a new one with different overrides. In that case,
   * call `dangerouslyReset` after destroying the runtime and `override` again
   * before initializing the new one.
   */
  RN_EXPORT static void dangerouslyReset();

 private:
  ReactNativeFeatureFlags() = delete;
  static ReactNativeFeatureFlagsAccessor& getAccessor(bool reset = false);
};

} // namespace facebook::react
