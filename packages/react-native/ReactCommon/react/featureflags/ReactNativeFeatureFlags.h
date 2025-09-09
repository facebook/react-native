/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e26a0c35f1499abf24e46275bbcbe06d>>
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
   * Enables start- and finishOperationBatch on any platform.
   */
  RN_EXPORT static bool animatedShouldSignalBatch();

  /**
   * Use a C++ implementation of Native Animated instead of the platform implementation.
   */
  RN_EXPORT static bool cxxNativeAnimatedEnabled();

  /**
   * Removes JS sync at end of native animation
   */
  RN_EXPORT static bool cxxNativeAnimatedRemoveJsSync();

  /**
   * Disable sync dispatch on the main queue on iOS
   */
  RN_EXPORT static bool disableMainQueueSyncDispatchIOS();

  /**
   * Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread
   */
  RN_EXPORT static bool disableMountItemReorderingAndroid();

  /**
   * Turns off the global measurement cache used by TextLayoutManager on Android.
   */
  RN_EXPORT static bool disableTextLayoutManagerCacheAndroid();

  /**
   * When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.
   */
  RN_EXPORT static bool enableAccessibilityOrder();

  /**
   * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
   */
  RN_EXPORT static bool enableAccumulatedUpdatesInRawPropsAndroid();

  /**
   * Enables various optimizations throughout the path of measuring text on Android.
   */
  RN_EXPORT static bool enableAndroidTextMeasurementOptimizations();

  /**
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer`.
   */
  RN_EXPORT static bool enableBridgelessArchitecture();

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  RN_EXPORT static bool enableCppPropsIteratorSetter();

  /**
   * This enables the fabric implementation of focus search so that we can focus clipped elements
   */
  RN_EXPORT static bool enableCustomFocusSearchOnClippedElementsAndroid();

  /**
   * Enables destructor calls for ShadowTreeRevision in the background to reduce UI thread work.
   */
  RN_EXPORT static bool enableDestroyShadowTreeRevisionAsync();

  /**
   * When enabled a subset of components will avoid double measurement on Android.
   */
  RN_EXPORT static bool enableDoubleMeasurementFixAndroid();

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
   * This feature flag enables a fix for reparenting fix in differentiator
   */
  RN_EXPORT static bool enableFixForParentTagDuringReparenting();

  /**
   * Enables font scale changes updating layout for measurable nodes.
   */
  RN_EXPORT static bool enableFontScaleChangesUpdatingLayout();

  /**
   * Applies base offset for each line of text separately on iOS.
   */
  RN_EXPORT static bool enableIOSTextBaselineOffsetPerLine();

  /**
   * iOS Views will clip to their padding box vs border box
   */
  RN_EXPORT static bool enableIOSViewClipToPaddingBox();

  /**
   * This is to fix the issue with interop view manager where component descriptor lookup is causing ViewManager to preload.
   */
  RN_EXPORT static bool enableInteropViewManagerClassLookUpOptimizationIOS();

  /**
   * When enabled, LayoutAnimations API will animate state changes on Android.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnAndroid();

  /**
   * When enabled, LayoutAnimations API will animate state changes on iOS.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnIOS();

  /**
   * Make RCTUnsafeExecuteOnMainQueueSync less likely to deadlock, when used in conjuction with sync rendering/events.
   */
  RN_EXPORT static bool enableMainQueueCoordinatorOnIOS();

  /**
   * Makes modules requiring main queue setup initialize on the main thread, during React Native init.
   */
  RN_EXPORT static bool enableMainQueueModulesOnIOS();

  /**
   * Enable NSNull conversion when handling module arguments on iOS
   */
  RN_EXPORT static bool enableModuleArgumentNSNullConversionIOS();

  /**
   * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
   */
  RN_EXPORT static bool enableNativeCSSParsing();

  /**
   * Enable network event reporting hooks in each native platform through `NetworkReporter`. This flag should be combined with `enableResourceTimingAPI` and `fuseboxNetworkInspectionEnabled` to enable end-to-end reporting behaviour via the Web Performance API and CDP debugging respectively.
   */
  RN_EXPORT static bool enableNetworkEventReporting();

  /**
   * Use BackgroundDrawable and BorderDrawable instead of CSSBackgroundDrawable
   */
  RN_EXPORT static bool enableNewBackgroundAndBorderDrawables();

  /**
   * Enables caching text layout artifacts for later reuse
   */
  RN_EXPORT static bool enablePreparedTextLayout();

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  RN_EXPORT static bool enablePropsUpdateReconciliationAndroid();

  /**
   * Enables the reporting of network resource timings through `PerformanceObserver`.
   */
  RN_EXPORT static bool enableResourceTimingAPI();

  /**
   * Dispatches state updates synchronously in Fabric (e.g.: updates the scroll position in the shadow tree synchronously from the main thread).
   */
  RN_EXPORT static bool enableSynchronousStateUpdates();

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
   * Enables VirtualView debug features such as logging and overlays.
   */
  RN_EXPORT static bool enableVirtualViewDebugFeatures();

  /**
   * Enables reading render state when dispatching VirtualView events.
   */
  RN_EXPORT static bool enableVirtualViewRenderState();

  /**
   * Enables window focus detection for prioritizing VirtualView events.
   */
  RN_EXPORT static bool enableVirtualViewWindowFocusDetection();

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  RN_EXPORT static bool fixMappingOfEventPrioritiesBetweenFabricAndReact();

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxEnabledRelease();

  /**
   * Enable network inspection support in the React Native DevTools CDP backend. Requires `enableBridgelessArchitecture`. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxNetworkInspectionEnabled();

  /**
   * Hides offscreen VirtualViews on iOS by setting hidden = YES to avoid extra cost of views
   */
  RN_EXPORT static bool hideOffscreenVirtualViewsOnIOS();

  /**
   * Number cached PreparedLayouts in TextLayoutManager cache
   */
  RN_EXPORT static double preparedTextCacheSize();

  /**
   * Enables a new mechanism in ShadowTree to prevent problems caused by multiple threads trying to commit concurrently. If a thread tries to commit a few times unsuccessfully, it will acquire a lock and try again.
   */
  RN_EXPORT static bool preventShadowTreeCommitExhaustion();

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
   * Use a native implementation of equals in NativeReadableArray.
   */
  RN_EXPORT static bool useNativeEqualsInNativeReadableArrayAndroid();

  /**
   * Use a native implementation of TransformHelper
   */
  RN_EXPORT static bool useNativeTransformHelperAndroid();

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
   * Initial prerender ratio for VirtualView.
   */
  RN_EXPORT static double virtualViewPrerenderRatio();

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
   * could also cause a workflow to suddenly have different feature flags for
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
