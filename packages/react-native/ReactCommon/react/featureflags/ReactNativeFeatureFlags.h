/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ce2f5895234f1cfb30374c72db54ccce>>
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

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>
#include <optional>
#include <string>

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
   * Prevent FabricMountingManager from reordering mountitems, which may lead to invalid state on the UI thread
   */
  RN_EXPORT static bool disableMountItemReorderingAndroid();

  /**
   * When enabled, Andoid will accumulate updates in rawProps to reduce the number of mounting instructions for cascading rerenders.
   */
  RN_EXPORT static bool enableAccumulatedUpdatesInRawPropsAndroid();

  /**
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer.
   */
  RN_EXPORT static bool enableBridgelessArchitecture();

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  RN_EXPORT static bool enableCppPropsIteratorSetter();

  /**
   * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
   */
  RN_EXPORT static bool enableEagerRootViewAttachment();

  /**
   * This feature flag enables logs for Fabric.
   */
  RN_EXPORT static bool enableFabricLogs();

  /**
   * Enables the use of the Fabric renderer in the whole app.
   */
  RN_EXPORT static bool enableFabricRenderer();

  /**
   * iOS Views will clip to their padding box vs border box
   */
  RN_EXPORT static bool enableIOSViewClipToPaddingBox();

  /**
   * When enabled, Andoid will build and initiate image prefetch requests on ImageShadowNode::layout
   */
  RN_EXPORT static bool enableImagePrefetchingAndroid();

  /**
   * Trigger JS runtime GC on memory pressure event on iOS
   */
  RN_EXPORT static bool enableJSRuntimeGCOnMemoryPressureOnIOS();

  /**
   * When enabled, LayoutAnimations API will animate state changes on Android.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnAndroid();

  /**
   * When enabled, LayoutAnimations API will animate state changes on iOS.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnIOS();

  /**
   * Enables the reporting of long tasks through `PerformanceObserver`. Only works if the event loop is enabled.
   */
  RN_EXPORT static bool enableLongTaskAPI();

  /**
   * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
   */
  RN_EXPORT static bool enableNativeCSSParsing();

  /**
   * Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable
   */
  RN_EXPORT static bool enableNewBackgroundAndBorderDrawables();

  /**
   * Moves execution of pre-mount items to outside the choregrapher in the main thread, so we can estimate idle time more precisely (Android only).
   */
  RN_EXPORT static bool enablePreciseSchedulingForPremountItemsOnAndroid();

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
   * Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.
   */
  RN_EXPORT static bool enableViewCulling();

  /**
   * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
   */
  RN_EXPORT static bool enableViewRecycling();

  /**
   * Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.
   */
  RN_EXPORT static bool enableViewRecyclingForText();

  /**
   * Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.
   */
  RN_EXPORT static bool enableViewRecyclingForView();

  /**
   * When enabled, rawProps in Props will not include Yoga specific props.
   */
  RN_EXPORT static bool excludeYogaFromRawProps();

  /**
   * Fixes a bug in Differentiator where parent views may be referenced before they're created
   */
  RN_EXPORT static bool fixDifferentiatorEmittingUpdatesWithWrongParentTag();

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  RN_EXPORT static bool fixMappingOfEventPrioritiesBetweenFabricAndReact();

  /**
   * Fixes a limitation on Android where the mounting coordinator would report there are no pending transactions but some of them were actually not processed due to the use of the push model.
   */
  RN_EXPORT static bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid();

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxEnabledRelease();

  /**
   * Enable network inspection support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxNetworkInspectionEnabled();

  /**
   * Only enqueue Choreographer calls if there is an ongoing animation, instead of enqueueing every frame.
   */
  RN_EXPORT static bool lazyAnimationCallbacks();

  /**
   * When enabled, mutex _turboModuleManagerDelegateMutex in RCTTurboModuleManager will not be used
   */
  RN_EXPORT static bool removeTurboModuleManagerDelegateMutex();

  /**
   * Throw an exception instead of deadlocking when a TurboModule that requires main queue setup is initialized during a synchronous render on iOS.
   */
  RN_EXPORT static bool throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS();

  /**
   * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
   */
  RN_EXPORT static bool traceTurboModulePromiseRejectionsOnAndroid();

  /**
   * When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.
   */
  RN_EXPORT static bool updateRuntimeShadowNodeReferencesOnCommit();

  /**
   * In Bridgeless mode, use the always available javascript error reporting pipeline.
   */
  RN_EXPORT static bool useAlwaysAvailableJSErrorHandling();

  /**
   * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
   */
  RN_EXPORT static bool useFabricInterop();

  /**
   * When enabled, the native view configs are used in bridgeless mode.
   */
  RN_EXPORT static bool useNativeViewConfigsInBridgelessMode();

  /**
   * Uses an optimized mechanism for event batching on Android that does not need to wait for a Choreographer frame callback.
   */
  RN_EXPORT static bool useOptimizedEventBatchingOnAndroid();

  /**
   * Instead of using folly::dynamic as internal representation in RawProps and RawValue, use jsi::Value
   */
  RN_EXPORT static bool useRawPropsJsiValue();

  /**
   * Use the state stored on the source shadow node when cloning it instead of reading in the most recent state on the shadow node family.
   */
  RN_EXPORT static bool useShadowNodeStateOnClone();

  /**
   * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
   */
  RN_EXPORT static bool useTurboModuleInterop();

  /**
   * When enabled, NativeModules will be executed by using the TurboModule system
   */
  RN_EXPORT static bool useTurboModules();

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

  /**
   * This is a combination of `dangerouslyReset` and `override` that reduces
   * the likeliness of a race condition between the two calls.
   *
   * This is **dangerous** because it can introduce consistency issues that will
   * be much harder to debug. For example, it could hide the fact that feature
   * flags are read before you set the values you want to use everywhere. It
   * could also cause a workflow to suddently have different feature flags for
   * behaviors that were configured with different values before.
   *
   * Please see the documentation of `dangerouslyReset` for additional details.
   */
  RN_EXPORT static std::optional<std::string> dangerouslyForceOverride(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  ReactNativeFeatureFlags() = delete;
  static ReactNativeFeatureFlagsAccessor& getAccessor();
};

} // namespace facebook::react
